---
name: verify-payment-wallet
description: 결제/지갑/크레딧 시스템 무결성 검증. 결제 관련 코드 변경 후 사용.
---

## Purpose

1. 지갑 잔액 변경 시 비관적 락(PESSIMISTIC_WRITE) 사용 여부 검증
2. 캐시 트랜잭션 idempotencyKey 유니크 제약 확인
3. PortOne 결제 흐름 (prepare → verify → confirm) 무결성 검증
4. 환불/분쟁 상태 전이 규칙 검증
5. Provider 패턴 (fake/portone) 올바른 조건 설정 검증

## When to Run

- `backend/.../wallet/`, `cash/`, `credit/`, `portone/` 패키지 변경 시
- `backend/.../refund/`, `dispute/` 패키지 변경 시
- `backend/.../lock/DistributedLock.java` 변경 시
- `web/src/app/cash/`, `wallet/`, `credits/`, `refunds/` 변경 시
- `web/src/components/wallet-widget.tsx`, `credit-widget.tsx` 변경 시
- `backend/.../settlement/` 패키지 변경 시
- `web/src/app/credits/` 페이지 변경 시
- `app_flutter/lib/features/wallet/`, `credit/` 변경 시
- `app_flutter/lib/core/api_client.dart` 결제/크레딧 관련 메서드 변경 시

## Related Files

| File | Purpose |
|------|---------|
| `backend/src/main/java/com/cheonjiyeon/api/wallet/WalletService.java` | 지갑 비즈니스 로직 |
| `backend/src/main/java/com/cheonjiyeon/api/wallet/WalletRepository.java` | 비관적 락 쿼리 |
| `backend/src/main/java/com/cheonjiyeon/api/wallet/WalletEntity.java` | 지갑 엔티티 |
| `backend/src/main/java/com/cheonjiyeon/api/cash/CashTransactionEntity.java` | 트랜잭션 (idempotencyKey) |
| `backend/src/main/java/com/cheonjiyeon/api/cash/CashTransactionService.java` | 트랜잭션 기록 서비스 |
| `backend/src/main/java/com/cheonjiyeon/api/credit/CreditEntity.java` | 상담 크레딧 |
| `backend/src/main/java/com/cheonjiyeon/api/credit/CreditService.java` | 크레딧 구매/예약/해제 |
| `backend/src/main/java/com/cheonjiyeon/api/portone/PortOnePaymentService.java` | 결제 오케스트레이션 |
| `backend/src/main/java/com/cheonjiyeon/api/portone/PortOneClient.java` | PortOne REST 클라이언트 |
| `backend/src/main/java/com/cheonjiyeon/api/portone/PortOneWebhookHandler.java` | 웹훅 처리 |
| `backend/src/main/java/com/cheonjiyeon/api/refund/RefundService.java` | 환불 처리 |
| `backend/src/main/java/com/cheonjiyeon/api/refund/RefundEntity.java` | 환불 엔티티 |
| `backend/src/main/java/com/cheonjiyeon/api/dispute/DisputeService.java` | 분쟁 처리 |
| `backend/src/main/java/com/cheonjiyeon/api/lock/DistributedLock.java` | Redis 분산 락 |
| `backend/src/main/java/com/cheonjiyeon/api/product/ProductEntity.java` | 상품 엔티티 |
| `web/src/app/cash/buy/page.tsx` | 캐시 구매 페이지 |
| `web/src/app/wallet/page.tsx` | 지갑 페이지 |
| `web/src/components/api-client.ts` | 결제 API 메서드 |
| `web/src/components/wallet-widget.tsx` | 지갑 위젯 |
| `web/src/components/credit-widget.tsx` | 크레딧 위젯 |
| `web/src/app/credits/buy/page.tsx` | 크레딧 구매 페이지 |
| `web/src/app/credits/history/page.tsx` | 크레딧 이용 내역 페이지 |
| `app_flutter/lib/features/credit/credit_buy_screen.dart` | Flutter 크레딧 구매 화면 |
| `app_flutter/lib/features/wallet/wallet_screen.dart` | Flutter 지갑 화면 |
| `app_flutter/lib/features/wallet/cash_buy_screen.dart` | Flutter 캐시 충전 화면 |
| `app_flutter/lib/core/api_client.dart` | Flutter API 클라이언트 (결제/크레딧 메서드) |
| `backend/src/main/java/com/cheonjiyeon/api/settlement/SettlementController.java` | 정산 엔드포인트 |
| `backend/src/main/java/com/cheonjiyeon/api/settlement/SettlementService.java` | 정산 비즈니스 로직 |
| `backend/src/main/java/com/cheonjiyeon/api/settlement/CounselorSettlementEntity.java` | 상담사 정산 엔티티 |
| `backend/src/main/java/com/cheonjiyeon/api/settlement/CounselorBankAccountController.java` | 상담사 정산 계좌 관리 |
| `backend/src/main/java/com/cheonjiyeon/api/settlement/CounselorBankAccountService.java` | 상담사 정산 계좌 서비스 |
| `backend/src/main/java/com/cheonjiyeon/api/settlement/SettlementPdfService.java` | 정산 PDF 생성 서비스 |
| `backend/src/main/java/com/cheonjiyeon/api/scheduler/SettlementBatchScheduler.java` | 정산 배치 스케줄러 |
| `backend/src/main/java/com/cheonjiyeon/api/cash/CashTransactionController.java` | 캐시 거래 REST 엔드포인트 |
| `backend/src/main/java/com/cheonjiyeon/api/cash/CashChargeController.java` | 캐시 충전 엔드포인트 (TEST 모드 포함) |
| `web/src/app/credits/page.tsx` | 크레딧 목록/개요 페이지 |
| `backend/src/main/java/com/cheonjiyeon/api/cash/ReceiptService.java` | 영수증 HTML 생성 서비스 |
| `backend/src/main/java/com/cheonjiyeon/api/coupon/CouponEntity.java` | 쿠폰 엔티티 |
| `backend/src/main/java/com/cheonjiyeon/api/coupon/CouponUsageEntity.java` | 쿠폰 사용 엔티티 |
| `backend/src/main/java/com/cheonjiyeon/api/referral/ReferralCodeEntity.java` | 추천 코드 엔티티 |
| `backend/src/main/java/com/cheonjiyeon/api/referral/ReferralRewardEntity.java` | 추천 보상 엔티티 |
| `web/src/app/counselor/settlement/page.tsx` | 상담사 정산 페이지 |
| `backend/src/main/java/com/cheonjiyeon/api/cash/ReceiptController.java` | 영수증 PDF 다운로드 엔드포인트 |
| `backend/src/main/java/com/cheonjiyeon/api/cash/ReceiptPdfService.java` | 영수증 PDF 생성 서비스 |

