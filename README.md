# ExamPortal - Randomized Online Assessment & Examination Platform

A production-ready, enterprise-grade online examination platform built with **Next.js (App Router)**, **TypeScript**, **PostgreSQL**, **Prisma ORM**, and **Tailwind CSS**.

Featuring multi-format question ingestion (**PDF** and **Microsoft Word .docx**), tolerant question extraction, duplicate detection, staged preview & inline editing before database import, server-enforced 50-question randomization, autosaved candidate answers, atomic server-side evaluation, strict client-side result privacy, and a comprehensive administrator analytics suite with CSV export.

---

## Table of Contents
- [1. Project Overview & Architecture](#1-project-overview--architecture)
- [2. Technology Stack](#2-technology-stack)
- [3. Key Features](#3-key-features)
- [4. Security Architecture & Privacy Guarantee](#4-security-architecture--privacy-guarantee)
- [5. Database Schema & Models](#5-database-schema--models)
- [6. Document Parsing Engine & Format Guidelines](#6-document-parsing-engine--format-guidelines)
  - [Inline Answer Document Example](#inline-answer-document-example)
  - [End-of-Document Answer Key Example](#end-of-document-answer-key-example)
- [7. Candidate Assessment Flow](#7-candidate-assessment-flow)
- [8. Administrator Management & Analytics](#8-administrator-management--analytics)
- [9. API Documentation](#9-api-documentation)
- [10. Quick Start & Setup Guide](#10-quick-start--setup-guide)
  - [System Requirements](#system-requirements)
  - [PostgreSQL Database Setup](#postgresql-database-setup)
  - [Environment Variables (.env)](#environment-variables-env)
  - [Database Migration & Seeding](#database-migration--seeding)
  - [Running Development Server](#running-development-server)
  - [Building for Production](#building-for-production)
- [11. Pre-Seeded Demo Credentials](#11-pre-seeded-demo-credentials)
- [12. Automated Verification & Testing](#12-automated-verification--testing)
- [13. Troubleshooting](#13-troubleshooting)

---

## 1. Project Overview & Architecture

ExamPortal is designed to eliminate academic dishonesty and examination fatigue through a defense-in-depth full-stack architecture:

1. **Staged Ingestion**: Documents are uploaded and parsed in-memory on the server. Admins review detected questions in a staging area, resolve errors via an inline editor, verify duplicate alerts, and confirm import before any records touch the database.
2. **50-Question Server Randomization**: When a candidate initiates an assessment, the server randomly selects exactly 50 active questions using the Fisher-Yates algorithm, shuffles question order, and anchors them permanently in an `AssessmentQuestion` relation. Refreshing or switching devices restores the exact set without regenerations.
3. **Strict Zero-Leak Privacy**: The assessment API delivers sanitized question payloads without `isCorrect`, correct option keys, or score properties. Inspection via DevTools, network loggers, or DOM explorers reveals no answers.
4. **Atomic Server Evaluation**: Submissions trigger an atomic database transaction that fetches authoritative answer keys directly from PostgreSQL, scores candidate choices, and updates assessment records. Candidates receive only a generic confirmation: *"Your assessment has been submitted successfully. Your result will be available to the administrator."*

---

## 2. Technology Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Server Actions, Route Handlers)
- **Language**: TypeScript (Strict Mode)
- **Frontend**: React 19, Tailwind CSS, Lucide Icons, Canvas Confetti
- **Database**: PostgreSQL 18
- **ORM**: Prisma ORM v6
- **Authentication**: JWT session tokens via `jose` signed with HMAC-SHA256 stored in HTTP-only, secure, SameSite cookies; password hashing with `bcryptjs`
- **Document Parsers**: `pdf-parse` (PDF extraction) and `mammoth` (DOCX extraction)
- **Validation**: Zod schema validation on all inputs and API payloads

---

## 3. Key Features

### Candidate Experience
- **Distraction-Free Exam Portal**: Minimalist layout with question statement, choice selector, and single-click answer switching.
- **Strict Anti-Cheat Tab-Lock**: Leaving the active exam tab, switching to another browser tab, or minimizing the window triggers **immediate automatic submission** of the exam with all answers completed up to that second.
- **Strict Single Attempt Policy**: Each candidate is permitted strictly **1 attempt**. Once submitted (manually or via tab-switch), they are permanently locked out from re-entering or retaking.
- **50-Question Palette**: Interactive navigation grid (1 to 50) color-coded by answered (green), current (blue outline), and unanswered (slate) states.
- **Answer Autosave**: Instant server-side autosave with debounced visual status feedback (*"Answer saved"*).
- **Submission Guard**: Confirmation modal highlights remaining unanswered questions before finalization.
- **Strict Privacy**: Zero score or answer breakdown shown upon submission.

### Administrator Console
- **Candidate Excel / CSV Ingestion**: Upload candidate rosters directly from `.xlsx`, `.xls`, or `.csv` files.
- **Auto-Generated Usernames & Passwords**: The platform automatically generates clean, normalized usernames and secure high-entropy passwords with collision handling.
- **Instant Credentials CSV Export**: Download an official `.csv` credentials file containing names, usernames, login emails, and passwords to distribute to candidates.
- **Executive Analytics Dashboard**: Overview cards for Total Questions, Active Questions, Total Candidates, Exam Starts, Completions, and Average Score with category breakdowns.
- **PDF & Word Ingestion**: Tolerant parser supporting varied numbering (`1.`, `Question 1:`, `Q.1`), inline answers (`Answer: A`), and end-of-document answer keys (`ANSWER KEY`).
- **Pre-Import Question Stager**: Interactive review table flagging valid, invalid, and duplicate questions with an integrated modal editor.
- **Question Bank CRUD**: Search, filter by category/difficulty/status, pagination, and status toggles.
- **Individual Candidate Review**: Question-by-question view highlighting the candidate's chosen option versus the database authoritative key (Correct, Incorrect, or Unanswered).
- **Audit Logs & Export**: Historical import batch tracking and one-click CSV export of candidate scores.
- **User Management**: Candidate directory with account activation/deactivation controls.

---

## 4. Security Architecture & Privacy Guarantee

| Threat Vector | Mitigation Strategy |
| :--- | :--- |
| **Unauthorized Public Registration** | Public self-registration is permanently disabled (`403 Forbidden`). Candidate accounts are created exclusively by administrators via Excel roster ingestion. |
| **Tab Switching / Window Departure** | Monitored via HTML5 `visibilitychange` and window `blur` events. Leaving or switching tabs instantly triggers an atomic auto-submit via `keepalive` POST request with currently completed answers. |
| **Client-Side Answer Leakage** | `getAssessmentForUser` strips all `isCorrect`, option answers, and score fields before JSON serialization. |
| **Insecure Direct Object Reference (IDOR)** | Route handlers authenticate the user from JWT cookies and verify `assessment.userId === session.userId` before granting read or write access. |
| **Tampered Score Submissions** | Client cannot send scores; `/api/assessments/[id]/submit` evaluates choices exclusively against database answer keys in a Prisma transaction. |
| **Multiple Exam Attempts** | `startOrResumeAssessment` enforces a strict 1-attempt policy; completed assessments cannot be restarted. |
| **Malicious File Uploads** | Restricts uploads to `.pdf`, `.docx`, `.xlsx`, and `.csv`, enforces a 10-20MB limit, and validates MIME structures. |
| **XSS & Session Hijacking** | Auth tokens reside exclusively in `HttpOnly`, `SameSite=Lax` cookies inaccessible to JavaScript. |

---

## 5. Database Schema & Models

```prisma
model User {
  id           String       @id @default(cuid())
  name         String
  email        String       @unique
  passwordHash String
  role         Role         @default(USER) // ADMIN | USER
  isActive     Boolean      @default(true)
  assessments  Assessment[]
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  @@index([email])
  @@index([role])
}

model Category {
  id        String     @id @default(cuid())
  name      String     @unique
  questions Question[]
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
}

model Question {
  id                  String               @id @default(cuid())
  questionText        String               @db.Text
  categoryId          String?
  category            Category?            @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  difficulty          Difficulty           @default(MEDIUM) // EASY | MEDIUM | HARD
  isActive            Boolean              @default(true)
  sourceFileName      String?
  sourceImportId      String?
  sourceImport        ImportBatch?         @relation(fields: [sourceImportId], references: [id], onDelete: SetNull)
  options             QuestionOption[]
  assessmentQuestions AssessmentQuestion[]
  assessmentAnswers   AssessmentAnswer[]
  createdAt           DateTime             @default(now())
  updatedAt           DateTime             @updatedAt

  @@index([categoryId])
  @@index([isActive])
  @@index([difficulty])
}

model QuestionOption {
  id         String   @id @default(cuid())
  questionId String
  question   Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  optionKey  String   // A | B | C | D
  optionText String   @db.Text
  isCorrect  Boolean  @default(false)

  @@index([questionId])
}

model ImportBatch {
  id                String     @id @default(cuid())
  fileName          String
  fileType          String
  totalQuestions    Int
  validQuestions    Int
  invalidQuestions  Int
  importedQuestions Int
  uploadedBy        String
  createdAt         DateTime   @default(now())
  questions         Question[]

  @@index([createdAt])
}

model Assessment {
  id                 String               @id @default(cuid())
  userId             String
  user               User                 @relation(fields: [userId], references: [id], onDelete: Cascade)
  status             AssessmentStatus     @default(IN_PROGRESS) // IN_PROGRESS | COMPLETED
  totalQuestions     Int                  @default(50)
  attemptedQuestions Int                  @default(0)
  correctAnswers     Int                  @default(0)
  incorrectAnswers   Int                  @default(0)
  unanswered         Int                  @default(50)
  score              Float                @default(0)
  percentage         Float                @default(0)
  startedAt          DateTime             @default(now())
  submittedAt        DateTime?
  questions          AssessmentQuestion[]
  answers            AssessmentAnswer[]
  createdAt          DateTime             @default(now())
  updatedAt          DateTime             @updatedAt

  @@index([userId])
  @@index([status])
}

model AssessmentQuestion {
  id            String     @id @default(cuid())
  assessmentId  String
  assessment    Assessment @relation(fields: [assessmentId], references: [id], onDelete: Cascade)
  questionId    String
  question      Question   @relation(fields: [questionId], references: [id], onDelete: Cascade)
  questionOrder Int

  @@unique([assessmentId, questionId])
  @@unique([assessmentId, questionOrder])
  @@index([assessmentId])
}

model AssessmentAnswer {
  id             String     @id @default(cuid())
  assessmentId   String
  assessment     Assessment @relation(fields: [assessmentId], references: [id], onDelete: Cascade)
  questionId     String
  question       Question   @relation(fields: [questionId], references: [id], onDelete: Cascade)
  selectedOption String     // A | B | C | D
  answeredAt     DateTime   @default(now())

  @@unique([assessmentId, questionId])
  @@index([assessmentId])
}
```

---

## 6. Document Parsing Engine & Format Guidelines

The parser accommodates common document layouts, irregular whitespace, and differing capitalization.

### Supported Question Numbering Patterns
- `Question 1.`, `Question 1:`, `Question 1`
- `Q1.`, `Q.1`, `Q1:`
- `1.`, `1)`, `1 -`, `1 :`

### Supported Option Formats
- `A.`, `B.`, `C.`, `D.`
- `A)`, `B)`, `C)`, `D)`
- `(A)`, `(B)`, `(C)`, `(D)`
- `Option A:`, `Option B:`

### Inline Answer Document Example
```text
Question 1. What is Java?
A. Programming Language
B. Database
C. Operating System
D. Browser
Answer: A

Question 2. What is SQL?
A. Programming Language
B. Database Query Language
C. Browser
D. Operating System
Answer: B
```

### End-of-Document Answer Key Example
```text
QUESTIONS
1. What does DOM stand for in web browsers?
A. Document Object Model
B. Data Object Management
C. Desktop Operation Method
D. Digital Ordinance Matrix

2. Which protocol encrypts web traffic by default?
A. HTTP
B. FTP
C. HTTPS
D. SMTP

ANSWER KEY
1. A
2. C
```

*(Sequential letter answer keys such as `A`, `B`, `C` are also detected automatically)*.

---

## 7. Candidate Assessment Flow

```
1. Candidate logs in at /login
2. Navigates to Candidate Dashboard (/user/dashboard)
3. Clicks "Start Assessment"
   ├── Server checks for existing attempts (enforces 1 attempt)
   ├── Selects 50 random active questions from PostgreSQL
   ├── Anchors questions into AssessmentQuestion table
   └── Delivers sanitized questions (NO answers or isCorrect)
4. Candidate answers questions at /user/assessment/[id]
   ├── Answers autosaved asynchronously via /api/assessments/[id]/answers
   └── Candidate navigates freely using Previous/Next or 50-item palette
5. Candidate clicks "Submit Assessment"
   ├── Modal warns if any questions remain unanswered
   └── Confirmation sends request to /api/assessments/[id]/submit
6. Server executes atomic evaluation in transaction:
   ├── Reads candidate choices & database correct options
   ├── Computes correct, incorrect, unanswered, score, and percentage
   ├── Marks assessment COMPLETED and stores evaluation
   └── Returns ONLY: "Your assessment has been submitted successfully.
       Your result will be available to the administrator."
7. Redirects to /user/assessment/submitted (zero score displayed)
```

---

## 8. Administrator Management & Analytics

1. **Dashboard (`/admin/dashboard`)**:
   - Total Questions, Active Questions, Total Candidates, Tests Started, Tests Completed, Average Score.
   - Recent test submissions table with candidate name, score, percentage, and submission time.
   - Category distribution statistics.
2. **Question Bank (`/admin/questions`)**:
   - Search question text, filter by category, difficulty (`EASY`, `MEDIUM`, `HARD`), or active status.
   - One-click active/inactive toggle, edit, and delete actions.
3. **Document Ingestion (`/admin/questions/import`)**:
   - Drag & drop PDF or Word `.docx` file (up to 20MB).
   - Multi-step parsing pipeline with staged preview.
   - Inline question editor to fix invalid options or missing answers.
   - Duplicate detection warnings against existing question bank records.
   - Confirm import commits records directly to PostgreSQL.
4. **Assessment Results (`/admin/results`)**:
   - Candidate scores, percentages, correct/incorrect/blank counts, and submission timestamps.
   - Sort by score, date, or percentage. Search by candidate name or email.
   - One-click **Export Results to CSV** (`assessment_results.csv`).
5. **Individual Review (`/admin/results/[id]`)**:
   - Comprehensive test evaluation for a specific candidate.
   - Question-by-question breakdown showing candidate choice vs. database answer key with status chips (Correct, Incorrect, Unanswered).
6. **User Management (`/admin/users`)**:
   - Directory of candidates with registration dates, test statuses, and scores.
   - Ability to activate or deactivate candidate accounts.

---

## 9. API Documentation

### Authentication Endpoints
- `POST /api/auth/register`: Create candidate account (`name`, `email`, `password`).
- `POST /api/auth/login`: Authenticate candidate or admin; sets HTTP-only session cookie.
- `POST /api/auth/logout`: Clears session cookie.
- `GET /api/auth/me`: Retrieves current authenticated user profile.

### Candidate Assessment Endpoints
- `POST /api/assessments/start`: Initializes or resumes assessment; returns 50 sanitized questions.
- `GET /api/assessments/[id]`: Retrieves active assessment state with previously selected answers.
- `POST /api/assessments/[id]/answers`: Autosaves an individual question answer (`questionId`, `selectedOption`).
- `POST /api/assessments/[id]/submit`: Submits assessment, performs server-side evaluation, and closes test.

### Administrator Endpoints
- `GET /api/admin/dashboard-stats`: Retrieves system counters, metrics, and recent test logs.
- `GET /api/admin/questions`: Paginated list of questions with search and filter parameters.
- `POST /api/admin/questions`: Creates a question manually.
- `GET /api/admin/questions/[id]`: Retrieves question details.
- `PUT /api/admin/questions/[id]`: Updates question or toggles active status.
- `DELETE /api/admin/questions/[id]`: Removes question from bank.
- `POST /api/admin/questions/upload-preview`: Uploads and parses PDF/DOCX; returns staged preview without saving to DB.
- `POST /api/admin/questions/import-confirm`: Commits staged questions into PostgreSQL under an `ImportBatch`.
- `GET /api/admin/imports`: Retrieves historical import batch logs.
- `GET /api/admin/results`: Retrieves paginated completed assessments.
- `GET /api/admin/results/[id]`: Retrieves detailed question-by-question evaluation with answer keys.
- `GET /api/admin/results/export`: Generates and downloads assessment results as a CSV file.
- `GET /api/admin/users`: Retrieves candidate list with test statuses.
- `PATCH /api/admin/users/[id]`: Toggles candidate active status.
- `GET /api/admin/categories` & `POST /api/admin/categories`: Manages question categories.

---

## 10. Quick Start & Setup Guide

### System Requirements
- **Node.js**: v18.17+ or v20+ or v22+ (tested on Node v22.14.0)
- **PostgreSQL**: v14+ (tested on PostgreSQL 18 on port 5432)
- **Package Manager**: npm 10+

### PostgreSQL Database Setup
Ensure PostgreSQL is running locally, then create the database:
```sql
CREATE DATABASE examination_db;
```

### Environment Variables (.env)
Create a `.env` file in the root directory (or copy from `.env.example`):
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/examination_db?schema=public"
AUTH_SECRET="c7f96a41f6bc3e245a9e32f059cbde49b1df7830aaef08639ceca4f65d64e3be"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
MAX_UPLOAD_SIZE_MB="20"
```

### Database Migration & Seeding
Synchronize the Prisma schema and seed 1 Admin, 3 Candidates, 6 Categories, and 105 verified questions:
```bash
# Push schema to PostgreSQL and generate Prisma Client
npx prisma db push

# Seed the database with users and 105 MCQs
npm run seed
```

### Running Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production
```bash
# Generate Prisma Client and create optimized Next.js bundle
npm run build

# Start production server
npm start
```

---

## 11. Pre-Seeded Demo Credentials

The database is pre-seeded with verified test accounts:

| Role | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **Administrator** | System Administrator | `admin@assessment.com` | `Admin@123456` |
| **Candidate 1** | Alex Johnson | `user1@assessment.com` | `User@123456` |
| **Candidate 2** | Bethany Smith | `user2@assessment.com` | `User@123456` |
| **Candidate 3** | Carlos Mendez | `user3@assessment.com` | `User@123456` |

*Quick login buttons are also available on the homepage and login screen for 1-click authentication.*

---

## 12. Automated Verification & Testing

The repository includes test suites to verify functionality:

1. **Core Engine & Security Test Suite**:
   Verifies inline answer parsing, end-of-document answer key parsing, invalid question flagging, 50-question server randomization, distinct user permutations, zero client answer leakage, autosaving, and atomic evaluation:
   ```bash
   npx tsx test/verify-core.ts
   ```

2. **Real Document Ingestion Test Suite**:
   Generates and parses real `.pdf` and `.docx` binary documents with both inline answers and answer keys at the end:
   ```bash
   npx tsx scripts/test-document-imports.ts
   ```

Sample test documents are available in `sample-documents/`:
- `Sample_Exam_Inline_Answers.pdf`
- `Sample_Exam_Answer_Key_At_End.pdf`
- `Sample_Exam_Inline.docx`
- `Sample_Exam_Answer_Key_At_End.docx`

---

## 13. Troubleshooting

- **Error: "At least 50 active questions are required to start an assessment"**:
  Run `npm run seed` to populate the database with the pre-seeded 105 questions.
- **Port 5432 Connection Refused**:
  Ensure the PostgreSQL service is active (`net start postgresql-x64-18` on Windows).
- **Prisma Client Missing**:
  Run `npx prisma generate` to refresh the local Prisma Client bindings.
- **PDF Upload Errors**:
  Ensure uploaded PDF documents contain selectable text (not scanned bitmap images without OCR).

---

Developed with Next.js, Prisma, and PostgreSQL.
