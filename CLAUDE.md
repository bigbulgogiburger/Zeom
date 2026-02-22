# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

천지연꽃신당 (Cheonjiyeon Lotus Shrine) — a full-stack monorepo for a Korean fortune-telling/counseling booking platform. Users browse counselors, book time slots, pay, and receive chat rooms for consultations.

## Monorepo Structure

- **backend/** — Spring Boot 3.5 API (Java 21, Gradle)
- **web/** — Next.js 15 frontend (React 19, TypeScript, Korean design system)
- **app_flutter/** — Flutter mobile app (feature complete: auth, counselor browse, booking, payment, wallet, consultation, review)
- **docs/** — Architecture docs, runbooks, design guides, OpenAPI spec

## Build & Run Commands

### Backend (port 8080)
```bash
cd backend
./gradlew bootRun                    # Start dev server (H2 in-memory DB by default)
./gradlew test                       # Run all integration tests
./gradlew test --tests '*AuthSession*'  # Run a single test class
```

### Frontend (port 3000)
```bash
cd web
npm install                          # Install dependencies
npm run dev                          # Start dev server
npm test                             # Run Jest unit tests
npm run test:coverage                # Jest with coverage
npm run test:e2e                     # Playwright E2E (auto-starts backend + frontend)
```

### Flutter (port varies)
```bash
cd app_flutter
flutter pub get                      # Install dependencies
flutter run                          # Run on connected device/simulator
flutter test                         # Run widget/unit tests
flutter build apk --release          # Build Android APK
flutter build ios --release          # Build iOS IPA
```

**Features implemented:**
- Auth (login, signup, session management)
- Counselor browsing (Korean design system: cards, filters)
- Booking flow (slot selection, confirmation)
- Payment integration (PortOne wrapper)
- Wallet (캐시 충전, transaction history)
- Consultation sessions (chat room launch)
- Review submission (5-star rating + text)

## Architecture

### Backend Package Layout (`com.cheonjiyeon.api`)

| Package | Purpose |
|---------|---------|
| `auth/` | JWT auth, refresh tokens, multi-device support, user entity |
| `booking/` | Booking CRUD, slot management |
| `payment/` | Payment flow, webhooks, status log tracking |
| `chat/` | Chat room auto-creation on payment confirmation |
| `notification/` | Notification dispatch with retry |
| `counselor/` | Counselor profiles and time slot management |
| `wallet/` | User wallets (캐시 balance) |
| `cash/` | Cash transactions (charge, deduct, refund) |
| `product/` | Purchasable products (캐시 packages, future merchandise) |
| `consultation/` | Consultation sessions (track chat session metadata) |
| `review/` | Review CRUD (counselor ratings, moderation status) |
| `refund/` | Refund requests and processing |
| `dispute/` | Dispute handling |
| `portone/` | PortOne payment gateway integration |
| `sendbird/` | Sendbird chat provider integration |
| `lock/` | Distributed lock service (Redis-based for wallet concurrency) |
| `scheduler/` | Background jobs (booking auto-cancel, session timeout) |
| `admin/` | Admin audit log API |
| `ops/` | Operations dashboard (summary metrics, timeline) |
| `alert/` | Alert webhook dispatch |
| `config/` | CORS, rate limiting, security headers, Redis config |
| `common/` | `ApiException`, `GlobalExceptionHandler` |

### Provider Pattern (Key Architecture Decision)

External services use pluggable provider interfaces:
- **`fake`** (default) — in-memory stubs for development
- **Real providers** — production integrations (PortOne for payment, Sendbird for chat, HTTP for notifications)

**Payment**: `PAYMENT_PROVIDER=portone` (production) or `fake` (dev)
**Chat**: `CHAT_PROVIDER=sendbird` (production) or `fake` (dev)
**Notification**: `NOTIFICATION_PROVIDER=http` (production) or `fake` (dev)

### Database

- **Flyway** migrations in `backend/src/main/resources/db/migration/` (V1–V19)
- **H2** in-memory by default for dev/test; **MySQL** for production
- **Redis** required for production (distributed locks, session cache)
- JPA with `ddl-auto: none` — all schema changes go through Flyway

**Migration summary:**
- V1–V9: Original schema (users, bookings, payments, chat, audit logs)
- V10: wallets
- V11: cash_transactions
- V12: products
- V13: consultation_sessions
- V14: reviews
- V15: refunds
- V16: disputes
- V17–V19: Schema alterations (user phone/status, counselor user_id, booking channel)

### Frontend Structure (`web/src/`)

- `app/` — Next.js App Router pages (login, signup, bookings, counselors, sessions, dashboard, admin, wallet, reviews, refunds, disputes, products)
- `components/` — Shared components: `api-client.ts`, `auth-context.tsx`, `route-guard.tsx`, `session-expiry-guard.tsx`, Korean design system tokens
- `__tests__/` — Jest unit tests (48+ component/integration tests)
- `e2e/` — Playwright E2E specs (6 spec files: admin, auth, error, payment, user journeys, wallet)

**Korean design system:**
- Color tokens (primary: `#8B4513` 밤색, secondary: `#DAA520`, accent: `#FF6B6B`)
- Typography (Noto Sans KR, sizes: 12–24px)
- Spacing scale (4px base: xs=4, sm=8, md=16, lg=24, xl=32)
- Component variants (cards, buttons, badges, forms)

### Compensation Strategy

Payment confirmation (`PAID`) is persisted first. Downstream failures (chat room creation, notifications) do not roll back payment — instead they log `*_retry_needed` in payment status logs and alert via webhook for manual operator retry.

## Testing

### Backend Tests
**19 integration test classes** using `@SpringBootTest` with `TestRestTemplate` (covers all 16 controllers). Tests run against H2 in-memory DB. No separate unit test layer.

**New test coverage (Phase 1-3):**
- `WalletControllerTest`, `CashTransactionTest`, `ProductControllerTest`
- `ConsultationSessionControllerTest`, `ReviewControllerTest`
- `RefundControllerTest`, `DisputeControllerTest`
- `PortOnePaymentControllerTest`, `SendbirdChatProviderTest`
- Distributed lock tests (Redis)

### Frontend Tests
- **Unit**: Jest + React Testing Library (48+ tests in `src/__tests__/`)
- **E2E**: Playwright (6 spec files in `e2e/`) — runs serially (1 worker), Chromium only. Auto-starts backend (with `AUTH_ALLOW_E2E_ADMIN_BOOTSTRAP=true`) and frontend.

**E2E coverage:**
- `admin.spec.ts`, `auth-flow.spec.ts`, `error-handling.spec.ts`
- `payment-flow.spec.ts`, `user-journey.spec.ts`, `wallet-flow.spec.ts`

### Flutter Tests
- Widget tests for all screens (counselor, booking, payment, wallet, consultation, review)
- Unit tests for API clients, state management

### Path alias
Frontend uses `@/` path alias mapped to `src/` (configured in `tsconfig.json` and `jest.config.js` via `moduleNameMapper`).

## Key Configuration

### Environment Variables (Backend)

**Core:**
- `JWT_SECRET` — JWT signing key (32+ chars, override in production)
- `DB_URL`, `DB_USER`, `DB_PASSWORD` — MySQL connection (H2 in dev)
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` — Redis for locks/cache (required in production)

**Provider config:**
- `PAYMENT_PROVIDER` — `fake` (dev) or `portone` (production)
- `PORTONE_API_KEY`, `PORTONE_API_SECRET`, `PORTONE_STORE_ID` — PortOne credentials
- `PORTONE_WEBHOOK_SECRET` — webhook signature verification
- `CHAT_PROVIDER` — `fake` (dev) or `sendbird` (production)
- `SENDBIRD_APP_ID`, `SENDBIRD_API_TOKEN` — Sendbird credentials
- `NOTIFICATION_PROVIDER` — `fake` (dev) or `http` (production)
- `NOTIFICATION_HTTP_BASE_URL`, `NOTIFICATION_HTTP_API_KEY`

**Testing:**
- `AUTH_ALLOW_E2E_ADMIN_BOOTSTRAP=true` — required for Playwright E2E tests

**Other:**
- `ALERTS_WEBHOOK_URL` — Slack/Teams webhook for operational alerts
- CORS defaults to `http://localhost:3000` (update `CorsConfig.java` for production)

### Frontend
- `NEXT_PUBLIC_API_URL` — backend API URL (defaults to `http://localhost:8080`)

## API Endpoints

**58 total endpoints** across 16 controllers. Key additions in Phase 1-3:

| Domain | Endpoints |
|--------|-----------|
| **Wallet** | `GET /api/v1/wallets/my`, `GET /api/v1/wallets/{id}` |
| **Cash** | `POST /api/v1/cash/charge`, `POST /api/v1/cash/deduct`, `GET /api/v1/cash/transactions` |
| **Product** | `GET /api/v1/products`, `GET /api/v1/products/{id}` |
| **Consultation** | `POST /api/v1/consultations`, `GET /api/v1/consultations/{id}`, `PUT /api/v1/consultations/{id}/complete`, `GET /api/v1/consultations/my`, `GET /api/v1/consultations/counselor/{counselorId}` |
| **Review** | `POST /api/v1/reviews`, `GET /api/v1/reviews/{id}`, `GET /api/v1/reviews/counselor/{counselorId}` |
| **Refund** | `POST /api/v1/refunds`, `GET /api/v1/refunds/{id}`, `PUT /api/v1/refunds/{id}/approve`, `PUT /api/v1/refunds/{id}/reject`, `GET /api/v1/refunds/my` |
| **Dispute** | `POST /api/v1/disputes`, `GET /api/v1/disputes/{id}`, `GET /api/v1/disputes/my` |
| **PortOne** | `POST /api/v1/payments/portone/prepare`, `POST /api/v1/payments/portone/verify`, `POST /api/v1/payments/portone/webhooks` |

See `docs/openapi.yaml` for full API spec.

## CI/CD Pipeline

GitHub Actions workflows in `.github/workflows/`:
- **`ci.yml`** — runs on every push/PR: backend tests, frontend tests, Flutter build
- **`deploy.yml`** — deploys to staging/production on merge to main (manual approval gate)

**Pipeline stages:**
1. Backend: `./gradlew test` (19 integration tests)
2. Web: `npm test`, `npm run test:e2e` (Jest + Playwright)
3. Flutter: `flutter test`, `flutter build apk --release`
4. Deploy: Docker build → push to registry → deploy to K8s/ECS

## Skills

검증 스킬 (`.claude/skills/verify-*/SKILL.md`):

| 스킬 | 설명 |
|------|------|
| `verify-flyway-migrations` | Flyway DB 마이그레이션과 JPA Entity 일관성 검증 |
| `verify-sendbird-videocall` | Sendbird 화상통화 파이프라인 검증 |
| `verify-payment-wallet` | 결제/지갑/크레딧 시스템 무결성 검증 |
| `verify-frontend-ui` | 프론트엔드 UI/디자인 시스템 품질 검증 |
| `verify-e2e-tests` | E2E 테스트 설정 및 품질 검증 |
| `verify-admin-auth` | Admin API 엔드포인트 인증/인가 가드 검증 |
| `verify-auth-system` | 인증/인가 시스템 무결성 검증 (이메일 인증, 비밀번호 리셋, 소셜 로그인) |
| `verify-notification-system` | 알림/이메일/SMS 시스템 무결성 검증 |
| `verify-flutter-app` | Flutter 앱 품질 및 React-Flutter UX 동기화 검증 |
| `verify-fortune` | 운세 엔진 도메인 무결성 검증 (사주 기반 + SHA-256 폴백) |
| `verify-seo-analytics` | SEO/GA4/온보딩 시스템 무결성 검증 |
| `verify-implementation` | 통합 검증 (위 스킬 순차 실행) |
| `manage-skills` | 검증 스킬 유지보수 및 드리프트 탐지 |

## Conventions

- Commit messages: conventional commits (`feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`)
- Korean used in documentation, commit bodies, UI text, and code comments
- OpenAPI spec at `docs/openapi.yaml` (updated for Phase 1-3)
- No ESLint/Prettier or Checkstyle configured — no linting commands available
