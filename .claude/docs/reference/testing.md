# Testing Reference

> 참조 시점: 테스트 작성/수정 시

## Backend Tests

19 integration test classes using `@SpringBootTest` + `TestRestTemplate`.
모든 컨트롤러 커버. H2 in-memory DB.

```bash
./gradlew test                           # 전체
./gradlew test --tests '*AuthSession*'   # 단일 클래스
```

## Frontend Unit Tests

Jest + React Testing Library. 48+ tests in `src/__tests__/`.

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

### E2E Spec Files (13개)
- `admin-journey.spec.ts` — 관리자 기능
- `auth-flows.spec.ts` — 인증 (멀티스텝 회원가입, 토큰 리프레시)
- `consultation-journey.spec.ts` — 상담 세션
- `counselor-portal.spec.ts` — 상담사 포털
- `error-scenarios.spec.ts` — 에러 핸들링
- `korean-theme.spec.ts` — 디자인 시스템 검증 (Pretendard, 색상, 반응형)
- `payment-flow.spec.ts` — 결제 플로우
- `refund-journey.spec.ts` — 환불
- `review-journey.spec.ts` — 리뷰
- `settlement-journey.spec.ts` — 정산
- `user-journey.spec.ts` — 사용자 여정
- `video-call.spec.ts` — 화상통화
- `wallet-journey.spec.ts` — 지갑

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
