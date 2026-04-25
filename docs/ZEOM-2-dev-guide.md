# [ZEOM-2] Phase 0 Foundation — 토큰·폰트·radial bg — 개발 가이드

> 생성일: 2026-04-25
> 스택: Next.js 15 (App Router) + React 19 + Tailwind v4 + shadcn/ui
> 페르소나: **React/Next.js Expert** — Tailwind v4 디자인 토큰 + Next.js 15 RSC 폰트 최적화 + CLS·LCP 회귀 방지 전문가
> 부모 에픽: ZEOM-1 (웹 리디자인 71 Page Pixel-Perfect Migration)
> 하위 이슈: ZEOM-10 (P0-1 Gowun Batang), ZEOM-11 (P0-2 globals.css), ZEOM-12 (P0-3 검증)
> 참조 문서: `WEB_DESIGN.md` §2–§3, `WEB_DESIGN_PLAN.md` §3.1–§3.4

---

## 1. 요구사항 요약

### 비즈니스 목표

71페이지 회귀 없이 **production-safe foundation** 구축. 디자인 마이그레이션의 critical path 시작점으로, **단일 PR + revert 1회로 롤백 가능**해야 함. Phase 1 이후 작업이 의존하는 토큰·폰트·키프레임·유틸리티만 도입하고, 페이지별 시각 변경은 일체 하지 않음.

### Phase 0 범위 (3개 하위작업 합계)

| 하위 이슈 | 산출물 | 파일 |
|----------|--------|------|
| ZEOM-10 | Gowun Batang next/font 통합 + body className 추가 | `web/src/app/layout.tsx` |
| ZEOM-11 | globals.css 신규 토큰·@theme inline·radial bg·키프레임·유틸리티 | `web/src/app/globals.css` |
| ZEOM-12 | 71페이지 스모크·Lighthouse·CLS·접근성 검증 + Lighthouse JSON 산출 | `web/e2e/` (선택), PR 첨부 |

### 통합 인수조건 (ZEOM-2)

- [ ] `cd web && npm run build` 성공
- [ ] `cd web && npm test` 125개 통과 유지
- [ ] `cd web && tsc --noEmit` 통과
- [ ] 71페이지 자동 스모크 통과 (Playwright simple navigate)
- [ ] Lighthouse Performance ≥ 90 (홈/login/counselors/room 4개)
- [ ] **CLS ≤ 0.05** (Gowun Batang 도입 직후 측정 — 가장 큰 회귀 리스크)
- [ ] 4G 시뮬레이션 LCP ≤ 2.5s
- [ ] DevTools Computed: `<h1>` `font-family` 에 Gowun Batang 표시
- [ ] OS 다크/라이트 모두 정상 (다크 only지만 OS 설정 영향 없음)
- [ ] `prefers-reduced-motion: reduce` 시 신규 애니메이션(`breathe`, `scaleIn`, stagger) 정지
- [ ] Safari 17+ / Chrome 120+ / Firefox 120+ 동작
- [ ] `@supports not (backdrop-filter)` 폴백으로 `.glass-card` opaque 배경
- [ ] hex 직접 사용 0개 (모두 `hsl(var(--xxx))`)
- [ ] 단일 PR 단일 커밋 — `feat(design): foundation tokens, Gowun Batang, app-shell radial bg (Phase 0)`
- [ ] PR 첨부: Lighthouse JSON 4개 + CLS 측정 스크린샷

### 제약사항

- **Coexistence #2 정책** (`WEB_DESIGN_PLAN.md` §1.4) — 기존 토큰 별칭 유지. 예: `--surface-hover`는 `--surface-2`의 별칭으로 정의해 기존 컴포넌트 영향 차단
- **시각 변경은 사이드이펙트만 허용** — Phase 0에서 페이지·컴포넌트 마크업 수정 금지
- **헤딩 폰트 전환은 71페이지 전반에 즉시 반영됨** — `--font-heading`을 `var(--font-geist)` → `var(--font-gowun-batang)` 로 교체 시 모든 h1–h6 시각이 바뀜. 이게 의도된 결과지만 Phase 0 PR 리뷰어가 "변경이 너무 크다"고 오인할 수 있음 → PR 본문에 명시
- **린터 의존 컨벤션 사용 금지** — 프로젝트 ESLint/Prettier 미설정. 코드 스타일은 기존 globals.css 컨벤션을 따름

