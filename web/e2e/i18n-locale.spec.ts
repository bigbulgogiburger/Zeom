import { test, expect } from '@playwright/test';

const PAGES_KO_REQUIRED = ['/', '/login', '/counselors', '/fortune', '/terms'];
const PAGES_EN_SMOKE = ['/', '/login', '/counselors'];

async function setLocale(context: any, locale: 'ko' | 'en') {
  await context.clearCookies();
  await context.addCookies([
    { name: 'NEXT_LOCALE', value: locale, url: 'http://localhost:3000' },
  ]);
}

test.describe('i18n ko locale', () => {
  for (const p of PAGES_KO_REQUIRED) {
    test(`ko: ${p}`, async ({ page, context }) => {
      await setLocale(context, 'ko');
      await page.goto(p, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle').catch(() => {});

      const lang = await page.locator('html').getAttribute('lang');
      expect(lang).toBe('ko');

      const body = await page.locator('body').innerText();
      expect(body).toMatch(/[가-힣]/);
    });
  }
});

test.describe('i18n en locale (smoke + fallback)', () => {
  for (const p of PAGES_EN_SMOKE) {
    test(`en: ${p}`, async ({ page, context }) => {
      await setLocale(context, 'en');

      const consoleErrors: string[] = [];
      page.on('pageerror', (e) => consoleErrors.push(e.message));

      await page.goto(p, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle').catch(() => {});

      const lang = await page.locator('html').getAttribute('lang');
      expect(lang).toBe('en');

      // layout shift / overflow 검사
      const overflow = await page.evaluate(() => {
        const root = document.documentElement;
        return Math.max(0, root.scrollWidth - root.clientWidth);
      });
      expect(overflow, `en locale overflow ${overflow}px on ${p}`).toBeLessThanOrEqual(1);

      // throw 없이 렌더링
      expect(
        consoleErrors,
        `en locale console errors on ${p}:\n${consoleErrors.join('\n')}`,
      ).toEqual([]);
    });
  }
});

test('en fallback: 카피 거의 없는 페이지에서 throw 안 함', async ({ page, context }) => {
  await setLocale(context, 'en');
  const consoleErrors: string[] = [];
  page.on('pageerror', (e) => consoleErrors.push(e.message));
  await page.goto('/terms', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle').catch(() => {});
  expect(consoleErrors).toEqual([]);
});
