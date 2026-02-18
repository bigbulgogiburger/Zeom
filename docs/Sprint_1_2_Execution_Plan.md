# Sprint 1+2 병렬 실행 계획

> **기준 문서**: `docs/PRD_ToBe_v1.md`
> **실행 방식**: Claude Code Agent Team
> **총 에이전트**: 6명 (Foundation 1 + Domain 5)

---

## 1. 의존성 분석

### 작업 전체 목록 (Sprint 1 + Sprint 2)

```
Sprint 1 (런칭 차단)
  E-01: 인증 고도화 — 비밀번호 찾기, 이메일 인증, 프로필 관리
  E-02: 통합 알림 — 이메일 8종, 인앱 알림 센터, SSE
  E-03: 정산 지급 — 계좌 등록, 승인/지급 워크플로우, 환불-정산 연동
  E-04: 어드민 도구 — 유저관리, 상담사 승인, 분쟁 처리, 환불 승인
  E-12 일부: PaymentRetryScheduler 구현

Sprint 2 (전환율 개선)
  E-05: UX 완성 — 결제 실패 복구, 예약 변경/취소, 즐겨찾기, 빈/에러 상태
  E-06: 결제 고도화 — 영수증, 거래 필터링
  E-07: SEO — robots.txt, sitemap, OG태그, JSON-LD
  E-04 나머지: 리뷰 모더레이션
```

### 의존성 그래프

```
┌──────────────────────────────────────────────────────────────────┐
│                    Wave 1: FOUNDATION                            │
│                                                                  │
│  DB Migrations (V31-V43) + JPA Entities + 인터페이스 정의        │
│  Email Service Interface + Config                                │
└──────────────────┬───────────────────────────────────────────────┘
                   │
     ┌─────────────┼─────────────┬──────────────┬──────────────┐
     ▼             ▼             ▼              ▼              ▼
┌─────────┐ ┌───────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────┐
│  auth   │ │notification│ │settlement│ │  admin   │ │  ux-seo     │
│         │ │           │ │-payment  │ │          │ │             │
│ Backend │ │ Backend   │ │ Backend  │ │ Backend  │ │ Frontend    │
│    +    │ │    +      │ │    +     │ │    +     │ │ Only        │
│Frontend │ │ Frontend  │ │ Frontend │ │ Frontend │ │             │
└─────────┘ └───────────┘ └──────────┘ └──────────┘ └─────────────┘
     │             │             │              │              │
     └─────────────┴─────────────┴──────────────┴──────────────┘
                                 │
                   ┌─────────────┴──────────────┐
                   │   Wave 3: INTEGRATION      │
                   │                            │
                   │  Build Verification        │
                   │  Test Fixes                │
                   │  Cross-cutting Integration │
                   └────────────────────────────┘
```

### 왜 2-Wave가 최적인가?

| 대안 | 장점 | 단점 |
|------|------|------|
| **3-Wave (Backend→Frontend→Test)** | 안전 | 느림 — Frontend가 Backend 완료 대기 |
| **2-Wave (Foundation→Full-Stack Domain)** | 최대 병렬성 | Agent당 컨텍스트 증가 |
| **1-Wave (전부 동시)** | 최고 속도 | Migration 충돌 위험 |

**2-Wave 선택 이유**: 각 Agent가 자기 도메인의 Backend + Frontend를 함께 소유하면, API 계약을 자체적으로 정의하고 즉시 연동 가능. Foundation이 DB 스키마와 공통 인터페이스를 먼저 확보해주므로 충돌 없음.

---

## 2. 팀 구성

### Team: `sprint-1-2`

| Agent | 역할 | Wave | User Stories | 예상 파일 수 |
|-------|------|------|-------------|-------------|
| `foundation` | DB/Entity/Config | 1 (선행) | - | ~20 |
| `auth` | 인증 풀스택 | 2 (병렬) | US-01-01~04, US-05-04 일부 | ~15 |
| `notification` | 알림 풀스택 | 2 (병렬) | US-02-01, US-02-03 | ~12 |
| `settlement-payment` | 정산/결제 풀스택 | 2 (병렬) | US-03-01~03, US-06-02~03, US-12-03 | ~18 |
| `admin` | 어드민 풀스택 | 2 (병렬) | US-04-01~05, US-09-02 일부 | ~20 |
| `ux-seo` | UX/SEO 프론트엔드 | 2 (병렬) | US-05-01~03, US-07-01 | ~15 |

