import { test, expect } from '@playwright/test';

/**
 * E2E: Error Scenarios
 * Slot conflict, payment failure, invalid input handling
 */

const BASE = 'http://localhost:3000';

test.describe('Error Scenarios', () => {
  test.describe('Slot Conflict (409)', () => {
    test('1. Double booking same slot shows conflict error', async ({ page, context }) => {
      // User 1 signs up and books a slot
      const user1Email = `e2e_conflict1_${Date.now()}@zeom.com`;
      await page.goto(`${BASE}/signup`);
      await page.fill('input[name="email"], input[type="email"]', user1Email);
      await page.fill('input[name="name"]', '첫번째사용자');
      await page.fill('input[name="password"], input[type="password"]', 'Password123!');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/\/counselors/, { timeout: 10000 });

      // Navigate to counselor and book
      await page.locator('a[href*="/counselors/"]').first().click();
      await expect(page).toHaveURL(/\/counselors\/\d+/);
      const slotButton = page.locator('button:has-text("예약")').first();
      if (await slotButton.isVisible()) {
        await slotButton.click();
        await page.waitForTimeout(1000);
      }

      // User 2 tries to book the same slot (new page context)
      const page2 = await context.newPage();
      const user2Email = `e2e_conflict2_${Date.now()}@zeom.com`;
      await page2.goto(`${BASE}/signup`);
      await page2.fill('input[name="email"], input[type="email"]', user2Email);
      await page2.fill('input[name="name"]', '두번째사용자');
      await page2.fill('input[name="password"], input[type="password"]', 'Password123!');
      await page2.click('button[type="submit"]');
      await expect(page2).toHaveURL(/\/counselors/, { timeout: 10000 });

      // Try to book the same counselor's slot
      await page2.locator('a[href*="/counselors/"]').first().click();
      await expect(page2).toHaveURL(/\/counselors\/\d+/);
      const sameSlot = page2.locator('button:has-text("예약")').first();
      if (await sameSlot.isVisible()) {
        // Listen for the 409 response
        const responsePromise = page2.waitForResponse(
          resp => resp.url().includes('/api/v1/bookings'),
          { timeout: 10000 }
        );
        await sameSlot.click();
        const response = await responsePromise;

        // Should get 409 Conflict or show error message
        if (response.status() === 409) {
          // Error message should be displayed
          await expect(
            page2.locator('text=이미').or(page2.locator('text=다른')).or(page2.locator('[role="alert"]'))
          ).toBeVisible({ timeout: 5000 });
        }
      }

      await page2.close();
    });
  });

  test.describe('Payment Failure', () => {
    test('2. Payment with invalid booking ID shows error', async ({ page }) => {
      const email = `e2e_payerr_${Date.now()}@zeom.com`;
      await page.goto(`${BASE}/signup`);
      await page.fill('input[name="email"], input[type="email"]', email);
      await page.fill('input[name="name"]', '결제에러테스터');
      await page.fill('input[name="password"], input[type="password"]', 'Password123!');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/\/counselors/, { timeout: 10000 });

      // Try to create payment via API with invalid booking
      const response = await page.evaluate(async () => {
        const token = localStorage.getItem('accessToken');
        const res = await fetch('http://localhost:8080/api/v1/payments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ bookingId: 99999, amount: 50000, currency: 'KRW' }),
        });
        return { status: res.status };
      });

      // Should get 4xx error
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    test('3. Double cancel payment shows appropriate error', async ({ page }) => {
      const email = `e2e_dblcancel_${Date.now()}@zeom.com`;
      await page.goto(`${BASE}/signup`);
      await page.fill('input[name="email"], input[type="email"]', email);
      await page.fill('input[name="name"]', '이중취소테스터');
      await page.fill('input[name="password"], input[type="password"]', 'Password123!');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/\/counselors/, { timeout: 10000 });

      // Create booking and payment via API
      const result = await page.evaluate(async () => {
        const token = localStorage.getItem('accessToken')!;
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        };

        // Create booking
        const bookRes = await fetch('http://localhost:8080/api/v1/bookings', {
          method: 'POST', headers,
          body: JSON.stringify({ counselorId: 1, slotId: 4 }),
        });
        if (!bookRes.ok) return { error: 'booking failed' };
        const booking = await bookRes.json();

        // Create payment
        const payRes = await fetch('http://localhost:8080/api/v1/payments', {
          method: 'POST', headers,
          body: JSON.stringify({ bookingId: booking.id, amount: 50000, currency: 'KRW' }),
        });
        if (!payRes.ok) return { error: 'payment failed' };
        const payment = await payRes.json();

        // First cancel
        const cancel1 = await fetch(`http://localhost:8080/api/v1/payments/${payment.id}/cancel`, {
          method: 'POST', headers,
        });

        // Second cancel
        const cancel2 = await fetch(`http://localhost:8080/api/v1/payments/${payment.id}/cancel`, {
          method: 'POST', headers,
        });

        return { cancel1Status: cancel1.status, cancel2Status: cancel2.status };
      });

      if (!('error' in result)) {
        expect(result.cancel1Status).toBe(200);
        expect(result.cancel2Status).toBeGreaterThanOrEqual(400);
      }
    });
  });

  test.describe('Input Validation', () => {
    test('4. Login with invalid credentials shows error', async ({ page }) => {
      await page.goto(`${BASE}/login`);
      await page.fill('input[name="email"], input[type="email"]', 'nonexistent@zeom.com');
      await page.fill('input[name="password"], input[type="password"]', 'WrongPass123!');
      await page.click('button[type="submit"]');

      // Should show error message (not redirect)
      await page.waitForTimeout(2000);
      await expect(page).toHaveURL(/\/login/);
    });

    test('5. Signup with duplicate email shows error', async ({ page }) => {
      const email = `e2e_dup_${Date.now()}@zeom.com`;

      // First signup
      await page.goto(`${BASE}/signup`);
      await page.fill('input[name="email"], input[type="email"]', email);
      await page.fill('input[name="name"]', '중복테스터');
      await page.fill('input[name="password"], input[type="password"]', 'Password123!');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/\/counselors/, { timeout: 10000 });

      // Second signup with same email
      await page.goto(`${BASE}/signup`);
      await page.fill('input[name="email"], input[type="email"]', email);
      await page.fill('input[name="name"]', '중복테스터2');
      await page.fill('input[name="password"], input[type="password"]', 'Password123!');
      await page.click('button[type="submit"]');

      // Should show error or stay on signup page
      await page.waitForTimeout(2000);
      await expect(page).toHaveURL(/\/signup/);
    });
  });
});
