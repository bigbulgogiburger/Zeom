# Architecture Overview — 천지연꽃신당

작성일: 2026-02-15

---

## 1. 시스템 개요

천지연꽃신당은 온라인 신점 상담 예약/결제/상담 플랫폼입니다.
사용자가 상담사를 탐색하고, 예약하고, 결제 후 화상/음성 상담을 받는 전체 플로우를 제공합니다.

---

## 2. 시스템 구성도

```
┌────────────────────────────────────────────────────────────────┐
│                        클라이언트                               │
│                                                                │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    │
│   │  Web (Next.js)│    │ App (Flutter) │    │ Admin (Web)  │    │
│   │  :3000       │    │  mobile app  │    │  /admin/*    │    │
│   └──────┬───────┘    └──────┬───────┘    └──────┬───────┘    │
└──────────┼───────────────────┼───────────────────┼────────────┘
           │ HTTPS             │ HTTPS             │ HTTPS
           └───────────────────┼───────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Load Balancer     │
                    │   (ALB / Nginx)     │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Backend API       │
                    │   Spring Boot 3.5   │
                    │   Java 21           │
                    │   :8080             │
                    └──┬──────┬──────┬────┘
                       │      │      │
              ┌────────┘      │      └────────┐
              │               │               │
     ┌────────▼────┐  ┌──────▼──────┐  ┌─────▼─────────┐
     │   MySQL     │  │   Redis     │  │  External     │
     │  (주 DB)    │  │  (캐시/락)  │  │  Providers    │
     │             │  │             │  │               │
     │  - users    │  │  - 세션     │  │  - Payment    │
     │  - bookings │  │  - 분산락   │  │  - Chat       │
     │  - payments │  │  - 캐시     │  │  - Notification│
     │  - etc.     │  │             │  │  - Sendbird   │
     └─────────────┘  └─────────────┘  └───────────────┘
```

---

## 3. Backend 아키텍처

### 3.1 패키지 구조

```
com.cheonjiyeon.api/
├── CheonjiyeonApplication.java        # Spring Boot 메인
├── common/
│   ├── ApiException.java              # 커스텀 예외 (status + message)
│   └── GlobalExceptionHandler.java    # 전역 예외 처리 (@RestControllerAdvice)
├── config/
│   └── CorsConfig.java               # CORS 설정
├── auth/
│   ├── AuthController.java            # 인증 API (/auth/*)
│   ├── AuthService.java               # 인증 비즈니스 로직
│   ├── AuthDtos.java                  # 요청/응답 DTO
│   ├── UserEntity.java                # users 테이블 엔티티
│   ├── UserRepository.java            # JPA Repository
│   ├── TokenStore.java                # JWT 발급/검증
│   └── refresh/
│       ├── RefreshTokenEntity.java    # refresh_tokens 엔티티
│       └── RefreshTokenRepository.java
├── counselor/
│   ├── CounselorController.java       # 상담사 API
│   ├── CounselorService.java          # 상담사 비즈니스 로직
│   ├── CounselorDtos.java
│   ├── CounselorEntity.java
│   ├── CounselorRepository.java
│   ├── SlotEntity.java                # counselor_slots 엔티티
│   └── SlotRepository.java
├── booking/
│   ├── BookingController.java         # 예약 API (/bookings/*)
│   ├── BookingService.java            # 예약 비즈니스 로직
│   ├── BookingDtos.java
│   ├── BookingEntity.java
│   └── BookingRepository.java
├── payment/
│   ├── PaymentController.java         # 결제 API (/payments/*)
│   ├── PaymentWebhookController.java  # 결제 웹훅 수신
│   ├── PaymentService.java            # 결제 비즈니스 로직 (confirm/cancel/webhook)
│   ├── PaymentDtos.java
│   ├── PaymentEntity.java
│   ├── PaymentRepository.java
│   ├── provider/
│   │   ├── PaymentProvider.java       # Provider 인터페이스
│   │   ├── FakePaymentProvider.java   # 개발용 fake
│   │   └── HttpPaymentProvider.java   # 실 연동 (RestClient)
│   └── log/
│       ├── PaymentStatusLogEntity.java
│       └── PaymentStatusLogRepository.java
├── chat/
│   ├── ChatController.java            # 상담방 API
│   ├── ChatService.java               # 상담방 생성 (ensureRoom)
│   ├── ChatRoomEntity.java
│   ├── ChatRoomRepository.java
│   └── provider/
│       ├── ChatProvider.java          # Provider 인터페이스
│       ├── FakeChatProvider.java
│       └── HttpChatProvider.java
├── notification/
│   ├── NotificationService.java       # 알림 발송
│   └── provider/
│       ├── NotificationProvider.java  # Provider 인터페이스
│       ├── FakeNotificationProvider.java
│       └── HttpNotificationProvider.java
├── audit/
│   ├── AuditLogService.java           # 감사로그 기록
│   ├── AuditLogEntity.java
│   └── AuditLogRepository.java
├── alert/
│   └── AlertWebhookService.java       # 운영 알림 (Slack 등)
├── ops/
│   ├── OpsController.java             # 운영 요약 지표
│   └── OpsTimelineController.java     # 통합 타임라인
└── admin/
    └── AdminAuditController.java      # 감사로그 조회/CSV
```