**총 에이전트**: 6명 (1 foundation + 5 domain)
**최대 동시 실행**: 5명 (Wave 2)

---

## 3. Agent별 상세 파일 소유권

### Agent 1: `foundation` (Wave 1 — 단독, 선행 완료 필수)

**역할**: 모든 도메인 Agent가 의존하는 DB 스키마, JPA Entity, 공통 인터페이스를 생성

**Backend 파일 소유권**:
```
backend/src/main/resources/db/migration/
  V31__email_verification.sql           -- users 테이블 컬럼 추가
  V32__counselor_bank_accounts.sql      -- 상담사 계좌 테이블
  V33__password_reset_tokens.sql        -- 비밀번호 재설정 토큰
  V34__social_accounts.sql              -- 소셜 로그인 연동
  V35__notifications.sql                -- 인앱 알림 테이블
  V36__notification_preferences.sql     -- 알림 설정
  V37__notification_logs.sql            -- 발송 이력
  V38__favorite_counselors.sql          -- 즐겨찾기
  V39__review_moderation.sql            -- 리뷰 모더레이션 컬럼
  V40__dispute_resolution.sql           -- 분쟁 해결 컬럼
  V41__counselor_applications.sql       -- 상담사 승인 테이블
  V42__user_status_deletion.sql         -- 사용자 상태/탈퇴

backend/.../entity/ (새 Entity 클래스들)
  PasswordResetTokenEntity.java
  SocialAccountEntity.java
  NotificationEntity.java
  NotificationPreferenceEntity.java
  NotificationLogEntity.java
  FavoriteCounselorEntity.java
  CounselorBankAccountEntity.java
  CounselorApplicationEntity.java

backend/.../entity/ (기존 Entity 수정)
  UserEntity.java                       -- emailVerified, status 필드 추가
  ReviewEntity.java                     -- moderationStatus, reportedCount 추가
  DisputeEntity.java                    -- resolutionType, resolvedBy 등 추가

backend/.../notification/
  EmailService.java                     -- 인터페이스 정의
  FakeEmailService.java                 -- dev 스텁

backend/src/main/resources/
  application.yml                       -- 이메일/알림 설정 추가
```

**작업 완료 조건**:
- `./gradlew compileJava` 성공
- 모든 Entity에 Repository 인터페이스 생성
- application.yml에 이메일/알림 관련 설정 추가

---

### Agent 2: `auth` (Wave 2 — 인증 도메인 풀스택)

**담당 User Stories**: US-01-01 (비밀번호 찾기), US-01-02 (이메일 인증), US-01-04 (프로필 관리)

**Backend 파일 소유권**:
```
backend/.../auth/
  PasswordResetService.java             -- 토큰 생성, 이메일 발송, 검증, 재설정
  PasswordResetController.java          -- POST /forgot-password, POST /reset-password
  EmailVerificationService.java         -- 인증 토큰 생성, 검증
  EmailVerificationController.java      -- POST /verify-email, POST /resend-verification

backend/.../user/                       -- 신규 패키지
  UserService.java                      -- 프로필 CRUD, 계정 삭제
  UserController.java                   -- PUT /users/me, DELETE /users/me

backend/.../auth/
  AuthService.java                      -- changePassword() 메서드 추가
  AuthController.java                   -- PUT /auth/change-password 추가
```

**Frontend 파일 소유권**:
```
web/src/app/forgot-password/page.tsx    -- 신규
web/src/app/reset-password/page.tsx     -- 신규
web/src/app/verify-email/page.tsx       -- 신규
web/src/app/mypage/page.tsx             -- 신규 (마이페이지 메인)
web/src/app/mypage/edit/page.tsx        -- 신규 (프로필 편집)
web/src/app/mypage/password/page.tsx    -- 신규 (비밀번호 변경)
web/src/app/mypage/delete/page.tsx      -- 신규 (계정 탈퇴)
web/src/app/mypage/layout.tsx           -- 신규 (마이페이지 레이아웃)
web/src/app/login/page.tsx              -- 수정 ("비밀번호 찾기" 링크 추가)
web/src/app/signup/page.tsx             -- 수정 (이메일 인증 안내 추가)
```

