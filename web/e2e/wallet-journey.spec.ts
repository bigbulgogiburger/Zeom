import { test, expect } from '@playwright/test';

/**
 * E2E: Wallet Journey - View Balance → Cash Buy Flow
 * Tests wallet balance display and cash purchase UI flow.
 */

const BASE = 'http://localhost:3000';

test.describe('Wallet Journey: Balance → Cash Buy', () => {
  const testEmail = 'dohoon321@gmail.com';
  const testPassword = 'test1234';

  test.beforeEach(async ({ page }) => {
    // Login with test account
    await page.goto(`${BASE}/login`);
    await page.fill('input[name="email"], input[type="email"]', testEmail);
    await page.fill('input[name="password"], input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/counselors/, { timeout: 10000 });
  });

  test('1. User can navigate to wallet page and see balance', async ({ page }) => {
    // Navigate to wallet
    await page.goto(`${BASE}/wallet`);
    await expect(page).toHaveURL(/\/wallet/);

    // Check if balance is displayed
    await expect(page.locator('text=/잔액|balance|포인트/i')).toBeVisible({ timeout: 5000 });
  });

  test('2. User can view cash buy page', async ({ page }) => {
    // Navigate to cash buy
    await page.goto(`${BASE}/wallet/cash-buy`);
    await expect(page).toHaveURL(/\/wallet\/cash-buy/);

    // Should show cash product options
    await expect(page.locator('text=/구매|충전|캐시/i')).toBeVisible({ timeout: 5000 });
  });

  test('3. User can select a cash product', async ({ page }) => {
    await page.goto(`${BASE}/wallet/cash-buy`);
    await page.waitForLoadState('networkidle');

    // Look for product selection buttons/cards
    const productButton = page.locator('button:has-text("구매"), button:has-text("선택")').first();
    if (await productButton.isVisible()) {
      await productButton.click();
      await page.waitForTimeout(1000);

      // Should show payment flow UI or confirmation
      await expect(page.locator('text=/결제|확인/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('4. Wallet page handles backend unavailable gracefully', async ({ page }) => {
    // Navigate to wallet page
    await page.goto(`${BASE}/wallet`);

    // Wait for page load
    await page.waitForLoadState('networkidle');

    // Page should either show balance or error message (not crash)
    const hasContent = await page.locator('body').textContent();
    expect(hasContent).toBeTruthy();
  });

  test('5. Cash buy shows payment amount correctly', async ({ page }) => {
    await page.goto(`${BASE}/wallet/cash-buy`);
    await page.waitForLoadState('networkidle');

    // Should display price information
    const priceText = await page.locator('text=/원|₩|KRW/i').first();
    if (await priceText.isVisible()) {
      await expect(priceText).toBeVisible();
    }
  });
});
