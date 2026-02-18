# PRD: 영상 상담 시스템 & 선생님 어드민

> **Version**: 1.0
> **Date**: 2026-02-17
> **Status**: Draft
> **Author**: Claude (Sendbird Calls 전문가 + IT 기획자 관점)

---

## 1. 배경 및 목표

### 1.1 현재 상태
- Sendbird Calls SDK 초기화, 인증, WebSocket 연결까지 구현 완료
- 백엔드에서 채널 생성, 토큰 발급, 유저 프로비저닝 동작 확인 (E2E 검증 완료)
- 고객 측 상담실 UI 기본 틀 존재 (`/consultation/[sessionId]`)
- `CounselorEntity.userId` 필드로 상담사-유저 계정 연결 가능

### 1.2 빠진 것
- 고객이 예약 시간에 방에 입장하는 플로우
- 상담사 전용 어드민 포털
- 양방향 영상통화 연결 (dial → accept)
- `calleeId` 매핑 (고객 ↔ 상담사)

### 1.3 목표
1. 고객이 예약 시간에 "입장" 버튼을 눌러 상담방에 들어갈 수 있다
2. 상담사가 전용 어드민에서 상담을 수락하고 영상통화를 진행할 수 있다
3. 양방향 영상/음성 통화가 Sendbird Calls로 동작한다

---

## 2. 통화 아키텍처 결정

### 2.1 Q: 누가 방을 만들고, 누가 들어가는가?

**결론: 고객이 Dial, 선생님이 Accept (Sendbird Calls 권장 패턴)**

#### 검토한 옵션

| 옵션 | 설명 | 장점 | 단점 |
|------|------|------|------|
| A. 고객이 방 생성, 선생님 입장 | 고객이 create + dial | 단순 | 선생님이 수동으로 찾아 들어가야 함 |
| B. 선생님이 방 생성, 고객 입장 | 선생님이 create, 고객 join | 선생님 주도 | 선생님이 잊으면 고객 대기, UX 나쁨 |
| **C. 채널 사전생성 + 고객 Dial + 선생님 Accept** | 채널은 예약확정 시 생성, 통화는 고객이 시작 | 최적 UX, 실패 복구 용이 | 구현 복잡도 중간 |

#### 옵션 C 선택 이유 (Sendbird Calls 전문가 관점)

1. **Sendbird Calls의 본질은 Direct Call**
   - Sendbird Calls는 "방(room)" 개념이 아닌 **1:1 Direct Call** 모델
   - 한 쪽이 `dial()`, 상대방이 `onRinging` → `accept()` 하는 구조
   - Group Channel(채팅방)과 Direct Call(영상통화)은 별개 기능

2. **채널(채팅)과 통화(영상)를 분리**
   - 채팅 채널: 예약 확정 시 사전 생성 (이미 구현됨)
   - 영상통화: 고객이 "상담 시작" 클릭 시 `dial()` → 선생님 `accept()`
   - 채팅은 통화 전후에도 사용 가능 (사전 질문, 사후 메모)

3. **선생님이 온라인 상태여야만 통화 가능**
   - 선생님이 어드민 대시보드에 접속 → Sendbird 인증 → WebSocket 연결
   - 이 상태에서만 `onRinging` 이벤트 수신 가능
   - 선생님이 오프라인이면 고객에게 "선생님이 아직 준비 중" 안내

4. **실패 복구가 자연스러움**
   - 통화 끊김 → 고객이 다시 "재연결" 클릭 → re-dial
   - 선생님 측도 re-accept 가능
   - 기존 reconnect 로직과 호환

### 2.2 통화 시퀀스 다이어그램

