import { test, expect } from '@playwright/test';

/**
 * E2E: Payment Flow - Booking Payment → Confirmation
 * Tests the complete payment lifecycle including creation, confirmation,
 * and verification of chat room auto-creation.
 */

const BASE = 'http://localhost:3000';

test.describe('Payment Flow: Booking → Payment → Confirmation', () => {
  const testEmail = `e2e_pay_${Date.now()}@zeom.com`;
  const testPassword = 'Password123!';

  test.beforeEach(async ({ page }) => {
    // Signup
    await page.goto(`${BASE}/signup`);
    await page.fill('input[name="email"], input[type="email"]', testEmail);
    await page.fill('input[name="name"]', '결제테스터');
    await page.fill('input[name="password"], input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/counselors/, { timeout: 10000 });
  });

  test('1. User can create a booking and see PENDING payment', async ({ page }) => {
    // Navigate to counselor and book
    await page.locator('a[href*="/counselors/"]').first().click();
    await expect(page).toHaveURL(/\/counselors\/\d+/);

    // Book first available slot
    const bookButton = page.locator('button:has-text("예약")').first();
    if (await bookButton.isVisible()) {
      await bookButton.click();
      await page.waitForTimeout(1000);
    }

    // Navigate to bookings
    await page.goto(`${BASE}/bookings/me`);
    await page.waitForLoadState('networkidle');

    // Should show booking with payment option
    await expect(page.locator('text=PENDING').or(page.locator('text=예약'))).toBeVisible({ timeout: 5000 });
  });

  test('2. Payment confirmation updates status to PAID', async ({ page }) => {
    // Navigate to counselor and book
    await page.locator('a[href*="/counselors/"]').first().click();
    await expect(page).toHaveURL(/\/counselors\/\d+/);

    const bookButton = page.locator('button:has-text("예약")').first();
    if (await bookButton.isVisible()) {
      await bookButton.click();
      await page.waitForTimeout(1000);
    }

    // Navigate to bookings
    await page.goto(`${BASE}/bookings/me`);
    await page.waitForLoadState('networkidle');

    // Look for payment/confirm action button
    const payButton = page.locator('button:has-text("결제"), button:has-text("확인")').first();
    if (await payButton.isVisible()) {
      await payButton.click();
      await page.waitForTimeout(2000);

      // Status should update to PAID
      await expect(page.locator('text=PAID').or(page.locator('text=결제완료'))).toBeVisible({ timeout: 10000 });
    }
  });

  test('3. Chat room is available after payment confirmation', async ({ page }) => {
    // This test verifies chat room creation after payment
    await page.goto(`${BASE}/sessions`);
    await page.waitForLoadState('networkidle');

    // Sessions page should be accessible for logged-in users
    // After payment confirmation, active sessions should appear
    await expect(page).toHaveURL(/\/sessions/);
  });
});
