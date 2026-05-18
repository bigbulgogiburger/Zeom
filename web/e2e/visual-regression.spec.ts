import { test, expect, type Page } from '@playwright/test';

const VIEWPORTS = [
  { name: '375', width: 375, height: 812 },
  { name: '768', width: 768, height: 1024 },
  { name: '1280', width: 1280, height: 800 },
  { name: '1920', width: 1920, height: 1080 },
] as const;

const PAGES_PUBLIC = [
  '/',
  '/counselors',
  '/counselors/1',
  '/fortune',
  '/blog',
  '/terms',
  '/privacy',
  '/faq',
  '/design-system',
  '/login',
  '/signup',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
];

const PAGES_AUTHED = [
  '/dashboard',
  '/mypage',
  '/wallet',
  '/credits',
  '/credits/buy',
  '/cash/buy',
  '/favorites',
  '/notifications',
  '/notification-preferences',
  '/referral',
  '/recommend',
  '/share',
  '/my-saju',
  '/bookings/me',
  '/booking/confirm',
  '/disputes',
  '/refunds',
  '/sessions',
  '/onboarding',
];

const PAGES_COUNSELOR = [
  '/counselor',
  '/counselor/bookings',
  '/counselor/customers',
  '/counselor/profile',
  '/counselor/records',
  '/counselor/reviews',
  '/counselor/room',
  '/counselor/schedule',
  '/counselor/settlement',
];

const PAGES_ADMIN = [
  '/admin/login',
  '/admin/dashboard',
  '/admin/analytics',
  '/admin/audit',
  '/admin/counselor-applications',
  '/admin/coupons',
  '/admin/disputes',
  '/admin/refunds',
  '/admin/reviews',
  '/admin/settlements',
  '/admin/timeline',
  '/admin/users',
];

const ALL_PAGES = [
  ...PAGES_PUBLIC,
  ...PAGES_AUTHED,
  ...PAGES_COUNSELOR,
  ...PAGES_ADMIN,
];

function snapshotKey(path: string, vp: string): string {
  const slug = path.replace(/[/\[\]]/g, '_') || 'root';
  return `${slug}-${vp}.png`;
}

async function checkOverflow(page: Page, vpWidth: number): Promise<number> {
  return await page.evaluate(() => {
    const root = document.documentElement;
    return Math.max(0, root.scrollWidth - root.clientWidth);
  });
}

for (const vp of VIEWPORTS) {
  test.describe(`Visual @${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    for (const p of ALL_PAGES) {
      test(`${p}`, async ({ page }) => {
        const response = await page.goto(p, { waitUntil: 'domcontentloaded' });
        if (!response || response.status() >= 500) {
          test.fail(true, `route returned ${response?.status() ?? 'no response'}`);
        }
        await page.waitForLoadState('networkidle').catch(() => {});

        const overflow = await checkOverflow(page, vp.width);
        if (vp.name === '375' && overflow > 0) {
          // mobile overflow 는 hard fail
          throw new Error(`mobile overflow detected: ${overflow}px on ${p}`);
        }

        await expect(page).toHaveScreenshot(snapshotKey(p, vp.name), {
          fullPage: true,
          animations: 'disabled',
          maxDiffPixelRatio: 0.01,
        });
      });
    }
  });
}
