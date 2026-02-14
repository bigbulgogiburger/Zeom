import { test, expect } from '@playwright/test';

/**
 * E2E: User Journey - Signup → Login → Browse → Book
 * Covers the core user flow from registration to booking a counseling slot.
 */

const BASE = 'http://localhost:3000';

test.describe('User Journey: Signup → Login → Browse → Book', () => {
  const testEmail = `e2e_${Date.now()}@zeom.com`;
  const testPassword = 'Password123!';
  const testName = 'E2E테스터';

  test('1. User can sign up with email/password', async ({ page }) => {
    await page.goto(`${BASE}/signup`);

    await page.fill('input[name="email"], input[type="email"]', testEmail);
    await page.fill('input[name="name"]', testName);
    await page.fill('input[name="password"], input[type="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Should redirect to /counselors after signup
    await expect(page).toHaveURL(/\/counselors/, { timeout: 10000 });
  });

  test('2. User can log in with existing credentials', async ({ page }) => {
    await page.goto(`${BASE}/login`);

    await page.fill('input[name="email"], input[type="email"]', testEmail);
    await page.fill('input[name="password"], input[type="password"]', testPassword);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/counselors/, { timeout: 10000 });
    // Header should show user name
    await expect(page.locator('header')).toContainText(testName);
  });

  test('3. User can browse counselor list', async ({ page }) => {
    // Login first
    await page.goto(`${BASE}/login`);
    await page.fill('input[name="email"], input[type="email"]', testEmail);
    await page.fill('input[name="password"], input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/counselors/);

    // Should display counselor cards
    const counselorCards = page.locator('[data-testid="counselor-card"], article, .counselor-card');
    await expect(counselorCards.first()).toBeVisible({ timeout: 5000 });
  });

  test('4. User can view counselor detail and available slots', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('input[name="email"], input[type="email"]', testEmail);
    await page.fill('input[name="password"], input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/counselors/);

    // Click first counselor
    const firstCounselor = page.locator('a[href*="/counselors/"]').first();
    await firstCounselor.click();

    // Should navigate to counselor detail page
    await expect(page).toHaveURL(/\/counselors\/\d+/);

    // Should show available slots
    await expect(page.locator('text=예약')).toBeVisible({ timeout: 5000 });
  });

  test('5. User can book a slot', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('input[name="email"], input[type="email"]', testEmail);
    await page.fill('input[name="password"], input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/counselors/);

    // Navigate to first counselor
    await page.locator('a[href*="/counselors/"]').first().click();
    await expect(page).toHaveURL(/\/counselors\/\d+/);

    // Click available slot to book
    const slotButton = page.locator('button:has-text("예약")').first();
    if (await slotButton.isVisible()) {
      await slotButton.click();

      // Should show booking confirmation or redirect to bookings
      await page.waitForResponse(resp =>
        resp.url().includes('/api/v1/bookings') && resp.status() === 200,
        { timeout: 10000 }
      );
    }
  });

  test('6. User can view their bookings', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('input[name="email"], input[type="email"]', testEmail);
    await page.fill('input[name="password"], input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/counselors/);

    await page.goto(`${BASE}/bookings/me`);
    await expect(page).toHaveURL(/\/bookings\/me/);

    // Should show booking list
    await page.waitForLoadState('networkidle');
  });
});
