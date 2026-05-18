# [ZEOM-9 / ZEOM-33] P7-1 — Lighthouse · 시각 회귀 · A11y · 4 뷰포트 · reduced-motion (2일)

> 부모 통합: `docs/ZEOM-9-dev-guide.md`
> 스택: Next.js 15 + Playwright 1.55 + Lighthouse CLI + axe-core
> 페르소나: React Expert + QA Automation
> 산출물: `docs/qa/lighthouse/*.json`, `web/e2e-screenshots/`, `docs/qa/ZEOM-9-qa-report.md` (§A·B·C·D·E)

## 0. Touched Files (disjoint 보장)

**신규 생성**:
- `docs/qa/ZEOM-9-qa-report.md` (P7-1 섹션 — ZEOM-34 가 §F·G·H 추가)
- `docs/qa/lighthouse/<page>.json` × 9
- `docs/qa/axe/71-pages-summary.json`
- `web/e2e-screenshots/<page>-{375,768,1280,1920}.png` (~284 PNG — Playwright snapshot baseline)
- `web/e2e/visual-regression.spec.ts` (신규 — 4 viewport × 71 페이지 스냅샷)
- `web/e2e/a11y-axe.spec.ts` (신규 — axe-core 71 페이지 자동 검사)
- `web/e2e/reduced-motion.spec.ts` (신규 — reduced-motion media query 시 정적 paint 검증)

**수정**:
- `web/package.json` — devDep `@axe-core/playwright` 추가, `scripts.test:lighthouse` 추가
- `web/playwright.config.ts` — viewport 매트릭스 + reducedMotion project 추가

**ZEOM-34 와 disjoint**: ZEOM-34 는 `docs/qa/ZEOM-9-qa-report.md` 의 §F·G·H 만 append + `docs/qa/i18n/` 신규. 동일 파일 충돌 X (섹션 단위 분리).

## 1. AC 분해 (P7-1 6개)

- [ ] AC-33-1: **Lighthouse JSON 9개** — P0 페이지 (`/`, `/login`, `/counselors`, `/counselors/[id]`, `/cash/buy`, `/bookings/me`, `/dashboard`, `/consultation/[sid]/room`, `/consultation/[sid]/review`), 모두 Perf/A11y/Best/SEO ≥ 90. 표 1개로 점수 정리.
- [ ] AC-33-2: **시각 회귀 비교 문서** — 71페이지 Before/After (Before 는 main HEAD 디플로이 / After 는 본 브랜치). 본 라운드는 **baseline 최초 생성** 이므로 "Before" 는 N/A, "After" PNG 만 기록. 사람의 눈으로 spot check 후 OK/이상 메모.
- [ ] AC-33-3: **keyboard nav 검증 표** — 7 핵심 페이지 (홈/login/counselors/[id]/cash/buy/bookings/me/consultation/room) + 글로벌 chrome (header/bottom-tab). Tab 순서 일관성, Enter 활성화, Esc dismiss (modal), Space toggle (checkbox/switch).
- [ ] AC-33-4: **screen reader 검증** — VoiceOver (macOS) 5 핵심 페이지. NVDA 는 limitation 명시.
- [ ] AC-33-5: **reduced-motion 71페이지 PASS** — Playwright `emulateMedia({ reducedMotion: 'reduce' })` 자동 검증 + BreathingOrb / MicLevelMeter / stagger / glow / scroll-fade 컴포넌트 spot check.
- [ ] AC-33-6: **4 뷰포트 결과** — 375 / 768 / 1280 / 1920. 71 페이지 모두 viewport 별 PNG + overflow (horizontal scroll) 점검.

## 2. 환경 준비 (반시간)

```bash
# 1. backend docker 기동 (개발용 fake provider)
docker compose up -d backend mysql redis

# 2. backend health 대기
curl -fsS http://localhost:8080/actuator/health

# 3. web production build (Lighthouse 신뢰도 ↑)
cd web && npm run build && npm run start &

# 4. web health 대기
curl -fsS http://localhost:3000/

# 5. axe-core/playwright devDep 추가
cd web && npm i -D @axe-core/playwright lighthouse chrome-launcher
```

**E2E 계정 (인증 필요 경로)**: `e2e-test@zeom.com` / `TestPass123!` — Playwright `storageState` 로 1회 로그인 후 모든 spec 에서 재사용.

