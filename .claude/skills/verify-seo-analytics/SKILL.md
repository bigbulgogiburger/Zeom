---
name: verify-seo-analytics
description: SEO/GA4/온보딩 시스템 무결성 검증. SEO 메타데이터, 분석 코드, 온보딩 플로우 변경 후 사용.
---

## Purpose

1. SEO 메타데이터 (robots.txt, sitemap.xml, JSON-LD) 올바른 생성 검증
2. GA4 분석 코드 (gtag 스크립트, 이벤트 트래킹) 무결성 검증
3. 온보딩 플로우 (4단계: 생년월일→관심분야→고민유형→추천상담사) 완전성 검증
4. 페이지별 메타데이터 layout 일관성 검증

## When to Run

- `web/src/app/robots.ts`, `web/src/app/sitemap.ts` 변경 시
- `web/src/components/analytics.tsx`, `analytics-provider.tsx` 변경 시
- `web/src/components/json-ld.tsx` 변경 시
- `web/src/app/onboarding/page.tsx` 변경 시
- `web/src/app/*/layout.tsx` 메타데이터 layout 추가/변경 시
- 새 공개 페이지 추가 시 (sitemap 업데이트 필요)

## Related Files

| File | Purpose |
|------|---------|
| `web/src/app/robots.ts` | robots.txt 동적 생성 |
| `web/src/app/sitemap.ts` | sitemap.xml 동적 생성 |
| `web/src/components/json-ld.tsx` | JSON-LD 구조화 데이터 컴포넌트 |
| `web/src/components/analytics.tsx` | GA4 trackEvent, trackPageView 함수 |
| `web/src/components/analytics-provider.tsx` | GA4 gtag 스크립트 로더 컴포넌트 |
| `web/src/app/layout.tsx` | 루트 레이아웃 (AnalyticsProvider, JsonLd 포함) |
| `web/src/app/login/layout.tsx` | 로그인 페이지 SEO 메타데이터 |
| `web/src/app/signup/layout.tsx` | 회원가입 페이지 SEO 메타데이터 |
| `web/src/app/counselors/layout.tsx` | 상담사 목록 SEO 메타데이터 |
| `web/src/app/onboarding/page.tsx` | 온보딩 4단계 플로우 |
| `web/src/app/HomeContent.tsx` | 홈 화면 (FortuneCard, 이벤트 트래킹) |

## Workflow

### Step 1: robots.txt 설정 확인

**도구:** Grep

```bash
grep -n 'rules\|sitemap\|allow\|disallow' web/src/app/robots.ts
```

**PASS:** Allow/Disallow 규칙 존재, sitemap URL 포함
**FAIL:** robots.ts 파일 누락 또는 비어있음
**수정:** robots.ts 생성 및 규칙 추가

### Step 2: sitemap 공개 페이지 커버리지

**도구:** Grep

```bash
grep -n "url:" web/src/app/sitemap.ts
```

공개 페이지 목록 비교:
```bash
grep -rn 'export.*metadata' web/src/app/*/layout.tsx 2>/dev/null | head -10
```

**PASS:** 주요 공개 페이지 (/, /login, /signup, /counselors, /fortune) sitemap에 포함
**FAIL:** 공개 페이지가 sitemap에 누락
**수정:** sitemap.ts에 누락 URL 추가

### Step 3: JSON-LD 구조화 데이터 확인

**도구:** Grep

```bash
grep -n 'application/ld\+json\|@type\|Organization\|WebSite' web/src/components/json-ld.tsx
```

루트 레이아웃에 포함 확인:
```bash
grep -n 'JsonLd\|json-ld' web/src/app/layout.tsx
```

**PASS:** JSON-LD 컴포넌트가 Organization 또는 WebSite 타입으로 정의되고, 루트 레이아웃에 포함
**FAIL:** JSON-LD 누락 또는 루트 레이아웃에 미포함
**수정:** JsonLd 컴포넌트를 layout.tsx에 추가

### Step 4: GA4 Analytics 설정 확인

**도구:** Grep

환경변수 설정:
```bash
grep -n 'GA_MEASUREMENT_ID\|gtag' web/src/components/analytics.tsx web/src/components/analytics-provider.tsx
```

루트 레이아웃에 포함 확인:
```bash
grep -n 'AnalyticsProvider\|analytics' web/src/app/layout.tsx
```

**PASS:** GA_MEASUREMENT_ID 환경변수 사용, AnalyticsProvider가 루트 레이아웃에 포함
**FAIL:** 하드코딩된 ID 또는 AnalyticsProvider 누락
**수정:** 환경변수로 변경, layout.tsx에 추가

### Step 5: 이벤트 트래킹 사용 확인

**도구:** Grep

주요 페이지에서 trackEvent 사용:
```bash
grep -rn 'trackEvent\|trackPageView' web/src/app/login/page.tsx web/src/app/signup/page.tsx web/src/app/counselors/page.tsx web/src/app/HomeContent.tsx
```

**PASS:** 주요 사용자 행동 (로그인, 회원가입, 상담사 조회, 예약)에 이벤트 트래킹 존재
**FAIL:** 핵심 전환 이벤트에 트래킹 누락
**수정:** trackEvent 호출 추가

### Step 6: 온보딩 플로우 완전성

**도구:** Grep

4단계 확인:
```bash
grep -n 'step === 0\|step === 1\|step === 2\|step === 3' web/src/app/onboarding/page.tsx
```

네비게이션 확인:
```bash
grep -n 'handleNext\|handleBack\|handleComplete\|canProceed' web/src/app/onboarding/page.tsx
```

**PASS:** 4단계 (생년월일, 관심분야, 고민유형, 추천상담사) + 이전/다음/건너뛰기 존재
**FAIL:** 단계 누락 또는 네비게이션 불완전
**수정:** 누락 단계/네비게이션 추가

## Output Format

| 검사 | 결과 | 상세 |
|------|------|------|
| robots.txt | PASS/FAIL | 규칙: ... |
| sitemap 커버리지 | PASS/FAIL | 페이지 수: ... |
| JSON-LD | PASS/FAIL | 타입: ... |
| GA4 설정 | PASS/FAIL | 환경변수: ... |
| 이벤트 트래킹 | PASS/FAIL | 트래킹 수: ... |
| 온보딩 플로우 | PASS/FAIL | 단계 수: ... |

## Exceptions

1. **GA_MEASUREMENT_ID 미설정**: 개발 환경에서 GA_MEASUREMENT_ID가 빈 문자열인 것은 정상 — gtag 호출이 무시됨
2. **sitemap 동적 페이지**: `/counselors/[id]` 같은 동적 경로는 정적 sitemap에 포함하지 않아도 정상 — Google Bot이 크롤링으로 발견
3. **온보딩 건너뛰기**: 사용자가 온보딩을 건너뛰고 홈으로 이동할 수 있는 것은 의도된 동작
