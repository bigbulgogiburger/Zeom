# PRD: 실시간 상담 세션 강화 (Real-time Consultation Enhancement)

> **Version**: 1.0
> **Author**: BigTech IT Agile PM
> **Date**: 2026-02-20
> **Status**: Draft
> **Priority**: P0 (GA Blocker)

---

## 1. Executive Summary

현재 상담 시스템의 핵심 사용자 경험 갭 5개를 해소하여, 실제 운영 환경에서 끊김 없는 상담 세션을 제공한다. Sendbird 기반 화상/채팅 상담에서 시간 관리, 연속 세션, 재접속, 알림 기능을 완성한다.

---

## 2. Problem Statement

### AS-IS (현재 상태)
- 세션 타이머가 0이 되면 3초 후 강제 종료 → 사용자 경험 저하
- 연속 예약(별도 BookingEntity)은 각각 별도 채널 → 상담 흐름 단절
- 시간 경고가 "5분 미만" 단일 시각 효과만 → 상담사/고객 모두 시간 인지 부족
- Sendbird 채널이 endSession에서 즉시 삭제 → 예상치 못한 종료 시 재접속 불가
- 상담사 대기실 준비 신호가 5초 타이머 mock → 실제 상담사 접속 확인 불가

### TO-BE (목표 상태)
- 시간 초과 시 강제 종료 대신 단계별 알림(5분/3분/1분) 후 자연스러운 마무리
- 연속 시간대 예약은 동일 채널에서 이어지며, "다음 티켓 소모" 프롬프트 제공
- 네트워크 끊김 시 양측(고객/상담사) 모두 동일 채널에 재입장 가능
- 실시간 SSE 기반 상담사 준비 신호 및 세션 이벤트 전달

---

## 3. User Stories

### Epic 1: 세션 내 시간 관리 및 알림

**US-1.1** 고객으로서, 상담 종료 5분/3분/1분 전에 시각적 알림과 소리를 받아 상담 마무리를 준비하고 싶다.

**Acceptance Criteria:**
- [ ] 5분 전: 화면 상단 배너 + 알림음 1회 + Sendbird 관리자 메시지 "상담 종료 5분 전입니다"
- [ ] 3분 전: 화면 상단 배너(주황) + 알림음 1회 + Sendbird 관리자 메시지 "상담 종료 3분 전입니다"
- [ ] 1분 전: 화면 상단 배너(빨강) + 알림음 2회 + Sendbird 관리자 메시지 "상담 종료 1분 전입니다"
- [ ] 상담사 화면에도 동일한 타이머 및 알림 표시

**US-1.2** 고객으로서, 예약 시간이 끝나도 즉시 튕기지 않고 자연스럽게 마무리 인사를 나눌 수 있다.

**Acceptance Criteria:**
- [ ] 시간 만료 시 "예약 시간이 종료되었습니다. 상담을 마무리해주세요." 배너 표시
- [ ] 만료 후 2분간 grace period 제공 (강제 종료 없음)
- [ ] Grace period 종료 시 "상담이 자동 종료됩니다" 알림 후 10초 카운트다운
- [ ] 카운트다운 완료 시 자동 종료

### Epic 2: 연속 세션 이어짐 및 티켓 소모

**US-2.1** 고객으로서, 같은 상담사에게 연속 시간대(예: 9:30, 10:00)를 예약했을 때 상담이 끊기지 않고 이어지기를 원한다.

**Acceptance Criteria:**
- [ ] 동일 상담사에 대한 연속 예약(30분 간격 이내) 감지
- [ ] 첫 번째 세션 시간 종료 시 "다음 예약 티켓이 있습니다. 이어서 상담하시겠습니까?" 모달
- [ ] "계속" 선택 시: 동일 Sendbird 채널 유지, 새 티켓(크레딧) 소모, 타이머 갱신
- [ ] "종료" 선택 시: 일반 종료 플로우 진행, 다음 예약은 별도 세션으로 시작
- [ ] 상담사에게도 동일한 연속 세션 알림 표시

**US-2.2** 고객으로서, 상담 중 실제로 티켓이 소비되는 것을 확인하고 싶다.

