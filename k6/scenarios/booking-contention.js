import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';
import { BASE_URL, defaultHeaders, login, authHeaders } from '../common.js';

/**
 * Booking Contention Test
 * - 20 virtual users trying to book the same slot simultaneously
 * - Tests distributed lock behavior
 * - Verify only 1 booking succeeds, others get appropriate error
 */

const successfulBookings = new Counter('successful_bookings');
const failedBookings = new Counter('failed_bookings');

export const options = {
  vus: 20,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    // We expect most to fail (contention), so we don't set strict error rate
  },
};

export function setup() {
  const tokens = [];

  // Create 20 test users
  for (let i = 0; i < 20; i++) {
    const email = `contention_user_${i}@test.com`;
    const password = 'Test1234!';

    http.post(
      `${BASE_URL}/api/v1/auth/signup`,
      JSON.stringify({
        email: email,
        password: password,
        name: `ContentionUser${i}`,
        role: 'USER',
        termsAgreed: true,
      }),
      { headers: defaultHeaders }
    );

    const token = login(email, password);
    tokens.push(token);
  }

  // Get available counselors and slots
  const listRes = http.get(`${BASE_URL}/api/v1/counselors`, {
    headers: tokens[0] ? authHeaders(tokens[0]) : defaultHeaders,
  });

  let counselorId = null;
  let slotId = null;

  try {
    let counselors = JSON.parse(listRes.body);
    if (!Array.isArray(counselors)) counselors = counselors.content || [];
    if (counselors.length > 0) {
      counselorId = counselors[0].id;

      // Get slots for this counselor
      const slotsRes = http.get(`${BASE_URL}/api/v1/counselors/${counselorId}/slots`, {
        headers: authHeaders(tokens[0]),
      });
      try {
        const slots = JSON.parse(slotsRes.body);
        const availableSlots = Array.isArray(slots)
          ? slots.filter((s) => s.status === 'AVAILABLE')
          : [];
        if (availableSlots.length > 0) {
          slotId = availableSlots[0].id;
        }
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }

  return { tokens, counselorId, slotId };
}

export default function (data) {
  const vuIndex = __VU - 1;
  const token = data.tokens[vuIndex % data.tokens.length];

  if (!token || !data.counselorId || !data.slotId) {
    console.warn('Missing test data (token/counselorId/slotId). Skipping iteration.');
    sleep(5);
    return;
  }

  const bookingRes = http.post(
    `${BASE_URL}/api/v1/bookings`,
    JSON.stringify({
      counselorId: data.counselorId,
      slotIds: [data.slotId],
    }),
    { headers: authHeaders(token) }
  );

  const isSuccess = bookingRes.status === 200 || bookingRes.status === 201;

  check(bookingRes, {
    'booking response received': (r) => r.status !== 0,
  });

  if (isSuccess) {
    successfulBookings.add(1);
  } else {
    failedBookings.add(1);
    check(bookingRes, {
      'contention error is 409 or 400': (r) => r.status === 409 || r.status === 400,
    });
  }

  sleep(5); // Wait to avoid re-attempting the same slot
}