**수정하는 기존 파일**: `login/page.tsx`, `signup/page.tsx`, `AuthService.java`, `AuthController.java`
**절대 건드리지 않는 파일**: `app-header.tsx`, `globals.css`, `wallet/`, `admin/`, `counselor/`

---

### Agent 3: `notification` (Wave 2 — 알림 도메인 풀스택)

**담당 User Stories**: US-02-01 (이메일 알림 8종), US-02-03 (인앱 알림 센터)

**Backend 파일 소유권**:
```
backend/.../notification/
  NotificationService.java              -- 재설계: 다중 타입, 다중 채널
  NotificationController.java           -- GET /notifications, PUT /read, SSE /stream
  NotificationPreferenceService.java    -- 알림 설정 CRUD
  NotificationPreferenceController.java -- GET/PUT /notification-preferences
  NotificationLogService.java           -- 발송 이력 관리
  EmailTemplateService.java             -- 이메일 템플릿 (8종)
  SseEmitterService.java                -- Server-Sent Events 관리

backend/.../scheduler/
  NotificationReminderScheduler.java    -- 상담 리마인더 (1시간 전, 10분 전)

backend/src/main/resources/templates/   -- 이메일 HTML 템플릿 (신규 디렉토리)
  booking-confirmed.html
  consultation-reminder.html
  consultation-completed.html
  refund-requested.html
  refund-processed.html
  settlement-paid.html
  review-received.html
  new-booking.html
```

**Frontend 파일 소유권**:
```
web/src/components/notification-bell.tsx     -- 신규 (벨 아이콘 + 뱃지)
web/src/app/notifications/page.tsx           -- 신규 (알림 목록)
web/src/app/notification-preferences/page.tsx -- 신규 (알림 설정)
web/src/components/app-header.tsx            -- 수정 (notification-bell import 추가)
```

**수정하는 기존 파일**: `app-header.tsx`, `NotificationService.java`
**절대 건드리지 않는 파일**: `login/`, `signup/`, `admin/`, `wallet/`, `counselor/settlement/`

---

### Agent 4: `settlement-payment` (Wave 2 — 정산/결제 풀스택)

**담당 User Stories**: US-03-01 (계좌 등록), US-03-02 (정산 워크플로우), US-03-03 (환불-정산), US-06-02 (영수증), US-06-03 (거래 필터링), US-12-03 (PaymentRetryScheduler)

**Backend 파일 소유권**:
```
backend/.../settlement/
  CounselorBankAccountService.java      -- 계좌 CRUD, 암호화
  CounselorBankAccountController.java   -- POST/GET/PUT /counselor/bank-account
  SettlementService.java                -- 수정: 승인/지급 워크플로우 추가
  SettlementController.java             -- 수정: 지급 API 추가
  SettlementPdfService.java             -- 정산 명세서 PDF 생성

backend/.../wallet/
  WalletService.java                    -- 수정: 거래 필터링 추가
  WalletController.java                 -- 수정: 필터 파라미터 추가

backend/.../refund/
  RefundService.java                    -- 수정: 환불-정산 상호작용 추가

backend/.../scheduler/
  PaymentRetryScheduler.java            -- 구현 (현재 스텁)
  SettlementBatchScheduler.java         -- 월 2회 자동 정산 Batch

backend/.../cash/
  ReceiptService.java                   -- 영수증 생성
  CashTransactionController.java        -- 수정: 필터 파라미터, CSV 내보내기
```

**Frontend 파일 소유권**:
```
web/src/app/wallet/page.tsx             -- 수정 (거래 필터링, 영수증 다운로드)
web/src/app/cash/buy/page.tsx           -- 수정 (결제 실패 복구 UX)
web/src/app/counselor/settlement/page.tsx -- 수정 (계좌 등록 섹션 추가)
```

**수정하는 기존 파일**: `wallet/page.tsx`, `cash/buy/page.tsx`, `counselor/settlement/page.tsx`, `SettlementService.java`, `WalletService.java`, `RefundService.java`, `PaymentRetryScheduler.java`
**절대 건드리지 않는 파일**: `login/`, `admin/`, `app-header.tsx`, `counselors/`