### 3.2 레이어 구조

```
Controller → Service → Repository → DB
                ↓
           Provider (외부 연동)
                ↓
         AuditLogService (감사로그)
         AlertWebhookService (장애 알림)
```

- **Controller**: HTTP 요청 수신, 인증 확인, DTO 변환
- **Service**: 비즈니스 로직, 트랜잭션 관리
- **Repository**: JPA/Spring Data 기반 DB 접근
- **Provider**: 외부 서비스 연동 (결제/채팅/알림) — `fake`/`http` 전환 가능

### 3.3 인증 흐름

```
Client → [Authorization: Bearer <accessToken>] → Controller
                                                      │
                                                AuthService.requireAdmin(header)
                                                  또는 AuthService.me(header)
                                                      │
                                                TokenStore.resolveAccessUserId(token)
                                                      │
                                               JWT 서명 검증 + claims 파싱
                                                      │
                                               UserRepository.findById(userId)
```

- **액세스 토큰**: JWT, 6시간 유효, HMAC-SHA 서명
- **리프레시 토큰**: JWT, 14일 유효, SHA-256 해시로 DB 저장
- **토큰 순환**: 리프레시 시 기존 토큰 revoke + 새 토큰 발급
- **재사용 감지**: 이미 revoke된 리프레시 토큰 사용 시 해당 사용자의 모든 세션 무효화
- **역할**: `USER` / `ADMIN` (email prefix `admin` → ADMIN 자동 부여)

### 3.4 Provider 패턴

외부 서비스 연동에 Strategy 패턴을 사용합니다:

```
PaymentProvider (interface)
├── FakePaymentProvider   ← PAYMENT_PROVIDER=fake (개발/테스트)
└── HttpPaymentProvider   ← PAYMENT_PROVIDER=http (프로덕션)
```

동일 패턴이 Chat, Notification에도 적용됩니다.

전환은 환경변수로만 이루어지며, 코드 변경 없이 provider 교체가 가능합니다.

---

## 4. 데이터 흐름

### 4.1 예약 → 결제 → 상담방 생성 플로우

```
1. 예약 생성
   Client → POST /api/v1/bookings
       → BookingService.create()
       → counselor_slots.available = false
       → bookings INSERT (status=RESERVED)
       → audit_logs INSERT

2. 결제 생성
   Client → POST /api/v1/payments
       → PaymentService.create()
       → PaymentProvider.prepare()
       → payments INSERT (status=PENDING)

3. 결제 확정
   Client → POST /api/v1/payments/{id}/confirm
       → PaymentProvider.confirm()
       ┌─ 성공 시:
       │  → payments.status = PAID
       │  → bookings.status = PAID
       │  → ChatService.ensureRoom() → chat_rooms INSERT
       │  → NotificationService.notifyPaymentConfirmed()
       └─ 실패 시:
          → payments.status = FAILED
          → bookings.status = PAYMENT_FAILED
          → chat_rooms.status = CLOSED (있는 경우)

4. 웹훅 수신 (비동기)
   Provider → POST /api/v1/payments/webhooks/provider
       → X-Webhook-Secret 검증
       → PaymentService.handleWebhook()
       → 이벤트 타입에 따라 confirm / cancel / fail 처리
```

