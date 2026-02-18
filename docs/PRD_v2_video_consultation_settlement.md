# PRD v2.0: 화상 상담 정산 시스템 & Zoom급 통화 경험

> **Version**: 2.0
> **Date**: 2026-02-17
> **Status**: Draft → Sprint Planning
> **Author**: Claude (Agile 기획자 + Sendbird Calls 전문가)
> **선행 문서**: `docs/PRD_video_consultation.md` (v1.0)

---

## 1. 배경 및 현황 분석

### 1.1 구현 완료 (v1.0 결과물)

| 영역 | 상태 | 상세 |
|------|------|------|
| Sendbird Calls SDK 초기화 | ✅ | 고객/상담사 양측 인증, WebSocket 연결 |
| 고객 상담실 UI | ✅ | 526줄, dial/reconnect/timer/video toggle |
| 상담사 대기실 UI | ✅ | 552줄, 오늘 예약 목록, 수신 팝업, 메모 |
| Pre-flight 장비 체크 | ✅ | 카메라/마이크/네트워크 품질 검사 |
| 세션 타이머 | ✅ | 카운트다운, 5분 경고, 만료 자동 종료 |
| 크레딧 구매 | ✅ | 지갑 → 크레딧 변환 (30분 단위) |
| 크레딧 예약 | ✅ | 예약 생성 시 `reserveCredits()` |
| 크레딧 해제 | ✅ | 예약 취소 시 `releaseCredits()` |
| 세션 자동 종료 | ✅ | 60분 초과 세션 자동 종료 스케줄러 |
| 상담사 포털 기본 | ✅ | 9개 메뉴 페이지 레이아웃 존재 |

### 1.2 미구현 (Critical Gap)

| # | Gap | 영향도 | 설명 |
|---|-----|--------|------|
| G1 | **크레딧 정산/소모** | 🔴 Critical | 세션 종료 시 예약된 크레딧을 "소모 완료"로 전환하는 로직 없음 |
| G2 | **시간 기반 과금** | 🔴 Critical | `durationSec` 기록만 하고 실제 과금에 미사용 |
| G3 | **정산 감사 로그** | 🟡 High | 크레딧 소모 이력 기록 없음 |
| G4 | **상담사 정산 백엔드** | 🟡 High | UI 존재하나 실제 정산 API 미구현 |
| G5 | **상담 메모 저장** | 🟡 High | 상담사 메모 입력 UI 존재하나 저장 API 없음 |
| G6 | **통화 품질 모니터링** | 🟢 Medium | 실시간 bitrate/latency 미표시 |
| G7 | **Flutter 영상 SDK** | 🟢 Medium | 상담실 UI 존재하나 실제 Sendbird Calls SDK 미연동 |
| G8 | **텍스트 채팅** | 🟢 Medium | 영상통화 중 텍스트 채팅 미구현 |
| G9 | **통화 녹화** | 🟢 Medium | 녹화 기능 없음 |
| G10 | **운영자 모니터링 대시보드** | 🟢 Medium | 실시간 통화 현황 미구현 |

### 1.3 PRD v2.0 목표

> **"카카오톡 보이스톡/Zoom 수준의 사용자 경험 + 운영/정산 자동화"**

1. 세션 종료 시 크레딧이 자동 정산되고, 사용자에게 소모 내역이 표시된다
2. 고객은 Zoom처럼 자연스러운 화상통화 경험을 한다 (장비 체크 → 통화 → 종료 → 리뷰)
3. 상담사는 전문적인 어드민에서 상담/정산/고객을 관리한다
4. 운영자는 실시간으로 통화 현황과 정산을 모니터링한다
5. Flutter 앱에서도 동일한 화상통화가 가능하다

---

## 2. 유저 스토리 맵

### 2.1 고객 Journey

```
[크레딧 구매] → [상담사 선택] → [예약] → [입장] → [장비체크] → [통화] → [종료] → [리뷰] → [내역확인]
     ✅            ✅           ✅       ✅        ✅         ✅       ⚠️       ✅        ⚠️
```