## Workflow

### Step 1: 비관적 락 사용 확인

**도구:** Grep

```bash
grep -n 'PESSIMISTIC_WRITE\|findByUserIdWithLock' backend/src/main/java/com/cheonjiyeon/api/wallet/WalletRepository.java
```

**PASS:** `@Lock(LockModeType.PESSIMISTIC_WRITE)` + `findByUserIdWithLock` 메서드 존재
**FAIL:** 비관적 락 없이 잔액 변경
**수정:** WalletRepository에 `@Lock` 어노테이션 추가

### Step 2: IdempotencyKey 유니크 제약 확인

**도구:** Grep

```bash
grep -n 'idempotencyKey\|unique' backend/src/main/java/com/cheonjiyeon/api/cash/CashTransactionEntity.java
```

**PASS:** `@Column(nullable = false, unique = true)` 설정됨
**FAIL:** unique 제약 누락
**수정:** Entity에 unique 제약 추가 + 마이그레이션 ALTER

### Step 3: 결제 상태 전이 검증

**도구:** Grep

```bash
grep -n 'PENDING\|PAID\|FAILED\|CANCELLED' backend/src/main/java/com/cheonjiyeon/api/portone/PortOnePaymentService.java
```

**PASS:** PENDING → PAID, PENDING → FAILED 전이만 허용
**FAIL:** 이미 PAID된 결제가 다시 변경 가능
**수정:** 상태 전이 가드 추가

### Step 4: Webhook 멱등성 확인

**도구:** Grep

```bash
grep -n 'isWebhookAlreadyProcessed\|idempot' backend/src/main/java/com/cheonjiyeon/api/portone/PortOneWebhookHandler.java
```

**PASS:** 웹훅 중복 처리 체크 로직 존재
**FAIL:** 중복 웹훅에 대한 방어 없음
**수정:** 중복 체크 로직 추가

### Step 5: 환불 상태 전이 규칙

**도구:** Grep

```bash
grep -n 'REQUESTED\|APPROVED\|REJECTED' backend/src/main/java/com/cheonjiyeon/api/refund/RefundService.java
```

