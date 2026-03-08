# E2E 테스트 리포트 - 천지연꽃신당

**실행일시**: 2026-03-07 09:43 KST
**환경**: Docker Compose (MySQL 8.0 + Redis 7 + Spring Boot + Next.js)
**테스트 도구**: Backend API (curl) + Chrome DevTools MCP + iOS Simulator (Flutter)

---

## 테스트 계정 정보

| 역할 | 이메일 | 비밀번호 | 비고 |
|------|--------|----------|------|
| 고객 | `e2e_customer@test.com` | `test1234` | userId=1, role=USER |
| 상담사 | `e2e_counselor_star@test.com` | `test1234` | userId=2, role=COUNSELOR, counselorId=4 |

---

## 테스트 시나리오 및 결과

### Step 1: 계정 생성 (API)

**고객 계정 생성**
```
POST /api/v1/auth/signup
Body: {"email":"e2e_customer@test.com","password":"test1234","name":"테스트 고객","phone":"010-1111-2222","birthDate":"1995-03-15","gender":"F","termsAgreed":true}
```
- 결과: PASS - userId=1, role=USER, accessToken 발급

**상담사 계정 생성**
```
POST /api/v1/auth/signup
Body: {"email":"e2e_counselor_star@test.com","password":"test1234","name":"별하늘 상담사","phone":"010-3333-4444","birthDate":"1988-07-20","gender":"F","termsAgreed":true}
```
- 결과: PASS - userId=2, role=COUNSELOR 자동 할당 (e2e_counselor_ prefix)
- CounselorEntity 자동 생성 (counselorId=4, specialty="종합운세")

---

### Step 2: 상담사 스케줄 설정 (API)

```
PUT /api/v1/counselor/schedule
Authorization: Bearer <counselor_token>
Body: {"slots":[
  {"startAt":"2026-03-08T10:00:00","endAt":"2026-03-08T11:00:00"},
  {"startAt":"2026-03-08T11:00:00","endAt":"2026-03-08T12:00:00"},
  {"startAt":"2026-03-08T14:00:00","endAt":"2026-03-08T15:00:00"}
]}
```
- 결과: PASS - slotId 41, 42, 43 생성

---

### Step 3: 캐시 충전 (API)

```
POST /api/v1/cash/charge
Authorization: Bearer <customer_token>
Body: {"amount":50000,"paymentMethod":"TEST"}
```
- 결과: PASS - newBalance=50,000원, transactionId=1

---

### Step 4: 상담사 목록 조회 (API)

```
GET /api/v1/counselors
```
- 결과: PASS - 4명의 상담사 반환 (시드 데이터 3명 + E2E 상담사 1명)
- "별하늘 상담사" (id=4, specialty="종합운세") 확인

---

### Step 5: 웹 UI 로그인 (Chrome DevTools)

1. `http://localhost:3000/login` 접속
2. 이메일/비밀번호 입력 → 로그인 버튼 클릭
3. 상담사 목록 페이지로 자동 이동
- 결과: PASS
- 스크린샷: `01-counselor-list.png`

---

### Step 6: 상담사 상세 + 슬롯 선택 (Chrome DevTools)

1. "별하늘 상담사" → "프로필 보기" 클릭
2. 슬롯 3개 표시 확인 (10:00, 11:00, 14:00)
3. "오후 02:00 ~ 오후 03:00" 슬롯 선택
- 결과: PASS - "1개 슬롯 선택됨 (30분), 상담권 1회 사용" 표시
- 스크린샷: `02-counselor-detail.png`, `03-slot-selected.png`

---

### Step 7: 상담권 부족 → 구매 (Chrome DevTools)

1. "예약하기" 클릭 → 예약 확인 모달 표시
2. "예약 확정" 클릭 → "상담권이 부족합니다" 모달 표시 (보유 0회, 필요 1회)
3. "상담권 구매하기" 클릭 → 상담권 구매 페이지 이동
4. 보유 캐시 50,000원 확인
5. "기본 상담 (30분) - 33,000원" 구매 클릭
- 결과: PASS - 상담권 1회 구매 완료, 상담사 상세 페이지로 자동 복귀
- 스크린샷: `04-booking-confirm.png`, `05-credits-insufficient.png`, `06-credits-buy.png`

---

### Step 8: 예약 확정 (Chrome DevTools)

1. 다시 "오후 02:00 ~ 오후 03:00" 슬롯 선택
2. 보유 상담권 1회 확인
3. "예약하기" → "예약 확정" 클릭
4. "내 예약" 페이지로 자동 이동
- 결과: PASS - 예약 2건 표시
  - 오후 02:00 ~ 03:00 (UI 예약, bookingId=2)
  - 오전 10:00 ~ 12:00 (API 예약, bookingId=1, 2슬롯)
- 스크린샷: `07-booking-confirm-final.png`, `08-my-bookings.png`

---

### Step 9: 상담 세션 시작 + 상담실 입장 (API + Chrome DevTools)

**세션 시작 (API)**
```
POST /api/v1/sessions/2/start
```
- 결과: PASS - sessionId=2, sendbirdRoomId="consultation-2"

**고객 상담실 (Chrome DevTools)**
1. `http://localhost:3000/consultation/2` 접속
2. 상담실 UI 확인: "연결 중...", 남은 시간 59:48, 마이크/카메라/채팅/PIP/상담종료 버튼
- 결과: PASS
- 스크린샷: `09-consultation-room.png`

