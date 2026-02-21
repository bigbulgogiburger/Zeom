# PRD: 예약-결제 통합 흐름 구현

## 문서 정보
- **작성일**: 2026-02-21
- **버전**: 1.0
- **작성자**: Product Manager (BigTech Agile)
- **상태**: Implementation Ready

---

## 1. Executive Summary

현재 천지연꽃신당 플랫폼은 **예약(Booking)**, **결제(Payment)**, **상담권(Credit)**, **지갑(Wallet)** 시스템이 백엔드에 모두 구현되어 있으나, **프론트엔드(React/Flutter) 에서 이 흐름이 연결되어 있지 않다.**

사용자가 상담권이 없어도 예약이 가능하고, 예약 후 결제 단계가 생략되며, 상담권 구매와 예약이 별개의 흐름으로 분리되어 있다. 이 PRD는 전체 예약-결제 흐름을 End-to-End로 통합한다.

---

## 2. 현재 상태 분석 (As-Is)

### 2.1 백엔드 (완성됨)
| 시스템 | 상태 | API |
|--------|------|-----|
| 지갑 (Wallet) | ✅ 완성 | `GET /api/v1/wallet`, `GET /api/v1/wallet/transactions` |
| 캐시 충전 (PortOne) | ✅ 완성 | `POST /api/v1/portone/payments/prepare`, `POST /api/v1/portone/payments/{id}/confirm` |
| 상담권 구매 (Credit) | ✅ 완성 | `POST /api/v1/credits/purchase`, `GET /api/v1/credits/my` |
| 예약 생성 | ✅ 완성 | `POST /api/v1/bookings` (상담권 자동 차감) |
| 결제 생성/확인 | ✅ 완성 | `POST /api/v1/payments`, `POST /api/v1/payments/{id}/confirm` |
| 상품 조회 | ✅ 완성 | `GET /api/v1/products/cash` |

### 2.2 프론트엔드 (미연결)
| 흐름 | React | Flutter |
|------|-------|---------|
| 예약 전 상담권 잔액 확인 | ❌ 없음 | ❌ 없음 |
| 상담권 부족 시 구매 유도 | ❌ 없음 | ❌ 없음 |
| 상담권 구매 화면 | ❌ 없음 | ❌ 없음 |
| 예약 후 결제 연결 | ❌ 없음 | ❌ 없음 |
| 캐시 → 상담권 구매 전환 | ❌ 없음 | ❌ 없음 |

### 2.3 사용자 경험 문제
1. 상담권 0개인 사용자가 예약 가능 → **무의미한 예약 생성**
2. 예약 후 결제 단계가 없음 → **BOOKED 상태에서 멈춤**
3. 캐시 충전과 상담권 구매가 별개 → **2단계 결제를 사용자가 직접 해야 함**

---

## 3. 목표 상태 (To-Be)

### 3.1 핵심 사용자 흐름

```
[상담사 상세] → 슬롯 선택 → [예약하기] 클릭
                                    ↓
                          ┌─ 상담권 잔액 확인 ─┐
                          │                     │
                    상담권 충분              상담권 부족
                          │                     │
                    예약 생성               [상담권 구매 안내]
                    (BOOKED)                    │
                          │              ┌──────┴──────┐
                    예약 완료 화면      캐시 있음     캐시 부족
                                         │              │
                                   상담권 구매      [캐시 충전]
                                   (잔액 차감)     (PortOne 결제)
                                         │              │
                                         └──────┬───────┘
                                                │
                                          상담권 확보 후
                                          예약 화면 복귀
                                                │
                                          예약 생성 (BOOKED)
                                                │
                                          예약 완료 화면
```

### 3.2 핵심 원칙
1. **상담권 기반 예약**: 예약 시 상담권이 차감됨 (1슬롯 = 1상담권 = 30분)
2. **사전 검증**: 예약 버튼 클릭 시 잔액 확인 → 부족하면 구매 유도
3. **원스톱 결제**: 캐시 충전 → 상담권 구매 → 예약 생성을 하나의 흐름으로
4. **React/Flutter 동일 UX**: 두 플랫폼의 흐름이 동일해야 함

---

## 4. 기능 명세

### Feature 1: 상담권 잔액 표시 (Credit Balance Display)

**위치**: 상담사 상세 화면, 예약 생성 화면, 지갑 화면

**API**: `GET /api/v1/credits/my`
```json
Response: { "totalUnits": 5, "usedUnits": 2, "remainingUnits": 3 }
```

**UI 요소**:
- 상담사 상세 하단: "보유 상담권: N회" 뱃지 (예약하기 버튼 위)
- 예약 확인 카드: "필요 상담권: M회 / 보유: N회"
- 부족 시: 빨간색 경고 "상담권이 M회 부족합니다"

