# Web Testing

> **Sub affinity**: web 전용
> 참조 시점: Jest 유닛 / Playwright E2E 작성·수정·실행

## 개요

- **Unit**: Jest 30 + React Testing Library — 14 spec (~129 tests) in `src/__tests__/`
- **E2E**: Playwright (Chromium, 1 worker, serial) — 13 spec in `e2e/`
- **Type check** (lint 대용 — ESLint 미설정): `npx tsc --noEmit`

## 실행

```bash
# Unit
npm test                                     # Jest
npm run test:coverage                        # 커버리지

# E2E — playwright.config.ts 가 webServer 로 backend+frontend 자동 시작
npm run test:e2e                             # 전체 13 spec

# E2E — 기존 서버 재사용 (이미 dev 띄워 둔 경우)
npx playwright test e2e/<name>.spec.ts \
  --config=playwright-e2e.config.ts

# Type check
npx tsc --noEmit
```

## E2E Spec Files (13개)

대표:
- `auth-flows.spec.ts` (3-스텝 회원가입 위자드, refresh)
- `admin-journey.spec.ts`, `counselor-portal.spec.ts`
- `consultation-journey.spec.ts`, `video-call.spec.ts`
- `payment-flow.spec.ts`, `wallet-journey.spec.ts`, `refund-journey.spec.ts`
- `review-journey.spec.ts`, `settlement-journey.spec.ts`, `user-journey.spec.ts`
- `korean-theme.spec.ts` (디자인 시스템 회귀)
- `error-scenarios.spec.ts`

## Playwright Config 2종

- `playwright.config.ts` — 기본 (webServer 로 backend+frontend 자동 시작, CI/full run)
- `playwright-e2e.config.ts` — 기존 서버 재사용 (로컬 빠른 반복)

## E2E 환경 의존

- **backend 필수** — web 만으로는 로그인·결제·통화 흐름 검증 불가. backend 는 `./gradlew bootRun` 또는 `docker compose up backend` 로 띄움 (로컬에선 docker 사용).
- **E2E 전용 계정**: `e2e-test@zeom.com` / `TestPass123!` (USER 역할, id=2). 로그인 필요 시나리오에서 사용.
- **AUTH_ALLOW_E2E_ADMIN_BOOTSTRAP=true** backend 환경변수 필요 (admin 시나리오).

## Jest 유닛 패턴

```ts
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('renders CTA', async () => {
  render(<MyComponent />);
  await userEvent.click(screen.getByRole('button', { name: '예약하기' }));
  expect(screen.getByText(/완료/)).toBeInTheDocument();
});
```

- `moduleNameMapper`: `@/` → `web/src/` (`jest.config.js`)
- jsdom 환경 (`jest-environment-jsdom`)

## 함정

- ❌ `waitForLoadState('networkidle')` 사용 → flaky. ✅ `'domcontentloaded'` + `getByRole` waiter
- ❌ viewport 테스트에서 `clientWidth === 360` 같은 strict 비교 → 스크롤바로 인해 viewport 보다 작을 수 있음. ✅ 범위 비교 (`>= 350 && <= 360`)
- ❌ E2E 에서 `localhost:8080` 하드코딩 → ✅ Playwright config 의 `baseURL` 또는 env 사용
- ❌ 회원가입 1-step 가정 → ✅ 3-스텝 위자드 (email/pw → 사주 → 약관)
- ❌ Jest 에서 next/font 직접 import → 모킹 필요. `__mocks__/` 또는 jest.config 의 `transformIgnorePatterns`

## 시각 회귀

Playwright spec 외 별도 QA 회차에서 **openchrome MCP** 로 4 viewport (360/768/1024/1440) × 50 화면 + chrome. 자동화는 안 함 — 디자인 변경 시 수동.

## 관련 reference

- `frontend-pages.md` — 페이지 인벤토리 + immersive 가드
- `design-system.md` — 토큰·anti-slop 회귀 체크
- `../../../.claude/docs/reference/sendbird-guide.md` — 통화 E2E (`video-call.spec.ts`)