| ID | As a 고객 | I want to | So that | 상태 |
|----|-----------|-----------|---------|------|
| U1 | 상담 종료 후 | 소모된 크레딧과 남은 크레딧을 즉시 확인 | 투명한 과금을 신뢰 | ❌ NEW |
| U2 | 상담 중 | 남은 시간을 실시간으로 확인 | 시간 관리 가능 | ✅ 구현됨 |
| U3 | 상담 중 | 텍스트 채팅으로 URL/텍스트 전송 | 구두 전달이 어려운 정보 공유 | ❌ NEW |
| U4 | 상담 후 | 상담 요약과 메모를 확인 | 상담 내용 복습 | ❌ NEW |
| U5 | 통화 품질 문제 시 | 자동 재연결 + 상태 표시 | 불안 없이 대기 | ✅ 구현됨 |
| U6 | 크레딧 부족 시 | 상담 중 크레딧 추가 구매 | 상담 연장 가능 | ❌ NEW |
| U7 | 상담 이력 조회 시 | 날짜/상담사별 필터링 + 크레딧 소모 내역 | 이용 내역 추적 | ❌ NEW |

### 2.2 상담사 Journey

```
[로그인] → [대기실 입장] → [호출 수신] → [수락] → [상담 진행] → [메모 작성] → [종료] → [정산 확인]
   ✅          ✅            ✅         ✅         ✅          ⚠️         ✅        ⚠️
```

| ID | As a 상담사 | I want to | So that | 상태 |
|----|------------|-----------|---------|------|
| C1 | 상담 종료 후 | 자동으로 정산 금액이 계산 | 수동 계산 불필요 | ❌ NEW |
| C2 | 상담 중 | 메모를 작성하고 저장 | 고객별 상담 이력 관리 | ⚠️ UI만 |
| C3 | 정산 페이지에서 | 기간별 수입/수수료/순수입을 확인 | 재무 관리 | ⚠️ UI만 |
| C4 | 상담 중 | 화면 공유 | 자료 보여주기 | ❌ NEW |
| C5 | 고객 관리에서 | 고객별 상담 횟수/총 시간/메모 조회 | 맞춤 상담 | ⚠️ UI만 |
| C6 | 상담 종료 후 | 고객에게 후속 메시지 전송 | 고객 관계 관리 | ❌ NEW |

### 2.3 운영자 Journey

| ID | As a 운영자 | I want to | So that | 상태 |
|----|------------|-----------|---------|------|
| A1 | 대시보드에서 | 실시간 통화 현황 (진행 중 세션 수, 대기 중 상담사) 확인 | 운영 상태 파악 | ❌ NEW |
| A2 | 정산 관리에서 | 상담사별 정산 승인/지급 처리 | 정산 운영 | ❌ NEW |
| A3 | 분쟁 발생 시 | 세션 로그/통화 기록 조회 | 분쟁 해결 근거 확보 | ⚠️ 부분 |

---

## 3. 크레딧 정산 시스템 (핵심 Gap 해결)

### 3.1 크레딧 생명주기

```
[구매]          [예약]           [소모 확정]        [만료]
  │               │                │                 │
  ▼               ▼                ▼                 ▼
AVAILABLE ──→ RESERVED ──→ CONSUMED          EXPIRED
                  │                              ▲
                  └──── (취소) ──→ RELEASED ──────┘
                                     │
                                     └──→ AVAILABLE (잔액 복원)
```

### 3.2 정산 로직 상세

#### 3.2.1 세션 종료 시 크레딧 소모 확정

```
[세션 종료 트리거]
  │
  ├─ endReason = NORMAL (정상 종료)
  │   └─→ 예약된 크레딧 전량 소모 확정
  │
  ├─ endReason = TIMEOUT (시간 초과)
  │   └─→ 예약된 크레딧 전량 소모 확정
  │
  ├─ endReason = NETWORK (네트워크 문제)
  │   └─→ 실제 통화 시간 기준으로 정산
  │       ├─ 10분 미만: 크레딧 전량 환불
  │       ├─ 10분 이상: 사용 시간에 비례하여 소모
  │       └─ 환불분은 RELEASED → AVAILABLE
  │
  └─ endReason = ADMIN (관리자 강제 종료)
      └─→ 크레딧 전량 환불 (고객 보호)
```

#### 3.2.2 시간 비례 정산 공식

```
단위 = 30분 (1 credit = 30분)

소모_크레딧 = ceil(실제_통화_분 / 30)

예시:
  - 예약: 2크레딧 (60분), 실제 통화: 45분 → 소모 2크레딧 (30분 단위 올림)
  - 예약: 2크레딧 (60분), 실제 통화: 25분 → 소모 1크레딧
  - 예약: 1크레딧 (30분), 실제 통화: 30분 → 소모 1크레딧
  - 네트워크 문제로 8분 통화 → 소모 0크레딧 (전량 환불)
```