---

## 2. 영향 범위 분석

### 수정 대상 파일

| 파일 | 변경 유형 | 변경 요약 |
|------|----------|----------|
| `web/src/app/layout.tsx` | 수정 | `next/font/google` Gowun_Batang import, body className에 variable 추가 |
| `web/src/app/globals.css` | 수정 | `:root` 신규 토큰 11개·기존 3개 값 조정·`--font-heading` 교체, `@theme inline` 6개 token 등록, body radial bg, `breathe`/`scaleIn` keyframes, `.serif`/`.tabular`/`.glow-card`/`.wallet-chip`/`.seg`/`.progress-steps` 유틸 베이스, stagger 80→60ms 조정, `@supports not (backdrop-filter)` 폴백, reduced-motion 보강 |
| `web/e2e/phase-0-smoke.spec.ts` | 신규 (선택) | 71 라우트 단순 navigate 스모크 — 기존 spec 보충 |

### 연관 파일 (수정 X, 이해 필요)

| 파일 | 참조 이유 |
|------|----------|
| `web/src/app/globals.css` (기존) | 현재 토큰 셋, `@theme inline` 블록(81-142줄), stagger 80ms 규칙(371-378줄), 기존 keyframes(`fadeUp`, `slideUp`, `float`, `glow`, `pulse`, `shimmer`) |
| `web/src/app/layout.tsx` (기존) | `<html className="font-pretendard">`(64줄) — Pretendard CDN과 충돌 X, 현재는 dead className. Geist도 CDN(82-85줄) — 그대로 둠 |
| `web/playwright-e2e.config.ts` / `web/playwright.config.ts` | 71페이지 smoke spec 추가 시 webServer 설정 활용 |
| `WEB_DESIGN_PLAN.md` §3.1–§3.4 | 토큰 정확값·디자인 의도 |
| `WEB_DESIGN.md` §3 (Typography) §5.1 (.glow-card) | 유틸 베이스 정의 |

### 변경하지 않을 것 (의도적 보존)

- Pretendard CDN preload·stylesheet (layout.tsx 70-80줄) — 본문 폰트는 그대로 CDN
- Geist CDN stylesheet (layout.tsx 81-86줄) — Phase 0에서 제거 X. Phase 6+에서 정리
- 기존 `.glass-card`, `.fade-up`, `.skeleton`, `.tab-bounce`, `.card-hover-glow` — 그대로 유지
- 기존 페이지·컴포넌트 마크업 일체

### DB 변경

없음 (디자인 시스템 단독 작업).

---

## 3. 구현 계획

### 의존성 그래프

```
Phase 1 (ZEOM-10) ─── Variable 계약: --font-gowun-batang
       │
Phase 2 (ZEOM-11) ─── globals.css 에서 위 variable 참조
       │
Phase 3 (ZEOM-12) ─── 머지 직전 검증 (Phase 1+2 통합 결과)
```

ZEOM-10과 ZEOM-11은 **다른 파일이지만 variable 이름(`--font-gowun-batang`)에 의존성**이 있습니다. 두 작업자가 변수명을 사전 합의하고 동시 진행 가능 — 단, 이 가이드에서는 risk 최소화 위해 **순차 진행** 권장.

---

### Phase 1 (ZEOM-10): Gowun Batang next/font 통합

**목표**: `next/font/google`로 Gowun Batang 로드, CLS 안전한 fallback 설정, body className에 variable 노출.

#### 1-1. layout.tsx 수정

**기존 import 영역 다음에 추가** (`web/src/app/layout.tsx:1` 직후):

