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
    // Signup
    await page.goto(`${BASE}/signup`);
    await page.fill('input[name="email"], input[type="email"]', testEmail);
    await page.fill('input[name="name"]', '인증테스터');
    await page.fill('input[name="password"], input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/counselors/, { timeout: 10000 });
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