#### 3.2.3 DB 스키마 변경

```sql
-- V27: 크레딧 정산 상태 추가
ALTER TABLE credit_usage_log ADD COLUMN status VARCHAR(20) DEFAULT 'RESERVED';
-- status: RESERVED → CONSUMED | RELEASED | PARTIAL_REFUND

ALTER TABLE credit_usage_log ADD COLUMN consumed_at TIMESTAMP NULL;
ALTER TABLE credit_usage_log ADD COLUMN actual_minutes INT NULL;
ALTER TABLE credit_usage_log ADD COLUMN refunded_units INT DEFAULT 0;

-- V28: 정산 이력 테이블
CREATE TABLE settlement_transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id BIGINT NOT NULL,
    booking_id BIGINT NOT NULL,
    customer_id BIGINT NOT NULL,
    counselor_id BIGINT NOT NULL,
    credits_reserved INT NOT NULL,
    credits_consumed INT NOT NULL,
    credits_refunded INT NOT NULL,
    actual_duration_sec INT NOT NULL,
    settlement_type VARCHAR(20) NOT NULL,  -- NORMAL, TIMEOUT, NETWORK_PARTIAL, NETWORK_FULL_REFUND, ADMIN_REFUND
    counselor_earning BIGINT NOT NULL,     -- 상담사 수입 (원)
    platform_fee BIGINT NOT NULL,          -- 플랫폼 수수료 (원)
    commission_rate DECIMAL(5,2) NOT NULL, -- 수수료율
    settled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_st_session FOREIGN KEY (session_id) REFERENCES consultation_sessions(id),
    CONSTRAINT fk_st_booking FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

-- V29: 상담사 정산 주기 테이블
CREATE TABLE counselor_settlements (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    counselor_id BIGINT NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_sessions INT DEFAULT 0,
    total_duration_min INT DEFAULT 0,
    gross_amount BIGINT DEFAULT 0,        -- 총 매출
    commission_amount BIGINT DEFAULT 0,   -- 수수료
    net_amount BIGINT DEFAULT 0,          -- 순수입
    commission_rate DECIMAL(5,2) DEFAULT 20.00,
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING → CONFIRMED → PAID
    confirmed_at TIMESTAMP NULL,
    paid_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cs_counselor FOREIGN KEY (counselor_id) REFERENCES counselors(id)
);

-- V30: 상담 메모 테이블
CREATE TABLE consultation_memos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id BIGINT NOT NULL,
    counselor_id BIGINT NOT NULL,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cm_session FOREIGN KEY (session_id) REFERENCES consultation_sessions(id),
    CONSTRAINT fk_cm_counselor FOREIGN KEY (counselor_id) REFERENCES counselors(id),
    CONSTRAINT uq_cm_session UNIQUE (session_id)
);
```

### 3.3 정산 API

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/v1/sessions/{id}/settle` | 세션 종료 시 크레딧 정산 (내부 호출) |
| GET | `/api/v1/settlements/my` | 고객: 내 정산 이력 |
| GET | `/api/v1/counselor/settlements` | 상담사: 정산 요약 (기간별) |
| GET | `/api/v1/counselor/settlements/{id}` | 상담사: 정산 상세 |
| GET | `/api/v1/admin/settlements` | 운영자: 전체 정산 목록 |
| POST | `/api/v1/admin/settlements/{id}/confirm` | 운영자: 정산 확정 |
| POST | `/api/v1/admin/settlements/{id}/pay` | 운영자: 지급 처리 |

### 3.4 정산 시퀀스

```
[세션 종료 호출]
     │
     ▼
ConsultationSessionService.endSession(sessionId, endReason)
     │
     ├─ 1. 세션 종료 처리 (endedAt, durationSec, endReason 기록)
     ├─ 2. Sendbird 채널 삭제
     │
     └─ 3. SettlementService.settleSession(session) ← NEW
            │
            ├─ a. 통화 시간 계산 (durationSec → minutes)
            ├─ b. 정산 유형 결정 (endReason 기반)
            ├─ c. 소모 크레딧 계산
            │     ├─ NORMAL/TIMEOUT: 예약 전량 소모
            │     ├─ NETWORK (<10분): 전량 환불
            │     ├─ NETWORK (≥10분): ceil(실제분/30) 소모
            │     └─ ADMIN: 전량 환불
            │
            ├─ d. credit_usage_log 상태 업데이트
            │     ├─ status → CONSUMED / RELEASED / PARTIAL_REFUND
            │     ├─ consumed_at → now
            │     └─ actual_minutes → 실제 통화 분
            │
            ├─ e. 환불분 크레딧 복원
            │     └─ consultation_credits.remaining_units += refunded_units
            │
            ├─ f. settlement_transactions 기록
            │     ├─ credits_consumed, credits_refunded
            │     ├─ counselor_earning = 크레딧단가 × consumed × (1 - commission_rate)
            │     └─ platform_fee = 크레딧단가 × consumed × commission_rate
            │
            └─ g. 상담사 정산 주기에 합산
                  └─ counselor_settlements의 현재 정산 기간에 누적
