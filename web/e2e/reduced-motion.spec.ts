import { test, expect } from '@playwright/test';

const ANIMATED_TARGETS = [
  { url: '/', name: 'home-glow', timeout: 1500 },
  { url: '/counselors', name: 'counselors-stagger', timeout: 1500 },
  { url: '/fortune', name: 'fortune-scroll-fade', timeout: 1500 },
];

for (const target of ANIMATED_TARGETS) {
  test(`reduced-motion stays static: ${target.name}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(target.url, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(300);

    const before = await page.screenshot({ fullPage: false });
    await page.waitForTimeout(target.timeout);
    const after = await page.screenshot({ fullPage: false });

    expect(after.equals(before)).toBe(true);
  });
}

test('prefers-reduced-motion media query is honored', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const prefers = await page.evaluate(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  expect(prefers).toBe(true);
});