**Acceptance Criteria:**
- [ ] 세션 시작 시 첫 번째 티켓 즉시 CONSUMED 상태로 변경 (예약 시 RESERVED → 시작 시 CONSUMED)
- [ ] 30분 경계 도달 시 다음 티켓 CONSUMED (다중 슬롯 예약의 경우)
- [ ] CreditIndicator UI가 실시간 소비 상태를 반영
- [ ] 세션 비정상 종료 시 미소비 티켓은 자동 환불

### Epic 3: 세션 재접속

**US-3.1** 고객으로서, 네트워크 끊김 후에도 동일 상담 채널에 다시 들어갈 수 있다.

**Acceptance Criteria:**
- [ ] endSession 호출 전까지 Sendbird 채널 삭제하지 않음
- [ ] 재접속 시 기존 채팅 기록 유지
- [ ] 상담사도 고객 재접속 알림을 받음
- [ ] 상담사가 채널에 남아있어 고객 복귀를 대기할 수 있음

**US-3.2** 상담사로서, 고객 세션이 끊겨도 채널에 남아있으며 고객 복귀를 안내할 수 있다.

**Acceptance Criteria:**
- [ ] 고객 연결 해제 시 상담사에게 "고객 연결이 끊어졌습니다. 잠시 기다려주세요." 표시
- [ ] 고객이 재접속하면 "고객이 다시 연결되었습니다" 알림
- [ ] 상담사도 "세션 종료" 버튼으로 세션을 직접 종료 가능

### Epic 4: 상담사 대기 및 연결 신호

**US-4.1** 고객으로서, 대기실에서 상담사가 실제로 준비가 됐는지 알 수 있다.

**Acceptance Criteria:**
- [ ] 상담사가 상담실에 입장하면 실시간으로 "상담사 준비 완료" 상태 변경
- [ ] SSE 또는 폴링으로 실시간 상태 전달 (mock 타이머 제거)
- [ ] 상담사 미접속 시 "상담사를 기다리는 중..." 표시 유지

---

## 4. Technical Requirements

### 4.1 Backend Changes

#### 4.1.1 Sendbird Admin Message API
```
새 메서드: SendbirdClient.sendAdminMessage(channelUrl, message)
→ POST /v3/group_channels/{channel_url}/messages
→ message_type: "ADMM"
→ 용도: 시간 경고, 연속 세션 알림, 시스템 메시지
```

#### 4.1.2 세션 시간 관리 서비스
```
새 클래스: SessionTimeAlertService
- checkActiveSessionAlerts(): 5분마다 실행
  → 활성 세션 중 남은 시간 기준 알림 발송
  → 5분/3분/1분 전 Sendbird 관리자 메시지 전송
  → NotificationLogService로 중복 방지
```

#### 4.1.3 연속 예약 감지 API
```
새 엔드포인트: GET /api/v1/sessions/{sessionId}/next-consecutive
→ 현재 세션의 예약 종료 시각 기준 30분 이내에
  동일 상담사에 대한 다음 예약이 있는지 확인
→ 응답: { hasNext: boolean, nextBookingId, nextSlotStartAt }
```

#### 4.1.4 티켓 실시간 소모 API
```
새 엔드포인트: POST /api/v1/sessions/{sessionId}/consume-credit
→ 현재 세션의 다음 크레딧 단위를 CONSUMED로 변경
→ 연속 세션 "계속" 시에도 호출

새 엔드포인트: POST /api/v1/sessions/{sessionId}/continue-next
→ 다음 연속 예약의 크레딧을 소모하고 세션을 연장
→ 세션의 durationMinutes 갱신, 타이머 리셋 정보 반환
```

#### 4.1.5 상담사 준비 상태 API
```
새 엔드포인트: POST /api/v1/sessions/{sessionId}/counselor-ready
→ 상담사가 상담실에 입장했음을 기록
→ SSE 또는 GET 폴링으로 고객 대기실에 전달

GET /api/v1/sessions/{sessionId}/status
→ { counselorReady, sessionState, remainingSeconds }
```

#### 4.1.6 채널 삭제 정책 변경
```
변경: ConsultationSessionService.endSession()
→ 즉시 삭제 대신 1시간 후 삭제 예약 (soft-delete flag)
→ 새 스케줄러: ChannelCleanupJob (1시간마다)
  → endedAt + 1시간 경과한 세션의 Sendbird 채널 삭제
```

### 4.2 Frontend Changes

