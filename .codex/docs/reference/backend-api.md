# Backend API Reference

> 참조 시점: API 엔드포인트 추가/수정 시

## 개요

Spring Boot 3.5 (Java 21) REST API. 44+ 컨트롤러, 34 도메인 패키지.
패키지: `com.cheonjiyeon.api`

서비스 레이어 패턴·트랜잭션 경계·예외 처리는 `service-layer.md` 참조.
외부 SDK 통합 패턴은 `provider-integration.md` 참조.
인증·admin 가드 체크리스트는 `security-checklist.md` 참조.

## Package Layout

| Package | Purpose |
|---------|---------|
| `auth/` | JWT auth, refresh tokens, multi-device, user entity |
| `oauth/` | Kakao/Naver OAuth 로그인 (provider 패턴) |
| `booking/` | Booking CRUD, slot management |
| `payment/` | Payment flow, webhooks, status log tracking |
| `portone/` | PortOne 결제 게이트웨이 |
| `wallet/` | User wallets (캐시 balance) |
| `cash/` | Cash transactions (charge, deduct, refund, 멱등성 키) |
| `credit/` | 크레딧(코인) 잔액·구매·이력 |
| `coupon/` | 쿠폰 발급/사용 |
| `settlement/` | 상담사 정산 |
| `dispute/` | 분쟁 처리 |
| `refund/` | 환불 요청·처리 |
| `chat/` | Chat room auto-creation on payment confirmation |
| `sendbird/` | Sendbird chat/video provider (userId prefix 규약) |
| `consultation/` | Consultation 세션 (idempotent startSession) |
| `notification/` | Notification dispatch with retry |
| `counselor/` | Counselor 프로필, 슬롯, 은행계좌 |
| `favorite/` | 관심 상담사 |
| `review/` | Review CRUD, counselor ratings |
| `product/` | Purchasable products |
| `fortune/` | 운세 (today, zodiac, compatibility, saju) |
| `recommendation/` | 상담사 추천 |
| `referral/` | 친구 초대 |
| `lock/` | Distributed lock (Redis Redisson) |
| `scheduler/` | Background jobs (auto-cancel, timeout) |
| `admin/` | Admin 전용 — 10+ 컨트롤러 (audit, coupon, user 등) |
| `audit/` | 감사 로그 |
| `ops/` | Operations 대시보드, 타임라인 |
| `alert/` | Alert webhook dispatch |
| `config/` | CORS, rate limiting, security, Redis, CookieAuthFilter |
| `common/` | ApiException, GlobalExceptionHandler |

## Provider Pattern

5개 외부 통합이 모두 인터페이스 + fake/real + `@ConditionalOnProperty` 자동선택. 상세는 `provider-integration.md`.

```
PAYMENT_PROVIDER=fake|http        (http → PortOne)
CHAT_PROVIDER=fake|http           (http → Sendbird)
NOTIFICATION_PROVIDER=fake|http
OAUTH_PROVIDER=fake|kakao|naver
SMS_PROVIDER=fake|aligo
```

## Sendbird userId 규약

`HttpChatProvider`/`SendbirdClient` 가 강제하는 prefix — 클라이언트도 동일하게 사용해야 함:

```
user_{userId}        // 고객
counselor_{counselorId}  // 상담사
```

채널 네이밍: `consultation-{reservationId}`. 상세는 `sendbird-guide.md`.

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

- Flyway migrations: V1–V60 in `backend/src/main/resources/db/migration/` (계속 증가)
- H2 in-memory (dev/test), MySQL 8 (production)
- JPA `ddl-auto: none` — Flyway only
- Redis required for production (Redisson 분산락, 세션 캐시)
- 상세 규칙은 `database-migrations.md` 참조