```
시간축 →

[예약 확정 시]
  백엔드 ──→ Sendbird API: createGroupChannel("consultation-{bookingId}")
  백엔드 ──→ Sendbird API: createUser(customerId), createUser(counselorId)

[상담 시간 도래]
  고객: 마이페이지 → "입장" 클릭
  │
  ├─→ POST /api/v1/sessions/{bookingId}/start (세션 시작)
  ├─→ POST /api/v1/sessions/{bookingId}/token (토큰 + calleeId 발급)
  │
  ├─→ SendBirdCall.init(appId)
  ├─→ SendBirdCall.authenticate(customerToken)
  ├─→ SendBirdCall.connectWebSocket()
  │
  └─→ SendBirdCall.dial({ userId: counselorSendbirdId, isVideoCall: true })
         │
         │  ← Sendbird Server →
         ▼
  선생님: 어드민 대시보드 (이미 인증 + WebSocket 연결 상태)
  │
  ├─→ onRinging(call) 이벤트 수신
  ├─→ 화면에 "OOO 고객님 상담 요청" 알림 표시
  └─→ call.accept({ callOption }) 클릭
         │
         ▼
  [양방향 영상통화 연결 완료]
  │
  ├─→ call.onConnected: 타이머 시작, UI 활성화
  │
  [상담 종료]
  ├─→ 어느 쪽이든 "상담 종료" 클릭
  ├─→ call.end()
  └─→ POST /api/v1/sessions/{id}/end (세션 종료, duration 기록)
```

---

## 3. 고객 측 변경사항

### 3.1 마이페이지 예약 내역 개선

**현재**: 예약 목록에 "취소" 버튼만 존재
**변경**: 예약 시간 조건에 따라 "입장" 버튼 추가

#### 입장 버튼 표시 조건

```
예약 상태 === 'CONFIRMED' (결제 완료)
AND 현재 시각 >= 예약 시작시간 - 5분
AND 현재 시각 <= 예약 종료시간 + 10분
```

#### UI 상태

| 조건 | 표시 | 동작 |
|------|------|------|
| 예약 시간 5분+ 전 | `예약 확정 (N분 후 입장 가능)` | 비활성 |
| 예약 시간 5분 전 ~ 시작 | `입장 가능 (대기실)` | 클릭 → `/consultation/{sessionId}` |
| 예약 시간 중 | `상담 중 (입장하기)` | 클릭 → `/consultation/{sessionId}` |
| 예약 종료 + 10분 후 | `상담 종료` | 비활성 |

#### 입장 버튼 클릭 시

1. `POST /api/v1/sessions/{bookingId}/start` (세션 시작, 이미 시작됐으면 기존 세션 반환)
2. `/consultation/{sessionId}` 페이지로 이동

### 3.2 상담실 페이지 개선 (`/consultation/[sessionId]`)

**변경 사항:**

1. **calleeId 추가**: 백엔드에서 받은 상담사의 Sendbird userId로 `dial()` 호출
2. **선생님 온라인 상태 표시**: 선생님이 아직 접속 안 했으면 "선생님 접속 대기 중" 표시
3. **Ringing 상태 표시**: dial 후 선생님이 accept 할 때까지 "선생님 호출 중..." 표시
4. **통화 품질 표시**: 연결 후 네트워크 상태 인디케이터
5. **타이머 수정**: `NaN:NaN` 버그 수정 (세션 데이터에 `durationMinutes` 필드 추가 필요)

---

## 4. 선생님 어드민 포털

### 4.1 접근 경로

- URL: `/counselor` (기존 `/admin`은 운영자용으로 유지)
- 로그인: 기존 유저 계정 + `COUNSELOR` role 검증
- `CounselorEntity.userId`로 유저 ↔ 상담사 매핑

### 4.2 메뉴 구성

| # | 메뉴 | 경로 | 설명 |
|---|------|------|------|
| 1 | **대시보드** | `/counselor` | 오늘의 상담 일정, 실시간 알림, 통계 |
| 2 | **상담실** | `/counselor/room` | 영상통화 수신/진행 화면 |
| 3 | **예약 내역** | `/counselor/bookings` | 전체 예약 목록, 필터, 상태 관리 |
| 4 | **정산** | `/counselor/settlement` | 수입 내역, 정산 주기, 출금 요청 |
| 5 | **고객 관리** | `/counselor/customers` | 고객 목록, 상담 이력, 메모 |
| 6 | **스케줄 관리** | `/counselor/schedule` | 상담 가능 시간대 설정, 휴무일 관리 |
| 7 | **리뷰 관리** | `/counselor/reviews` | 받은 리뷰 확인, 답변 작성 |
| 8 | **상담 기록** | `/counselor/records` | 과거 상담 녹화/메모, 통화 시간 통계 |
| 9 | **프로필 설정** | `/counselor/profile` | 소개글, 전문 분야, 프로필 사진 수정 |

### 4.3 대시보드 상세

