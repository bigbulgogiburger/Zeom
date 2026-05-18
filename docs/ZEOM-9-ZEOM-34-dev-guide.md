# [ZEOM-9 / ZEOM-34] P7-2 — i18n ko/en · audit · verify · 전체 DoD 게이트 (1일)

> 부모 통합: `docs/ZEOM-9-dev-guide.md`
> 의존: ZEOM-33 (P7-1 측정 결과) — 본 slice 는 종합 게이트 + 정합성 audit
> 스택: Next.js 15 + next-intl + Jest + Playwright + tsc + verify-frontend-ui 스킬
> 산출물: `docs/qa/ZEOM-9-qa-report.md` (§F·G·H + 종합 DoD 표) + `docs/qa/i18n/` + 미해결 hotfix Task 목록

## 0. Touched Files (disjoint 보장)

**append (ZEOM-33 작성한 파일에 섹션 추가)**:
- `docs/qa/ZEOM-9-qa-report.md` — §F (i18n), §G (audit), §H (verify), 종합 DoD 표

**신규 생성**:
- `docs/qa/i18n/ko-en-coverage.md` (next-intl key coverage 표)
- `web/e2e/i18n-locale.spec.ts` (locale 토글 스모크 — 3 페이지)

**수정 (회귀 발견 시만)**:
- `web/src/**/*.tsx` — small fix (단일 파일 / ≤ 20줄 / 즉시 검증 가능) 한도
- `web/src/app/globals.css` — `@theme inline` 누락 토큰 추가 (audit 발견 시)

**ZEOM-33 와 disjoint**: ZEOM-33 가 작성한 §A~§E 는 append 만, 수정 X.

## 1. AC 분해 (P7-2 + 종합 12 DoD)

### slice 고유 AC

- [ ] AC-34-1: **i18n ko 스모크** — 71 페이지 모두 한국어 정상 렌더 (visual snapshot baseline 으로 갈음 — 이미 ZEOM-33 에서 ko 환경 측정 완료)
- [ ] AC-34-2: **i18n en 스모크** — `NEXT_LOCALE=en` 쿠키 + accept-language 헤더 변경 시:
  - 핵심 3 페이지 (홈, login, counselors) 정상 렌더 + 영어 카피 적용
  - 카피 없는 페이지 fallback (한국어 또는 key string) layout shift 0
  - locale switch 시 polyfill error 0
- [ ] AC-34-3: **hex 잔재 audit 0건**
  ```bash
  rg -nE '#[0-9A-Fa-f]{3,6}\b' web/src/{app,components} \
    | rg -v '(api/og|brand-kakao|brand-naver|brand-fg)' \
    | rg -v '\.test\.|\.spec\.|node_modules'
  ```
  → 0건 또는 정당한 예외만 (코멘트 안 hex, 정책 문서 안 hex 등 — 정상 컨텍스트면 메모)
- [ ] AC-34-4: **@theme inline 누락 0** — `web/src/app/globals.css` `:root` 안 변수 ↔ `@theme inline` 등록 1:1. diff 스크립트로 검증
- [ ] AC-34-5: **`verify-frontend-ui` PASS** — 스킬 호출 결과 PASS
- [ ] AC-34-6: **emoji/HTML entity 0건** — `web/src/{app,components}` 범위
  ```bash
  rg -nE '[📞👤⚠️★☆🛡️🔒💬✅❌🎉🎁🌟]|&#[0-9]+;' web/src/{app,components}
  ```

### 종합 DoD 게이트 (12개 — 부모 ZEOM-9 가 release 가능 상태로 판정)

ZEOM-33 + ZEOM-34 의 모든 산출물 + 본 slice 의 게이트 통과 후 `docs/qa/ZEOM-9-qa-report.md` 종합 표 작성.

| # | 항목 | 검증 방법 | 상태 |
|---|------|----------|------|
| 1 | 71 §6 처방 일치 | ZEOM-33 §B snapshot + 사람의 눈 | ⬜ |
| 2 | Lighthouse ≥ 90 (P0 9) | ZEOM-33 §A JSON | ⬜ |
| 3 | CLS ≤ 0.05, LCP ≤ 2.5s | ZEOM-33 §A JSON | ⬜ |
| 4 | keyboard + SR | ZEOM-33 §C·D | ⬜ |
| 5 | tsc + jest + build | 본 slice §3 | ⬜ |
| 6 | Playwright 스모크 | 본 slice §3 | ⬜ |
| 7 | 4 뷰포트 | ZEOM-33 §B | ⬜ |
| 8 | reduced-motion | ZEOM-33 §E | ⬜ |
| 9 | ko/en locale | AC-34-2 | ⬜ |
| 10 | hex 잔재 0 | AC-34-3 | ⬜ |
| 11 | @theme inline 누락 0 | AC-34-4 | ⬜ |
| 12 | verify-frontend-ui PASS | AC-34-5 | ⬜ |