```

---

## 4. Zoom급 화상통화 경험 설계

### 4.1 고객 통화 플로우 (As-Is → To-Be)

#### As-Is (현재)
```
예약 목록 → 입장 → [장비체크] → 통화 → 종료 → (끝)
```

#### To-Be (목표)
```
예약 목록 → 입장 → [장비체크] → 대기실 → 통화 → 종료 → 정산확인 → 리뷰 → 이력
                                  │
                                  ├─ 상담사 접속 상태 표시
                                  ├─ 예상 대기 시간
                                  └─ 텍스트 채팅 (사전 질문)
```

### 4.2 통화 중 기능 (Zoom 벤치마크)

| 기능 | Zoom | 카카오톡 | 현재 | 목표 | 우선순위 |
|------|------|---------|------|------|---------|
| 영상/음성 토글 | ✅ | ✅ | ✅ | ✅ | - |
| 자기 화면 미러링 | ✅ | ✅ | ✅ | ✅ | - |
| 남은 시간 표시 | ❌ | ❌ | ✅ | ✅ | - |
| 텍스트 채팅 | ✅ | ✅ | ❌ | ✅ | P1 |
| 화면 공유 | ✅ | ❌ | ❌ | ✅ | P2 |
| 네트워크 품질 표시 | ✅ | ✅ | ❌ | ✅ | P1 |
| 재연결 자동화 | ✅ | ✅ | ✅ | ✅ | - |
| 배경 블러/교체 | ✅ | ❌ | ❌ | ❌ | P3 (향후) |
| 녹화 | ✅ | ❌ | ❌ | ❌ | P3 (향후) |
| PIP (Picture-in-Picture) | ✅ | ✅ | ❌ | ✅ | P2 |
| 크레딧 잔액 표시 | N/A | N/A | ❌ | ✅ | P1 |
| 연장 요청 | N/A | N/A | ❌ | ✅ | P2 |

### 4.3 텍스트 채팅 설계 (P1)

```
┌─────────────────────────────────────────┐
│ [영상 통화 영역]                          │
│  ┌────────────┐  ┌────────────┐        │
│  │ 상대방 영상  │  │ 내 영상     │        │
│  └────────────┘  └────────────┘        │
│                                         │
│  남은 시간: 24:35  |  크레딧: 1/2 소모 중  │
│                                         │
│  ┌─ 채팅 ──────────────────────────────┐│
│  │ 상담사: 네, 그 부분은 이렇게 보시면... │ │
│  │ 나: 감사합니다. 이 링크 확인해주세요   │ │
│  │ 나: https://example.com              │ │
│  │                                      │ │
│  │ [메시지 입력...]            [전송]    │ │
│  └──────────────────────────────────────┘│
│                                         │
│  [🎤] [📹] [💬 채팅] [📊 품질] [🔴 종료] │
└─────────────────────────────────────────┘
```

**구현 방식**: Sendbird Chat SDK (Group Channel)
- 세션 시작 시 이미 생성된 `consultation-{bookingId}` 채널 활용
- 영상통화 = Sendbird Calls (Direct Call)
- 텍스트 = Sendbird Chat (Group Channel) — 동시 사용

### 4.4 네트워크 품질 표시 (P1)

```
연결 상태: ████░ 양호 (지연: 45ms)