```tsx
import { Gowun_Batang } from 'next/font/google';

const gowunBatang = Gowun_Batang({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-gowun-batang',
  display: 'swap',
  adjustFontFallback: 'Times New Roman',
});
```

**왜**:
- `subsets: ['latin']` — 한자 글리프 미포함으로 초기 다운로드 최소화 (한자 별도 검토는 Phase 4+)
- `weight: ['400', '700']` — 본문(400)·강조(700) 두 단계만. 디스플레이 헤딩에 충분
- `variable: '--font-gowun-batang'` — CSS 변수로 노출, globals.css 에서 `var(--font-gowun-batang)` 참조
- `display: 'swap'` — FOIT 회피, 즉시 fallback 표시 → 폰트 로드 후 swap. CLS 방어
- `adjustFontFallback: 'Times New Roman'` — fallback metric 자동 조정으로 swap 시점 layout shift 최소화. **CLS ≤ 0.05 달성의 핵심**

#### 1-2. body className에 variable 추가

**현재** (`web/src/app/layout.tsx:87`):
```tsx
<body className="grain-overlay">
```

**변경 후**:
```tsx
<body className={`grain-overlay ${gowunBatang.variable}`}>
```

**왜**: next/font의 `variable` 은 className으로 주입되어야 해당 DOM 트리 안에서 `var(--font-gowun-batang)` 가 resolve됨. body에 두면 모든 자식이 사용 가능.

#### 1-3. 영문 헤딩 fallback 클래스 (선택, §3.3)

`messages/en.json` 헤딩에서 명조가 어색하면 `.font-display-en` 변형 클래스 활용 — Phase 0에서는 정의만 globals.css에 두고 적용 X.

#### 검증 (Phase 1 단독)

```bash
cd web && npm run dev
# DevTools > Network: gowun-batang-*.woff2 가 로드되는지 확인
# DevTools > Elements > body: className 에 __variable_xxxxx 가 포함되는지 확인
# DevTools > :root computed: --font-gowun-batang 값이 fontFace 식별자인지 확인
```

---

### Phase 2 (ZEOM-11): globals.css 보강

**목표**: 신규 토큰 정의 + Tailwind v4 `@theme inline` 등록 + body radial bg + 신규 키프레임·유틸리티 + stagger 60ms 조정 + 폴백·reduced-motion 보강.

#### 2-1. `:root` 신규 토큰 추가 (`globals.css:62` 직후, 기존 `--border-accent` 다음에)

```css
  /* ===== Phase 0 신규 토큰 ===== */
  --bg-deep: 24 18% 3%;
  --surface-2: 32 10% 16%;
  --surface-3: 32 10% 10%;
  --gold-deep: 43 70% 36%;
  --jade: 160 30% 45%;
  --shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  --shadow-gold: 0 12px 40px hsl(var(--gold) / 0.12), 0 4px 12px hsl(var(--gold) / 0.06);

  /* Coexistence #2 — 기존 별칭으로 보존 */
  /* (--surface-hover 는 아래 기존 정의를 별칭으로 교체) */

  /* 폰트 — display/heading 을 Gowun Batang으로 */
  --font-display: var(--font-gowun-batang);
```

#### 2-2. 기존 토큰 값 조정

`globals.css:50` 의 `--surface-hover` 를 별칭으로 교체:

```css
  /* 기존: --surface-hover: 32 10% 16%; */
  --surface-hover: var(--surface-2);  /* Coexistence #2 별칭 */
```

> ⚠️ 주의: `--surface-hover` 는 `hsl(var(--surface-hover))` 형태로 사용되는데 별칭이 다른 변수를 참조하게 되면 `hsl(hsl(var(--surface-2)))` 가 되어 깨집니다. **올바른 형태**:
> ```css
> --surface-hover: 32 10% 16%; /* 그대로 두고, --surface-2 와 동일한 값으로만 동기화 */
> ```
> 즉 별칭 대신 **값 동기화**로 처리. 기존 사용처 스타일 깨짐 방지.