## 2. i18n 검증 절차

### 2-1. ko/en coverage 분석

```bash
# key 개수 비교
node -e "const ko=require('./web/messages/ko.json'); const en=require('./web/messages/en.json'); \
  const flatKo=Object.keys(JSON.parse(JSON.stringify(ko))); \
  const flatEn=Object.keys(JSON.parse(JSON.stringify(en))); \
  console.log('ko keys:', flatKo.length, '/ en keys:', flatEn.length);"
```

(실제로는 nested key flatten 함수 필요 — `docs/qa/i18n/ko-en-coverage.md` 에 결과 기록)

### 2-2. locale 토글 스모크 (Playwright)

`web/e2e/i18n-locale.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

const PAGES = ['/', '/login', '/counselors'];

for (const p of PAGES) {
  test(`ko locale: ${p}`, async ({ page, context }) => {
    await context.addCookies([{ name: 'NEXT_LOCALE', value: 'ko', url: 'http://localhost:3000' }]);
    await page.goto(p);
    await expect(page.locator('html')).toHaveAttribute('lang', 'ko');
    // 한국어 키워드 존재
    await expect(page.locator('body')).toContainText(/[가-힣]/);
  });

  test(`en locale: ${p}`, async ({ page, context }) => {
    await context.addCookies([{ name: 'NEXT_LOCALE', value: 'en', url: 'http://localhost:3000' }]);
    await page.goto(p);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    // layout shift 0 — viewport 안에 가로 스크롤 없음
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}
```

### 2-3. fallback 동작 확인

`messages/en.json` 에 없는 key 가 ko 와 동일 출력되는지 (silent fallback) OR throw 되는지 (loud) 확인. 본 프로젝트는 fallback 정상 = OK.

```ts
// useTranslations 가 throw 안 하는지
test('en fallback: missing key 가 throw 안 함', async ({ page, context }) => {
  await context.addCookies([{ name: 'NEXT_LOCALE', value: 'en', url: 'http://localhost:3000' }]);
  const consoleErrors: string[] = [];
  page.on('pageerror', (e) => consoleErrors.push(e.message));
  await page.goto('/terms'); // 카피 거의 없는 페이지
  expect(consoleErrors).toEqual([]);
});
```

## 3. 종합 게이트 실행 (정합성 audit + 빌드 + verify)

### 3-1. hex / emoji audit

```bash
cd web

# hex 잔재 (brand 토큰 + api/og 제외)
rg -nE '#[0-9A-Fa-f]{3,6}\b' src/app src/components \
  | rg -v 'api/og|brand-kakao|brand-naver|brand-fg|\.test\.|\.spec\.' > /tmp/hex-audit.txt
wc -l /tmp/hex-audit.txt  # → 0

# emoji / HTML entity
rg -nE '&#[0-9]+;' src/app src/components > /tmp/entity.txt
# emoji 범위 (필요 시 unicode 범위 사용)
rg -nE '[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]' src/app src/components > /tmp/emoji.txt
wc -l /tmp/entity.txt /tmp/emoji.txt  # → 0 / 0
```

### 3-2. @theme inline 누락 검사

```bash
cd web
# :root 안 --변수 추출
rg -oN '^\s*--[a-z0-9-]+(?=:)' src/app/globals.css | sort -u > /tmp/root-vars.txt
# @theme inline 안 --변수 추출
awk '/@theme inline/{f=1} /^}/{f=0} f' src/app/globals.css \
  | rg -oN '^\s*--[a-z0-9-]+(?=:)' | sort -u > /tmp/theme-vars.txt
diff /tmp/root-vars.txt /tmp/theme-vars.txt  # → 차이 0 또는 정당한 alias 만
```

차이 발견 시 `web/src/app/globals.css` `@theme inline` 블록에 누락 토큰 추가.

