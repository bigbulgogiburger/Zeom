import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, defaultHeaders, login, authHeaders } from '../common.js';

/**
 * Counselor Browse Load Test
 * - 50 virtual users browsing counselor list and details
 * - Each VU: list counselors -> pick random -> view detail -> view reviews
 * - Threshold: P95 < 500ms
 */
export const options = {
  stages: [
    { duration: '15s', target: 50 },
    { duration: '60s', target: 50 },
    { duration: '15s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.05'],
  },
};

export function setup() {
  // Create a test user and get token
  const email = 'browse_test@test.com';
  const password = 'Test1234!';

  http.post(
    `${BASE_URL}/api/v1/auth/signup`,
    JSON.stringify({
      email: email,
      password: password,
      name: 'BrowseTestUser',
      role: 'USER',
      termsAgreed: true,
    }),
    { headers: defaultHeaders }
  );

  const token = login(email, password);
  return { token };
}

export default function (data) {
  const headers = data.token ? authHeaders(data.token) : defaultHeaders;

  // 1. List counselors
  const listRes = http.get(`${BASE_URL}/api/v1/counselors`, { headers });
  check(listRes, {
    'counselor list status 200': (r) => r.status === 200,
  });

  let counselors = [];
  try {
    counselors = JSON.parse(listRes.body);
    if (!Array.isArray(counselors)) {
      // Handle paginated response
      counselors = counselors.content || [];
    }
  } catch {
    // ignore parse errors
  }

  sleep(0.5);

  // 2. Pick a random counselor and view detail
  if (counselors.length > 0) {
    const randomCounselor = counselors[Math.floor(Math.random() * counselors.length)];
    const counselorId = randomCounselor.id;

    const detailRes = http.get(`${BASE_URL}/api/v1/counselors/${counselorId}`, { headers });
    check(detailRes, {
      'counselor detail status 200': (r) => r.status === 200,
    });

    sleep(0.5);

    // 3. View reviews for the counselor
    const reviewRes = http.get(`${BASE_URL}/api/v1/reviews/counselor/${counselorId}`, { headers });
    check(reviewRes, {
      'reviews status 200': (r) => r.status === 200,
    });
  }

  sleep(1);
}
