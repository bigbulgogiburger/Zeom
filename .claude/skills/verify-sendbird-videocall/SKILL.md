---
name: verify-sendbird-videocall
description: Sendbird 화상통화 파이프라인 검증. 통화 관련 코드 변경 후 사용.
---

## Purpose

1. Sendbird userId prefix 규칙 (`user_{userId}`, `counselor_{counselorId}`) 일관성 검증
2. 상담사/고객 인증 엔드포인트와 프론트엔드 API 호출 매칭 검증
3. Provider 패턴 (fake/real) 구현이 올바른지 검증
4. Direct Call 흐름 (Customer Dial → Counselor Accept) 일관성 검증
5. 세션 생명주기 (start → token → end) 무결성 검증

## When to Run

- `backend/.../sendbird/` 패키지 파일 변경 시
- `backend/.../consultation/` 패키지 파일 변경 시
- `web/src/app/consultation/` 또는 `web/src/app/counselor/room/` 변경 시
- `web/src/components/api-client.ts` Sendbird 관련 메서드 변경 시
- `web/src/components/call-notification.tsx` 변경 시

## Related Files

| File | Purpose |
|------|---------|
| `backend/src/main/java/com/cheonjiyeon/api/sendbird/SendbirdProvider.java` | Provider 인터페이스 |
| `backend/src/main/java/com/cheonjiyeon/api/sendbird/SendbirdService.java` | 서비스 (provider 선택) |
| `backend/src/main/java/com/cheonjiyeon/api/sendbird/SendbirdClient.java` | 실제 Sendbird REST 클라이언트 |
| `backend/src/main/java/com/cheonjiyeon/api/sendbird/FakeSendbirdClient.java` | 개발용 fake 클라이언트 |
| `backend/src/main/java/com/cheonjiyeon/api/consultation/ConsultationSessionController.java` | REST 엔드포인트 |
| `backend/src/main/java/com/cheonjiyeon/api/consultation/ConsultationSessionService.java` | 비즈니스 로직 |
| `backend/src/main/java/com/cheonjiyeon/api/consultation/ConsultationSessionDtos.java` | DTO 정의 |
| `backend/src/main/java/com/cheonjiyeon/api/consultation/ConsultationSessionEntity.java` | JPA 엔티티 |
| `web/src/app/consultation/[sessionId]/page.tsx` | 고객 상담실 (다이얼러) |
| `web/src/app/counselor/room/page.tsx` | 상담사 대기실 (리스너) |
| `web/src/components/api-client.ts` | API 클라이언트 (getCounselorAuthToken, getSessionToken) |
| `web/src/components/call-notification.tsx` | 수신 전화 알림 다이얼로그 |
| `web/src/components/counselor-auth.tsx` | RequireCounselor 가드 |
| `web/src/components/session-timer.tsx` | 상담 타이머 |
| `backend/src/main/resources/application.yml` | Sendbird 설정 (enabled, app-id, api-token) |

## Workflow

### Step 1: userId Prefix 일관성 확인

**도구:** Grep

```bash
grep -rn 'user_\|counselor_' backend/src/main/java/com/cheonjiyeon/api/consultation/ConsultationSessionService.java
```

**PASS:** `"user_" + userId`와 `"counselor_" + counselorId` 형식이 일관됨
**FAIL:** prefix가 다르거나 누락됨 (예: `"u_"`, `"c_"`)
**수정:** `user_` 및 `counselor_` prefix로 통일

### Step 2: API 엔드포인트-프론트엔드 매칭

**도구:** Grep

백엔드 컨트롤러 엔드포인트 추출:
```bash
grep -n '@PostMapping\|@GetMapping\|@PutMapping' backend/src/main/java/com/cheonjiyeon/api/consultation/ConsultationSessionController.java
```

프론트엔드 API 호출 추출:
```bash
grep -n '/api/v1/sessions' web/src/components/api-client.ts
```

**PASS:** 모든 프론트엔드 API 호출에 대응하는 백엔드 엔드포인트 존재
**FAIL:** 엔드포인트 불일치 (path, method, 응답 형식)
**수정:** 불일치하는 엔드포인트 수정

### Step 3: Provider 패턴 확인

**도구:** Grep

```bash
grep -n '@ConditionalOnProperty' backend/src/main/java/com/cheonjiyeon/api/sendbird/*.java
```

**PASS:** SendbirdClient에 `sendbird.enabled=true`, FakeSendbirdClient에 `sendbird.enabled=false, matchIfMissing=true`
**FAIL:** 조건이 누락되거나 충돌
**수정:** @ConditionalOnProperty 어노테이션 수정

### Step 4: 세션 DTO 응답 필드 완전성

**도구:** Read

ConsultationSessionDtos.java를 읽고 SessionTokenResponse와 CounselorAuthResponse 확인:

```bash
grep -A 10 'record SessionTokenResponse\|record CounselorAuthResponse' backend/src/main/java/com/cheonjiyeon/api/consultation/ConsultationSessionDtos.java
```

**PASS:** 필수 필드 존재 (sendbirdToken, sendbirdUserId, sendbirdAppId)
**FAIL:** 필수 필드 누락
**수정:** DTO에 누락된 필드 추가

### Step 5: 프론트엔드 Call Flow 상태 관리

**도구:** Grep

고객 페이지 상태:
```bash
grep -n 'ConnectionState\|IDLE\|CONNECTING\|RINGING\|CONNECTED' web/src/app/consultation/\[sessionId\]/page.tsx
```

상담사 페이지 상태:
```bash
grep -n 'RoomState\|INITIALIZING\|WAITING\|IN_CALL' web/src/app/counselor/room/page.tsx
```

**PASS:** 필수 상태 전이가 모두 구현됨
**FAIL:** 상태가 누락되거나 전이 로직 불완전
**수정:** 누락된 상태/전이 추가

### Step 6: Sendbird SDK 초기화 패턴

**도구:** Grep

```bash
grep -n 'SendBirdCall.init\|SendBirdCall.authenticate\|connectWebSocket' web/src/app/consultation/\[sessionId\]/page.tsx web/src/app/counselor/room/page.tsx
```

**PASS:** 양쪽 모두 init → authenticate → connectWebSocket 순서
**FAIL:** 초기화 순서 불일치
**수정:** 올바른 순서로 수정

## Output Format

| 검사 | 결과 | 상세 |
|------|------|------|
| userId Prefix | PASS/FAIL | user_/counselor_ 형식 확인 |
| API 엔드포인트 매칭 | PASS/FAIL | 불일치 경로: ... |
| Provider 패턴 | PASS/FAIL | 조건 설정: ... |
| DTO 필드 완전성 | PASS/FAIL | 누락 필드: ... |
| Call Flow 상태 | PASS/FAIL | 누락 상태: ... |
| SDK 초기화 순서 | PASS/FAIL | 순서: ... |

## Exceptions

1. **Fake provider의 mock 값**: FakeSendbirdClient가 `"fake-sendbird-app-id"`, `"fake-token"` 등을 반환하는 것은 정상 (개발 환경)
2. **Sendbird SDK import 경로**: `sendbird-calls` 패키지의 import 방식은 런타임 환경에 따라 다를 수 있음
3. **WebRTC 미디어 에러**: 실제 카메라/마이크 없이 Playwright에서 `--use-fake-device-for-media-stream` 사용하는 것은 테스트 환경의 정상 동작
