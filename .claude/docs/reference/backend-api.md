# Backend API Reference

> 참조 시점: API 엔드포인트 추가/수정 시

## 개요

Spring Boot 3.5 (Java 21) REST API. 58개 엔드포인트, 16개 컨트롤러.
패키지: `com.cheonjiyeon.api`

## Package Layout

| Package | Purpose |
|---------|---------|
| `auth/` | JWT auth, refresh tokens, multi-device, user entity |
| `booking/` | Booking CRUD, slot management |
| `payment/` | Payment flow, webhooks, status log tracking |
| `chat/` | Chat room auto-creation on payment confirmation |
| `notification/` | Notification dispatch with retry |
| `counselor/` | Counselor profiles, time slot management |
| `wallet/` | User wallets (캐시 balance) |
| `cash/` | Cash transactions (charge, deduct, refund) |
| `product/` | Purchasable products |
| `consultation/` | Consultation sessions metadata |
| `review/` | Review CRUD, counselor ratings |
| `refund/` | Refund requests and processing |
| `dispute/` | Dispute handling |
| `portone/` | PortOne payment gateway |
| `sendbird/` | Sendbird chat provider |
| `lock/` | Distributed lock (Redis) |
| `scheduler/` | Background jobs (auto-cancel, timeout) |
| `admin/` | Admin audit log API |
| `ops/` | Operations dashboard metrics |
| `alert/` | Alert webhook dispatch |
| `config/` | CORS, rate limiting, security, Redis |
| `common/` | ApiException, GlobalExceptionHandler |

## Provider Pattern

```
PAYMENT_PROVIDER=fake|portone
CHAT_PROVIDER=fake|sendbird
NOTIFICATION_PROVIDER=fake|http
```

## Key Endpoints

| Domain | Endpoints |
|--------|-----------|
| Auth | login, signup, logout, refresh, verify-email, reset-password |
| Counselors | CRUD, search, slots, favorites |
| Booking | create, cancel, list, counselor-bookings |
| Payment | prepare, verify, webhooks (PortOne) |
| Wallet | balance, transactions, CSV export, receipt PDF |
| Cash | charge, deduct |
| Credits | balance, purchase, history |
| Consultation | create, complete, list |
| Review | create, list by counselor |
| Refund | request, approve, reject |
| Dispute | create, list |
| Fortune | today, zodiac, compatibility |
| Admin | audit logs, timeline, summary, coupons, users |
| Stats | public stats, featured reviews |

See `docs/openapi.yaml` for full spec.

## Database

- Flyway migrations: V1–V52+ in `backend/src/main/resources/db/migration/`
- H2 in-memory (dev/test), MySQL (production)
- JPA `ddl-auto: none` — Flyway only
- Redis required for production (distributed locks, session cache)