#### 4.2.1 Enhanced SessionTimer
- 5분/3분/1분 임계값 별도 알림 상태
- 각 임계값에서 알림음 재생 (`/public/sounds/alert-*.mp3`)
- Grace period (만료 후 2분) 카운트다운 UI

#### 4.2.2 ConsecutiveSessionModal
- "다음 예약이 있습니다" 모달 컴포넌트
- "계속" / "종료" 버튼
- 타이머 리셋 및 크레딧 소비 연동

#### 4.2.3 CounselorConsultationPage
- 상담사 전용 상담실 페이지 (기존에 없음)
- 타이머, 알림, 연속 세션 모달 동일 적용
- 고객 연결 상태 표시

#### 4.2.4 대기실 상담사 준비 상태
- mock 타이머 제거
- 5초 간격 폴링으로 `GET /api/v1/sessions/{sessionId}/status` 확인
- 상담사 준비 완료 시 "입장" 버튼 활성화

### 4.3 Database Migrations

```sql
-- V48: 세션 알림 로그
ALTER TABLE consultation_sessions ADD COLUMN alert_5min_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE consultation_sessions ADD COLUMN alert_3min_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE consultation_sessions ADD COLUMN alert_1min_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE consultation_sessions ADD COLUMN grace_period_end TIMESTAMP NULL;
ALTER TABLE consultation_sessions ADD COLUMN counselor_ready_at TIMESTAMP NULL;
ALTER TABLE consultation_sessions ADD COLUMN channel_deleted BOOLEAN DEFAULT FALSE;

-- V49: 연속 세션 연결
ALTER TABLE consultation_sessions ADD COLUMN continued_from_session_id BIGINT NULL;
ALTER TABLE consultation_sessions ADD COLUMN continued_to_session_id BIGINT NULL;
```

---

## 5. Implementation Phases

### Phase 1: 세션 시간 알림 + Grace Period (Epic 1)
**Scope:** 시간 경고 시스템, 강제 종료 제거, Grace Period
**Dependencies:** Sendbird Admin Message API
**Estimated Effort:** Backend 2일, Frontend 2일

### Phase 2: 세션 재접속 강화 (Epic 3)
**Scope:** 채널 삭제 지연, 양측 재접속, 상태 표시
**Dependencies:** Phase 1
**Estimated Effort:** Backend 1일, Frontend 1일

### Phase 3: 연속 세션 + 티켓 소모 (Epic 2)
**Scope:** 연속 예약 감지, 세션 연장, 실시간 크레딧 소모
**Dependencies:** Phase 1, 2
**Estimated Effort:** Backend 2일, Frontend 2일

### Phase 4: 상담사 연결 신호 (Epic 4)
**Scope:** 상담사 준비 상태, mock 제거, 상담사 상담실
**Dependencies:** Phase 1
**Estimated Effort:** Backend 1일, Frontend 2일

---

## 6. API Contract Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/sessions/{id}/consume-credit` | 크레딧 실시간 소모 |
| GET | `/api/v1/sessions/{id}/next-consecutive` | 연속 예약 확인 |
| POST | `/api/v1/sessions/{id}/continue-next` | 연속 세션 이어가기 |
| POST | `/api/v1/sessions/{id}/counselor-ready` | 상담사 준비 완료 |
| GET | `/api/v1/sessions/{id}/status` | 세션 실시간 상태 |

---

## 7. Risk & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Sendbird Admin Message API rate limit | 알림 누락 | 프론트엔드 자체 타이머 병행 |
| 연속 세션 중 결제 실패 | 세션 단절 | 크레딧 사전 예약 확인 후 연속 제안 |
| Grace period 악용 | 무료 상담 시간 증가 | 2분 하드 리밋 + 관리자 모니터링 |
| 채널 삭제 지연 시 비용 | Sendbird 채널 수 증가 | 1시간 후 자동 삭제 + 배치 정리 |

---

## 8. Success Metrics

- 세션 강제 종료율 < 5% (현재 추정 30%+)
- 연속 세션 이어가기 성공률 > 95%
- 재접속 성공률 > 90% (3회 시도 이내)
- 상담사 연결 평균 대기 시간 < 30초

---

## 9. Out of Scope

- 세션 녹화/녹음
- 화면 공유
- 3자 통화
- 모바일 앱(Flutter) 동일 기능 적용 (별도 스프린트)