지표:
- 🟢 양호: RTT < 100ms, 패킷 손실 < 1%
- 🟡 보통: RTT 100-300ms, 패킷 손실 1-5%
- 🔴 불량: RTT > 300ms, 패킷 손실 > 5%
```

**데이터 소스**: Sendbird Calls SDK의 `call.getLocalMediaStats()` / WebRTC `getStats()` API

### 4.5 세션 종료 화면 (NEW)

```
┌─────────────────────────────────────────┐
│                                         │
│          상담이 종료되었습니다             │
│                                         │
│  ┌──────────────────────────────────┐   │
│  │ 상담사: 연화당 선생님              │   │
│  │ 상담 시간: 28분 35초              │   │
│  │ 소모 크레딧: 1 (30분권)           │   │
│  │ 남은 크레딧: 1                    │   │
│  │                                  │   │
│  │ 정산 내역                         │   │
│  │ ├─ 예약 크레딧: 2                 │   │
│  │ ├─ 사용 크레딧: 1 (28분)          │   │
│  │ └─ 환불 크레딧: 1 → 잔액 복원     │   │
│  └──────────────────────────────────┘   │
│                                         │
│  [⭐ 리뷰 작성하기]    [📋 이력 보기]     │
│                                         │
└─────────────────────────────────────────┘
```

---

## 5. 상담사 포털 고도화

### 5.1 정산 페이지 백엔드 연동

#### 정산 대시보드

```
┌─────────────────────────────────────────────────────┐
│  정산 관리                                            │
├─────────────────────────────────────────────────────┤
│                                                      │
│  이번 달 요약 (2026년 2월)                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐│
│  │ 총 상담    │ │ 총 시간    │ │ 총 매출    │ │ 순수입    ││
│  │  18건     │ │  9시간    │ │ 594,000원 │ │ 475,200원 ││
│  │          │ │          │ │          │ │ (80%)    ││
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘│
│                                                      │
│  정산 내역                                            │
│  ┌─────┬──────┬──────┬────────┬────────┬──────────┐ │
│  │ 날짜 │ 고객  │ 시간  │ 매출    │ 수수료  │ 순수입   │ │
│  ├─────┼──────┼──────┼────────┼────────┼──────────┤ │
│  │ 2/17│ 김OO │ 30분 │ 33,000 │ 6,600  │ 26,400  │ │
│  │ 2/17│ 이OO │ 60분 │ 60,000 │ 12,000 │ 48,000  │ │
│  │ 2/16│ 박OO │ 30분 │ 33,000 │ 6,600  │ 26,400  │ │
│  └─────┴──────┴──────┴────────┴────────┴──────────┘ │
│                                                      │
│  정산 주기                                            │
│  ┌─────────────┬──────┬────────┬────────┬────────┐  │
│  │ 기간         │ 건수  │ 순수입   │ 상태    │        │  │
│  ├─────────────┼──────┼────────┼────────┼────────┤  │
│  │ 2/1 ~ 2/15  │ 12건 │ 316,800│ 지급완료 │ [상세] │  │
│  │ 2/16 ~ 2/28 │ 6건  │ 158,400│ 정산중  │ [상세] │  │
│  └─────────────┴──────┴────────┴────────┴────────┘  │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### 5.2 상담 메모 CRUD

```java
// API
POST   /api/v1/counselor/memos              // 메모 생성/갱신 (sessionId + content)
GET    /api/v1/counselor/memos/{sessionId}   // 세션별 메모 조회
GET    /api/v1/counselor/memos               // 전체 메모 목록 (페이지네이션)
DELETE /api/v1/counselor/memos/{sessionId}   // 메모 삭제
```

### 5.3 고객 관리 백엔드 연동

```java
// API
GET    /api/v1/counselor/customers                    // 내 고객 목록 (상담 이력 기반)
GET    /api/v1/counselor/customers/{userId}/sessions   // 고객별 상담 이력
GET    /api/v1/counselor/customers/{userId}/memos      // 고객별 메모 모음
```

---

## 6. 운영자 모니터링

### 6.1 실시간 대시보드 (신규)

```
┌─────────────────────────────────────────────────────┐
│  운영 현황 대시보드                     🔄 자동갱신 30초 │
├─────────────────────────────────────────────────────┤
│                                                      │
│  실시간 현황                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐│
│  │ 진행 중    │ │ 대기 중    │ │ 오늘 완료  │ │ 오늘 매출 ││
│  │ 🟢 3건    │ │ 🟡 2명    │ │ ✅ 15건   │ │ 495,000원││
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘│
│                                                      │
│  진행 중 세션                                         │
│  ┌──────┬──────┬────────┬──────┬────────┐           │
│  │ 상담사│ 고객  │ 시작시각 │ 경과  │ 상태    │           │
│  ├──────┼──────┼────────┼──────┼────────┤           │
│  │연화당 │ 김OO │ 14:02  │ 23분 │ 🟢통화중│           │
│  │백련화 │ 이OO │ 14:15  │ 10분 │ 🟢통화중│           │
│  │홍연화 │ 박OO │ 14:20  │ 5분  │ 🟢통화중│           │
│  └──────┴──────┴────────┴──────┴────────┘           │
│                                                      │
│  정산 현황                                            │
│  미확정: 8건 (264,000원) | 확정 대기: 3건 | 지급 완료: 42건│
│                                                      │
└─────────────────────────────────────────────────────┘
```