---

### Agent 5: `admin` (Wave 2 — 어드민 풀스택)

**담당 User Stories**: US-04-01 (사용자 관리), US-04-02 (상담사 승인), US-04-03 (분쟁 처리), US-04-04 (환불 승인), US-04-05 (리뷰 모더레이션)

**Backend 파일 소유권**:
```
backend/.../admin/
  AdminUserService.java                 -- 사용자 목록, 정지/해제
  AdminUserController.java              -- GET /admin/users, PUT /admin/users/{id}/suspend
  AdminCounselorApplicationService.java -- 상담사 승인 워크플로우
  AdminCounselorApplicationController.java
  AdminDisputeService.java              -- 분쟁 해결 워크플로우
  AdminDisputeController.java           -- GET/PUT /admin/disputes
  AdminRefundController.java            -- 신규 (환불 관리 전용 페이지 API)
  AdminReviewModerationService.java     -- 리뷰 신고/모더레이션
  AdminReviewModerationController.java

backend/.../review/
  ReviewService.java                    -- 수정: report(), 평점 재계산 개선
  ReviewController.java                 -- 수정: POST /reviews/{id}/report

backend/.../dispute/
  DisputeService.java                   -- 수정: 상태 전이 로직 추가
```

**Frontend 파일 소유권**:
```
web/src/app/admin/users/page.tsx            -- 신규
web/src/app/admin/users/[id]/page.tsx       -- 신규
web/src/app/admin/disputes/page.tsx         -- 신규
web/src/app/admin/disputes/[id]/page.tsx    -- 신규
web/src/app/admin/refunds/page.tsx          -- 신규
web/src/app/admin/counselor-applications/page.tsx -- 신규
web/src/app/admin/reviews/page.tsx          -- 신규
```

**수정하는 기존 파일**: `ReviewService.java`, `ReviewController.java`, `DisputeService.java`
**절대 건드리지 않는 파일**: `login/`, `wallet/`, `app-header.tsx`, `counselor/settlement/`

---

### Agent 6: `ux-seo` (Wave 2 — UX/SEO 프론트엔드 전용)

**담당 User Stories**: US-05-01 (결제 실패 복구 - 공통 컴포넌트만), US-05-02 (예약 변경/취소), US-05-03 (즐겨찾기), US-05-04 (빈/에러 상태), US-07-01 (기술적 SEO)

**Backend 파일 소유권**:
```
backend/.../favorite/                   -- 신규 패키지
  FavoriteCounselorService.java         -- 즐겨찾기 CRUD
  FavoriteCounselorController.java      -- POST/DELETE/GET /favorites

backend/.../booking/
  BookingService.java                   -- 수정: 예약 변경, 취소 사유 추가
  BookingController.java                -- 수정: PUT /bookings/{id}/reschedule, 취소 사유 파라미터
```

**Frontend 파일 소유권**:
```
web/src/components/empty-state.tsx      -- 신규 (통일된 빈 상태 컴포넌트)
web/src/app/favorites/page.tsx          -- 신규
web/src/app/bookings/me/page.tsx        -- 수정 (취소 사유 모달, 변경 버튼)
web/src/app/counselors/page.tsx         -- 수정 (하트 아이콘 추가)
web/src/app/counselors/[id]/CounselorDetailClient.tsx -- 수정 (즐겨찾기 + JSON-LD)
web/src/app/layout.tsx                  -- 수정 (SEO 메타데이터 강화)
web/src/app/sitemap.ts                  -- 신규 (Next.js 동적 사이트맵)
web/public/robots.txt                   -- 신규
web/src/app/not-found.tsx               -- 수정 (Empty State 적용)
```

**수정하는 기존 파일**: `bookings/me/page.tsx`, `counselors/page.tsx`, `CounselorDetailClient.tsx`, `layout.tsx`, `not-found.tsx`, `BookingService.java`, `BookingController.java`
**절대 건드리지 않는 파일**: `login/`, `admin/`, `wallet/`, `app-header.tsx`, `counselor/settlement/`

---

## 4. 파일 충돌 매트릭스

각 Agent의 소유권이 겹치지 않는지 검증:

| 파일 | foundation | auth | notification | settlement | admin | ux-seo |
|------|:---:|:---:|:---:|:---:|:---:|:---:|
| `db/migration/V31-V42` | **OWNER** | | | | | |
| `*Entity.java` (신규) | **OWNER** | | | | | |
| `UserEntity.java` (수정) | **OWNER** | | | | | |
| `ReviewEntity.java` (수정) | **OWNER** | | | | | |
| `DisputeEntity.java` (수정) | **OWNER** | | | | | |
| `application.yml` | **OWNER** | | | | | |
| `AuthService/Controller` | | **OWNER** | | | | |
| `login/page.tsx` | | **OWNER** | | | | |
| `signup/page.tsx` | | **OWNER** | | | | |
| `forgot-password/*` | | **OWNER** | | | | |
| `mypage/*` | | **OWNER** | | | | |
| `NotificationService` | | | **OWNER** | | | |
| `app-header.tsx` | | | **OWNER** | | | |
| `notifications/*` | | | **OWNER** | | | |
| `SettlementService` | | | | **OWNER** | | |
| `wallet/page.tsx` | | | | **OWNER** | | |
| `cash/buy/page.tsx` | | | | **OWNER** | | |
| `counselor/settlement/page.tsx` | | | | **OWNER** | | |
| `PaymentRetryScheduler` | | | | **OWNER** | | |
| `AdminUser*` | | | | | **OWNER** | |
| `AdminDispute*` | | | | | **OWNER** | |
| `admin/users/*` | | | | | **OWNER** | |
| `admin/disputes/*` | | | | | **OWNER** | |
| `admin/refunds/*` | | | | | **OWNER** | |
| `admin/reviews/*` | | | | | **OWNER** | |
| `ReviewService` (수정) | | | | | **OWNER** | |
| `DisputeService` (수정) | | | | | **OWNER** | |
| `BookingService` (수정) | | | | | | **OWNER** |
| `counselors/page.tsx` | | | | | | **OWNER** |
| `CounselorDetailClient.tsx` | | | | | | **OWNER** |
| `bookings/me/page.tsx` | | | | | | **OWNER** |
| `layout.tsx` (SEO) | | | | | | **OWNER** |
| `sitemap.ts`, `robots.txt` | | | | | | **OWNER** |
| `favorites/*` | | | | | | **OWNER** |

**충돌 없음 확인** — 모든 파일이 정확히 1개 Agent에만 할당됨.

---

## 5. 실행 순서 및 Lead 역할

### Wave 1: Foundation (단독)

```
Lead → foundation Agent 스폰
     → 작업 완료 대기
     → ./gradlew compileJava 검증
     → 완료 확인
```

**예상 소요**: foundation 에이전트 1개 작업 (~13개 migration + ~12개 entity)

### Wave 2: Domain Agents (5명 병렬)

```
Lead → auth, notification, settlement-payment, admin, ux-seo 동시 스폰
     → Shared Task List로 진행 상황 모니터링
     → 에이전트 간 직접 소통 (필요 시)
     → 전원 완료 대기
```

**병렬 작업 구조**:
```
                    ┌─ auth ──────────── (Backend → Frontend)
                    │
                    ├─ notification ──── (Backend → Frontend)
                    │
foundation 완료 ────┼─ settlement ────── (Backend → Frontend)
                    │
                    ├─ admin ─────────── (Backend → Frontend)
                    │
                    └─ ux-seo ────────── (Backend → Frontend)
```

### Wave 3: Integration (Lead 직접)

```
Lead가 직접 수행:
  1. cd backend && ./gradlew compileJava
  2. cd web && npm run build
  3. cd backend && ./gradlew test
  4. cd web && npm test
  5. 빌드 에러 수정
  6. 테스트 실패 수정
  7. docker compose up -d --build
  8. 전체 스크린샷 검증
```

---

## 6. Agent별 Task 목록 (Shared Task List)

### foundation (6 tasks)