## 3. 측정 매트릭스 (Phase 별 구체)

### Phase 3-A. Lighthouse (P0 9 페이지)

`scripts/qa-lighthouse.mjs` (web 디렉토리 기준 신규):

```js
// 의사 코드 — 실제 구현은 lighthouse + chrome-launcher 조합
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import fs from 'node:fs/promises';
import path from 'node:path';

const PAGES = [
  { name: 'home', url: 'http://localhost:3000/' },
  { name: 'login', url: 'http://localhost:3000/login' },
  { name: 'counselors', url: 'http://localhost:3000/counselors' },
  { name: 'counselors-id', url: 'http://localhost:3000/counselors/1' },
  { name: 'cash-buy', url: 'http://localhost:3000/cash/buy' },
  { name: 'bookings-me', url: 'http://localhost:3000/bookings/me' },        // 인증 필요
  { name: 'dashboard', url: 'http://localhost:3000/dashboard' },             // 인증 필요
  { name: 'room', url: 'http://localhost:3000/consultation/fake-sid/room' }, // 인증 + session
  { name: 'review', url: 'http://localhost:3000/consultation/fake-sid/review' },
];

const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
const opts = { port: chrome.port, output: 'json',
  onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
  formFactor: 'mobile', screenEmulation: { mobile: true, width: 412, height: 823, deviceScaleFactor: 2 },
  throttling: { rttMs: 150, throughputKbps: 1638.4, cpuSlowdownMultiplier: 4 } };

for (const p of PAGES) {
  const r = await lighthouse(p.url, opts);
  await fs.writeFile(path.join('docs/qa/lighthouse', `${p.name}.json`), r.report);
}
await chrome.kill();
```

**점수 합격 기준**: 각 카테고리 ≥ 90, CLS ≤ 0.05, LCP ≤ 2500ms. < 90 발견 시:
1. 명백한 원인 (next/image 미사용, 폰트 preload 누락, console error) 이면 즉시 소형 fix.
2. 그 외 (예: 외부 SDK 무거움) 는 hotfix Task 후보 → `docs/qa/ZEOM-9-qa-report.md` 미해결 섹션.

### Phase 3-B. Playwright Visual Snapshot (71 페이지 × 4 VP)

`web/e2e/visual-regression.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { name: '375', width: 375, height: 812 },   // mobile
  { name: '768', width: 768, height: 1024 },  // tablet
  { name: '1280', width: 1280, height: 800 }, // desktop
  { name: '1920', width: 1920, height: 1080 },// ultrawide
];

const PAGES_PUBLIC = [
  '/', '/counselors', '/counselors/1', '/fortune', '/blog', '/terms', '/privacy', '/faq',
  '/login', '/signup', '/forgot-password',
  // ... (이슈 description 의 71 페이지 인벤토리 — web/CLAUDE.md 참조)
];

const PAGES_AUTHED = [
  '/dashboard', '/mypage', '/wallet', '/credits', '/favorites', '/notifications',
  '/cash/buy', '/credits/buy', '/bookings/me', '/booking/confirm',
  // ... (인증 필요 — storageState 사용)
];

for (const vp of VIEWPORTS) {
  test.describe(`Visual ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });
    for (const p of [...PAGES_PUBLIC, ...PAGES_AUTHED]) {
      test(`${p}`, async ({ page }) => {
        await page.goto(p);
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveScreenshot(
          `${p.replace(/[/\[\]]/g, '_') || 'root'}-${vp.name}.png`,
          { fullPage: true, maxDiffPixels: 0 }
        );
      });
    }
  });
}
```

**1회차 (baseline)**: `npx playwright test e2e/visual-regression.spec.ts --update-snapshots` 로 `web/e2e-screenshots/` 채움. 2회차부터 회귀 검사.

**Overflow 점검**: 각 spec 안에서 `await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)` ≤ 0 (mobile=375) 검증. 양수면 fail.

### Phase 3-C. A11y 자동 (axe-core)

`web/e2e/a11y-axe.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

const PAGES = [/* 71 페이지 */];