### 6.2 운영자 API

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/v1/admin/sessions/active` | 진행 중 세션 목록 |
| GET | `/api/v1/admin/sessions/stats` | 오늘/이번주/이번달 통계 |
| GET | `/api/v1/admin/settlements` | 전체 정산 목록 (필터: 기간, 상담사, 상태) |
| POST | `/api/v1/admin/settlements/{id}/confirm` | 정산 확정 |
| POST | `/api/v1/admin/settlements/{id}/pay` | 지급 처리 |
| POST | `/api/v1/admin/sessions/{id}/force-end` | 강제 종료 |

---

## 7. Flutter 앱 화상통화 연동

### 7.1 Sendbird Calls Flutter SDK 통합

```dart
// pubspec.yaml에 추가
dependencies:
  sendbird_calls: ^1.10.0

// 기능 구현
- SendbirdCall.init(appId)
- SendbirdCall.authenticate(userId, accessToken)
- DirectCall.dial() / DirectCall.accept()
- 영상/음성 토글
- 통화 품질 콜백
```

### 7.2 Flutter 화면 구성

| 화면 | 설명 |
|------|------|
| `ConsultationPreflightScreen` | 장비 체크 (카메라/마이크 권한) |
| `ConsultationRoomScreen` | 통화 화면 (기존 UI 확장 + SDK 연동) |
| `ConsultationEndScreen` | 종료 + 정산 확인 화면 |
| `ConsultationHistoryScreen` | 상담 이력 + 크레딧 소모 내역 |

---

## 8. 스프린트 계획

### Sprint 1: 크레딧 정산 핵심 (운영 필수) — 3일

> **목표**: 세션 종료 시 크레딧이 자동 정산되고, 감사 로그가 기록된다

| # | Task | 담당 | 파일 |
|---|------|------|------|
| 1.1 | Flyway V27: credit_usage_log에 status/consumed_at/actual_minutes/refunded_units 추가 | Backend | `V27__credit_settlement_status.sql` |
| 1.2 | Flyway V28: settlement_transactions 테이블 생성 | Backend | `V28__settlement_transactions.sql` |
| 1.3 | Flyway V29: counselor_settlements 테이블 생성 | Backend | `V29__counselor_settlements.sql` |
| 1.4 | SettlementService 구현 (정산 로직 + 환불 계산) | Backend | `settlement/SettlementService.java` |
| 1.5 | endSession()에 settleSession() 연동 | Backend | `consultation/ConsultationSessionService.java` |
| 1.6 | 정산 API 엔드포인트 (고객용, 상담사용, 운영자용) | Backend | `settlement/SettlementController.java` |
| 1.7 | 통합 테스트 (정상종료/네트워크/관리자 시나리오) | Backend | `SettlementIntegrationTest.java` |

**인수 조건**:
- [ ] 정상 종료 시 크레딧 전량 CONSUMED 처리
- [ ] 네트워크 종료 10분 미만: 전량 환불
- [ ] 네트워크 종료 10분 이상: 비례 정산
- [ ] 관리자 강제 종료: 전량 환불
- [ ] settlement_transactions에 모든 정산 기록
- [ ] 통합 테스트 전수 통과

---

### Sprint 2: 세션 종료 UX + 상담사 정산 페이지 — 3일

> **목표**: 고객은 종료 후 정산 내역을 보고, 상담사는 수입을 확인한다

| # | Task | 담당 | 파일 |
|---|------|------|------|
| 2.1 | 세션 종료 화면 (정산 결과 표시) | Frontend | `consultation/[sessionId]/complete/page.tsx` |
| 2.2 | 고객 크레딧 이력 페이지 | Frontend | `credits/history/page.tsx` |
| 2.3 | 상담사 정산 페이지 백엔드 연동 | Frontend | `counselor/settlement/page.tsx` |
| 2.4 | 상담 메모 CRUD API | Backend | `counselor/CounselorMemoService.java` |
| 2.5 | Flyway V30: consultation_memos 테이블 | Backend | `V30__consultation_memos.sql` |
| 2.6 | 상담사 메모 UI 저장/조회 연동 | Frontend | `counselor/room/page.tsx` (수정) |
| 2.7 | 고객 관리 API + UI 연동 | Both | `counselor/customers/page.tsx` |

**인수 조건**:
- [ ] 세션 종료 시 정산 결과 화면 자동 표시
- [ ] 고객 크레딧 이력에 소모/환불 내역 표시
- [ ] 상담사 정산 페이지에 실제 데이터 표시
- [ ] 상담 메모 저장/조회 동작

---

### Sprint 3: Zoom급 통화 경험 — 4일

> **목표**: 텍스트 채팅, 네트워크 품질 표시, PIP, 크레딧 실시간 표시

| # | Task | 담당 | 파일 |
|---|------|------|------|
| 3.1 | 텍스트 채팅 컴포넌트 (Sendbird Chat SDK) | Frontend | `components/consultation-chat.tsx` |
| 3.2 | 통화 화면에 채팅 패널 통합 | Frontend | `consultation/[sessionId]/page.tsx` (수정) |
| 3.3 | 네트워크 품질 인디케이터 | Frontend | `components/network-quality.tsx` |
| 3.4 | 크레딧 실시간 표시 (통화 중 잔액) | Frontend | `components/credit-indicator.tsx` |
| 3.5 | PIP (Picture-in-Picture) 지원 | Frontend | `consultation/[sessionId]/page.tsx` (수정) |
| 3.6 | 상담 연장 요청 플로우 | Both | `ExtensionService.java` + `extension-modal.tsx` |
| 3.7 | 상담사 측에도 동일 기능 적용 | Frontend | `counselor/consultation/[sessionId]/page.tsx` |

**인수 조건**:
- [ ] 통화 중 텍스트 채팅 가능 (Sendbird Chat)
- [ ] 네트워크 품질 3단계 표시 (양호/보통/불량)
- [ ] 통화 중 크레딧 잔액 실시간 표시
- [ ] PIP 모드 지원 (브라우저 지원 시)

---

### Sprint 4: 운영 대시보드 + Flutter 연동 — 4일

> **목표**: 운영자가 실시간 모니터링하고, Flutter 앱에서 화상통화 가능

| # | Task | 담당 | 파일 |
|---|------|------|------|
| 4.1 | 운영자 실시간 세션 API | Backend | `admin/AdminSessionController.java` |
| 4.2 | 운영자 정산 관리 API (확정/지급) | Backend | `admin/AdminSettlementController.java` |
| 4.3 | 운영 대시보드 UI | Frontend | `admin/dashboard/page.tsx` |
| 4.4 | 정산 관리 UI | Frontend | `admin/settlements/page.tsx` |
| 4.5 | Flutter Sendbird Calls SDK 통합 | Flutter | `features/consultation/` |
| 4.6 | Flutter 세션 종료 + 정산 화면 | Flutter | `features/consultation/complete_screen.dart` |
| 4.7 | Flutter 크레딧 이력 화면 | Flutter | `features/credits/history_screen.dart` |

**인수 조건**:
- [ ] 운영자 대시보드에서 진행 중 세션 실시간 조회
- [ ] 운영자가 정산 확정/지급 처리 가능
- [ ] Flutter 앱에서 Sendbird 화상통화 연결
- [ ] Flutter 앱에서 세션 종료 후 정산 확인

---

### Sprint 5: E2E 테스트 + 안정화 — 3일

> **목표**: 전체 플로우 E2E 검증, 엣지 케이스 처리, 성능 최적화

| # | Task | 담당 | 파일 |
|---|------|------|------|
| 5.1 | 정산 E2E 테스트 (예약→통화→정산→환불) | Test | `e2e/settlement-journey.spec.ts` |
| 5.2 | 상담사 포털 E2E 테스트 | Test | `e2e/counselor-portal.spec.ts` |
| 5.3 | Backend 통합 테스트 보강 | Test | `*IntegrationTest.java` |
| 5.4 | 엣지 케이스 처리 (동시 종료, 이중 정산 방지) | Backend | 기존 파일 수정 |
| 5.5 | 성능 최적화 (정산 배치, 쿼리 최적화) | Backend | 기존 파일 수정 |
| 5.6 | Verify Skills 업데이트 | Ops | `.claude/skills/verify-*/SKILL.md` |

**인수 조건**:
- [ ] E2E 전체 Journey 통과 (예약→결제→통화→정산→리뷰)
- [ ] 이중 정산 방지 (idempotency)
- [ ] 동시 종료 처리 (race condition 방지)
- [ ] 전체 빌드 성공 (`./gradlew test` + `npm test` + `npm run build`)

---

## 9. Agent Team 구성 계획

### 9.1 팀 구조

```
[Team Lead (나)]
     │
     ├─ backend-agent      : Sprint별 백엔드 구현 (Java/Spring Boot)
     ├─ frontend-agent     : Sprint별 프론트엔드 구현 (Next.js/React)
     ├─ flutter-agent      : Sprint 4 Flutter 연동 (Dart)
     └─ test-agent         : Sprint별 테스트 작성 + 검증
