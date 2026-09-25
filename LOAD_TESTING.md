# Load Testing Guide: Examination System

## 1. Overview
This guide provides complete instructions and scripts to validate high concurrency performance for the Examination System under a target normal load of **200 concurrent users**.

---

## 2. Test Scenarios Covered
The load test suite simulates the realistic end-to-end examination lifecycle:

1. **Scenario 1: Concurrent Login**
   - 200 users login simultaneously.
   - Evaluates bcrypt hash verification, JWT generation, and cookie serialization.
2. **Scenario 2: Concurrent Exam Start & 50-Question Retrieval**
   - 200 candidates request exam initialization simultaneously.
   - Validates question sampling from memory cache and batch insertion of 50 assigned questions.
3. **Scenario 3: Concurrent Answer Autosave**
   - 200 candidates simultaneously save answers across multiple questions (1,000+ total autosave requests).
   - Validates atomic database `upsert` queries under high concurrency without connection starvation.
4. **Scenario 4: Concurrent Exam Submission**
   - 200 candidates submit their final exam simultaneously.
   - Validates atomic score calculation, database locking, and duplicate-submission prevention.

---

## 3. Running the Native Load Test Runner

The project includes a high-performance native load testing runner located in `load-test/run-concurrent-load-test.ts`. It runs directly via Node.js / `tsx` without requiring external third-party software.

### Prerequisites
1. Ensure the PostgreSQL database is running and seeded:
   ```bash
   npx tsx scripts/seed-production-load-data.ts
   ```
2. Ensure the examination server is running:
   ```bash
   npm run dev
   # or for production performance:
   npm run build && npm run start
   ```

### Execution Commands

#### Test with 50 Concurrent Users:
```powershell
$env:CONCURRENT_USERS="50"; $env:CANDIDATE_START_OFFSET="200"; npx tsx load-test/run-concurrent-load-test.ts
```

#### Test with 200 Concurrent Users:
```powershell
$env:CONCURRENT_USERS="200"; $env:CANDIDATE_START_OFFSET="300"; npx tsx load-test/run-concurrent-load-test.ts
```

---

## 4. Running Load Tests with k6

For testing with Grafana k6:

### Installation
- Windows (via Winget):
  ```powershell
  winget install GrafanaLabs.k6
  ```
- MacOS (via Homebrew):
  ```bash
  brew install k6
  ```

### Execution
Run the k6 script against the local server:
```bash
k6 run --vus 200 --duration 1m load-test/k6-load-test.js
```

---

## 5. Interpreting Results
The runner outputs:
- **Total Requests & Success Rate:** Target $> 99\%$ success rate under full load.
- **Throughput:** Requests per second (RPS).
- **Latency Distribution:**
  - **Avg Latency:** Mean response time.
  - **p50 Latency:** Median response time experienced by the typical candidate.
  - **p95 Latency:** 95th percentile response time (must remain $< 2000$ ms for complex operations and $< 500$ ms for autosave).
  - **p99 Latency:** 99th percentile response time representing worst-case latency during burst peaks.