### 4.2 보상(Compensation) 패턴

결제 확정 후 채팅방 생성이나 알림 발송이 실패해도 결제를 롤백하지 않습니다.

```
결제 확정 (PAID) ─────────────────── 저장 완료
       │
       ├── 채팅방 생성 시도
       │   ├── 성공 → chat_rooms INSERT
       │   └── 실패 → payment_status_logs에 "chat_open_retry_needed" 기록
       │            → ALERTS_WEBHOOK_URL로 알림 전송
       │
       └── 알림 발송 시도
           ├── 성공 → audit_logs INSERT
           └── 실패 → payment_status_logs에 "notification_retry_needed" 기록
                    → ALERTS_WEBHOOK_URL로 알림 전송

운영자 재처리:
  POST /api/v1/payments/{id}/retry-post-actions (관리자)
```

### 4.3 감사로그 (Audit Trail)

모든 주요 액션에 감사로그가 기록됩니다:

| Action | 설명 |
|---|---|
| `AUTH_SIGNUP` | 회원가입 |
| `AUTH_LOGIN` | 로그인 성공 |
| `AUTH_LOGIN_FAIL` | 로그인 실패 |
| `AUTH_ADMIN_LOGIN` | 관리자 로그인 |
| `AUTH_REFRESH` | 토큰 갱신 |
| `AUTH_REFRESH_REUSE_DETECTED` | 리프레시 토큰 재사용 감지 |
| `AUTH_REFRESH_EXPIRED` | 만료된 리프레시 토큰 사용 |
| `AUTH_LOGOUT` | 로그아웃 |
| `AUTH_SESSION_REVOKED` | 세션 해제 |
| `BOOKING_CREATED` | 예약 생성 |
| `BOOKING_CANCELED` | 예약 취소 |
| `PAYMENT_CREATED` | 결제 생성 |
| `PAYMENT_CONFIRMED` | 결제 확정 |
| `PAYMENT_FAILED` | 결제 실패 |
| `PAYMENT_CANCELED` | 결제 취소 |
| `CHAT_ROOM_CREATED` | 상담방 생성 |
| `NOTIFICATION_SENT` | 알림 발송 |

---

## 5. 데이터베이스 스키마

### 5.1 ERD (요약)

```
users (1)──────(N) bookings
  │                   │
  │                   ├──(1) payments ──(N) payment_status_logs
  │                   │
  │                   └──(1) chat_rooms
  │
  ├──(N) refresh_tokens
  │
  └──(N) audit_logs

counselors (1)──(N) counselor_slots
     │
     └──────────(N) bookings
```

### 5.2 테이블 목록

| 테이블 | 설명 | 마이그레이션 |
|---|---|---|
| `users` | 사용자 (email, password_hash, name, role) | V1 |
| `counselors` | 상담사 (name, specialty, intro) | V1 |
| `counselor_slots` | 상담 슬롯 (counselor_id, start_at, end_at, available) | V1 |
| `bookings` | 예약 (user_id, counselor_id, slot_id, status) | V2 |
| `audit_logs` | 감사로그 (user_id, action, target_type, target_id) | V3 |
| `refresh_tokens` | 리프레시 토큰 (user_id, token_hash, device_id, revoked) | V5, V6 |
| `payments` | 결제 (booking_id, amount, currency, provider, status) | V7 |
| `chat_rooms` | 상담방 (booking_id, provider_room_id, status) | V8 |
| `payment_status_logs` | 결제 상태 전이 로그 (payment_id, from/to_status, reason) | V9 |

### 5.3 주요 인덱스

| 인덱스 | 테이블 | 컬럼 |
|---|---|---|
| `idx_payment_status` | payments | status |
| `idx_audit_action_created_at` | audit_logs | action, created_at |
| `idx_payment_status_log_payment_id` | payment_status_logs | payment_id |
| `idx_refresh_user` | refresh_tokens | user_id |
| UNIQUE | bookings | slot_id |
| UNIQUE | payments | booking_id |
| UNIQUE | chat_rooms | booking_id |

