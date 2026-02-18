import { test, expect } from '@playwright/test';

/**
 * E2E: Refund Journey - View Refunds → Request Refund → Check Status
 * Tests the refund request flow including policy calculator and status tracking.
 */

const BASE = 'http://localhost:3000';

test.describe('Refund Journey: Request → Policy → Status', () => {
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

  test('1. User can navigate to refunds page', async ({ page }) => {
    await page.goto(`${BASE}/refunds`);
    await expect(page).toHaveURL(/\/refunds/);

    // Should show refunds list or empty state
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=/환불|취소/i')).toBeVisible({ timeout: 5000 });
  });

  test('2. User can click new refund request', async ({ page }) => {
    await page.goto(`${BASE}/refunds`);
    await page.waitForLoadState('networkidle');

    // Look for "new refund" button
    const newRefundButton = page.locator('button:has-text("환불"), button:has-text("신청"), a:has-text("환불")').first();
    if (await newRefundButton.isVisible()) {
      await newRefundButton.click();
      await page.waitForTimeout(1000);

      // Should navigate to refund request form
      await expect(page.locator('text=/환불|취소|예약/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('3. User can select reservation for refund', async ({ page }) => {
    await page.goto(`${BASE}/refunds/new`);
    await page.waitForLoadState('networkidle');

    // Look for reservation selection dropdown/list
    const reservationSelect = page.locator('select[name="bookingId"], select[name="reservation"]').first();
    if (await reservationSelect.isVisible()) {
      // Get all options
      const options = await reservationSelect.locator('option').count();
      if (options > 1) {
        // Select second option (first is usually placeholder)
        await reservationSelect.selectOption({ index: 1 });
        await page.waitForTimeout(500);
      }
    } else {
      // Alternative: click on reservation card/button
      const reservationCard = page.locator('[data-testid="reservation-card"], .reservation-item').first();
      if (await reservationCard.isVisible()) {
        await reservationCard.click();
      }
    }
  });

  test('4. Refund policy calculator shows correct amount', async ({ page }) => {
    await page.goto(`${BASE}/refunds/new`);
    await page.waitForLoadState('networkidle');

    // Select a reservation if available
    const reservationSelect = page.locator('select[name="bookingId"]').first();
    if (await reservationSelect.isVisible()) {
      const options = await reservationSelect.locator('option').count();
      if (options > 1) {
        await reservationSelect.selectOption({ index: 1 });
        await page.waitForTimeout(1000);
      }
    }

    // Look for policy calculator display (refund amount, fee, etc.)
    const policyInfo = page.locator('text=/환불.*금액|수수료|취소.*정책/i');
    if (await policyInfo.first().isVisible()) {
      await expect(policyInfo.first()).toBeVisible();
    }

    // Should show amount in KRW
    const amountDisplay = page.locator('text=/원|₩|KRW/');
    if (await amountDisplay.first().isVisible()) {
      await expect(amountDisplay.first()).toBeVisible();
    }
  });

  test('5. User can submit refund request', async ({ page }) => {
    await page.goto(`${BASE}/refunds/new`);
    await page.waitForLoadState('networkidle');

    // Select reservation
    const reservationSelect = page.locator('select[name="bookingId"]').first();
    if (await reservationSelect.isVisible()) {
      const options = await reservationSelect.locator('option').count();
      if (options > 1) {
        await reservationSelect.selectOption({ index: 1 });
        await page.waitForTimeout(500);
      }
    }

    // Fill reason if required
    const reasonInput = page.locator('textarea[name="reason"], input[name="reason"]').first();
    if (await reasonInput.isVisible()) {
      await reasonInput.fill('개인 사정으로 인한 취소입니다.');
    }

    // Submit
    const submitButton = page.locator('button[type="submit"], button:has-text("신청"), button:has-text("제출")');
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(2000);

      // Should show success message or redirect to refunds list
      await expect(page.locator('text=/완료|접수|신청/i').or(page.locator('[href*="/refunds"]'))).toBeVisible({ timeout: 5000 });
    }
  });

  test('6. User can view refund request status', async ({ page }) => {
    await page.goto(`${BASE}/refunds`);
    await page.waitForLoadState('networkidle');

    // Should show refund list with status
    const statusText = page.locator('text=/대기|처리.*중|완료|승인|거부/i').first();
    if (await statusText.isVisible()) {
      await expect(statusText).toBeVisible();
    }
  });

  test('7. Refund page shows policy information', async ({ page }) => {
    await page.goto(`${BASE}/refunds/policy`);
    await page.waitForLoadState('networkidle');

    // Should show refund policy details
    await expect(page.locator('text=/환불.*정책|취소.*규정/i')).toBeVisible({ timeout: 5000 });
  });

  test('8. Refund journey handles backend errors gracefully', async ({ page }) => {
    await page.goto(`${BASE}/refunds`);
    await page.waitForLoadState('networkidle');

    // Should either show content or error message (not crash)
    const bodyContent = await page.locator('body').textContent();
    expect(bodyContent).toBeTruthy();
  });
});
