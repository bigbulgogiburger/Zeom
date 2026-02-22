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
| `backend/src/main/java/com/cheonjiyeon/api/chat/ChatController.java` | 채팅 상담 REST 엔드포인트 |
| `backend/src/main/java/com/cheonjiyeon/api/chat/ChatService.java` | 채팅 상담 비즈니스 로직 |
| `backend/src/main/java/com/cheonjiyeon/api/chat/ChatMessageEntity.java` | 채팅 메시지 JPA 엔티티 |
| `web/src/app/consultation/chat/[sessionId]/page.tsx` | 채팅 상담 페이지 (카카오톡 스타일 UI) |
| `web/src/app/consultation/[sessionId]/waiting/page.tsx` | 상담 대기실 페이지 |
| `web/src/app/consultation/[sessionId]/summary/page.tsx` | 상담 후 요약 페이지 |
| `web/src/app/consultation/components/connection-monitor.tsx` | 연결 안정성 모니터 |
| `web/src/app/consultation/components/quality-indicator.tsx` | 통화 품질 인디케이터 |
| `backend/src/main/resources/application.yml` | Sendbird 설정 (enabled, app-id, api-token) |
| `app_flutter/lib/core/sendbird_calls_service.dart` | Flutter MethodChannel bridge to native Sendbird SDK |
| `app_flutter/lib/features/consultation/consultation_room_screen.dart` | Flutter video call room (waiting screen, video views, auto-retry) |
| `app_flutter/ios/Runner/SendbirdCallsPlugin.swift` | iOS native Sendbird Calls plugin (MethodChannel handler) |
| `app_flutter/ios/Runner/SendbirdVideoViewFactory.swift` | iOS PlatformView for Sendbird video rendering |
| `app_flutter/ios/Runner/AppDelegate.swift` | iOS plugin registration |
| `app_flutter/android/app/src/main/kotlin/com/cheonjiyeon/cheonjiyeon_app/SendbirdCallsPlugin.kt` | Android native Sendbird Calls plugin |
| `app_flutter/android/app/src/main/kotlin/com/cheonjiyeon/cheonjiyeon_app/SendbirdVideoViewFactory.kt` | Android PlatformView for Sendbird video rendering |
| `app_flutter/android/app/src/main/kotlin/com/cheonjiyeon/cheonjiyeon_app/MainActivity.kt` | Android plugin registration |
| `backend/src/main/java/com/cheonjiyeon/api/booking/BookingDtos.java` | BookingResponse DTO (customerName field) |

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

### Step 7: 채팅 상담 API 매칭

**도구:** Grep

채팅 상담 백엔드 엔드포인트 확인:
```bash
grep -n '@PostMapping\|@GetMapping' backend/src/main/java/com/cheonjiyeon/api/chat/ChatController.java
```

프론트엔드 채팅 API 호출 확인:
```bash
grep -n '/api/v1/chats' web/src/app/consultation/chat/\[sessionId\]/page.tsx
```

**PASS:** 채팅 메시지 전송/조회/종료 엔드포인트가 매칭됨
**FAIL:** 프론트엔드에서 호출하는 API 경로가 백엔드에 존재하지 않음
**수정:** 불일치하는 엔드포인트 수정

### Step 8: 상담 유형 (video/chat) 분기 확인

**도구:** Grep

```bash
grep -n 'consultationType\|CHAT\|VIDEO' backend/src/main/java/com/cheonjiyeon/api/booking/BookingEntity.java
grep -n 'consultationType\|chat\|video' web/src/app/counselors/\[id\]/CounselorDetailClient.tsx
```

**PASS:** BookingEntity에 consultationType 필드 존재, 프론트엔드에서 상담 유형 선택 UI 존재
**FAIL:** 상담 유형 분기 누락
**수정:** 누락된 분기 로직 추가

### Step 9: Flutter 네이티브 통합 검증

**도구:** Grep

1. **MethodChannel 이름 일치**: Dart `sendbird_calls_service.dart`의 channel name이 iOS `SendbirdCallsPlugin.swift`와 Android `SendbirdCallsPlugin.kt`에서 동일한지 확인 (expected: `com.cheonjiyeon/sendbird_calls`)
   ```bash
   grep -rn "com.cheonjiyeon/sendbird_calls" app_flutter/lib/core/sendbird_calls_service.dart app_flutter/ios/Runner/SendbirdCallsPlugin.swift app_flutter/android/app/src/main/kotlin/com/cheonjiyeon/cheonjiyeon_app/SendbirdCallsPlugin.kt
   ```
   **PASS**: 3개 파일 모두에서 동일한 channel name 발견
   **FAIL**: 일부 파일에서 누락되거나 불일치

2. **PlatformView viewType 일치**: Dart에서 사용하는 `sendbird-local-video`, `sendbird-remote-video` viewType이 iOS AppDelegate.swift와 Android MainActivity.kt에서 동일하게 등록되는지 확인
   ```bash
   grep -rn "sendbird-local-video\|sendbird-remote-video" app_flutter/lib/core/sendbird_calls_service.dart app_flutter/ios/Runner/AppDelegate.swift app_flutter/android/app/src/main/kotlin/com/cheonjiyeon/cheonjiyeon_app/MainActivity.kt
   ```
   **PASS**: local/remote viewType이 Dart와 iOS/Android 모두에서 일치
   **FAIL**: viewType 불일치

3. **Video View 바인딩**: iOS plugin의 `registerVideoView`와 `didConnect`에서 `updateLocalVideoView`/`updateRemoteVideoView`가 호출되는지 확인
   ```bash
   grep -n "registerVideoView\|updateLocalVideoView\|updateRemoteVideoView" app_flutter/ios/Runner/SendbirdCallsPlugin.swift
   ```
   **PASS**: registerVideoView 메서드 존재하고 updateLocal/RemoteVideoView 호출
   **FAIL**: 비디오 뷰 바인딩 누락 (검은 화면 발생)

4. **웹 상담사 미디어 뷰 바인딩**: `room/page.tsx`에서 `callConnected` 후 `setLocalMediaView`/`setRemoteMediaView`가 호출되는지 확인
   ```bash
   grep -n "setLocalMediaView\|setRemoteMediaView" web/src/app/counselor/room/page.tsx
   ```
   **PASS**: useEffect에서 callConnected 시 미디어 뷰 바인딩
   **FAIL**: 미디어 뷰 바인딩 없음 (비디오 안 보임)

5. **BookingResponse customerName**: 상담사용 today bookings에서 customerName이 반환되는지 확인
   ```bash
   grep -n "customerName" backend/src/main/java/com/cheonjiyeon/api/booking/BookingDtos.java
   ```
   **PASS**: BookingResponse record에 customerName 필드 존재
   **FAIL**: 상담사 화면에서 고객 이름 표시 불가

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
