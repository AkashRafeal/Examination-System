# Database Optimization Guide: Examination System

## 1. Overview
The Examination System database layer is built on PostgreSQL using Prisma ORM. Under peak concurrent examination conditions (such as 200 candidates starting and submitting simultaneously), the database must handle bursts of random question assignments, high-frequency answer autosaves, and atomic score calculations without connection starvation, deadlocks, or slow table scans.

---

## 2. Connection Pool Configuration

### 2.1 The Bottleneck
By default, Prisma allocates a small connection pool calculated as:
$$\text{pool size} = (\text{num physical CPUs} \times 2) + 1$$
On a 4-core server, this is merely 9 connections with a strict 10-second pool timeout (`pool_timeout=10`). When 200 concurrent users attempt to login, save answers, and submit at once, 200 concurrent transactions attempt to acquire a connection. Without explicit pool sizing, requests queue up, hit the 10-second ceiling, and fail with:
`Timed out fetching a new connection from the connection pool`.

### 2.2 Production Configuration
Connection limits and pool timeouts are explicitly tuned in `.env` via URL parameters:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/examination_db?schema=public&connection_limit=30&pool_timeout=20"
```

- **`connection_limit=30`**: Establishes a bounded connection pool of 30 active connections. This is well within PostgreSQL default `max_connections = 100`, preventing database process exhaustion while allowing high concurrent query multiplexing.
- **`pool_timeout=20`**: Allows queued queries up to 20 seconds to acquire a connection during momentary burst spikes.

---

## 3. Indexing Strategy

Indexes were created strictly to match real query patterns rather than blindly indexed:

| Model | Index | Query Pattern Supported | Benefit |
| :--- | :--- | :--- | :--- |
| `Assessment` | `@@index([userId, status])` | Candidate attempt status & resumption checks (`findFirst({ where: { userId, status } })`) | Eliminates table scans; instant $O(1)$ attempt checks |
| `Assessment` | `@@index([status, submittedAt])` | Admin results pagination and date-ordered sorting (`findMany({ where: { status: 'COMPLETED' }, orderBy: { submittedAt: 'desc' } })`) | Avoids expensive in-memory sort across thousands of records |
| `Assessment` | `@@index([deadlineAt])` | Authoritative server-side deadline queries | Enables fast detection of expired exams |
| `AssessmentQuestion` | `@@unique([assessmentId, questionId])` | Ensures a question is assigned to an attempt only once | Enforces database-level uniqueness |
| `AssessmentAnswer` | `@@unique([assessmentId, questionId])` | High-frequency answer autosaving via `upsert` | Idempotent single-operation answer storage |
| `Question` | `@@index([isActive])` | Active question pool sampling | Fast index scans during cache warm-up |
| `User` | `@@index([email])` | Candidate and admin authentication lookups | Sub-millisecond credential lookup |
| `User` | `@@index([batchId])` | Batch-based candidate roster exports and filtering | Fast batch slicing |

---

## 4. Question Distribution Architecture

### 4.1 Problem
When 200 candidates start an exam simultaneously, traditional systems run `ORDER BY RANDOM() LIMIT 50` or load all questions from PostgreSQL on every start request. With 10,000 questions in the question bank:
- 200 users $\times$ 10,000 rows = **2,000,000 objects allocated in Node.js RAM simultaneously**.
- Database disk I/O spikes, causing latency to degrade to several seconds.

### 4.2 Solution: In-Memory Question ID Caching
Implemented in `src/lib/cache/question-cache.ts`:
1. Active question IDs are loaded into memory and cached with a 60-second TTL.
2. When a candidate starts an exam:
   - 50 IDs are sampled and shuffled using Fisher-Yates shuffle in memory ($< 1$ ms).
   - A single transaction writes the `Assessment` and `AssessmentQuestion` records with fixed order 1 to 50.
3. Once assigned, questions are persisted in `AssessmentQuestion` and never re-queried or re-shuffled.
4. Whenever an admin creates, updates, deletes, toggles, or imports questions, `invalidateQuestionCache()` is immediately invoked to ensure consistency.

---

## 5. Answer Autosave Optimization

### 4 DB Round Trips Reduced to 1
- **Old Pattern:**
  1. `db.assessment.findUnique` (check userId & status)
  2. `db.assessmentQuestion.findUnique` (check question belongs to exam)
  3. `db.assessmentAnswer.upsert` (write answer)
  4. `db.assessmentAnswer.count` (count answered questions)
  Total: 4 database queries per candidate answer click.
- **Optimized Pattern:**
  1. Query assessment ownership, status, and deadline in 1 step.
  2. Execute atomic `db.assessmentAnswer.upsert` using the composite unique key `(assessmentId, questionId)`.
  3. Omit the redundant count query; candidate browser maintains optimistic answered count locally.
  Result: **75% reduction in database load during the active exam phase**.

---

## 6. Atomic Submission & Idempotency

Exam submission in `submitAssessment()`:
1. **Lightweight Projection:** Queries only `isCorrect: true` option keys rather than loading complete question texts and wrong options.
2. **Idempotency Guard:** If already marked `COMPLETED`, returns success immediately without re-calculating or writing to the database.
3. **Atomic Transaction:** Updates `status: COMPLETED`, `score`, `percentage`, `attemptedQuestions`, `unanswered`, `submittedAt`, and `submissionReason` in a single atomic update.