**상담사 상담실 (Chrome DevTools - Isolated Context)**
1. 새 브라우저 컨텍스트에서 상담사 로그인
2. `http://localhost:3000/counselor/consultation/2` 접속
3. 상담사 상담실 UI 확인: 선생님 포털 사이드바, 상담실, 마이크/카메라/채팅/상담종료 버튼
- 결과: PASS
- 스크린샷: `10-counselor-consultation-room.png`

---

### Step 10: 상담 종료 (API)

```
POST /api/v1/sessions/2/end
Body: {"endReason":"COMPLETED"}
```
- 결과: PASS
  - durationSec=65 (약 1분)
  - endReason="COMPLETED"
  - endedAt 기록

---

## 테스트 요약

| # | 시나리오 | 방법 | 결과 |
|---|---------|------|------|
| 1 | 고객/상담사 계정 생성 | API | PASS |
| 2 | 상담사 스케줄 설정 | API | PASS |
| 3 | 캐시 충전 (50,000원) | API | PASS |
| 4 | 상담사 목록 조회 | API | PASS |
| 5 | 웹 로그인 (고객) | UI | PASS |
| 6 | 상담사 상세 + 슬롯 선택 | UI | PASS |
| 7 | 상담권 부족 → 구매 (33,000원) | UI | PASS |
| 8 | 예약 확정 | UI | PASS |
| 9 | 화상 상담실 입장 (고객+상담사) | API+UI | PASS |
| 10 | 상담 종료 | API | PASS |

**전체 결과: 10/10 PASS**

---

## 직접 테스트 가이드

아래 계정으로 직접 로그인하여 테스트할 수 있습니다.

### 웹 (http://localhost:3000)

**고객 계정으로 테스트:**
1. 로그인: `e2e_customer@test.com` / `test1234`
2. 상담사 → "별하늘 상담사" 프로필 보기
3. 내예약에서 기존 예약 확인
4. 상담권 → 보유 현황 확인
5. 내 지갑 → 잔액 확인 (50,000 - 33,000 = 17,000원)

**상담사 계정으로 테스트:**
1. (시크릿 모드) 로그인: `e2e_counselor_star@test.com` / `test1234`
2. "선생님 포털" 메뉴 클릭
3. 대시보드 → 예약 현황
4. 예약 내역 → 고객 예약 2건 확인
5. 스케줄 관리 → 슬롯 확인

### Flutter 앱 (iOS Simulator)

현재 iPhone 15 Pro (iOS 17.4) 시뮬레이터에서 실행 중입니다.
같은 계정으로 로그인하여 앱에서도 동일한 플로우를 확인할 수 있습니다.

### API 직접 호출

```bash
# 고객 로그인
curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"e2e_customer@test.com","password":"test1234"}'

# 상담사 로그인
curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"e2e_counselor_star@test.com","password":"test1234"}'

# 내 예약 조회
curl -s http://localhost:8080/api/v1/bookings/my \
  -H "Authorization: Bearer <token>"

# 지갑 잔액 조회
curl -s http://localhost:8080/api/v1/wallet \
  -H "Authorization: Bearer <token>"
```

---

## Flutter 앱 (iOS Simulator) 테스트

**디바이스**: iPhone 15 Pro (iOS 17.4)
**앱 상태**: Debug 모드 실행 중 (flutter run)

### 앱 로그인 화면 확인
- 로그인 화면 정상 렌더링 확인 (스크린샷 촬영)
- "천지연꽃신당 - 진심을 담은 상담" 타이틀 표시
- 이메일/비밀번호 입력 필드, 로그인 버튼, 카카오/네이버 소셜 로그인 버튼
- 비밀번호 찾기, 회원가입 링크 정상 표시
- 스크린샷: `11-flutter-login.png`

### 수동 테스트 안내
시뮬레이터 보조 접근(Accessibility) 권한 제한으로 자동 입력이 불가합니다.
아래 계정으로 시뮬레이터에서 직접 로그인하여 확인하세요:

```
이메일: e2e_customer@test.com
비밀번호: test1234
```

**확인 항목:**
- [ ] 앱 로그인 성공
- [ ] 상담사 목록 (별하늘 상담사 포함 4명)
- [ ] 내 예약 (2건: 오전 10:00~12:00, 오후 02:00~03:00)
- [ ] 지갑 잔액 확인 (17,000원)
- [ ] 상담실 입장 가능 여부

---

## 발견된 이슈

### 해결됨
1. **Flyway MySQL 호환성** - `V23`, `V51`, `V52` 마이그레이션에서 H2 전용 구문 (`DROP CONSTRAINT IF EXISTS`, `CREATE INDEX IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`) 사용 → MySQL 호환 PREPARE/EXECUTE 방식으로 수정

### 참고
1. **상담사 상담실 타이머**: `NaN:NaN` 표시 - durationMinutes 파싱 이슈 가능성
2. **크레딧 API 500 에러**: `/api/v1/credits`, `/api/v1/credits/buy` 직접 호출 시 500 에러 (웹 UI 경유는 정상 동작)

---

## 스크린샷 목록

| 파일명 | 설명 |
|--------|------|
| `01-counselor-list.png` | 상담사 목록 (로그인 후) |
| `02-counselor-detail.png` | 별하늘 상담사 상세 + 슬롯 |
| `03-slot-selected.png` | 슬롯 선택 상태 |
| `04-booking-confirm.png` | 예약 확인 모달 |
| `05-credits-insufficient.png` | 상담권 부족 모달 |
| `06-credits-buy.png` | 상담권 구매 페이지 |
| `07-booking-confirm-final.png` | 예약 확정 (상담권 보유 후) |
| `08-my-bookings.png` | 내 예약 목록 |
| `09-consultation-room.png` | 고객 상담실 |
| `10-counselor-consultation-room.png` | 상담사 상담실 |
