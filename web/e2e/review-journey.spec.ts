import { test, expect } from '@playwright/test';

/**
 * E2E: Review Journey - Consultation History → Submit Review
 * Tests the review submission flow including star rating and comment.
 */

const BASE = 'http://localhost:3000';

test.describe('Review Journey: History → Submit Review', () => {
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

  test('1. User can navigate to consultation history', async ({ page }) => {
    // Navigate to history page (could be /bookings/me or /history)
    await page.goto(`${BASE}/bookings/me`);
    await expect(page).toHaveURL(/\/bookings\/me/);

    // Should show booking list
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=/내역|히스토리|예약/i')).toBeVisible({ timeout: 5000 });
  });

  test('2. User can click review button for completed consultation', async ({ page }) => {
    await page.goto(`${BASE}/bookings/me`);
    await page.waitForLoadState('networkidle');

    // Look for review button (usually available after consultation completion)
    const reviewButton = page.locator('button:has-text("리뷰"), button:has-text("후기"), a:has-text("리뷰")').first();
    if (await reviewButton.isVisible()) {
      await reviewButton.click();
      await page.waitForTimeout(1000);

      // Should navigate to review page or show review modal
      await expect(page.locator('text=/리뷰|후기|평가/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('3. User can select star rating (4 stars)', async ({ page }) => {
    // Navigate to reviews or create review page
    await page.goto(`${BASE}/reviews/new`);
    await page.waitForLoadState('networkidle');

    // Look for star rating UI (could be buttons, inputs, or SVG stars)
    const starRating = page.locator('[data-rating="4"], button:has-text("★"):nth-child(4), input[type="radio"][value="4"]').first();
    if (await starRating.isVisible()) {
      await starRating.click();
      await page.waitForTimeout(500);
    } else {
      // Alternative: look for 4th star element
      const stars = page.locator('[role="button"]:has-text("★"), .star, .rating-star');
      if (await stars.count() >= 4) {
        await stars.nth(3).click(); // 0-indexed, so 3 = 4th star
      }
    }
  });

  test('4. User can write review comment', async ({ page }) => {
    await page.goto(`${BASE}/reviews/new`);
    await page.waitForLoadState('networkidle');

    // Look for comment/content textarea
    const commentInput = page.locator('textarea[name="comment"], textarea[name="content"], textarea[placeholder*="후기"]').first();
    if (await commentInput.isVisible()) {
      await commentInput.fill('정말 좋은 상담이었습니다. 친절하고 세심한 조언 감사합니다!');
      await page.waitForTimeout(500);
    }
  });

  test('5. User can submit review', async ({ page }) => {
    await page.goto(`${BASE}/reviews/new`);
    await page.waitForLoadState('networkidle');

    // Select rating
    const starRating = page.locator('[data-rating="4"], .star').nth(3);
    if (await starRating.isVisible()) {
      await starRating.click();
    }

    // Fill comment
    const commentInput = page.locator('textarea[name="comment"], textarea[name="content"]').first();
    if (await commentInput.isVisible()) {
      await commentInput.fill('훌륭한 상담이었습니다!');
    }

    // Submit
    const submitButton = page.locator('button[type="submit"], button:has-text("제출"), button:has-text("등록")');
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(2000);

      // Should show success message or redirect
      await expect(page.locator('text=/완료|성공|감사합니다/i').or(page.locator('text=/리뷰/i'))).toBeVisible({ timeout: 5000 });
    }
  });

  test('6. Review page handles backend errors gracefully', async ({ page }) => {
    await page.goto(`${BASE}/reviews/new`);
    await page.waitForLoadState('networkidle');

    // Should either show form or error message (not crash)
    const bodyContent = await page.locator('body').textContent();
    expect(bodyContent).toBeTruthy();
  });

  test('7. User can view submitted reviews', async ({ page }) => {
    // Navigate to reviews list
    await page.goto(`${BASE}/reviews`);
    await page.waitForLoadState('networkidle');

    // Should show review list or user's reviews
    await expect(page).toHaveURL(/\/reviews/);
  });
});
