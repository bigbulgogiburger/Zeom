# PRD: Flutter 앱 백엔드 API 정합성 개선

## 1. Overview

### 배경
천지연꽃신당 Flutter 앱은 UI 화면은 대부분 구현되어 있으나, 백엔드 API와의 정합성이 맞지 않아 핵심 기능(예약, 리뷰, 인증)이 실제로 동작하지 않는 상태. React 프론트엔드(web/)는 백엔드와 완전히 통합되어 있으므로, 이를 기준(Source of Truth)으로 Flutter 앱을 정렬한다.

### 목표
- Flutter 앱의 모든 API 호출을 백엔드 실제 스펙에 맞게 수정
- React 프론트엔드와 동일한 사용자 경험 제공
- 앱에서 예약 → 결제(캐시) → 상담 → 리뷰 풀 플로우 동작 가능

### 범위 제외 (Out of Scope)
- PortOne 네이티브 SDK 결제 연동 (WebView 방식은 향후)
- Sendbird 네이티브 SDK 실제 연동 (fake 모드 유지)
- Admin/Counselor 포탈 (앱에서는 고객 전용)
- OAuth 소셜 로그인

---

## 2. 핵심 문제 분석

### P0 — 예약 불가 (DioException)
| 항목 | Flutter (현재) | 백엔드 기대 |
|------|---------------|------------|
| 슬롯 전달 | `slotStart: "2026-02-20T14:00:00"` | `slotIds: [1, 2, 3]` |
| 상담 타입 키 | `channel` | `consultationType` |
| 상담 타입 값 | `"VOICE"` | `"CHAT"` |

### P0 — 리뷰 제출 실패
| 항목 | Flutter (현재) | 백엔드 기대 |
|------|---------------|------------|
| 리뷰 내용 키 | `comment` | `content` |

### P1 — 인증 토큰 갱신 불완전
- Flutter의 refresh 요청에 `deviceId`, `deviceName` 누락
- 멀티 디바이스 세션 관리 불가

### P1 — 예약 관리 기능 부재
- 취소, 일정 변경, 결제 재시도 미구현

### P2 — 상태값 불일치
- Flutter: `CONFIRMED`, `PENDING`, `CANCELLED`
- 백엔드: `BOOKED`, `PAID`, `PAYMENT_FAILED`, `CANCELED`, `COMPLETED`

---

## 3. 구현 스펙

### Phase 1: API Client 정렬 (api_client.dart)

#### 3.1 예약 생성 API 수정
```dart
// Before
Future<Response> createBooking({
  required int counselorId,
  required String slotStart,
  required String channel,
}) => _dio.post('/api/v1/bookings', data: {
  'counselorId': counselorId,
  'slotStart': slotStart,
  'channel': channel,
});

// After
Future<Response> createBooking({
  required int counselorId,
  required List<int> slotIds,
  required String consultationType, // "VIDEO" or "CHAT"
}) => _dio.post('/api/v1/bookings', data: {
  'counselorId': counselorId,
  'slotIds': slotIds,
  'consultationType': consultationType,
});
```

#### 3.2 예약 관리 API 추가
```dart
Future<Response> cancelBooking(int bookingId, {String? reason})
Future<Response> rescheduleBooking(int bookingId, {required List<int> newSlotIds})
Future<Response> retryPayment(int bookingId)
```

#### 3.3 상담사 슬롯 조회 API 추가
```dart
Future<Response> getCounselorSlots(int counselorId) =>
    _dio.get('/api/v1/counselors/$counselorId/slots');
```

#### 3.4 리뷰 제출 필드 수정
```dart
// "comment" → "content"
Future<Response> submitReview({
  required int consultationId,
  required int counselorId,
  required int rating,
  required String content, // NOT "comment"
})
```

#### 3.5 토큰 갱신 deviceId 추가
```dart
// refresh 요청에 deviceId, deviceName 포함
```

### Phase 2: 예약 화면 재구현 (booking/)

#### 3.6 BookingCreateScreen 재설계
- 상담사 슬롯 목록을 날짜별 그룹화 표시
- 슬롯 멀티 선택 (최대 3개)
- 상담 타입 선택 (VIDEO / CHAT)
- 백엔드 `slotIds` 기반 예약 생성

#### 3.7 BookingListScreen 기능 추가
- 예약 상태 배지: BOOKED, PAID, PAYMENT_FAILED, CANCELED, COMPLETED
- 취소 버튼 (BOOKED 상태, 사유 선택)
- 일정 변경 버튼 (24시간 전, BOOKED 상태)
- 결제 재시도 버튼 (PAYMENT_FAILED 상태)
- 입장 가능 표시 (시작 5분 전 ~ 10분 후)

### Phase 3: 상담사 상세 + 리뷰 + 환불 수정

#### 3.8 CounselorDetailScreen 슬롯 표시
- 상담사 슬롯 목록 로드 (getCounselorSlots)
- 날짜별 그룹화 + 시간 선택 UI
- 리뷰 목록 표시

#### 3.9 ReviewScreen 필드 수정
- `comment` → `content`
- `bookingId` → `consultationId` + `counselorId`

#### 3.10 RefundRequestScreen API 정렬
- 백엔드 실제 엔드포인트와 일치시키기

### Phase 4: 지갑 + 인증 개선

#### 3.11 WalletScreen 개선
- 실제 지갑 잔액 표시 (GET /api/v1/wallets/my)
- 거래 내역 표시 (GET /api/v1/cash/transactions)

#### 3.12 CashBuyScreen 상품 목록
- 상품 목록 로드 (GET /api/v1/products)
- 캐시 충전 → POST /api/v1/cash/charge
- (실결제는 향후 PortOne WebView로)

#### 3.13 Auth 개선
- 토큰 갱신 시 deviceId/deviceName 전달
- 로그아웃 시 refreshToken 전달

---

## 4. 상태값 매핑 테이블

| 백엔드 상태 | Flutter 표시 텍스트 | 배지 색상 |
|------------|-------------------|----------|
| `BOOKED` | 예약 완료 | 금색 (#C9A227) |
| `PAID` | 결제 완료 | 녹색 (#2D5016) |
| `PAYMENT_FAILED` | 결제 실패 | 암적색 (#8B0000) |
| `CANCELED` | 취소됨 | 회색 (#666666) |
| `COMPLETED` | 상담 완료 | 먹색 (#111111) |

---

## 5. 파일 소유권 (병렬 개발용)

| 에이전트 | 담당 파일 |
|---------|----------|
| **booking-agent** | `api_client.dart` (예약/슬롯 메서드), `booking_create_screen.dart`, `booking_list_screen.dart` |
| **counselor-review-agent** | `counselor_detail_screen.dart`, `counselor_list_screen.dart`, `review_screen.dart`, `refund_request_screen.dart`, `refund_list_screen.dart` |
| **wallet-auth-agent** | `api_client.dart` (지갑/인증 메서드), `wallet_screen.dart`, `cash_buy_screen.dart`, `auth_service.dart`, `auth_provider.dart` |

> ⚠️ `api_client.dart`는 booking-agent가 먼저 수정 후, wallet-auth-agent가 이어서 수정

---

## 6. 수락 기준

- [ ] 앱에서 상담사 슬롯 조회 → 슬롯 선택 → 예약 생성 성공
- [ ] 예약 목록에서 취소/일정변경 동작
- [ ] 리뷰 제출 성공 (content 필드)
- [ ] 지갑 잔액 및 거래 내역 표시
- [ ] `dart analyze lib/` — No issues found
- [ ] `flutter build apk --debug` — 빌드 성공