```
┌─────────────────────────────────────────────────────────────┐
│  🪷 천지연꽃신당 선생님 포털          연화당 선생님  [로그아웃] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📊 오늘의 요약                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ 오늘 상담  │ │ 완료     │ │ 대기 중   │ │ 오늘 수입  │       │
│  │   5건     │ │   2건    │ │   3건    │ │ 250,000원 │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                             │
│  📋 다음 상담                                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 14:00 ~ 14:30  |  김OO 고객  |  연애/재회           │   │
│  │ [입장 준비] ← 시간 되면 활성화                        │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ 15:00 ~ 15:30  |  이OO 고객  |  진로 상담           │   │
│  │ [대기 중]                                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  🔔 실시간 알림                                              │
│  • 14:00 김OO 고객님이 상담방에 입장했습니다 [수락하기]        │
│  • 13:55 다음 상담 5분 전입니다                              │
│                                                             │
│  📈 이번 주 통계                                             │
│  총 상담: 24건 | 평균 시간: 28분 | 평점: 4.8 | 수입: 1.2M    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.4 상담실 상세

**선생님 상담실은 두 가지 모드로 동작:**

#### 대기 모드 (기본)
- Sendbird 인증 + WebSocket 연결 유지
- `onRinging` 이벤트 리스너 등록
- 오늘 남은 예약 목록 표시
- 온라인 상태 표시 (고객에게도 보임)

#### 통화 모드 (고객이 dial 했을 때)
- `onRinging` 수신 → 팝업 알림: "OOO 고객님 상담 요청"
- "수락" 클릭 → `call.accept()` → 영상통화 시작
- "거절" 클릭 → `call.end()` (예외적 상황에서만)
- 통화 중: 비디오 영역, 마이크/카메라 토글, 타이머, 상담 종료 버튼

```
┌─────────────────────────────────────────────────────────────┐
│  상담실                                          🟢 온라인   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────┐  ┌──────────────────────┐        │
│  │                      │  │                      │        │
│  │     고객 영상         │  │     내 영상           │        │
│  │     (상대방)          │  │     (선생님)          │        │
│  │                      │  │                      │        │
│  └──────────────────────┘  └──────────────────────┘        │
│                                                             │
│  ┌─ 상담 정보 ──────────────────────────────────────────┐   │
│  │ 고객: 김OO | 분야: 연애/재회 | 남은 시간: 24:35      │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                             │
│  [🎤 마이크] [📹 카메라] [📝 메모] [🔴 상담 종료]           │
│                                                             │
│  ┌─ 상담 메모 ──────────────────────────────────────────┐   │
│  │ (이 상담에 대한 선생님 메모를 입력하세요...)           │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 호출 수신 팝업 (대시보드 또는 상담실 어디에서든)

```
┌────────────────────────────────────┐
│  📞 상담 요청                       │
│                                    │
│  김OO 고객님이 상담을 요청합니다     │
│  예약: 14:00 ~ 14:30 (연애/재회)   │
│                                    │
│  [ 수락하기 ]     [ 잠시 후 ]       │
└────────────────────────────────────┘
```

---

## 5. 백엔드 변경사항

### 5.1 API 신규/변경

#### 신규 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/v1/counselor/me` | 현재 로그인한 상담사 정보 |
| GET | `/api/v1/counselor/bookings` | 상담사의 예약 목록 (필터: 날짜, 상태) |
| GET | `/api/v1/counselor/bookings/today` | 오늘 예약 목록 |
| GET | `/api/v1/counselor/dashboard` | 대시보드 통계 (오늘 상담수, 수입, 평점) |
| GET | `/api/v1/counselor/customers` | 상담사의 고객 목록 (상담 이력 포함) |
| GET | `/api/v1/counselor/settlement` | 정산 내역 |
| POST | `/api/v1/counselor/settlement/request` | 출금 요청 |
| GET | `/api/v1/counselor/records` | 상담 기록 목록 |
| POST | `/api/v1/counselor/records/{sessionId}/memo` | 상담 메모 저장 |
| PUT | `/api/v1/counselor/profile` | 프로필 수정 |
| PUT | `/api/v1/counselor/schedule` | 스케줄 수정 |
| GET | `/api/v1/counselor/reviews` | 받은 리뷰 목록 |
| POST | `/api/v1/counselor/reviews/{id}/reply` | 리뷰 답변 |

#### 변경 엔드포인트