`globals.css:52` 의 `--gold-soft` 값 조정:
```css
  --gold-soft: 43 45% 65%;  /* 기존 55% → 65% */
```

`globals.css:57` 의 `--warning` 값 조정:
```css
  --warning: 35 70% 55%;    /* 기존 45% → 55% */
```

`globals.css:24` 의 `--destructive` 값 조정:
```css
  --destructive: 0 55% 55%; /* 기존 0 50% 35% → 0 55% 55% */
```

`globals.css:67` 의 `--font-heading` 교체:
```css
  --font-heading: var(--font-gowun-batang);  /* 기존 var(--font-geist) */
```

> ⚠️ 영향: 모든 `<h1>`–`<h6>` 폰트가 Geist → Gowun Batang으로 즉시 교체됨. 71페이지 일괄 적용 — 의도된 변경이지만 PR 본문에 명시 필수.

#### 2-3. `@theme inline` 신규 등록 (`globals.css:142` 의 닫는 `}` 직전)

```css
  /* ===== Phase 0 신규 색상 토큰 ===== */
  --color-bg-deep: hsl(var(--bg-deep));
  --color-surface-2: hsl(var(--surface-2));
  --color-surface-3: hsl(var(--surface-3));
  --color-gold-deep: hsl(var(--gold-deep));
  --color-jade: hsl(var(--jade));

  /* shadow는 hsl wrap 없이 그대로 */
  --shadow-gold: 0 12px 40px hsl(var(--gold) / 0.12), 0 4px 12px hsl(var(--gold) / 0.06);
```

> ⚠️ Tailwind v4 quirk: `@theme inline` 의 `--shadow-*` 는 `var(--shadow-gold)` 참조 시 일부 빌드에서 resolve 실패 보고 있음. 안전을 위해 위와 같이 **`@theme inline` 블록에는 값 자체를 인라인**.

#### 2-4. body radial bg (`globals.css:157-166` 교체)

**기존** (157-166):
```css
  body {
    background-color: hsl(var(--background));
    color: hsl(var(--foreground));
    /* ... */
  }
```

**변경 후**:
```css
  body {
    background:
      radial-gradient(1200px 600px at 85% -10%, hsl(var(--gold) / 0.12), transparent 60%),
      radial-gradient(900px 500px at -10% 40%, hsl(var(--dancheong) / 0.08), transparent 60%),
      hsl(var(--background));
    background-attachment: fixed;
    color: hsl(var(--foreground));
    font-family: var(--font-body);
    line-height: 1.5;
    word-break: keep-all;
    overflow-wrap: break-word;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
```

**왜**: `background-attachment: fixed` 로 스크롤 시 repaint 비용 차단. 라디얼 2개로 hero 스타일 그라디언트 + 단청 보조 컬러 분위기 형성. 기존 `background-color` 는 shorthand의 마지막 base color로 통합.

> ⚠️ `.grain-overlay::after` (246-254줄) 는 `position: fixed; inset: 0` 으로 body 위에 그레인 오버레이. radial bg와 layer 충돌 없음.

#### 2-5. 신규 keyframes·클래스 (`globals.css:309` `pulse` keyframe 다음에 삽입)

```css
@keyframes breathe {
  0%, 100% { transform: scale(1); opacity: 0.7; }
  50% { transform: scale(1.1); opacity: 1; }
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}

.breathe {
  animation: breathe 1.8s ease-in-out infinite;
}

.scale-in {
  animation: scaleIn 0.3s var(--ease-spring) both;
}
```

#### 2-6. stagger 60ms로 조정 (`globals.css:371-378` 교체)

**기존**: 80ms 간격 8단계 (0/80/160/240/320/400/480/560).

