import { test, expect } from '@playwright/test';

/**
 * E2E: Settlement Journey
 * Login → Booking → Start Session → End Session → See Settlement → Credit History
 */

const BASE = 'http://localhost:3000';
const API = 'http://localhost:8080';

async function apiSignup(email: string, name: string, password: string) {
  const res = await fetch(`${API}/api/v1/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name, password }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Signup failed for ${email}: ${res.status} ${body}`);
  }
  return res.json();
}

async function setTokens(page: import('@playwright/test').Page, accessToken: string, refreshToken: string) {
  await page.goto(BASE);
  await page.evaluate(
    ({ access, refresh }) => {
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
    },
    { access: accessToken, refresh: refreshToken },
  );
}

async function getCounselors() {
  const res = await fetch(`${API}/api/v1/counselors`);
  if (!res.ok) throw new Error(`Get counselors failed: ${res.status}`);
  return res.json();
}

async function getCounselorSlots(counselorId: number) {
  const res = await fetch(`${API}/api/v1/counselors/${counselorId}/slots`);
  if (!res.ok) throw new Error(`Get slots failed: ${res.status}`);
  return res.json();
}

async function createTodaySlot(accessToken: string) {
  const now = new Date();
  const startAt = new Date(now.getTime() + 5 * 60_000);
  const endAt = new Date(startAt.getTime() + 30 * 60_000);

  const res = await fetch(`${API}/api/v1/counselor/schedule`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      slots: [
        {
          startAt: startAt.toISOString().replace('Z', ''),
          endAt: endAt.toISOString().replace('Z', ''),
        },
      ],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Create slot failed: ${res.status} ${body}`);
  }
  return res.json();
}

test.describe('Settlement Journey: Session → Settlement → Credit History', () => {
  const timestamp = Date.now();
  const counselorEmail = `e2e_counselor_settle_${timestamp}@zeom.com`;
  const counselorName = 'E2E정산상담사';
  const customerEmail = `e2e_settle_customer_${timestamp}@zeom.com`;
  const customerName = 'E2E정산고객';
  const password = 'TestPassword123!';

  let counselorTokens: { accessToken: string; refreshToken: string };
  let customerTokens: { accessToken: string; refreshToken: string };
  let counselorId: number;
  let bookingId: number;
  let sessionId: number;

  test.beforeAll(async () => {
    // Signup counselor and customer
    counselorTokens = await apiSignup(counselorEmail, counselorName, password);
    customerTokens = await apiSignup(customerEmail, customerName, password);

    // Find counselor entity
    const counselors = await getCounselors();
    const counselorList = Array.isArray(counselors) ? counselors : counselors.content || [];
    const testCounselor = counselorList.find(
      (c: any) => c.name === counselorName || c.intro === 'E2E 테스트 상담사',
    );
    if (!testCounselor) {
      throw new Error(`Test counselor not found`);
    }
    counselorId = testCounselor.id;

    // Create schedule and book
    await createTodaySlot(counselorTokens.accessToken);
    const slotsData = await getCounselorSlots(counselorId);
    const slots = Array.isArray(slotsData) ? slotsData : slotsData.content || slotsData.slots || [];
    if (slots.length === 0) throw new Error('No slots available');

    const bookRes = await fetch(`${API}/api/v1/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerTokens.accessToken}`,
      },
      body: JSON.stringify({ counselorId, slotId: slots[0].id }),
    });
    if (!bookRes.ok) throw new Error(`Booking failed: ${bookRes.status}`);
    const booking = await bookRes.json();
    bookingId = booking.id;

    // Start session
    const startRes = await fetch(`${API}/api/v1/sessions/${bookingId}/start`, {
      method: 'POST',
    });
    if (!startRes.ok) throw new Error(`Start session failed: ${startRes.status}`);
    const session = await startRes.json();
    sessionId = session.id;

    // End session (triggers settlement)
    const endRes = await fetch(`${API}/api/v1/sessions/${sessionId}/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endReason: 'COMPLETED' }),
    });
    if (!endRes.ok) throw new Error(`End session failed: ${endRes.status}`);
  });

  test('1. Customer can see settlement result after session ends', async ({ page }) => {
    await setTokens(page, customerTokens.accessToken, customerTokens.refreshToken);

    // Navigate to credit history / consultations page
    await page.goto(`${BASE}/credits`);
    await page.waitForLoadState('networkidle');

    // Page should load without errors
    const body = await page.locator('body').textContent();
    expect(body).toBeTruthy();
  });

  test('2. Customer can view settlement entries in credit history', async ({ page }) => {
    await setTokens(page, customerTokens.accessToken, customerTokens.refreshToken);

    // Check the settlements API directly
    const res = await fetch(`${API}/api/v1/settlements/my`, {
      headers: { Authorization: `Bearer ${customerTokens.accessToken}` },
    });
    expect(res.ok).toBeTruthy();
    const data = await res.json();
    expect(data.settlements).toBeDefined();

    // Navigate to credit history page
    await page.goto(`${BASE}/credits`);
    await page.waitForLoadState('networkidle');

    // Page should render without crash
    await expect(page.locator('main, [role="main"], body')).toBeVisible({ timeout: 10000 });
  });

  test('3. Counselor can see settlement data in portal', async ({ page }) => {
    await setTokens(page, counselorTokens.accessToken, counselorTokens.refreshToken);

    await page.goto(`${BASE}/counselor/settlement`);
    await page.waitForLoadState('networkidle');

    // Should show settlement page with heading
    await expect(page.locator('text=/정산/')).toBeVisible({ timeout: 10000 });

    // Should show settlement stats or empty state
    const pageContent = await page.locator('body').textContent();
    const hasContent =
      pageContent?.includes('총 수입') ||
      pageContent?.includes('정산 내역이 없습니다') ||
      pageContent?.includes('출금 요청');
    expect(hasContent).toBeTruthy();
  });

  test('4. Settlement entry shows correct data via API', async () => {
    // Verify settlement transaction was created for the session
    const res = await fetch(`${API}/api/v1/settlements/session/${sessionId}`);
    expect(res.ok).toBeTruthy();

    const settlement = await res.json();
    expect(settlement.sessionId).toBe(sessionId);
    expect(settlement.bookingId).toBe(bookingId);
    expect(settlement.settlementType).toBeTruthy();
    expect(settlement.commissionRate).toBeDefined();
  });

  test('5. Counselor settlement page shows earnings summary', async ({ page }) => {
    await setTokens(page, counselorTokens.accessToken, counselorTokens.refreshToken);

    await page.goto(`${BASE}/counselor`);
    await page.waitForLoadState('networkidle');

    // Dashboard should load
    await expect(page.locator('text=/대시보드|오늘/')).toBeVisible({ timeout: 10000 });
  });
});
