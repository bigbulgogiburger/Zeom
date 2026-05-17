# Testing Reference

> 참조 시점: 테스트 작성/수정 시

## Backend Tests

31 integration test classes using `@SpringBootTest` + `TestRestTemplate`.
주요 컨트롤러·서비스 커버. H2 in-memory DB, 모든 provider는 fake.

```bash
./gradlew test                           # 전체
./gradlew test --tests '*AuthSession*'   # 단일 클래스
```

## Frontend Unit Tests

Jest 30 + React Testing Library. 12 spec files in `src/__tests__/` (suite 다수 포함).

```bash
npm test                    # Jest
npm run test:coverage       # 커버리지 포함
```

## Frontend E2E Tests

Playwright (Chromium, 1 worker, serial).

```bash
npm run test:e2e            # 전체 (backend+frontend 자동 시작)
npx playwright test e2e/korean-theme.spec.ts --config=playwright-e2e.config.ts  # 기존 서버 재사용
```

### E2E Spec Files (18개)

대표 spec:
- `admin-journey.spec.ts`, `auth-flows.spec.ts` (멀티스텝 회원가입, refresh)
- `consultation-journey.spec.ts`, `counselor-portal.spec.ts`, `video-call.spec.ts`
- `payment-flow.spec.ts`, `refund-journey.spec.ts`, `wallet-journey.spec.ts`
- `review-journey.spec.ts`, `settlement-journey.spec.ts`, `user-journey.spec.ts`
- `korean-theme.spec.ts` (디자인 시스템), `error-scenarios.spec.ts`
- 그 외 5개 (dispute, referral, fortune, onboarding 등)

### Playwright Config 2개
- `playwright.config.ts` — 기본 (webServer로 backend+frontend 자동 시작)
- `playwright-e2e.config.ts` — 기존 서버 재사용 (webServer 없음)

## Flutter Tests

```bash
flutter test   # Widget + unit tests
```

## 주의사항

- auth-flows.spec.ts: 회원가입이 3-스텝 위자드 (email/pw → 사주 → 약관)
- korean-theme.spec.ts: `waitForLoadState('domcontentloaded')` 사용 (networkidle 금지)
- viewport 테스트: `clientWidth`는 스크롤바로 인해 viewport보다 작을 수 있음 → 범위 비교