**변경 후**:
```css
.stagger-container.visible > *:nth-child(1) { animation-delay: 0ms; }
.stagger-container.visible > *:nth-child(2) { animation-delay: 60ms; }
.stagger-container.visible > *:nth-child(3) { animation-delay: 120ms; }
.stagger-container.visible > *:nth-child(4) { animation-delay: 180ms; }
.stagger-container.visible > *:nth-child(5) { animation-delay: 240ms; }
.stagger-container.visible > *:nth-child(6) { animation-delay: 300ms; }
.stagger-container.visible > *:nth-child(7) { animation-delay: 360ms; }
.stagger-container.visible > *:nth-child(8) { animation-delay: 420ms; }
```

#### 2-7. 신규 유틸리티 베이스 (`globals.css` 끝, Print Styles 직전)

```css
/* ===== Phase 0 유틸리티 베이스 ===== */
.serif {
  font-family: var(--font-display);
  letter-spacing: -0.005em;
}

.tabular {
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum';
}

/* glow-card — §5.1 베이스 (구체 스타일은 Phase 1에서 보강) */
.glow-card {
  position: relative;
  background: hsl(var(--surface));
  border: 1px solid hsl(var(--border-accent) / 0.2);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow);
  transition: transform 0.3s var(--ease-spring), box-shadow 0.3s var(--ease-spring);
}

.glow-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  background: radial-gradient(600px 200px at 50% -20%, hsl(var(--gold) / 0.08), transparent 60%);
}

/* wallet-chip — §5.5 베이스 */
.wallet-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  border-radius: 999px;
  background: hsl(var(--surface-2));
  border: 1px solid hsl(var(--border-accent) / 0.3);
  font-variant-numeric: tabular-nums;
}

/* seg — §5.6 segmented control 베이스 */
.seg {
  display: inline-flex;
  padding: 0.25rem;
  background: hsl(var(--surface-2));
  border-radius: var(--radius-md);
}

/* progress-steps — §5.7 베이스 */
.progress-steps {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
```

> 이 클래스들은 **베이스 정의만**. 페이지에서 실제 사용은 Phase 1+ 에서 진행 — 정의만 두면 미사용으로 남아도 0 비용 (Tailwind v4 purge 대상 X — globals 직접 정의).

#### 2-8. `@supports not (backdrop-filter)` 폴백 (`.glass-card` 정의 직후, 264줄 다음)

```css
@supports not ((backdrop-filter: blur(20px)) or (-webkit-backdrop-filter: blur(20px))) {
  .glass-card {
    background: hsl(var(--surface));
  }
}
```

#### 2-9. reduced-motion 보강 (`globals.css:469-475` 블록 다음에 추가)

기존 글로벌 `*` 규칙은 `animation-duration: 0.01ms` 로 모든 애니메이션을 사실상 정지시키지만, **명시적으로 신규 클래스도 보강**:

```css
@media (prefers-reduced-motion: reduce) {
  .breathe,
  .scale-in,
  .stagger-container.visible > * {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
  }
}
```

#### 검증 (Phase 2 단독)

```bash
cd web && npm run dev
# DevTools > :root computed: 신규 토큰 11개 확인
# Inspector > body: background-attachment: fixed, 라디얼 2개 적용
# Console: no CSS parse errors
# 기존 .glass-card / .fade-up / .skeleton 시각 변화 없음
```

---

### Phase 3 (ZEOM-12): Phase 0 검증

**목표**: 머지 전 production-safe 보증. Lighthouse·CLS·71페이지 스모크·접근성·브라우저 호환을 한 번에 통과.

#### 3-1. 자동 스모크 (Playwright)

**옵션 A (권장)**: 신규 spec `web/e2e/phase-0-smoke.spec.ts` 추가 — 71 라우트 단순 navigate, 콘솔 에러 X, h1 보임.

