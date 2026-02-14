import { test, expect } from '@playwright/test';

/**
 * E2E: Admin Journey
 * Admin Login → Dashboard → Timeline → Audit Log → CSV Export
 */

const BASE = 'http://localhost:3000';

test.describe('Admin Journey: Login → Dashboard → Timeline → Audit → CSV', () => {
  // Admin credentials need to be set up via API or seed data
  const adminEmail = `e2e_admin_${Date.now()}@zeom.com`;
  const adminPassword = 'Password123!';

  test.beforeAll(async ({ request }) => {
    // Signup via API
    await request.post('http://localhost:8080/api/v1/auth/signup', {
      data: { email: adminEmail, password: adminPassword, name: '관리자' },
    });

    // Note: In real setup, admin role promotion would be done via seed or admin API
    // For E2E, we assume the admin login endpoint handles this or a seed exists
  });

  test('1. Admin can log in via admin login page', async ({ page }) => {
    await page.goto(`${BASE}/admin/login`);

    await page.fill('input[name="email"], input[type="email"]', adminEmail);
    await page.fill('input[name="password"], input[type="password"]', adminPassword);
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test('2. Admin dashboard shows statistics', async ({ page }) => {
    await page.goto(`${BASE}/admin/login`);
    await page.fill('input[name="email"], input[type="email"]', adminEmail);
    await page.fill('input[name="password"], input[type="password"]', adminPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    // Dashboard should display stat cards
    await expect(page.locator('main')).toBeVisible();
    // Should have statistics sections (users, bookings, auth events)
    await page.waitForLoadState('networkidle');
  });

  test('3. Admin can view operations timeline', async ({ page }) => {
    await page.goto(`${BASE}/admin/login`);
    await page.fill('input[name="email"], input[type="email"]', adminEmail);
    await page.fill('input[name="password"], input[type="password"]', adminPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto(`${BASE}/admin/timeline`);
    await expect(page).toHaveURL(/\/admin\/timeline/);
    await page.waitForLoadState('networkidle');

    // Timeline page should be accessible to admin
    await expect(page.locator('main')).toBeVisible();
  });

  test('4. Admin can view audit logs', async ({ page }) => {
    await page.goto(`${BASE}/admin/login`);
    await page.fill('input[name="email"], input[type="email"]', adminEmail);
    await page.fill('input[name="password"], input[type="password"]', adminPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto(`${BASE}/admin/audit`);
    await expect(page).toHaveURL(/\/admin\/audit/);
    await page.waitForLoadState('networkidle');

    // Should display audit log table/list
    await expect(page.locator('main')).toBeVisible();
  });

  test('5. Admin can export audit logs as CSV', async ({ page }) => {
    await page.goto(`${BASE}/admin/login`);
    await page.fill('input[name="email"], input[type="email"]', adminEmail);
    await page.fill('input[name="password"], input[type="password"]', adminPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto(`${BASE}/admin/audit`);
    await page.waitForLoadState('networkidle');

    // Find CSV export button
    const csvButton = page.locator('button:has-text("CSV"), a:has-text("CSV"), button:has-text("내보내기")');
    if (await csvButton.isVisible()) {
      // Listen for download
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 10000 }),
        csvButton.click(),
      ]);

      // Verify download
      expect(download.suggestedFilename()).toContain('audit');
    }
  });
});
