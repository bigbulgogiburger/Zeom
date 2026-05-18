import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PAGES_FOR_A11Y = [
  '/',
  '/counselors',
  '/counselors/1',
  '/fortune',
  '/blog',
  '/terms',
  '/privacy',
  '/faq',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/dashboard',
  '/mypage',
  '/wallet',
  '/credits',
  '/cash/buy',
  '/favorites',
  '/notifications',
  '/bookings/me',
  '/booking/confirm',
  '/disputes',
  '/refunds',
  '/counselor',
  '/counselor/calendar',
  '/counselor/clients',
  '/admin/login',
  '/admin/dashboard',
  '/admin/users',
  '/admin/counselors',
];

interface AxeSummary {
  page: string;
  blockers: Array<{
    id: string;
    impact: string;
    description: string;
    nodes: number;
  }>;
}

const summary: AxeSummary[] = [];

test.afterAll(async () => {
  const outDir = path.resolve(__dirname, '../../docs/qa/axe');
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(
    path.join(outDir, '71-pages-summary.json'),
    JSON.stringify(summary, null, 2),
  );
});

for (const p of PAGES_FOR_A11Y) {
  test(`a11y: ${p}`, async ({ page }) => {
    await page.goto(p, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    const blockers = results.violations
      .filter((v) => v.impact === 'critical' || v.impact === 'serious')
      .map((v) => ({
        id: v.id,
        impact: v.impact ?? 'unknown',
        description: v.description,
        nodes: v.nodes.length,
      }));

    summary.push({ page: p, blockers });

    expect(
      blockers,
      `\n[a11y blockers on ${p}]\n${JSON.stringify(blockers, null, 2)}`,
    ).toEqual([]);
  });
}
