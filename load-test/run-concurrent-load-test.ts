/**
 * Production Concurrency Load Tester (200 Concurrent Users)
 * Simulates real candidate exam lifecycle simultaneously:
 * 1. 200 simultaneous candidate logins
 * 2. 200 simultaneous exam starts (retrieving 50 randomized questions)
 * 3. 200 simultaneous answer auto-saves (each user saves multiple answers)
 * 4. 200 simultaneous final exam submissions
 *
 * Measures: Total Requests, Success Rate, Average Latency, p50, p95, p99, and Requests/sec.
 */

interface RequestMetrics {
  durationMs: number;
  success: boolean;
  status: number;
  scenario: string;
}

const BASE_URL = process.env.LOAD_TEST_URL || 'http://localhost:3001';
const CONCURRENT_USERS = parseInt(process.env.CONCURRENT_USERS || '200', 10);
const CANDIDATE_START_OFFSET = parseInt(process.env.CANDIDATE_START_OFFSET || '200', 10);

function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

async function simulateCandidateWorkflow(candidateIndex: number): Promise<RequestMetrics[]> {
  const metrics: RequestMetrics[] = [];
  const candidateNum = CANDIDATE_START_OFFSET + candidateIndex;
  const email = `candidate${candidateNum}@assessment.com`;
  const password = 'candidate@123';

  let cookie = '';
  let assessmentId = '';
  let questionIds: string[] = [];

  // --- Step 1: Login ---
  const loginStart = Date.now();
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const setCookieHeader = res.headers.get('set-cookie');
    if (setCookieHeader) {
      // Extract examination_auth_token cookie
      cookie = setCookieHeader.split(';')[0];
    }

    metrics.push({
      scenario: 'Login',
      durationMs: Date.now() - loginStart,
      success: res.ok,
      status: res.status,
    });
  } catch (err) {
    metrics.push({
      scenario: 'Login',
      durationMs: Date.now() - loginStart,
      success: false,
      status: 0,
    });
    return metrics;
  }

  if (!cookie) return metrics;

  // --- Step 2: Start or Resume Exam & Load 50 Questions ---
  const startExamStart = Date.now();
  try {
    const res = await fetch(`${BASE_URL}/api/assessments/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
      },
    });

    const data = await res.json();
    if (res.ok && data.data) {
      assessmentId = data.data.id;
      questionIds = (data.data.questions || []).map((q: any) => q.id);
    }

    metrics.push({
      scenario: 'Start / Load Exam',
      durationMs: Date.now() - startExamStart,
      success: res.ok,
      status: res.status,
    });
  } catch (err) {
    metrics.push({
      scenario: 'Start / Load Exam',
      durationMs: Date.now() - startExamStart,
      success: false,
      status: 0,
    });
    return metrics;
  }

  if (!assessmentId || questionIds.length === 0) return metrics;

  // --- Step 3: Autosave 5 Answers (Simulating active exam test taking) ---
  const sampleQuestions = questionIds.slice(0, 5);
  for (const qId of sampleQuestions) {
    const autosaveStart = Date.now();
    try {
      const res = await fetch(`${BASE_URL}/api/assessments/${assessmentId}/answers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookie,
        },
        body: JSON.stringify({
          questionId: qId,
          selectedOption: 'A',
        }),
      });

      metrics.push({
        scenario: 'Autosave Answer',
        durationMs: Date.now() - autosaveStart,
        success: res.ok,
        status: res.status,
      });
    } catch {
      metrics.push({
        scenario: 'Autosave Answer',
        durationMs: Date.now() - autosaveStart,
        success: false,
        status: 0,
      });
    }
  }

  // --- Step 4: Final Exam Submission ---
  const submitStart = Date.now();
  try {
    const res = await fetch(`${BASE_URL}/api/assessments/${assessmentId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
      },
      body: JSON.stringify({ reason: 'manual' }),
    });

    metrics.push({
      scenario: 'Submit Exam',
      durationMs: Date.now() - submitStart,
      success: res.ok,
      status: res.status,
    });
  } catch {
    metrics.push({
      scenario: 'Submit Exam',
      durationMs: Date.now() - submitStart,
      success: false,
      status: 0,
    });
  }

  return metrics;
}

async function runLoadTest() {
  console.log(`====================================================`);
  console.log(`  EXAMINATION SYSTEM CONCURRENT LOAD TEST (p95/p99)`);
  console.log(`  Target Concurrency: ${CONCURRENT_USERS} Concurrent Users`);
  console.log(`  Target Server:      ${BASE_URL}`);
  console.log(`====================================================\n`);

  // Verify server is alive
  try {
    const health = await fetch(`${BASE_URL}/api/health`);
    if (!health.ok) {
      console.error(`Server health check failed with status: ${health.status}`);
      process.exit(1);
    }
    console.log(`✓ Target server is healthy and responding.`);
  } catch (err: any) {
    console.error(`Could not connect to ${BASE_URL}. Ensure Next.js is running.`, err.message);
    process.exit(1);
  }

  console.log(`Launching ${CONCURRENT_USERS} simultaneous user workflows...`);
  const overallStart = Date.now();

  const userPromises: Promise<RequestMetrics[]>[] = [];
  for (let i = 1; i <= CONCURRENT_USERS; i++) {
    userPromises.push(simulateCandidateWorkflow(i));
  }

  const results = await Promise.all(userPromises);
  const overallDuration = (Date.now() - overallStart) / 1000;

  const allMetrics = results.flat();
  const totalRequests = allMetrics.length;
  const successfulRequests = allMetrics.filter((m) => m.success).length;
  const failedRequests = totalRequests - successfulRequests;
  const successRate = ((successfulRequests / totalRequests) * 100).toFixed(2);
  const rps = (totalRequests / overallDuration).toFixed(1);

  console.log(`\n--- Overall Load Test Results ---`);
  console.log(`Total Requests:       ${totalRequests}`);
  console.log(`Successful:           ${successfulRequests}`);
  console.log(`Failed:               ${failedRequests}`);
  console.log(`Success Rate:         ${successRate}%`);
  console.log(`Total Test Duration:  ${overallDuration.toFixed(2)} seconds`);
  console.log(`Requests Per Second:  ${rps} req/sec`);

  // Scenario breakdown
  const scenarios = ['Login', 'Start / Load Exam', 'Autosave Answer', 'Submit Exam'];
  console.log(`\n--- Latency Breakdown by Scenario ---`);
  console.log(
    `Scenario`.padEnd(22) +
      `Count`.padEnd(10) +
      `Avg (ms)`.padEnd(12) +
      `p50 (ms)`.padEnd(12) +
      `p95 (ms)`.padEnd(12) +
      `p99 (ms)`
  );
  console.log(`-`.repeat(80));

  for (const sc of scenarios) {
    const scMetrics = allMetrics.filter((m) => m.scenario === sc);
    if (scMetrics.length === 0) continue;

    const durations = scMetrics.map((m) => m.durationMs);
    const avg = (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(1);
    const p50 = calculatePercentile(durations, 50);
    const p95 = calculatePercentile(durations, 95);
    const p99 = calculatePercentile(durations, 99);

    console.log(
      `${sc}`.padEnd(22) +
        `${scMetrics.length}`.padEnd(10) +
        `${avg}`.padEnd(12) +
        `${p50}`.padEnd(12) +
        `${p95}`.padEnd(12) +
        `${p99}`
    );
  }

  console.log(`====================================================\n`);
}

runLoadTest().catch(console.error);