| # | Task | Blocked By |
|---|------|-----------|
| T-01 | Flyway V31-V35 생성 (users, password_reset_tokens, social_accounts, notifications, notification_preferences) | - |
| T-02 | Flyway V36-V39 생성 (notification_logs, favorite_counselors, review_moderation, dispute_resolution) | - |
| T-03 | Flyway V40-V42 생성 (counselor_applications, counselor_bank_accounts, user_status) | - |
| T-04 | 신규 JPA Entity 클래스 생성 (8개) | T-01~03 |
| T-05 | 기존 Entity 수정 (UserEntity, ReviewEntity, DisputeEntity) + Repository 생성 | T-04 |
| T-06 | EmailService 인터페이스 + FakeEmailService + application.yml 설정 | - |

### auth (5 tasks)

| # | Task | Blocked By |
|---|------|-----------|
| T-07 | PasswordResetService + Controller (forgot/reset-password API) | T-05 |
| T-08 | EmailVerificationService + Controller (verify-email API) | T-05, T-06 |
| T-09 | UserService + Controller (프로필 CRUD, changePassword, 계정 탈퇴 API) | T-05 |
| T-10 | Frontend: forgot-password, reset-password, verify-email 페이지 | T-07, T-08 |
| T-11 | Frontend: mypage (메인, 편집, 비밀번호 변경, 탈퇴) + login/signup 수정 | T-09 |

### notification (5 tasks)

| # | Task | Blocked By |
|---|------|-----------|
| T-12 | NotificationService 재설계 (다중 타입/채널, 이벤트 발행) | T-05, T-06 |
| T-13 | 이메일 템플릿 8종 생성 + EmailTemplateService | T-06 |
| T-14 | NotificationController (CRUD + SSE stream) + PreferenceService | T-12 |
| T-15 | NotificationReminderScheduler (1시간/10분 전 리마인더) | T-12 |
| T-16 | Frontend: notification-bell, notifications 페이지, preferences 페이지, app-header 수정 | T-14 |

### settlement-payment (6 tasks)

| # | Task | Blocked By |
|---|------|-----------|
| T-17 | CounselorBankAccountService + Controller (계좌 CRUD, AES-256 암호화) | T-05 |
| T-18 | SettlementService 확장 (승인→지급 워크플로우) + PDF 명세서 | T-05 |
| T-19 | 환불-정산 상호작용 (RefundService ↔ SettlementService 연동) | T-18 |
| T-20 | PaymentRetryScheduler 구현 (채팅방/알림 재시도) | T-05 |
| T-21 | WalletController 거래 필터링 + ReceiptService 영수증 | T-05 |
| T-22 | Frontend: wallet 페이지 (필터/영수증), cash/buy (실패 복구), counselor/settlement (계좌 등록) | T-17, T-21 |

### admin (6 tasks)

| # | Task | Blocked By |
|---|------|-----------|
| T-23 | AdminUserService + Controller (사용자 목록, 정지/해제) | T-05 |
| T-24 | AdminCounselorApplicationService + Controller (승인 워크플로우) | T-05 |
| T-25 | AdminDisputeService + Controller (분쟁 해결 워크플로우) | T-05 |
| T-26 | AdminReviewModerationService + ReviewService 수정 (신고/모더레이션) | T-05 |
| T-27 | AdminRefundController (환불 관리 전용 페이지 API) | T-05 |
| T-28 | Frontend: admin/users, admin/disputes, admin/refunds, admin/counselor-applications, admin/reviews (5개 페이지) | T-23~27 |

### ux-seo (5 tasks)

| # | Task | Blocked By |
|---|------|-----------|
| T-29 | FavoriteCounselorService + Controller (즐겨찾기 CRUD API) | T-05 |
| T-30 | BookingService 수정 (예약 변경, 취소 사유 수집) | T-05 |
| T-31 | Frontend: empty-state 컴포넌트 + favorites 페이지 + counselors 하트 아이콘 | T-29 |
| T-32 | Frontend: bookings/me 취소 사유 모달 + 예약 변경 UX | T-30 |
| T-33 | SEO: layout.tsx 메타데이터, sitemap.ts, robots.txt, JSON-LD | - |

**총 33개 Task**, Agent당 평균 5.5개

---

## 7. Agent 스폰 명령 가이드

### Lead 초기 프롬프트 (팀 생성)