for (const p of PAGES) {
  test(`a11y: ${p}`, async ({ page }) => {
    await page.goto(p);
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    // 결과는 docs/qa/axe/ 에 누적 — fail 은 critical/serious 만
    const blockers = results.violations.filter(v => ['critical', 'serious'].includes(v.impact));
    expect(blockers, JSON.stringify(blockers.map(v => v.id), null, 2)).toEqual([]);
  });
}
```

발견된 violation 중:
- **자동 수정 가능** (`alt` 누락, `aria-label` 누락, button-name, link-name, label, color-contrast): 위치 표시 → 즉시 단일 fix.
- **구조 변경 필요** (form-field-multiple-labels, region 등): hotfix Task.

### Phase 3-D. A11y 수동 — VoiceOver

VoiceOver (Cmd+F5) 로 5 핵심 페이지 수동 진행. 체크리스트:
- 페이지 진입 시 페이지 제목 announce (`<title>` + h1)
- Tab 이동 시 focus visual + announce 일치
- modal open 시 focus trap + announce
- button/link 의 의미 명확 (`aria-label` or text)
- form error 시 aria-live 또는 errormessage

결과: `docs/qa/ZEOM-9-qa-report.md` §C-2 표.

### Phase 3-E. Reduced motion

`web/e2e/reduced-motion.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test.use({ reducedMotion: 'reduce' });

const ANIMATED_PAGES = [
  { url: '/consultation/fake-sid/preflight', name: 'BreathingOrb', selector: '[data-anim="breathing-orb"]' },
  { url: '/consultation/fake-sid/room', name: 'MicLevelMeter', selector: '[data-anim="mic-meter"]' },
  // ... stagger / glow / scroll-fade 도
];

for (const a of ANIMATED_PAGES) {
  test(`reduced-motion: ${a.name}`, async ({ page }) => {
    await page.goto(a.url);
    const before = await page.locator(a.selector).screenshot();
    await page.waitForTimeout(1500); // 1.5초 후
    const after = await page.locator(a.selector).screenshot();
    expect(before).toEqual(after); // 정적이어야 함
  });
}
```

71 페이지 전수 검사는 `reducedMotion: 'reduce'` 매체에서 1초 후 추가 paint 가 발생하지 않는지 일반 visual snapshot 으로 갈음.

## 4. 실행 순서 (2일)

**1일차**:
1. (오전) 환경 셋업 + axe-core/playwright 설치 + scripts 작성
2. (오전) Lighthouse 9 P0 측정 → JSON 9개 저장 → 점수 < 90 항목 1차 fix
3. (오후) Playwright visual baseline 생성 — 4 VP × 71 페이지 ≈ 284 PNG. 시간 초과 시 P0 우선
4. (오후) overflow 점검 (375 mobile) — 발견 시 즉시 fix 또는 메모

**2일차**:
5. (오전) axe-core 71 페이지 자동 검사 — critical/serious 0 까지 작은 fix 반복
6. (오전) VoiceOver 5 핵심 페이지 수동 검증
7. (오후) reduced-motion 검증
8. (오후) `docs/qa/ZEOM-9-qa-report.md` P7-1 섹션 (§A·B·C·D·E) 작성 + 미해결 hotfix 후보 정리

## 5. 검증 (slice 자체 DoD)

```bash
# 1. Lighthouse JSON 9개 존재
ls docs/qa/lighthouse/*.json | wc -l   # → 9

# 2. snapshot baseline 생성
ls web/e2e-screenshots/*.png | wc -l   # → ~284 (71×4)

# 3. axe 위반 critical/serious 0
npx playwright test e2e/a11y-axe.spec.ts

# 4. reduced-motion 통과
npx playwright test e2e/reduced-motion.spec.ts

# 5. 리포트 작성
test -f docs/qa/ZEOM-9-qa-report.md
```

## 6. 위험 & 백업 계획

- **Lighthouse 측정 환경 노이즈**: 같은 페이지 3회 측정 후 중간값 채택
- **인증 필요 페이지 측정 실패**: storageState 미생성 / 백엔드 미가동. 사전 health check 필수
- **71 페이지 시간 초과**: P0 9 → P1 (인증 필요) → P2 (정책/콘텐츠) 우선. 2일 박스 안에서 cut
- **VoiceOver 실 수동 작업**: 무인 자동화 불가 — 본 워크플로 진행자가 직접 수행
- **시각 회귀 "회귀" 판정 불가**: baseline 0인 첫 라운드라서 "변경" 만 기록. 후속 PR 부터 정상 diff
