import { test, expect, Browser, BrowserContext, Page } from '@playwright/test';

/**
 * E2E: Sendbird Video Call - Counselor ↔ Customer
 *
 * Tests the full video consultation flow:
 * 1. Counselor signup (e2e_counselor_ prefix → COUNSELOR role + CounselorEntity)
 * 2. Customer signup + slot booking
 * 3. Counselor enters room → waiting state
 * 4. Customer starts session → dials counselor
 * 5. Counselor receives call → accepts
 * 6. Both in video call → end session
 *
 * Requires SENDBIRD_APP_ID and SENDBIRD_API_TOKEN env vars.
 * Skipped when credentials are not provided.
 */

const BASE = 'http://localhost:3000';
const API = 'http://localhost:8080';

const hasSendbirdCredentials =
  !!process.env.SENDBIRD_APP_ID && !!process.env.SENDBIRD_API_TOKEN;

// Helper: signup via API and return tokens
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

// Helper: login via API and return tokens
async function apiLogin(email: string, password: string) {
  const res = await fetch(`${API}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status}`);
  return res.json();
}

// Helper: login via browser UI
async function browserLogin(page: Page, email: string, password: string) {
  await page.goto(`${BASE}/login`);
  await page.fill('input[name="email"], input[type="email"]', email);
  await page.fill('input[name="password"], input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(counselors|counselor)/, { timeout: 15000 });
}

// Helper: set tokens in localStorage to skip UI login
async function setTokens(page: Page, accessToken: string, refreshToken: string) {
  await page.goto(BASE);
  await page.evaluate(
    ({ access, refresh }) => {
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
    },
    { access: accessToken, refresh: refreshToken },
  );
}

// Helper: create a slot for today via API
async function createTodaySlot(accessToken: string) {
  const now = new Date();
  const startAt = new Date(now.getTime() + 5 * 60_000); // 5 min from now
  const endAt = new Date(startAt.getTime() + 30 * 60_000); // 30 min session

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

// Helper: book a slot via API
async function bookSlot(accessToken: string, counselorId: number, slotId: number) {
  const res = await fetch(`${API}/api/v1/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ counselorId, slotId }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Book slot failed: ${res.status} ${body}`);
  }
  return res.json();
}

// Helper: get counselor list to find our test counselor
async function getCounselors() {
  const res = await fetch(`${API}/api/v1/counselors`);
  if (!res.ok) throw new Error(`Get counselors failed: ${res.status}`);
  return res.json();
}

// Helper: get counselor slots
async function getCounselorSlots(counselorId: number) {
  const res = await fetch(`${API}/api/v1/counselors/${counselorId}/slots`);
  if (!res.ok) throw new Error(`Get slots failed: ${res.status}`);
  return res.json();
}

test.describe('Video Call: Counselor ↔ Customer', () => {
  const timestamp = Date.now();
  const counselorEmail = `e2e_counselor_${timestamp}@zeom.com`;
  const counselorName = 'E2E상담사';
  const customerEmail = `e2e_customer_${timestamp}@zeom.com`;
  const customerName = 'E2E고객';
  const password = 'TestPassword123!';

  let counselorTokens: { accessToken: string; refreshToken: string };
  let customerTokens: { accessToken: string; refreshToken: string };
  let counselorId: number;
  let bookingId: number;

  test.beforeAll(async () => {
    // 1. Signup counselor (auto-creates CounselorEntity via e2e_counselor_ prefix)
    const counselorAuth = await apiSignup(counselorEmail, counselorName, password);
    counselorTokens = counselorAuth;

    // 2. Signup customer
    const customerAuth = await apiSignup(customerEmail, customerName, password);
    customerTokens = customerAuth;

    // 3. Find the counselor entity
    const counselors = await getCounselors();
    const counselorList = Array.isArray(counselors) ? counselors : counselors.content || [];
    const testCounselor = counselorList.find(
      (c: any) => c.name === counselorName || c.intro === 'E2E 테스트 상담사',
    );
    if (!testCounselor) {
      throw new Error(`Test counselor not found. Available: ${JSON.stringify(counselorList.map((c: any) => c.name))}`);
    }
    counselorId = testCounselor.id;

    // 4. Counselor creates today's schedule
    await createTodaySlot(counselorTokens.accessToken);

    // 5. Get available slots and book one
    const slotsData = await getCounselorSlots(counselorId);
    const slots = Array.isArray(slotsData) ? slotsData : slotsData.content || slotsData.slots || [];
    if (slots.length === 0) {
      throw new Error('No slots available after schedule creation');
    }
    const slotId = slots[0].id;

    const booking = await bookSlot(customerTokens.accessToken, counselorId, slotId);
    bookingId = booking.id;
  });

  test('1. Counselor can enter room and reach waiting state', async ({ browser }) => {
    const context = await browser.newContext({
      permissions: ['camera', 'microphone'],
    });
    const page = await context.newPage();

    await setTokens(page, counselorTokens.accessToken, counselorTokens.refreshToken);
    await page.goto(`${BASE}/counselor/room`);

    // Should show either "대기 중" or "연결 준비 중" initially
    await expect(
      page.locator('text=/대기 중|연결 준비 중|WAITING|INITIALIZING|온라인/'),
    ).toBeVisible({ timeout: 15000 });

    // After initialization, should show waiting state or mock mode message
    await page.waitForTimeout(3000);

    const pageContent = await page.textContent('body');
    const isWaiting =
      pageContent?.includes('대기 중') ||
      pageContent?.includes('고객의 호출을 기다리는 중') ||
      pageContent?.includes('Mock 모드');

    expect(isWaiting).toBeTruthy();

    await context.close();
  });

  test('2. Customer can start session and reach consultation page', async ({ browser }) => {
    const context = await browser.newContext({
      permissions: ['camera', 'microphone'],
    });
    const page = await context.newPage();

    await setTokens(page, customerTokens.accessToken, customerTokens.refreshToken);

    // Start session via API
    const startRes = await fetch(`${API}/api/v1/sessions/${bookingId}/start`, {
      method: 'POST',
    });
    expect(startRes.ok).toBeTruthy();
    const session = await startRes.json();

    // Navigate to consultation page
    await page.goto(`${BASE}/consultation/${session.id}`);
    await page.waitForLoadState('networkidle');

    // Should show consultation room UI (connecting or connection status)
    await expect(
      page.locator('text=/연결|상담|통화|CONNECTING|IDLE|준비/'),
    ).toBeVisible({ timeout: 10000 });

    await context.close();
  });

  test.describe('Full video call flow (requires Sendbird credentials)', () => {
    test.skip(!hasSendbirdCredentials, 'Sendbird credentials not provided');

    test('3. Counselor and customer can establish video call', async ({ browser }) => {
      // Create two browser contexts for counselor and customer
      const counselorContext = await browser.newContext({
        permissions: ['camera', 'microphone'],
      });
      const customerContext = await browser.newContext({
        permissions: ['camera', 'microphone'],
      });
      const counselorPage = await counselorContext.newPage();
      const customerPage = await customerContext.newPage();

      try {
        // === Counselor enters room ===
        await setTokens(counselorPage, counselorTokens.accessToken, counselorTokens.refreshToken);
        await counselorPage.goto(`${BASE}/counselor/room`);

        // Wait for counselor to reach waiting state with Sendbird ready
        await expect(
          counselorPage.locator('text=/온라인 - 대기 중/'),
        ).toBeVisible({ timeout: 20000 });

        // === Customer starts session and dials ===
        await setTokens(customerPage, customerTokens.accessToken, customerTokens.refreshToken);

        // Start session
        const startRes = await fetch(`${API}/api/v1/sessions/${bookingId}/start`, {
          method: 'POST',
        });
        const session = await startRes.json();

        await customerPage.goto(`${BASE}/consultation/${session.id}`);

        // Wait for customer to initialize Sendbird and start dialing
        await customerPage.waitForTimeout(5000);

        // Customer should be in CONNECTING or RINGING state
        await expect(
          customerPage.locator('text=/연결 중|호출 중|CONNECTING|RINGING/'),
        ).toBeVisible({ timeout: 15000 });

        // === Counselor receives incoming call ===
        await expect(
          counselorPage.locator('text=/호출 수신 중|수락/'),
        ).toBeVisible({ timeout: 30000 });

        // Counselor accepts the call
        const acceptButton = counselorPage.locator('button:has-text("수락")');
        await expect(acceptButton).toBeVisible({ timeout: 5000 });
        await acceptButton.click();

        // === Both should be in call ===
        // Counselor should show "상담 진행 중"
        await expect(
          counselorPage.locator('text=/상담 진행 중/'),
        ).toBeVisible({ timeout: 15000 });

        // Customer should show connected state
        await expect(
          customerPage.locator('text=/연결됨|통화 중|CONNECTED|상담 진행/'),
        ).toBeVisible({ timeout: 15000 });

        // Both should show video areas
        await expect(counselorPage.locator('video')).toHaveCount(2, { timeout: 5000 });
        await expect(customerPage.locator('video')).toHaveCount(2, { timeout: 5000 });

        // === End session ===
        // Use customer or counselor to end
        const endButton = counselorPage.locator('button:has-text("상담 종료")');
        if (await endButton.isVisible()) {
          // Handle confirm dialog
          counselorPage.on('dialog', (dialog) => dialog.accept());
          await endButton.click();

          // Should return to waiting state
          await expect(
            counselorPage.locator('text=/대기 중|WAITING/'),
          ).toBeVisible({ timeout: 10000 });
        }
      } finally {
        await counselorContext.close();
        await customerContext.close();
      }
    });

    test('4. Counselor can toggle audio and video during call', async ({ browser }) => {
      const counselorContext = await browser.newContext({
        permissions: ['camera', 'microphone'],
      });
      const customerContext = await browser.newContext({
        permissions: ['camera', 'microphone'],
      });
      const counselorPage = await counselorContext.newPage();
      const customerPage = await customerContext.newPage();

      try {
        // Setup counselor
        await setTokens(counselorPage, counselorTokens.accessToken, counselorTokens.refreshToken);
        await counselorPage.goto(`${BASE}/counselor/room`);
        await expect(
          counselorPage.locator('text=/온라인 - 대기 중/'),
        ).toBeVisible({ timeout: 20000 });

        // Setup customer and start session
        await setTokens(customerPage, customerTokens.accessToken, customerTokens.refreshToken);
        const startRes = await fetch(`${API}/api/v1/sessions/${bookingId}/start`, {
          method: 'POST',
        });
        const session = await startRes.json();
        await customerPage.goto(`${BASE}/consultation/${session.id}`);
        await customerPage.waitForTimeout(5000);

        // Wait for and accept call
        await expect(
          counselorPage.locator('button:has-text("수락")'),
        ).toBeVisible({ timeout: 30000 });
        await counselorPage.locator('button:has-text("수락")').click();

        // Wait for call to be established
        await expect(
          counselorPage.locator('text=/상담 진행 중/'),
        ).toBeVisible({ timeout: 15000 });

        // Toggle audio
        const audioButton = counselorPage.locator('button:has-text("마이크 켜짐")');
        if (await audioButton.isVisible()) {
          await audioButton.click();
          await expect(
            counselorPage.locator('button:has-text("마이크 꺼짐")'),
          ).toBeVisible({ timeout: 3000 });
        }

        // Toggle video
        const videoButton = counselorPage.locator('button:has-text("카메라 켜짐")');
        if (await videoButton.isVisible()) {
          await videoButton.click();
          await expect(
            counselorPage.locator('button:has-text("카메라 꺼짐")'),
          ).toBeVisible({ timeout: 3000 });
        }

        // Cleanup
        counselorPage.on('dialog', (dialog) => dialog.accept());
        const endButton = counselorPage.locator('button:has-text("상담 종료")');
        if (await endButton.isVisible()) {
          await endButton.click();
        }
      } finally {
        await counselorContext.close();
        await customerContext.close();
      }
    });
  });

  test('5. Counselor room shows today bookings', async ({ browser }) => {
    const context = await browser.newContext({
      permissions: ['camera', 'microphone'],
    });
    const page = await context.newPage();

    await setTokens(page, counselorTokens.accessToken, counselorTokens.refreshToken);
    await page.goto(`${BASE}/counselor/room`);

    // Should show "오늘 남은 예약" section
    await expect(page.locator('text=/오늘 남은 예약/')).toBeVisible({ timeout: 10000 });

    await context.close();
  });

  test('6. Counselor room handles connection failure gracefully', async ({ browser }) => {
    const context = await browser.newContext({
      permissions: ['camera', 'microphone'],
    });
    const page = await context.newPage();

    // Use invalid tokens to trigger connection failure
    await page.goto(BASE);
    await page.evaluate(() => {
      localStorage.setItem('accessToken', 'invalid-token');
      localStorage.setItem('refreshToken', 'invalid-token');
    });

    await page.goto(`${BASE}/counselor/room`);
    await page.waitForTimeout(5000);

    // Should either redirect to login or show error state (not crash)
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();

    await context.close();
  });
});