**PASS:** REQUESTED → APPROVED/REJECTED 전이만 허용, APPROVED 시 지갑 환불 실행
**FAIL:** 잘못된 상태에서 승인/거절 가능
**수정:** 상태 검증 로직 추가

### Step 6: 프론트엔드-백엔드 결제 API 매칭

**도구:** Grep

```bash
grep -n 'preparePayment\|confirmPayment\|getWallet\|getCashProducts' web/src/components/api-client.ts
```

```bash
grep -n '@PostMapping\|@GetMapping' backend/src/main/java/com/cheonjiyeon/api/portone/PortOnePaymentController.java
```

**PASS:** 모든 프론트엔드 API 호출에 대응하는 백엔드 엔드포인트 존재
**FAIL:** 엔드포인트 불일치
**수정:** 불일치 수정

### Step 7: TEST 모드 캐시 충전 검증

**도구:** Grep

```bash
grep -n 'TEST\|paymentMethod\|amount.*<=.*0' backend/src/main/java/com/cheonjiyeon/api/cash/CashChargeController.java
```

**PASS:** 금액 검증 (`amount <= 0` 거부) 존재, paymentMethod 파라미터 수신
**FAIL:** 금액 검증 없이 충전 허용
**수정:** 금액 유효성 검사 추가

### Step 8: 프론트엔드 API 응답 필드 매핑 검증

**도구:** Grep

크레딧 잔액 필드:
```bash
grep -n 'remainingCredits\|remainingUnits\|totalCredits\|totalUnits\|usedCredits\|usedUnits' web/src/components/api-client.ts
```

상품 필드:
```bash
grep -n 'getCashProducts\|data\.products\|\.filter.*active' web/src/components/api-client.ts web/src/app/cash/buy/page.tsx web/src/app/credits/buy/page.tsx
```

**PASS:** `getCreditBalance()`가 `remainingUnits` → `remainingCredits` 변환, `getCashProducts()`가 `data.products`로 array unwrap, `.filter(p => p.active)` 미사용
**FAIL:** API 응답 필드를 변환 없이 직접 사용하거나, `.filter(p => p.active)` 사용 (DTO에 active 필드 없음)
**수정:** api-client.ts에서 필드명 변환 또는 불필요한 필터 제거

### Step 9: Flutter ↔ Web API 필드 매핑 동기화

**도구:** Grep

Flutter 크레딧 필드:
```bash
grep -n 'remainingUnits\|remainingCredits\|remaining\|usedUnits\|used' app_flutter/lib/features/wallet/wallet_screen.dart app_flutter/lib/features/credit/credit_buy_screen.dart
```

Flutter 상품 필드:
```bash
grep -n "minutes\|durationMinutes" app_flutter/lib/features/wallet/cash_buy_screen.dart app_flutter/lib/features/credit/credit_buy_screen.dart
```

**PASS:** Flutter에서 `remainingUnits`를 우선 사용하고 fallback 존재, `minutes`를 우선 사용하고 `durationMinutes` fallback
**FAIL:** 이전 필드명(`remaining`, `durationMinutes`)만 사용
**수정:** Backend API 응답 기준 필드명으로 수정하고 fallback 추가

## Output Format

| 검사 | 결과 | 상세 |
|------|------|------|
| 비관적 락 | PASS/FAIL | 락 설정: ... |
| IdempotencyKey | PASS/FAIL | unique 제약: ... |
| 결제 상태 전이 | PASS/FAIL | 허용 전이: ... |
| Webhook 멱등성 | PASS/FAIL | 중복 체크: ... |
| 환불 상태 전이 | PASS/FAIL | 전이 규칙: ... |
| API 매칭 | PASS/FAIL | 불일치: ... |
| TEST 모드 충전 | PASS/FAIL | 금액 검증: ... |
| API 필드 매핑 | PASS/FAIL | 변환 누락: ... |
| Flutter-Web 필드 동기화 | PASS/FAIL | 불일치 필드: ... |

## Exceptions

1. **H2에서의 락 동작**: H2 in-memory DB에서 PESSIMISTIC_WRITE는 실제 MySQL과 다르게 동작할 수 있음 (테스트 환경 한정)
2. **Fake provider 결제**: fake 모드에서는 PortOne API 호출 없이 직접 상태 변경하며, 이는 개발 환경 정상 동작
3. **Redis 미사용 환경**: `DistributedLock`은 Redis가 없으면 in-memory fallback 사용 가능, 이는 단일 인스턴스 개발 환경에서 허용