---

### Feature 2: 상담권 구매 화면 (Credit Purchase Screen)

**신규 화면**: `/credits/buy` (React), `/credits/buy` route (Flutter)

**흐름**:
1. 상품 목록 표시 (`GET /api/v1/products/cash`)
   - 상담권 1회 (30분) - 33,000원
   - 상담권 2회 (60분) - 60,000원 (할인)
   - 상담권 3회 (90분) - 85,000원 (할인)
2. 현재 캐시 잔액 표시 (`GET /api/v1/wallet`)
3. 상품 선택 시:
   - **캐시 충분**: 바로 상담권 구매 (`POST /api/v1/credits/purchase`)
   - **캐시 부족**: 캐시 충전 화면으로 이동 → 충전 후 돌아와서 구매

**API 호출 순서**:
```
1. GET /api/v1/products/cash        → 상품 목록
2. GET /api/v1/wallet               → 현재 캐시 잔액
3. GET /api/v1/credits/my           → 현재 상담권 잔액
4. POST /api/v1/credits/purchase    → 상담권 구매 (캐시 차감)
   Body: { "productId": Long }
   Response: { "creditId", "units", "productId", "purchasedAt" }
```

---

### Feature 3: 예약 전 상담권 검증 (Pre-Booking Validation)

**위치**: 상담사 상세 화면 → "예약하기" 버튼 로직

**로직**:
```
selectedSlots = 사용자가 선택한 슬롯 수
creditBalance = GET /api/v1/credits/my → remainingUnits

IF creditBalance >= selectedSlots:
    → 예약 생성 진행 (기존 흐름)
ELSE:
    → 상담권 부족 모달 표시
    → "상담권 구매하기" 버튼 → /credits/buy?needed={selectedSlots - creditBalance}&returnTo=/counselor/{id}
```

**모달 UI**:
```
┌─────────────────────────────────┐
│     상담권이 부족합니다          │
│                                 │
│  필요: 2회                      │
│  보유: 0회                      │
│  부족: 2회                      │
│                                 │
│  [상담권 구매하기]  [취소]       │
└─────────────────────────────────┘
```

---

### Feature 4: 예약-상담권 통합 확인 (Booking Confirmation with Credits)

**위치**: BookingCreateScreen 확인 카드

**표시 정보**:
- 상담사 이름
- 선택 슬롯 시간
- 상담 유형 (화상/채팅)
- **사용 상담권: N회** (강조)
- **잔여 상담권: M회** (예약 후 잔액)

---

### Feature 5: 캐시 충전 후 복귀 흐름 (Return Flow After Cash Top-up)

**시나리오**: 상담권 부족 → 캐시도 부족 → 캐시 충전 → 상담권 구매 → 예약 복귀

**구현**:
- URL 파라미터로 returnTo 전달: `/wallet/cash-buy?returnTo=/credits/buy&needed=2`
- 캐시 충전 성공 시: returnTo URL로 자동 이동
- 상담권 구매 성공 시: 이전 상담사 상세로 복귀

**Flutter**: GoRouter extra로 returnRoute 전달

---

### Feature 6: 지갑 화면에 상담권 섹션 추가 (Wallet + Credits View)

**위치**: 지갑 탭

**추가 요소**:
- 상단: 캐시 잔액 카드 (기존)
- 중단: **상담권 잔액 카드** (신규)
  - "보유 상담권: N회 (M회 사용됨)"
  - "상담권 구매" 버튼
- 하단: 거래 내역 (기존)

---

## 5. 구현 계획

### Phase 1: 공통 기반 (Backend API 검증 + Flutter API Client)

| Task | 담당 | 파일 |
|------|------|------|
| T1-1: Credit API를 Flutter apiClient에 추가 | api-agent | `app_flutter/lib/core/api_client.dart` |
| T1-2: React apiClient에 Credit API 추가 | web-api-agent | `web/src/components/api-client.ts` |

**추가할 API 메서드**:
- `getCreditBalance()` → `GET /api/v1/credits/my`
- `purchaseCredit(productId)` → `POST /api/v1/credits/purchase`
- `getCreditHistory()` → `GET /api/v1/credits/history`

### Phase 2: 상담권 구매 화면 (신규)

| Task | 담당 | 파일 |
|------|------|------|
| T2-1: Flutter 상담권 구매 화면 | flutter-credit-agent | `app_flutter/lib/features/credit/credit_buy_screen.dart` (신규) |
| T2-2: React 상담권 구매 페이지 | web-credit-agent | `web/src/app/credits/buy/page.tsx` (신규) |
| T2-3: Flutter 라우터에 credit 라우트 추가 | flutter-credit-agent | `app_flutter/lib/core/router.dart` |
| T2-4: React 라우터/네비게이션에 credit 링크 추가 | web-credit-agent | 해당 layout/nav 파일 |

