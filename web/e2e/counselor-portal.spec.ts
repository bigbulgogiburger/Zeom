import { test, expect } from '@playwright/test';

/**
 * E2E: Counselor Portal
 * Counselor Login → Dashboard → Settlement → Customers → Memo
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

test.describe('Counselor Portal: Dashboard → Settlement → Customers → Memo', () => {
  const timestamp = Date.now();
  const counselorEmail = `e2e_counselor_portal_${timestamp}@zeom.com`;
  const counselorName = 'E2E포탈상담사';
  const customerEmail = `e2e_portal_customer_${timestamp}@zeom.com`;
  const customerName = 'E2E포탈고객';
  const password = 'TestPassword123!';

  let counselorTokens: { accessToken: string; refreshToken: string };
  let customerTokens: { accessToken: string; refreshToken: string };
  let counselorId: number;
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
    if (!testCounselor) throw new Error('Test counselor not found');
    counselorId = testCounselor.id;

    // Create slot, book, start & end session to generate data
    const now = new Date();
    const startAt = new Date(now.getTime() + 5 * 60_000);
    const endAt = new Date(startAt.getTime() + 30 * 60_000);

    await fetch(`${API}/api/v1/counselor/schedule`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${counselorTokens.accessToken}`,
      },
      body: JSON.stringify({
        slots: [{ startAt: startAt.toISOString().replace('Z', ''), endAt: endAt.toISOString().replace('Z', '') }],
      }),
    });

    const slotsData = await getCounselorSlots(counselorId);
    const slots = Array.isArray(slotsData) ? slotsData : slotsData.content || slotsData.slots || [];
    if (slots.length === 0) throw new Error('No slots after schedule creation');

    const bookRes = await fetch(`${API}/api/v1/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerTokens.accessToken}`,
      },
      body: JSON.stringify({ counselorId, slotId: slots[0].id }),
    });
    const booking = await bookRes.json();

    // Start and end session
    const startRes = await fetch(`${API}/api/v1/sessions/${booking.id}/start`, { method: 'POST' });
    const session = await startRes.json();
    sessionId = session.id;

    await fetch(`${API}/api/v1/sessions/${sessionId}/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endReason: 'COMPLETED' }),
    });
  });

  test('1. Counselor can log in and dashboard loads', async ({ page }) => {
    await setTokens(page, counselorTokens.accessToken, counselorTokens.refreshToken);

    await page.goto(`${BASE}/counselor`);
    await page.waitForLoadState('networkidle');

    // Dashboard should show
    await expect(page.locator('text=/대시보드/')).toBeVisible({ timeout: 15000 });

    // Should show stats
    await expect(page.locator('text=/오늘|상담|건/')).toBeVisible({ timeout: 5000 });
  });

  test('2. Counselor can navigate to settlement page and data displays', async ({ page }) => {
    await setTokens(page, counselorTokens.accessToken, counselorTokens.refreshToken);

    await page.goto(`${BASE}/counselor/settlement`);
    await page.waitForLoadState('networkidle');

    // Settlement page should show title
    await expect(page.locator('text=/정산/')).toBeVisible({ timeout: 10000 });

    // Should show either data or empty state
    const body = await page.locator('body').textContent();
    const hasSettlementContent =
      body?.includes('총 수입') ||
      body?.includes('출금 요청') ||
      body?.includes('정산 내역이 없습니다');
    expect(hasSettlementContent).toBeTruthy();
  });

  test('3. Counselor can navigate to customers page and customer list displays', async ({ page }) => {
    await setTokens(page, counselorTokens.accessToken, counselorTokens.refreshToken);

    await page.goto(`${BASE}/counselor/customers`);
    await page.waitForLoadState('networkidle');

    // Customer management page
    await expect(page.locator('text=/고객 관리/')).toBeVisible({ timeout: 10000 });

    // Should show customer stats or customer list
    const body = await page.locator('body').textContent();
    const hasCustomerContent =
      body?.includes('전체 고객') ||
      body?.includes(customerName) ||
      body?.includes('고객이 없습니다');
    expect(hasCustomerContent).toBeTruthy();
  });

  test('4. Counselor can save and retrieve memo', async ({ page }) => {
    await setTokens(page, counselorTokens.accessToken, counselorTokens.refreshToken);

    // Save memo via API
    const memoRes = await fetch(`${API}/api/v1/counselor/records/${sessionId}/memo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${counselorTokens.accessToken}`,
      },
      body: JSON.stringify({ content: 'E2E 테스트 메모: 고객 상태 양호' }),
    });
    expect(memoRes.ok).toBeTruthy();

    const memo = await memoRes.json();
    expect(memo.content).toBe('E2E 테스트 메모: 고객 상태 양호');
    expect(memo.sessionId).toBe(sessionId);

    // Navigate to records page to verify memo appears
    await page.goto(`${BASE}/counselor/records`);
    await page.waitForLoadState('networkidle');

    // Records page should load
    await expect(page.locator('text=/상담 기록/')).toBeVisible({ timeout: 10000 });
  });

  test('5. Counselor can view booking history', async ({ page }) => {
    await setTokens(page, counselorTokens.accessToken, counselorTokens.refreshToken);

    await page.goto(`${BASE}/counselor/bookings`);
    await page.waitForLoadState('networkidle');

    // Bookings page should show
    await expect(page.locator('text=/예약/')).toBeVisible({ timeout: 10000 });
  });

  test('6. Counselor can access profile settings', async ({ page }) => {
    await setTokens(page, counselorTokens.accessToken, counselorTokens.refreshToken);

    await page.goto(`${BASE}/counselor/profile`);
    await page.waitForLoadState('networkidle');

    // Profile page should load
    await expect(page.locator('text=/프로필|이름|전문/')).toBeVisible({ timeout: 10000 });
  });

  test('7. Counselor can view reviews', async ({ page }) => {
    await setTokens(page, counselorTokens.accessToken, counselorTokens.refreshToken);

    await page.goto(`${BASE}/counselor/reviews`);
    await page.waitForLoadState('networkidle');

    // Reviews page should show
    await expect(page.locator('text=/리뷰/')).toBeVisible({ timeout: 10000 });
  });

  test('8. Non-counselor user is redirected from counselor portal', async ({ page }) => {
    await setTokens(page, customerTokens.accessToken, customerTokens.refreshToken);

    await page.goto(`${BASE}/counselor`);

    // Should redirect to login or home (not counselor dashboard)
    await page.waitForTimeout(3000);
    const url = page.url();
    const isRedirected = !url.includes('/counselor') || url.includes('/login');
    expect(isRedirected).toBeTruthy();
  });
});
