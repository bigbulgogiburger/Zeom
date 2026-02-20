import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, defaultHeaders } from '../common.js';

/**
 * Login Load Test
 * - 100 virtual users concurrent login
 * - Ramp up: 0->100 over 30s, hold 60s, ramp down 30s
 * - Threshold: P95 < 500ms, error rate < 1%
 */
export const options = {
  stages: [
    { duration: '30s', target: 100 }, // ramp up to 100 VUs
    { duration: '60s', target: 100 }, // hold at 100 VUs
    { duration: '30s', target: 0 },   // ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const vuId = __VU;
  const email = `loadtest_user_${vuId}@test.com`;
  const password = 'Test1234!';

  // Attempt signup (may fail if already exists - that's ok)
  http.post(
    `${BASE_URL}/api/v1/auth/signup`,
    JSON.stringify({
      email: email,
      password: password,
      name: `LoadTestUser${vuId}`,
      role: 'USER',
      termsAgreed: true,
    }),
    { headers: defaultHeaders }
  );

  // Login
  const loginRes = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({ email: email, password: password }),
    { headers: defaultHeaders }
  );

  check(loginRes, {
    'login status is 200': (r) => r.status === 200,
    'login has accessToken': (r) => {
      try {
        return JSON.parse(r.body).accessToken !== undefined;
      } catch {
        return false;
      }
    },
  });

  sleep(1);
}