---

## 6. API 엔드포인트 요약

### 6.1 공개 (인증 불요)

| Method | Path | 설명 |
|---|---|---|
| POST | `/api/v1/auth/signup` | 회원가입 |
| POST | `/api/v1/auth/login` | 로그인 |
| POST | `/api/v1/auth/admin/login` | 관리자 로그인 |
| POST | `/api/v1/auth/refresh` | 토큰 갱신 |
| GET | `/api/v1/counselors` | 상담사 목록 |
| GET | `/api/v1/counselors/{id}` | 상담사 상세 + 슬롯 |

### 6.2 사용자 (Bearer 토큰 필요)

| Method | Path | 설명 |
|---|---|---|
| GET | `/api/v1/auth/me` | 내 정보 |
| POST | `/api/v1/auth/logout` | 로그아웃 |
| GET | `/api/v1/auth/sessions` | 내 세션 목록 |
| POST | `/api/v1/auth/sessions/{id}/revoke` | 세션 해제 |
| POST | `/api/v1/bookings` | 예약 생성 |
| GET | `/api/v1/bookings/me` | 내 예약 |
| POST | `/api/v1/bookings/{id}/cancel` | 예약 취소 |
| POST | `/api/v1/payments` | 결제 생성 |
| GET | `/api/v1/payments/{id}` | 결제 조회 |
| POST | `/api/v1/payments/{id}/confirm` | 결제 확정 |
| POST | `/api/v1/payments/{id}/cancel` | 결제 취소 |
| GET | `/api/v1/chats/by-booking/{bookingId}` | 상담방 조회 |

### 6.3 관리자 (ADMIN 역할 필요)

| Method | Path | 설명 |
|---|---|---|
| GET | `/api/v1/ops/summary` | 운영 요약 지표 |
| GET | `/api/v1/ops/timeline` | 통합 타임라인 |
| GET | `/api/v1/payments/{id}/logs` | 결제 상태 전이 로그 |
| POST | `/api/v1/payments/{id}/retry-post-actions` | 결제 후속 재처리 |
| GET | `/api/v1/admin/audit` | 감사로그 조회 |
| GET | `/api/v1/admin/audit/csv` | 감사로그 CSV |

### 6.4 웹훅 (외부 Provider → 서버)

| Method | Path | 설명 |
|---|---|---|
| POST | `/api/v1/payments/webhooks/provider` | 결제 웹훅 수신 (`X-Webhook-Secret` 헤더) |

---

## 7. 프론트엔드 아키텍처

### 7.1 Web (Next.js 15 / React 19)

```
web/src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # 루트 레이아웃 (AuthProvider 포함)
│   ├── page.tsx                  # 홈
│   ├── login/page.tsx            # 로그인
│   ├── signup/page.tsx           # 회원가입
│   ├── counselors/
│   │   ├── page.tsx              # 상담사 목록
│   │   └── [id]/
│   │       ├── page.tsx          # 상담사 상세 (SSR)
│   │       └── CounselorDetailClient.tsx  # 클라이언트 컴포넌트
│   ├── bookings/me/page.tsx      # 내 예약
│   ├── sessions/page.tsx         # 세션 관리
│   ├── dashboard/page.tsx        # 관리자 대시보드
│   └── admin/
│       ├── login/page.tsx        # 관리자 로그인
│       ├── audit/page.tsx        # 감사로그
│       └── timeline/page.tsx     # 통합 타임라인
├── components/
│   ├── api.ts                    # API 유틸리티
│   ├── api-client.ts             # HTTP 클라이언트 (fetch wrapper)
│   ├── auth-client.ts            # 인증 클라이언트
│   ├── auth-context.tsx          # 인증 Context Provider
│   ├── route-guard.tsx           # 인증 라우트 가드
│   ├── session-expiry-guard.tsx  # 세션 만료 감지
│   ├── app-header.tsx            # 앱 헤더
│   └── ui.tsx                    # 공통 UI 컴포넌트
```

