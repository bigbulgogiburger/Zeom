import http from 'k6/http';

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

export const defaultHeaders = {
  'Content-Type': 'application/json',
};

/**
 * Login and return JWT access token.
 */
export function login(email, password) {
  const res = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({ email, password }),
    { headers: defaultHeaders }
  );

  if (res.status !== 200) {
    console.error(`Login failed: status=${res.status}, body=${res.body}`);
    return null;
  }

  const body = JSON.parse(res.body);
  return body.accessToken;
}

/**
 * Return headers with Authorization bearer token.
 */
export function authHeaders(token) {
  return {
    ...defaultHeaders,
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Common thresholds for all scenarios.
 */
export const commonThresholds = {
  http_req_duration: ['p(95)<500'],
  http_req_failed: ['rate<0.01'],
};