```ts
import { test, expect } from '@playwright/test';

const ROUTES = [
  '/', '/login', '/signup', '/counselors', '/counselors/1',
  '/booking', '/wallet', '/credits', '/mypage', '/notifications',
  // ... 71개 라우트 전체 (web/src/app 디렉토리 기반 자동 추출 권장)
];

for (const route of ROUTES) {
  test(`smoke: ${route}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    expect(errors).toEqual([]);
    await expect(page.locator('h1, [role="heading"]').first()).toBeVisible({ timeout: 5000 });
  });
}
```

**옵션 B (간소화)**: 기존 `korean-theme.spec.ts` 와 비슷한 톤으로 폰트·CLS 확인만:
```ts
test('Phase 0 — 헤딩 폰트 Gowun Batang', async ({ page }) => {
  await page.goto('/');
  const fontFamily = await page.locator('h1').first().evaluate(
    (el) => window.getComputedStyle(el).fontFamily
  );
  expect(fontFamily).toMatch(/Gowun Batang/i);
});
```

#### 3-2. Lighthouse 측정 (4페이지)

```bash
# 로컬에서 production build 후 측정
cd web && npm run build && npm start
# 다른 터미널:
npx lighthouse http://localhost:3000           --only-categories=performance --form-factor=mobile --throttling-method=simulate --output=json --output-path=./lh-home.json
npx lighthouse http://localhost:3000/login     --only-categories=performance --form-factor=mobile --throttling-method=simulate --output=json --output-path=./lh-login.json
npx lighthouse http://localhost:3000/counselors --only-categories=performance --form-factor=mobile --throttling-method=simulate --output=json --output-path=./lh-counselors.json
npx lighthouse http://localhost:3000/sessions  --only-categories=performance --form-factor=mobile --throttling-method=simulate --output=json --output-path=./lh-room.json
```

**성공 조건**:
- 각 JSON의 `audits.metrics.details.items[0].cumulativeLayoutShift ≤ 0.05`
- `categories.performance.score ≥ 0.90`
- `audits.largest-contentful-paint.numericValue ≤ 2500` (4G 시뮬레이션)

PR에 4개 JSON 첨부.

#### 3-3. 수동 체크리스트

- [ ] DevTools > Computed `<h1>`: `font-family: "Gowun Batang", "Times New Roman", ...` 표시
- [ ] DevTools > Performance: Initial render 후 추가 layout shift 없음
- [ ] OS 다크 → 라이트 → 다크 토글 시 페이지 영향 없음
- [ ] System Settings → Reduce Motion ON → 헤더·홈 hero에서 `breathe`/`scaleIn`/stagger 즉시 정지 확인
- [ ] Safari 17, Chrome 120, Firefox 120 직접 열어 홈+상세+예약+화상 4개 페이지 깨짐 없음
- [ ] `tsc --noEmit` 통과
- [ ] `npm test` 125개 통과
- [ ] `npm run build` 성공

#### 3-4. PR 산출물

- 단일 commit `feat(design): foundation tokens, Gowun Batang, app-shell radial bg (Phase 0)`
- PR 본문에 다음 명시:
  - "헤딩 폰트가 71페이지 전반에서 Geist → Gowun Batang으로 교체됨 — 의도된 변경"
  - "`--gold-soft`/`--warning`/`--destructive` 값이 미세 조정됨 — 컴포넌트 재작업 불필요"
  - Lighthouse JSON 4개 + CLS 스크린샷 첨부

---

## 4. 기술 상세

### 4.1 핵심 기술 판단

#### CLS 방어 — `adjustFontFallback`

Gowun Batang은 한국 명조체로 글리프 metric이 시스템 폰트(Apple SD Gothic/Malgun)와 크게 다름. `display: swap` 단독 사용 시 swap 시점에 헤딩 높이가 뒤바뀌며 CLS 0.1+ 발생 가능.

`adjustFontFallback: 'Times New Roman'` 으로 next/font가 빌드 타임에 Times New Roman의 metric을 분석해 `@font-face` 의 `size-adjust`/`ascent-override`/`descent-override` 를 자동 주입 → swap 전후 layout 일치 → **CLS ≤ 0.05 달성의 단일 가장 중요한 옵션**.

#### Tailwind v4 `@theme inline` — `--shadow-*` resolve quirk

Tailwind v4는 `@theme inline` 의 토큰을 빌드 타임에 utility로 변환하지만, 일부 토큰(특히 `--shadow-*`)에서 다른 CSS 변수 참조 시 resolve 실패 사례 보고됨 (Tailwind v4.0–v4.1 일부 빌드). 안전을 위해 `@theme inline` 블록 안에 `--shadow-gold` 는 **인라인 값**으로 작성하고, `:root` 의 `--shadow-gold` 는 따로 두어 직접 CSS에서 `var(--shadow-gold)` 참조용으로 사용.

#### `background-attachment: fixed` 와 모바일 스크롤

iOS Safari는 `background-attachment: fixed` 를 viewport에 고정하지만 **스크롤 중 일시적으로 비활성화** (성능 보호). 시각적 어색함 미미. 대안 `position: fixed` overlay 는 grain-overlay와 z-index 충돌 위험으로 비채택.

#### body radial bg와 Lighthouse CLS

라디얼 그라디언트는 paint 비용은 있지만 layout shift 미발생. CLS 영향 없음. LCP에는 1-3% 영향 가능 — `transform: translateZ(0)` 또는 `will-change` 강제는 비채택 (전역 적용 시 메모리 오버헤드).

### 4.2 위험 요소 매트릭스

| 위험 | 영향도 | 대응 |
|------|--------|------|
| Gowun Batang CLS 회귀 | **높음** | `next/font` + `display: swap` + `adjustFontFallback: 'Times New Roman'` + `subsets: ['latin']`. Lighthouse CLS ≤ 0.05 게이트 |
| 71페이지 중 일부 회귀 | 중간 | Phase 0 spec 자동 navigate 71개. PR 직전 `npm run build` + `npm test` 125개 |
| `--font-heading` 교체로 헤딩 시각 일괄 변경 | 중간 | PR 본문 명시. 디자인 의도 — 회귀 X (의도된 변경) |
| `@supports` 미지원 구형 브라우저 | 낮음 | Safari 17+ / Chrome 120+ / Firefox 120+ 만 지원. 그 미만은 fallback이 적용된 opaque 카드 — 사용 가능 |
| 기존 stagger 80ms 의존 컴포넌트 | 낮음 | stagger는 visual delay만 영향. 60ms로 짧아져도 깨지지 않음 |
| `--gold-soft`/`--warning`/`--destructive` 값 변경 | 낮음 | 미세 색상 조정. 시각 회귀 가능성은 있으나 디자인 의도 |
| Pretendard CDN과 next/font 폰트 동시 로드 | 낮음 | Pretendard preload 유지 — 중복 다운로드 없음 (각 다른 폰트). 합산 ~80KB 추가 |
| 4G 시뮬 LCP 회귀 | 중간 | radial bg paint + Gowun Batang download 2개 동시 작용. `display: swap` 으로 LCP 차단 회피 |

### 4.3 외부 연동 / 다른 팀 작업 필요사항

없음. Phase 0은 web 워크스페이스 단일 디렉토리(`web/`) 안에서 완결.

Backend·Flutter는 영향 X — `.claude/rules/migration-safety.md` 와 무관 (DB 스키마 변경 없음).

---

## 5. 병렬 작업 가이드

### 5.1 병렬 가능 여부 판정

| 조건 | 충족 여부 |
|------|----------|
| 독립 가능 모듈 ≥ 2 | ✅ ZEOM-10(layout.tsx)·ZEOM-11(globals.css) 다른 파일 |
| 파일 충돌 없음 | ✅ 두 작업이 같은 파일 미수정 |
| 시간 단축 효과 | ⚠️ ZEOM-10은 5분 작업 / ZEOM-11은 60분 작업 — 병렬 이점 작음 |
| 코디네이션 비용 | ⚠️ variable 이름(`--font-gowun-batang`) 사전 합의 필요 |

**판정**: 4가지 중 2개 미흡. **순차 진행 권장**. 단, 팀 인력이 2인 이상이면 ZEOM-10·ZEOM-11 동시 진행 후 머지 단일 commit 가능.

### 5.2 만약 병렬로 한다면 — 파일 소유권

| 역할 | 담당 파일 | subagent 타입 | 인터페이스 계약 |
|------|----------|---------------|----------------|
| Worker A | `web/src/app/layout.tsx` | (없음, 단일 파일 직접 편집) | next/font의 `variable: '--font-gowun-batang'` 고정. 다른 변수명 사용 금지 |
| Worker B | `web/src/app/globals.css` | (없음, 단일 파일 직접 편집) | `:root` 의 `--font-display`·`--font-heading` 이 `var(--font-gowun-batang)` 참조 |

### 5.3 머지 충돌 방지

- ZEOM-10·ZEOM-11 동시 진행 시 서로 다른 파일 → 자동 충돌 X
- ZEOM-12는 두 작업의 머지 후에만 시작 (검증은 통합 결과)
- 단일 PR 단일 commit 정책: 두 작업자가 작업 후 한 명이 amalgamate 커밋 후 push

---

## 6. 실행 순서 요약

```bash
# 1. 브랜치 확인 (이미 feature/ZEOM-2 체크아웃됨)
git status