| Method | Path | 변경 내용 |
|--------|------|----------|
| POST | `/api/v1/sessions/{bookingId}/start` | 멱등성 추가 (이미 시작된 세션이면 기존 세션 반환) |
| POST | `/api/v1/sessions/{bookingId}/token` | `calleeId` 필드 추가 (고객→상담사 Sendbird userId) |
| POST | `/api/v1/sessions/{bookingId}/counselor-token` | 신규: 상담사용 토큰 (calleeId = 고객 Sendbird userId) |

### 5.2 SessionTokenResponse 변경

```java
public record SessionTokenResponse(
    String token,            // legacy
    String sendbirdToken,    // Sendbird 인증 토큰
    String sendbirdUserId,   // 본인의 Sendbird user ID
    String sendbirdAppId,    // Sendbird App ID
    String calleeId,         // 상대방의 Sendbird user ID (NEW)
    String channelUrl,       // 채팅 채널 URL (NEW)
    String calleeName,       // 상대방 이름 (NEW)
    Integer durationMinutes  // 상담 시간 (분) (NEW)
) {}
```

#### 토큰 발급 로직

| 요청자 | sendbirdUserId | calleeId | 설명 |
|--------|---------------|----------|------|
| 고객 | `"user_{userId}"` | `"counselor_{counselorId}"` | 고객이 상담사에게 dial |
| 상담사 | `"counselor_{counselorId}"` | `"user_{userId}"` | 상담사 측 token (수신용) |

### 5.3 Sendbird 유저 ID 규칙 변경

**현재**: userId를 그대로 사용 (`"1"`, `"2"`)
**변경**: prefix 추가로 충돌 방지

- 고객: `user_{userId}` (예: `user_1`)
- 상담사: `counselor_{counselorId}` (예: `counselor_1`)

### 5.4 세션 시작 멱등성

```java
public ConsultationSessionEntity startSession(Long reservationId) {
    // 이미 세션이 존재하면 기존 세션 반환 (멱등성)
    Optional<ConsultationSessionEntity> existing =
        sessionRepository.findByReservationId(reservationId);
    if (existing.isPresent()) {
        return existing.get();
    }

    // 새 세션 생성 (기존 로직)
    ...
}
```

### 5.5 새 테이블

#### `counselor_settlement` (정산)

