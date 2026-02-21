# PRD: 테스트 모드 결제 플로우 (Dev-mode Payment Bypass)

## 배경

현재 결제 흐름이 end-to-end로 작동하지 않음:

| 구간 | 상태 | 문제 |
|------|------|------|
| 캐시 충전 (Flutter) | **BROKEN** | `POST /api/v1/cash/charge` 엔드포인트 미존재 |
| 캐시 충전 (Web) | **BROKEN** | PortOne SDK에 storeId 누락, 실제 PG 연동 미설정 |
| 상담권 구매 | **WORKS** | 지갑에 캐시가 있으면 정상 동작 |
| 예약 결제 | **WORKS** | FakePaymentProvider가 booking에는 동작 |

**결론**: 캐시 충전 구간이 막혀있어 전체 플로우 테스트 불가.

## 목표

테스트/개발 환경에서 실제 PG 없이 **캐시 충전 → 상담권 구매 → 예약 → 상담** 전체 플로우를 동작시킨다.

## 범위

### In-Scope
1. 백엔드: 테스트용 캐시 직접 충전 엔드포인트 (`POST /api/v1/cash/charge`)
2. Flutter: 캐시 충전 화면에서 위 엔드포인트 호출 (PG 없이 즉시 성공)
3. React: 캐시 충전 화면에서 위 엔드포인트 호출 (PortOne 우회)
4. 지갑 생성 보장: 회원가입 시 지갑 자동 생성 확인

### Out-of-Scope
- 실제 PortOne PG 연동 (프로덕션 단계)
- 실제 결제 취소/환불 PG 연동
- 보안 강화 (프로덕션에서 이 엔드포인트 비활성화)

## 기술 설계

### 1. 백엔드: `POST /api/v1/cash/charge`

**컨트롤러**: `CashTransactionController.java`에 추가

```
Request:  { "amount": 50000, "paymentMethod": "TEST" }
Response: { "walletId": 1, "newBalance": 50000, "transactionId": 123 }
```

**로직**:
1. `authService.me(authHeader)` → userId
2. `walletService.charge(userId, amount, "TEST_CHARGE", transactionId)` 호출
3. `cashTransactionService.recordTransaction(...)` 기록
4. 갱신된 잔액 반환

**지갑 자동 생성**: charge 시 지갑이 없으면 자동 생성 (getOrCreate 패턴)

### 2. Flutter: `cash_buy_screen.dart` 수정

현재 `apiClient.buyCash(amount)` → `POST /api/v1/cash/charge`는 이미 올바른 경로.
- 백엔드 엔드포인트만 생기면 즉시 동작
- 성공 시 잔액 갱신 + 성공 모달 표시
- `returnTo` 파라미터로 이전 화면 복귀

### 3. React: `cash/buy/page.tsx` 수정

현재 PortOne SDK 호출 제거하고 직접 charge API 호출:
```
POST /api/v1/cash/charge { amount, paymentMethod: "TEST" }
→ 성공 시 잔액 갱신 + 토스트
→ returnTo 있으면 리다이렉트
```

### 4. 지갑 초기화 검증

회원가입 시 `WalletEntity` 자동 생성 확인. 미존재 시 `WalletService`에 getOrCreate 로직 추가.

## 파일 소유권 (병렬 작업용)

| 태스크 | 담당 에이전트 | 파일 |
|--------|-------------|------|
| BE: cash charge 엔드포인트 | backend-agent | `CashTransactionController.java`, `CashTransactionService.java`, `WalletService.java` |
| Flutter: 캐시 충전 연동 | flutter-agent | `cash_buy_screen.dart`, `api_client.dart` |
| React: 캐시 충전 연동 | react-agent | `web/src/app/cash/buy/page.tsx`, `web/src/components/api-client.ts` |

## 수용 기준

1. Flutter에서 캐시 충전 → 지갑 잔액 증가 확인
2. Flutter에서 상담권 구매 → 상담권 잔액 증가 확인
3. React에서 동일 플로우 동작 확인
4. 신규 회원 가입 후 바로 충전 가능 (지갑 자동 생성)
5. `dart analyze` 및 `npm run build` 통과