# 2. Phase 1 — ZEOM-10
# layout.tsx 편집 → next/font import + body className 변경
cd web && npm run dev
# 브라우저에서 폰트 로드 확인 후 Ctrl+C

# 3. Phase 2 — ZEOM-11
# globals.css 편집 (위 8개 섹션)
npm run dev
# 시각·콘솔 확인

# 4. 통합 검증 — ZEOM-12
npm run build         # 프로덕션 빌드 통과
npm test              # 125개 통과
npx tsc --noEmit      # 타입 통과
npm start &
# Lighthouse 4페이지 측정 (위 3-2 명령)
# Playwright 71페이지 스모크 spec 추가 후 실행
npm run test:e2e -- phase-0-smoke

# 5. 단일 커밋 + PR
git add web/src/app/layout.tsx web/src/app/globals.css web/e2e/phase-0-smoke.spec.ts
git commit -m "feat(design): foundation tokens, Gowun Batang, app-shell radial bg (Phase 0)"
git push
gh pr create --base main --title "[ZEOM-2] Phase 0 Foundation" --body "..."
```

---

## 7. 검증 게이트 체크리스트 (PR 머지 직전)

### 자동
- [ ] `npm run build` 성공
- [ ] `npm test` 125 통과
- [ ] `tsc --noEmit` 통과
- [ ] Playwright phase-0-smoke 71 라우트 통과
- [ ] Lighthouse 홈/login/counselors/room: Perf ≥ 90, CLS ≤ 0.05, LCP ≤ 2.5s

### 수동
- [ ] DevTools `<h1>` font-family Gowun Batang
- [ ] OS 다크/라이트 토글 무영향
- [ ] Reduce Motion 시 신규 애니메이션 정지
- [ ] Safari 17+ / Chrome 120+ / Firefox 120+ 동작
- [ ] hex 직접 사용 0개 (`grep -nE '#[0-9a-fA-F]{3,6}' web/src/app/globals.css | grep -v 'data:image'` → 결과 없음)

### PR
- [ ] 단일 커밋 메시지 — `feat(design): foundation tokens, Gowun Batang, app-shell radial bg (Phase 0)`
- [ ] Lighthouse JSON 4개 첨부
- [ ] CLS 측정 스크린샷 첨부
- [ ] PR 본문에 헤딩 폰트 일괄 변경 명시

---

## 8. 다음 단계

Phase 0 머지 후 → **Phase 1 (Primitive Library, 1.5주)** 진행. ZEOM-2의 자식 이슈 외에 ZEOM-1 에픽의 다른 자식이 Phase 1+ 작업으로 등록될 예정.

이 가이드의 변수명·토큰명·키프레임명은 **Phase 1+ 모든 페이지 작업의 계약**이다 — 후속 작업에서 새로운 variable name 도입 시 이 가이드를 먼저 갱신.