```sql
CREATE TABLE counselor_settlement (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    counselor_id BIGINT NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_sessions INT DEFAULT 0,
    total_amount BIGINT DEFAULT 0,
    commission_rate DECIMAL(5,2) DEFAULT 20.00,
    net_amount BIGINT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'PENDING',
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `consultation_memo` (상담 메모)

```sql
CREATE TABLE consultation_memo (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id BIGINT NOT NULL,
    counselor_id BIGINT NOT NULL,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5.6 UserEntity role 확장

```java
public enum Role {
    USER,
    COUNSELOR,  // 신규
    ADMIN
}
```

상담사 계정 생성 흐름:
1. 일반 회원가입 (`role = USER`)
2. 관리자가 `COUNSELOR` role 부여 + `CounselorEntity` 생성 + `userId` 매핑

---

## 6. 프론트엔드 변경사항

### 6.1 고객 측

| 파일 | 변경 |
|------|------|
| `/bookings/me/page.tsx` | 입장 버튼 추가 (시간 조건부), 타이머 카운트다운 |
| `/consultation/[sessionId]/page.tsx` | calleeId로 dial(), 선생님 상태 표시, 타이머 버그 수정 |
| `components/api-client.ts` | `startSession()` 멱등 호출 추가 |

### 6.2 선생님 포털 (신규)

| 파일 | 설명 |
|------|------|
| `/counselor/layout.tsx` | 선생님 포털 레이아웃 (사이드바 + 헤더) |
| `/counselor/page.tsx` | 대시보드 |
| `/counselor/room/page.tsx` | 상담실 (Sendbird 수신 대기 + 통화) |
| `/counselor/bookings/page.tsx` | 예약 내역 |
| `/counselor/settlement/page.tsx` | 정산 |
| `/counselor/customers/page.tsx` | 고객 관리 |
| `/counselor/schedule/page.tsx` | 스케줄 관리 |
| `/counselor/reviews/page.tsx` | 리뷰 관리 |
| `/counselor/records/page.tsx` | 상담 기록 |
| `/counselor/profile/page.tsx` | 프로필 설정 |
| `components/counselor-auth.tsx` | 상담사 role guard |
| `components/call-notification.tsx` | 호출 수신 팝업 컴포넌트 |

---

## 7. Sendbird 연동 상세

### 7.1 유저 프로비저닝 타이밍

| 시점 | 동작 |
|------|------|
| 관리자가 상담사 등록 | `createUser("counselor_{id}", counselorName)` |
| 고객 첫 예약 확정 | `createUser("user_{userId}", userName)` |
| 세션 시작 | 유저 존재 확인 (이미 있으면 skip) |

### 7.2 선생님 WebSocket 연결 관리

```
선생님 어드민 진입 시:
  1. POST /api/v1/sessions/counselor-auth → sendbirdToken 발급
  2. SendBirdCall.init(appId)
  3. SendBirdCall.authenticate({ userId: "counselor_{id}", accessToken })
  4. SendBirdCall.connectWebSocket()
  5. SendBirdCall.addListener('counselor-listener', { onRinging: ... })

선생님 어드민 이탈 시:
  1. SendBirdCall.removeListener('counselor-listener')
  2. SendBirdCall.disconnectWebSocket()
```

### 7.3 통화 실패 처리

| 상황 | 고객 측 | 선생님 측 |
|------|--------|----------|
| 선생님 오프라인 | "선생님이 아직 준비 중입니다. 잠시 후 다시 시도해주세요." | - |
| 선생님 미응답 (30초) | "선생님이 응답하지 않습니다. 다시 시도하시겠습니까?" | 부재중 알림 |
| 네트워크 끊김 | 자동 재연결 (3회 시도, exponential backoff) | 자동 재연결 |
| 고객 이탈 | - | "고객이 상담을 종료했습니다" |
| 시간 초과 | "상담 시간이 종료되었습니다" | "상담 시간이 종료되었습니다" |

### 7.4 Sendbird Calls vs Group Call 선택

**Direct Call (1:1) 선택 이유:**
- 천지연꽃신당은 1:1 상담 플랫폼
- Direct Call이 지연시간 최소, 품질 최고
- Group Call은 3인 이상에 적합 (현재 불필요)
- Direct Call은 ringing/accept 흐름이 자연스러움

---

## 8. 구현 우선순위

### Phase 1: 핵심 통화 연결 (1주)
1. 백엔드: `calleeId` 추가, Sendbird userId prefix, 세션 멱등성
2. 프론트: 마이페이지 입장 버튼, 상담실 dial 로직 수정
3. 프론트: 선생님 상담실 페이지 (수신 대기 + accept)
4. 통합 테스트: 실제 양방향 통화 확인

### Phase 2: 선생님 어드민 기본 (1주)
5. 백엔드: 상담사 API (`/counselor/*`)
6. 프론트: 선생님 포털 레이아웃 + 대시보드
7. 프론트: 예약 내역 페이지
8. 프론트: 상담실 통합 (대시보드에서 호출 수신)

### Phase 3: 선생님 어드민 확장 (1주)
9. 정산 시스템 (테이블 + API + UI)
10. 고객 관리 + 상담 기록
11. 스케줄 관리 (가능 시간대 CRUD)
12. 리뷰 관리 + 답변

### Phase 4: 안정화 (3일)
13. 통화 품질 모니터링
14. 에러 핸들링 강화
15. E2E 테스트 추가
16. 프로필 설정

---

## 9. 기술적 고려사항

### 9.1 보안
- 상담사 토큰은 `COUNSELOR` role 검증 필수
- 상담사는 자신의 예약만 조회 가능
- Sendbird 토큰은 세션당 1회 발급, 만료 시간 설정

### 9.2 성능
- 선생님 WebSocket은 어드민 진입 시 1회 연결, 페이지 이동해도 유지
- 대시보드 데이터는 30초 polling 또는 SSE로 실시간 갱신

### 9.3 모바일 대응
- 선생님 어드민은 데스크톱 우선 (태블릿 호환)
- 고객 상담실은 모바일 반응형 필수
- Flutter 앱에도 동일 통화 플로우 적용 가능 (Sendbird Calls Flutter SDK 존재)

---

## 10. 성공 지표

| 지표 | 목표 |
|------|------|
| 통화 연결 성공률 | > 95% |
| 평균 연결 시간 (dial → connected) | < 5초 |
| 상담사 응답률 | > 90% |
| 통화 중 끊김률 | < 3% |
| 고객 상담 만족도 | > 4.5/5.0 |