### 7.2 인증 상태 관리

```
AuthProvider (Context)
    │
    ├── accessToken (메모리)
    ├── refreshToken (메모리)
    └── user 정보
         │
    RouteGuard
         │ 비인증 접근 → /login 리다이렉트
         │
    SessionExpiryGuard
         │ 토큰 만료 감지 → 세션 만료 모달 표시
```

### 7.3 기술 스택

| 항목 | 기술 |
|---|---|
| Framework | Next.js 15.1.6 |
| React | 19.0.0 |
| 언어 | TypeScript 5.9.3 |
| 상태관리 | React Context (내장) |
| HTTP 클라이언트 | fetch API (custom wrapper) |
| 빌드 | next build (SWC) |

---

## 8. 외부 서비스 의존성

| 서비스 | 용도 | Provider 모드 | 비고 |
|---|---|---|---|
| PortOne + KG이니시스 | 결제 처리 | `PAYMENT_PROVIDER=http` | 웹훅 수신 필요 |
| Sendbird Calls | 화상/음성 상담 | 향후 통합 예정 | MVP 이후 |
| Slack Webhook | 운영 장애 알림 | `ALERTS_WEBHOOK_URL` | 선택 |
| Chat Provider | 상담방 관리 | `CHAT_PROVIDER=http` | Sendbird 또는 커스텀 |
| Notification Provider | 알림 발송 | `NOTIFICATION_PROVIDER=http` | 이메일/SMS/푸시 |

---

## 9. 보안 아키텍처

### 9.1 인증 체계

```
                    ┌─────────────────────────┐
                    │   JWT (HMAC-SHA256)      │
                    │                         │
                    │  Access Token (6h)      │
                    │  └── subject: userId    │
                    │  └── claim: role        │
                    │  └── claim: typ=access  │
                    │                         │
                    │  Refresh Token (14d)    │
                    │  └── SHA-256 해시 DB 저장│
                    │  └── 순환 + 재사용 감지  │
                    └─────────────────────────┘
```

### 9.2 비밀번호 저장

- BCrypt 해싱 (`BCryptPasswordEncoder`)
- 평문 비밀번호 절대 저장하지 않음

### 9.3 웹훅 보안

- `X-Webhook-Secret` 헤더로 HMAC 검증
- Idempotency: 이미 terminal 상태(`PAID`/`CANCELED`)이면 무시

### 9.4 CORS

- `CorsConfig.java`에서 허용 Origin 관리
- 프로덕션 배포 시 반드시 프로덕션 도메인으로 변경 필요

---

## 10. 운영 모니터링 포인트

### 10.1 핵심 지표 (OpsController)

- `users` count
- `counselors` count
- `availableSlots` count
- `booked` / `canceled` count
- `authLogin` / `authFail` / `authReuse` count

### 10.2 알림 이벤트 (AlertWebhookService)

| 이벤트 | 심각도 | 설명 |
|---|---|---|
| `AUTH_LOGIN_FAIL` | 경고 | 로그인 실패 |
| `AUTH_REFRESH_REUSE_DETECTED` | 긴급 | 토큰 재사용 (계정 탈취 가능성) |
| `PAYMENT_CONFIRM_FAIL` | 긴급 | 결제 확정 실패 |
| `PAYMENT_WEBHOOK_FAILED` | 긴급 | 웹훅 결제 실패 |
| `CHAT_OPEN_FAIL` | 높음 | 상담방 생성 실패 |
| `NOTIFICATION_FAIL` | 보통 | 알림 발송 실패 |

### 10.3 결제 상태 전이 로그

`payment_status_logs` 테이블에서 전이 사유별 추적:

- `create` → 정상 생성
- `provider_confirm_ok` / `provider_confirm_fail` → 결제 확정 결과
- `cancel` → 취소
- `webhook_failed` → 웹훅 실패
- `chat_open_retry_needed` → 상담방 재생성 필요
- `notification_retry_needed` → 알림 재발송 필요
- `chat_open_retried_ok` / `notification_retried_ok` → 재처리 성공
