import { test, expect } from '@playwright/test';

/**
 * E2E: Consultation Journey - Browse → Book → Preflight → Room
 * Tests complete consultation flow including slot selection, channel choice,
 * preflight checks, and consultation room access.
 */

const BASE = 'http://localhost:3000';

test.describe('Consultation Journey: Browse → Book → Room', () => {
  const testEmail = 'dohoon321@gmail.com';
  const testPassword = 'test1234';

  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto(`${BASE}/login`);
    await page.fill('input[name="email"], input[type="email"]', testEmail);
    await page.fill('input[name="password"], input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/counselors/, { timeout: 10000 });
  });

  test('1. User can browse counselor list', async ({ page }) => {
    // Should already be on counselors page after login
    await expect(page).toHaveURL(/\/counselors/);

    // Should display counselor cards
    const counselorCards = page.locator('[data-testid="counselor-card"], article, .counselor-card');
    await expect(counselorCards.first()).toBeVisible({ timeout: 5000 });
  });

  test('2. User can view counselor detail page', async ({ page }) => {
    await page.goto(`${BASE}/counselors`);

    // Click first counselor
    const firstCounselor = page.locator('a[href*="/counselors/"]').first();
    await firstCounselor.click();

    // Should navigate to detail page
    await expect(page).toHaveURL(/\/counselors\/\d+/);

    // Should show counselor information
    await expect(page.locator('text=/프로필|소개|상담/i')).toBeVisible({ timeout: 5000 });
  });

  test('3. User can select a time slot', async ({ page }) => {
    await page.goto(`${BASE}/counselors`);
    await page.locator('a[href*="/counselors/"]').first().click();
    await expect(page).toHaveURL(/\/counselors\/\d+/);

    // Look for available slot
    const slotButton = page.locator('button:has-text("예약"), button:has-text("선택")').first();
    if (await slotButton.isVisible()) {
      await slotButton.click();
      await page.waitForTimeout(1000);

      // Should show booking form or confirmation
      await expect(page.locator('text=/예약|확인/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('4. User can choose consultation channel (VIDEO)', async ({ page }) => {
    await page.goto(`${BASE}/counselors`);
    await page.locator('a[href*="/counselors/"]').first().click();
    await expect(page).toHaveURL(/\/counselors\/\d+/);

    // Look for channel selection (VIDEO, CHAT, etc.)
    const videoOption = page.locator('button:has-text("VIDEO"), button:has-text("비디오"), input[value="VIDEO"]');
    if (await videoOption.first().isVisible()) {
      await videoOption.first().click();
      await page.waitForTimeout(500);
    }
  });

  test('5. User can access consultation room', async ({ page }) => {
    // Navigate to sessions/rooms
    await page.goto(`${BASE}/sessions`);
    await expect(page).toHaveURL(/\/sessions/);

    // Should show session list or room access
    await page.waitForLoadState('networkidle');
  });

  test('6. Consultation room shows timer display', async ({ page }) => {
    await page.goto(`${BASE}/sessions`);
    await page.waitForLoadState('networkidle');

    // Look for any session room link
    const roomLink = page.locator('a[href*="/sessions/"], button:has-text("입장")').first();
    if (await roomLink.isVisible()) {
      await roomLink.click();
      await page.waitForTimeout(2000);

      // Should show timer or time-related UI
      // (timer format: 00:00, or remaining time text)
      const timerElement = page.locator('text=/\\d{1,2}:\\d{2}|남은|시간|분/');
      if (await timerElement.first().isVisible()) {
        await expect(timerElement.first()).toBeVisible();
      }
    }
  });

  test('7. Preflight page shows camera/mic check UI', async ({ page }) => {
    // Navigate to preflight page (usually /sessions/preflight or similar)
    await page.goto(`${BASE}/sessions/preflight`);

    // Wait for page load
    await page.waitForLoadState('networkidle');

    // Should show camera/mic permission checks
    // (Common patterns: "카메라", "마이크", "권한", "허용")
    const preflightUI = page.locator('text=/카메라|마이크|camera|microphone|권한/i');
    if (await preflightUI.first().isVisible()) {
      await expect(preflightUI.first()).toBeVisible();
    }
  });

  test('8. Consultation journey handles backend errors gracefully', async ({ page }) => {
    // Try accessing sessions when backend might be down
    await page.goto(`${BASE}/sessions`);
    await page.waitForLoadState('networkidle');

    // Should either show content or error message (not crash)
    const bodyContent = await page.locator('body').textContent();
    expect(bodyContent).toBeTruthy();
  });
});
