# Environment & Configuration

> 참조 시점: 환경 변수, 배포 설정, Docker 작업 시

## Backend Environment Variables

**Core:**
- `JWT_SECRET` — JWT signing key (32+ chars)
- `DB_URL`, `DB_USER`, `DB_PASSWORD` — MySQL (H2 in dev)
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` — Redis (production)

**Providers** (전체 패턴은 `provider-integration.md`):
- `PAYMENT_PROVIDER` — `fake` (기본) or `http` (PortOne)
- `PORTONE_API_KEY`, `PORTONE_API_SECRET`, `PORTONE_STORE_ID`, `PORTONE_WEBHOOK_SECRET`
- `CHAT_PROVIDER` — `fake` or `http` (Sendbird)
- `SENDBIRD_APP_ID`, `SENDBIRD_API_TOKEN`
- `NOTIFICATION_PROVIDER` — `fake` or `http`
- `NOTIFICATION_HTTP_BASE_URL`, `NOTIFICATION_HTTP_API_KEY`
- `OAUTH_PROVIDER` — `fake` or `kakao` or `naver`
- `SMS_PROVIDER` — `fake` or `aligo` (Aligo SMS gateway)
- `EMAIL_PROVIDER` — `fake` (real 미구현)

**Testing:**
- `AUTH_ALLOW_E2E_ADMIN_BOOTSTRAP=true` — Playwright E2E 필수

**Other:**
- `ALERTS_WEBHOOK_URL` — Slack/Teams webhook
- CORS: `CorsConfig.java` (기본 `http://localhost:3000`)

## Frontend Environment

- `NEXT_PUBLIC_API_URL` — backend URL (기본 `http://localhost:8080`)

## Docker

`docker-compose.yml` — MySQL 8.0 + Redis 7 + Backend + Web
- Flyway 마이그레이션 V1–V60. MySQL 호환성 주의 (`CREATE INDEX IF NOT EXISTS` 미지원 등 — `database-migrations.md`)
- 로컬 개발은 H2 (`./gradlew bootRun`) 권장
- Docker는 통합 테스트/스테이징용

## CI/CD

GitHub Actions (`.github/workflows/`):
- `ci.yml` — push/PR: backend test + frontend test + Flutter build
- `deploy.yml` — main merge: Docker build → registry → K8s/ECS