### 3-3. 빌드 + 테스트 게이트

```bash
cd web
npx tsc --noEmit                          # → 0 error
npm test                                  # → 14 spec PASS (~129 tests)
npm run build                             # → 76 routes 빌드 성공
# Playwright 스모크 (기존 13 spec — 인증/wallet/video-call/payment/admin/counselor)
npx playwright test --grep "@smoke" || \
  npx playwright test e2e/{auth-flows,wallet-journey,user-journey}.spec.ts
```

### 3-4. verify skill 호출

```
Skill('verify-frontend-ui')
Skill('verify-e2e-tests')   # E2E spec 정합성
Skill('verify-seo-analytics') # SEO 회귀 확인 (옵션)
```

## 4. 발견 회귀 분기 정책

**즉시 수정 (본 브랜치)**:
- 단일 파일 / ≤ 20줄 / 검증 가능 (build + targeted spec PASS)
- 예: `aria-label` 추가, hex 1건 토큰 치환, 누락된 `@theme inline` 변수 추가, `text-wrap: balance` 누락

**ZEOM-N hotfix Task 등록 (별도)**:
- 다파일 / 구조 변경 / 회귀 위험 / 외부 SDK
- 예: 컴포넌트 prop 시그니처 변경, layout shift > 0.1 인 페이지 전반 재설계, screen reader fundamental issue, en locale 카피 누락 (대량)

미해결 항목은 `docs/qa/ZEOM-9-qa-report.md` 의 "미해결 이슈" 섹션에 다음 형식:

```markdown
### 미해결 이슈 → ZEOM-N hotfix 후보

| 항목 | 페이지 | 심각도 | 권장 Task 제목 |
|------|--------|--------|---------------|
| LCP 3.8s | /counselors/[id] | High | [hotfix] counselors detail LCP 최적화 |
| en locale 카피 누락 (12 페이지) | 여러 페이지 | Medium | [hotfix] en.json 카피 보강 |
```

본 slice 종료 직전에 위 표를 보고 `mcp__atlassian__createJiraIssue` 로 일괄 생성하거나, ZEOM-9 댓글에 인라인으로 기록.

## 5. 실행 순서 (1일)

1. (오전) i18n coverage 분석 → `docs/qa/i18n/ko-en-coverage.md`
2. (오전) `web/e2e/i18n-locale.spec.ts` 작성 + 실행
3. (오전) hex / emoji audit — 발견 시 즉시 fix
4. (오후) `@theme inline` 누락 검사 → globals.css 보강
5. (오후) tsc + jest + build + Playwright 스모크
6. (오후) verify-frontend-ui 스킬 호출 + 결과 확인
7. (오후) `docs/qa/ZEOM-9-qa-report.md` §F·G·H + 종합 DoD 표 작성
8. (오후) 미해결 hotfix 후보 → Jira create 또는 description 정리

## 6. 검증 (slice 자체 DoD)

```bash
# 1. i18n 스모크 PASS
npx playwright test e2e/i18n-locale.spec.ts

# 2. audit 0건
wc -l /tmp/hex-audit.txt /tmp/entity.txt /tmp/emoji.txt   # → 0 0 0
diff /tmp/root-vars.txt /tmp/theme-vars.txt              # → 0

# 3. 빌드 게이트
npx tsc --noEmit && npm test && npm run build

# 4. 종합 리포트 12 항목 모두 ✅ (또는 ⚠️ + hotfix Task 링크)
grep -c '⬜' docs/qa/ZEOM-9-qa-report.md   # → 0
```

## 7. 위험 & 백업 계획

- **en locale 카피 대량 누락**: fallback 동작 PASS 면 DoD 항목 9 ✅ + 카피 보강은 hotfix Task. 단 layout shift 발생 시 즉시 수정 (긴 영어 단어로 박스 깨짐).
- **@theme inline diff 가 많음**: ZEOM-* migrate 라운드에서 점진 추가됐을 가능성. 일괄 보강이 아니라 globals.css 단일 파일 수정이므로 5분 작업.
- **verify-frontend-ui 가 ITERATE**: 해당 스킬 출력의 fail 항목을 분석 → 즉시 fix 가능한 것은 본 브랜치, 그 외는 hotfix.
- **시간 박스 초과**: 종합 리포트 작성을 최후 우선 → 일부 P3 페이지 i18n 스모크 cut 가능.