```
Sprint 1+2 개발을 위한 Agent Team을 생성해줘.
팀 이름: sprint-1-2

먼저 foundation 에이전트를 스폰해서 DB 마이그레이션과 JPA Entity를 생성해.
foundation이 완료되면, 다음 5개 도메인 에이전트를 동시에 스폰해:
auth, notification, settlement-payment, admin, ux-seo

각 에이전트에게 docs/Sprint_1_2_Execution_Plan.md를 읽도록 해.
파일 소유권을 엄격히 준수하도록 해.
delegate 모드를 사용해.
```

### 에이전트별 스폰 프롬프트 예시

**foundation**:
```
docs/Sprint_1_2_Execution_Plan.md의 Agent 1 (foundation) 섹션을 읽고,
명시된 파일들만 생성해. DB migrations V31-V42, JPA Entity 8개,
기존 Entity 수정 3개, EmailService 인터페이스를 구현해.
완료 후 ./gradlew compileJava로 빌드 확인.
```

**auth** (foundation 완료 후):
```
docs/Sprint_1_2_Execution_Plan.md의 Agent 2 (auth) 섹션을 읽고,
Backend: PasswordReset, EmailVerification, UserProfile 서비스/컨트롤러,
Frontend: forgot-password, reset-password, verify-email, mypage 페이지를 구현해.
login/page.tsx에 "비밀번호 찾기" 링크, signup/page.tsx에 인증 안내를 추가해.
파일 소유권을 엄격히 지켜. 다른 에이전트의 파일은 절대 수정하지 마.
```

(나머지 4개도 동일 패턴)

---

## 8. Cross-Cutting Concerns 처리

### 8.1 알림 연동 (notification ↔ 다른 도메인)

다른 도메인 Agent (auth, settlement-payment, admin)에서 알림을 보내야 하는 경우:

**규칙**: `NotificationService.send(userId, type, data)`만 호출.
실제 전송 로직은 `notification` Agent가 구현.

각 도메인 Agent는 자기 Service에서 `notificationService.send()` 호출 코드만 추가:
- `auth` → 이메일 인증 발송
- `settlement-payment` → 정산 완료 알림
- `admin` → 분쟁 결정 알림, 환불 결과 알림

### 8.2 감사 로그

기존 `AuditLogService.log()` 패턴 그대로 사용.
각 Agent가 자기 도메인의 감사 로그를 직접 추가.

### 8.3 앱 헤더 변경

`app-header.tsx`는 **notification** Agent만 수정:
- 알림 벨 아이콘 추가
- "마이페이지" 메뉴 링크 추가

다른 Agent는 헤더에 표시할 메뉴가 필요하면 notification Agent에게 메시지로 요청.

---

## 9. 검증 체크리스트 (Wave 3 — Lead)

### Build

- [ ] `cd backend && ./gradlew compileJava` — 성공
- [ ] `cd backend && ./gradlew test` — 기존 19개 테스트 통과
- [ ] `cd web && npm run build` — 성공
- [ ] `cd web && npm test` — 기존 테스트 통과

### 기능 검증 (Docker)

- [ ] 비밀번호 찾기 → 재설정 → 로그인
- [ ] 회원가입 → 이메일 인증 (fake)
- [ ] 마이페이지 → 프로필 편집 → 비밀번호 변경
- [ ] 알림 벨 클릭 → 알림 목록 표시
- [ ] 상담사 포털 → 정산 → 계좌 등록
- [ ] 어드민 → 사용자 관리 → 정지/해제
- [ ] 어드민 → 환불 관리 → 승인
- [ ] 즐겨찾기 추가/제거
- [ ] 지갑 → 거래 필터링
- [ ] SEO: robots.txt, sitemap.xml 접근 확인

---

## 10. 리스크 완화

| 리스크 | 확률 | 완화 |
|--------|------|------|
| Entity 수정 충돌 (foundation ↔ domain) | 중 | foundation이 모든 Entity 수정을 완료한 후 Wave 2 시작 |
| 알림 인터페이스 불일치 | 중 | foundation이 `NotificationService` 인터페이스를 먼저 정의 |
| 기존 테스트 실패 | 고 | Wave 3에서 Lead가 직접 수정 |
| 토큰 비용 급증 | 중 | Sonnet 모델 사용 (domain agents), Opus는 Lead만 |
| 빌드 시간 증가 | 저 | 병렬 빌드, incremental compilation |
