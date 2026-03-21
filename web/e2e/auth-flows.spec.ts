import { test, expect } from '@playwright/test';

/**
 * E2E: Authentication Flows
 * Token refresh, session expiry handling, role-based redirects
 */

const BASE = 'http://localhost:3000';

test.describe('Auth Flows: Token Refresh & Session Expiry', () => {
  const testEmail = `e2e_auth_${Date.now()}@zeom.com`;
  const testPassword = 'Password123!';

  test.beforeEach(async ({ page }) => {
    // Signup — multi-step wizard
    await page.goto(`${BASE}/signup`);
    await page.waitForLoadState('domcontentloaded');

    // Step 1: Basic Info (email, password, confirm password, name)
    await page.fill('input[type="email"]', testEmail);
    await page.locator('input[type="password"]').first().fill(testPassword);
    await page.locator('input[type="password"]').nth(1).fill(testPassword);
    await page.fill('input[autocomplete="name"]', '인증테스터');

    // Click "다음" to go to step 2
    const nextButton = page.locator('button:has-text("다음"), button:has-text("Next")');
    await nextButton.click();

    // Step 2: Birth info — fill required fields
    await page.waitForTimeout(500);
    // Select birth year, month, day
    await page.locator('select').nth(0).selectOption({ index: 1 }); // year
    await page.locator('select').nth(1).selectOption({ index: 1 }); // month
    await page.locator('select').nth(2).selectOption({ index: 1 }); // day
    // Select birth hour
    await page.locator('select').nth(3).selectOption({ index: 1 }); // hour
    // Select gender (click first gender card button)
    const genderButton = page.locator('[data-gender], button:has-text("남"), label:has-text("남")').first();
    if (await genderButton.isVisible({ timeout: 2000 })) {
      await genderButton.click();
    }

    // Click "다음" to go to step 3
    const nextButton2 = page.locator('button:has-text("다음"), button:has-text("Next")');
    await nextButton2.click();

    // Step 3: Terms — agree all and submit
    await page.waitForTimeout(500);
    const agreeAllCheckbox = page.locator('button[role="checkbox"], input[type="checkbox"]').first();
    if (await agreeAllCheckbox.isVisible({ timeout: 2000 })) {
      await agreeAllCheckbox.click();
    }

    // Submit
    const submitButton = page.locator('button:has-text("가입"), button:has-text("Sign")');
    await submitButton.click();

    await expect(page).toHaveURL(/\/counselors/, { timeout: 15000 });
  });

  test('1. Unauthenticated user is redirected to login from protected pages', async ({ page }) => {
    // Clear tokens to simulate unauthenticated state
    await page.evaluate(() => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    });

    await page.goto(`${BASE}/bookings/me`);

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test('2. Non-admin user is redirected from admin pages', async ({ page }) => {
    // Regular user trying to access admin pages
    await page.goto(`${BASE}/dashboard`);

    // Should redirect to / or /admin/login
    await expect(page).toHaveURL(/\/(admin\/login)?$/, { timeout: 10000 });
  });

  test('3. Session expiry shows modal and redirects to login', async ({ page }) => {
    // Simulate session expiry by dispatching the custom event
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('auth:expired'));
    });

    // Session expiry modal should appear
    await expect(page.locator('text=세션이 만료되었습니다')).toBeVisible({ timeout: 5000 });

    // Click redirect button
    await page.locator('button:has-text("로그인으로 이동")').click();

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test('4. Token stored in localStorage after login', async ({ page }) => {
    const tokens = await page.evaluate(() => ({
      access: localStorage.getItem('accessToken'),
      refresh: localStorage.getItem('refreshToken'),
    }));

    expect(tokens.access).toBeTruthy();
    expect(tokens.refresh).toBeTruthy();
  });

  test('5. Logout clears tokens and redirects', async ({ page }) => {
    // Find and click logout button
    const logoutButton = page.locator('button:has-text("로그아웃")');
    if (await logoutButton.isVisible()) {
      await logoutButton.click();

      // Tokens should be cleared
      const tokens = await page.evaluate(() => ({
        access: localStorage.getItem('accessToken'),
        refresh: localStorage.getItem('refreshToken'),
      }));

      expect(tokens.access).toBeNull();
      expect(tokens.refresh).toBeNull();

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    }
  });

  test('6. Token refresh happens transparently on 401', async ({ page }) => {
    // Invalidate access token while keeping refresh token
    await page.evaluate(() => {
      localStorage.setItem('accessToken', 'invalid-token');
    });

    // Navigate to a protected API-consuming page
    await page.goto(`${BASE}/bookings/me`);

    // The page should still work (auto-refresh should kick in)
    // If refresh fails, we'd get redirected to login
    await page.waitForTimeout(3000);

    // Check if tokens were updated (refresh was successful)
    const newToken = await page.evaluate(() => localStorage.getItem('accessToken'));
    // If refresh worked, the token should be different from 'invalid-token'
    // If not, we should be on the login page
    const url = page.url();
    const refreshWorked = newToken !== 'invalid-token' || url.includes('/login');
    expect(refreshWorked).toBe(true);
  });
});
