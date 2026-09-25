import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    exam_portal_load: {
      executor: 'constant-vus',
      vus: 200,
      duration: '1m',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'],    // Less than 1% failure rate
  },
};

const BASE_URL = __ENV.LOAD_TEST_URL || 'http://localhost:3001';

export default function () {
  const userNum = (__VU % 1000) + 1;
  const email = `candidate${userNum}@assessment.com`;
  const password = 'candidate@123';

  // 1. Candidate Login
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email, password }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(loginRes, {
    'login status is 200': (r) => r.status === 200,
  });

  const cookie = loginRes.cookies['examination_auth_token'];
  if (!cookie) return;

  const authHeaders = {
    'Content-Type': 'application/json',
    headers: {
      Cookie: `examination_auth_token=${cookie[0].value}`,
    },
  };

  // 2. Start / Resume Assessment
  const startRes = http.post(`${BASE_URL}/api/assessments/start`, null, authHeaders);
  check(startRes, {
    'start assessment is 200': (r) => r.status === 200,
  });

  const body = startRes.json();
  if (!body || !body.data) return;

  const assessmentId = body.data.id;
  const questions = body.data.questions || [];

  // 3. Save answers for 3 questions
  if (questions.length > 0) {
    for (let i = 0; i < Math.min(3, questions.length); i++) {
      const qId = questions[i].id;
      const saveRes = http.post(
        `${BASE_URL}/api/assessments/${assessmentId}/answers`,
        JSON.stringify({
          questionId: qId,
          selectedOption: 'A',
        }),
        authHeaders
      );

      check(saveRes, {
        'answer saved successfully': (r) => r.status === 200,
      });

      sleep(0.5);
    }
  }

  // 4. Final Submission
  const submitRes = http.post(
    `${BASE_URL}/api/assessments/${assessmentId}/submit`,
    JSON.stringify({ reason: 'manual' }),
    authHeaders
  );

  check(submitRes, {
    'submission is 200': (r) => r.status === 200,
  });
}