### Phase 3: 예약 흐름 통합

| Task | 담당 | 파일 |
|------|------|------|
| T3-1: Flutter 상담사 상세 - 상담권 잔액 표시 + 부족 모달 | flutter-booking-agent | `app_flutter/lib/features/counselor/counselor_detail_screen.dart` |
| T3-2: Flutter 예약 확인 - 상담권 정보 표시 | flutter-booking-agent | `app_flutter/lib/features/booking/booking_create_screen.dart` |
| T3-3: React 상담사 상세 - 상담권 잔액 표시 + 부족 모달 | web-booking-agent | `web/src/app/counselors/[id]/CounselorDetailClient.tsx` |
| T3-4: React 예약 확인 - 상담권 정보 표시 | web-booking-agent | 해당 컴포넌트 |

### Phase 4: 지갑 화면 통합

| Task | 담당 | 파일 |
|------|------|------|
| T4-1: Flutter 지갑에 상담권 섹션 추가 | flutter-wallet-agent | `app_flutter/lib/features/wallet/wallet_screen.dart` |
| T4-2: Flutter 캐시 충전 후 복귀 흐름 | flutter-wallet-agent | `app_flutter/lib/features/wallet/cash_buy_screen.dart` |
| T4-3: React 지갑에 상담권 섹션 추가 | web-wallet-agent | `web/src/app/wallet/page.tsx` |
| T4-4: React 캐시 충전 후 복귀 흐름 | web-wallet-agent | `web/src/app/cash/buy/page.tsx` |

---

## 6. 파일 소유권 (Merge Conflict 방지)

| Agent | 소유 파일 |
|-------|----------|
| **flutter-api-agent** | `app_flutter/lib/core/api_client.dart` |
| **web-api-agent** | `web/src/components/api-client.ts` |
| **flutter-credit-agent** | `app_flutter/lib/features/credit/` (신규 디렉토리), `app_flutter/lib/core/router.dart` |
| **web-credit-agent** | `web/src/app/credits/` (신규 디렉토리) |
| **flutter-booking-agent** | `app_flutter/lib/features/counselor/counselor_detail_screen.dart`, `app_flutter/lib/features/booking/booking_create_screen.dart` |
| **web-booking-agent** | `web/src/app/counselors/[id]/CounselorDetailClient.tsx` |
| **flutter-wallet-agent** | `app_flutter/lib/features/wallet/wallet_screen.dart`, `app_flutter/lib/features/wallet/cash_buy_screen.dart` |
| **web-wallet-agent** | `web/src/app/wallet/page.tsx`, `web/src/app/cash/buy/page.tsx` |
| **build-verify-agent** | 빌드 검증만 (읽기 전용) |

---

## 7. 수락 기준 (Acceptance Criteria)

### AC-1: 상담권 0회인 사용자가 예약 시도
- [ ] "상담권이 부족합니다" 모달 표시
- [ ] "상담권 구매하기" 버튼으로 구매 화면 이동
- [ ] 구매 완료 후 원래 상담사 화면으로 복귀

### AC-2: 상담권 보유 사용자가 예약
- [ ] 예약 확인 카드에 "사용 상담권: N회" 표시
- [ ] 예약 생성 시 상담권 자동 차감
- [ ] 예약 내역에 상담권 사용 정보 표시

### AC-3: 캐시 충전 → 상담권 구매 흐름
- [ ] 캐시 부족 시 충전 화면으로 이동
- [ ] 충전 성공 후 상담권 구매 화면으로 자동 복귀
- [ ] 상담권 구매 성공 후 상담사 상세로 복귀

### AC-4: 지갑 화면
- [ ] 캐시 잔액 + 상담권 잔액 모두 표시
- [ ] 상담권 구매 바로가기 버튼

### AC-5: React / Flutter 동일 UX
- [ ] 두 플랫폼에서 동일한 흐름과 화면 구성
- [ ] dart analyze / npm run build 모두 통과

---

## 8. 비기능 요구사항

- **동시성**: 상담권 예약 시 Pessimistic Lock (백엔드 이미 구현)
- **멱등성**: 상담권 구매 중복 방지 (idempotencyKey)
- **에러 처리**: 네트워크 오류, 잔액 부족, 서버 에러 각각 한국어 메시지
- **로딩 상태**: 모든 API 호출에 로딩 인디케이터
- **빌드 검증**: `dart analyze lib/` + `flutter build ios --simulator` + `npm run build`
