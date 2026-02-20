import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, defaultHeaders, login, authHeaders } from '../common.js';

/**
 * Payment Flow Load Test
 * - 10 virtual users full payment flow
 * - Login -> charge wallet -> check balance
 * - Threshold: P95 < 500ms
 */
export const options = {
  stages: [
    { duration: '10s', target: 10 },
    { duration: '60s', target: 10 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.05'],
  },
};

export function setup() {
  const tokens = [];

  for (let i = 0; i < 10; i++) {
    const email = `payment_user_${i}@test.com`;
    const password = 'Test1234!';

    http.post(
      `${BASE_URL}/api/v1/auth/signup`,
      JSON.stringify({
        email: email,
        password: password,
        name: `PaymentUser${i}`,
        role: 'USER',
        termsAgreed: true,
      }),
      { headers: defaultHeaders }
    );

    const token = login(email, password);
    tokens.push(token);
  }

  return { tokens };
}

export default function (data) {
  const vuIndex = __VU - 1;
  const token = data.tokens[vuIndex % data.tokens.length];

  if (!token) {
    console.warn('No token available for VU. Skipping.');
    sleep(5);
    return;
  }

  const headers = authHeaders(token);

  // 1. Check wallet balance
  const walletRes = http.get(`${BASE_URL}/api/v1/wallets/my`, { headers });
  check(walletRes, {
    'wallet status 200': (r) => r.status === 200,
  });

  sleep(0.5);

  // 2. Charge wallet (fake payment)
  const chargeRes = http.post(
    `${BASE_URL}/api/v1/cash/charge`,
    JSON.stringify({
      amount: 10000,
      paymentMethod: 'CARD',
    }),
    { headers }
  );
  check(chargeRes, {
    'charge status 200 or 201': (r) => r.status === 200 || r.status === 201,
  });

  sleep(0.5);

  // 3. Check updated balance
  const walletRes2 = http.get(`${BASE_URL}/api/v1/wallets/my`, { headers });
  check(walletRes2, {
    'updated wallet status 200': (r) => r.status === 200,
  });

  sleep(0.5);

  // 4. View transaction history
  const txRes = http.get(`${BASE_URL}/api/v1/cash/transactions`, { headers });
  check(txRes, {
    'transactions status 200': (r) => r.status === 200,
  });

  sleep(2);
}