```

### 9.2 파일 소유 경계 (충돌 방지)

| Agent | 소유 파일 패턴 |
|-------|-------------|
| backend-agent | `backend/src/**/*.java`, `backend/src/**/db/migration/V2*.sql`, `backend/src/**/V3*.sql` |
| frontend-agent | `web/src/app/**/*.tsx`, `web/src/components/**/*.tsx` |
| flutter-agent | `app_flutter/lib/**/*.dart` |
| test-agent | `backend/src/test/**/*.java`, `web/e2e/**/*.spec.ts`, `web/src/__tests__/**/*.test.tsx` |

### 9.3 스프린트별 실행 전략

| Sprint | 실행 방식 | 병렬화 |
|--------|---------|--------|
| Sprint 1 | backend-agent 단독 → test-agent 검증 | 순차 (DB 스키마 선행) |
| Sprint 2 | backend-agent + frontend-agent 병렬 | ✅ 병렬 (API vs UI) |
| Sprint 3 | frontend-agent 단독 (SDK 연동) | 순차 |
| Sprint 4 | frontend-agent + flutter-agent + backend-agent 병렬 | ✅ 병렬 (3개 레이어) |
| Sprint 5 | test-agent + backend-agent 병렬 | ✅ 병렬 |

---

## 10. 리스크 & 완화

| 리스크 | 확률 | 영향 | 완화 전략 |
|--------|------|------|----------|
| Sendbird Chat + Calls 동시 사용 충돌 | 중 | 높음 | Sprint 3 초반에 PoC, 실패 시 자체 WebSocket 채팅 |
| 이중 정산 (race condition) | 중 | 높음 | Pessimistic lock + idempotency key |
| Flutter Sendbird SDK 호환성 | 낮 | 중 | Flutter SDK 버전 사전 확인, 실패 시 WebView 대체 |
| 정산 금액 오차 | 낮 | 높음 | 모든 금액 연산 BIGINT(원), 소수점 없음 |
| Agent 간 파일 충돌 | 중 | 중 | 파일 소유 경계 엄격 분리, 공유 파일은 Lead가 처리 |

---

## 11. 성공 지표

| 지표 | 현재 | 목표 |
|------|------|------|
| 크레딧 정산 자동화율 | 0% | 100% |
| 정산 오류율 | N/A | < 0.1% |
| 세션 종료 → 정산 완료 시간 | N/A | < 1초 |
| 고객 정산 투명성 (종료 후 내역 표시) | ❌ | ✅ |
| 상담사 수입 확인 가능 | ❌ (UI만) | ✅ (실데이터) |
| 통화 중 텍스트 채팅 | ❌ | ✅ |
| 네트워크 품질 표시 | ❌ | ✅ |
| Flutter 화상통화 | ❌ | ✅ |
| 운영자 실시간 모니터링 | ❌ | ✅ |
| E2E 정산 Journey 테스트 | ❌ | ✅ |

---

## 12. 부록: 기술 스택 확인

| 영역 | 기술 | 버전 |
|------|------|------|
| Backend | Spring Boot | 3.5 |
| Backend | Java | 21 |
| Backend | Flyway | Latest |
| Backend | H2 (dev) / MySQL (prod) | - |
| Frontend | Next.js | 15 |
| Frontend | React | 19 |
| Frontend | Sendbird Calls JS SDK | Latest |
| Frontend | Sendbird Chat JS SDK | Latest (신규) |
| Mobile | Flutter | Latest |
| Mobile | Sendbird Calls Flutter SDK | 1.10+ (신규) |
| Infra | Redis | 7+ |
