# Sendbird Integration Guide

> 참조 시점: 채팅·화상통화 작업 (Sendbird 채널/세션/userId 관련 변경)

## 개요

`HttpChatProvider` 가 `SendbirdClient` 를 위임. 사용자/상담사 ID 형식과 채널 네이밍이 컨벤션화되어 있어 **클라이언트(Web/Flutter)와 백엔드가 같은 규약**을 사용해야 매칭됨. 직접 통화(Direct Call) 모델 — 고객 발신 → 상담사 수락.

## userId 규약 (핵심)

`backend/.../sendbird/SendbirdClient.java` 에서 강제:

```java
"user_" + booking.getUser().getId()           // 고객
"counselor_" + booking.getCounselor().getId() // 상담사
```

웹/Flutter 클라이언트는 SDK 초기화 시 **동일한 prefix** 사용 — 안 그러면 채널 매칭 실패.

## 채널 네이밍

```
consultation-{reservationId}
```

예약 1건 = 채널 1개. 같은 예약으로 재호출 시 동일 channelUrl 재사용.

## 레시피: 중복 채널 (400202) 처리

이미 동일 URL의 채널이 있으면 Sendbird가 400202 또는 unique constraint 에러 반환. 정상 케이스 — 무시하고 기존 URL 사용:

```java
// SendbirdClient.java line 153-157
if (body.contains("unique constraint") || body.contains("400202")) {
    log.info("Sendbird channel {} already exists, reusing", channelUrl);
    return channelUrl;
}
```

## 레시피: 세션 idempotency

`ConsultationSessionService.startSession()` 은 같은 `reservationId` 로 재호출 시 기존 세션 반환:

```java
// ConsultationSessionService.java line 65-71
@Transactional
public ConsultationSessionEntity startSession(Long reservationId) {
    Optional<ConsultationSessionEntity> existing =
        sessionRepository.findByReservationId(reservationId);
    if (existing.isPresent()) return existing.get();
    // ... 신규 생성
}
```

→ 클라이언트가 재시도해도 안전. 이 idempotency를 깨면 통화 도중 세션 중복 생성으로 토큰 불일치 발생.

## Direct Call 엔드포인트

`ConsultationSessionController`:

| 엔드포인트 | 용도 |
|-----------|------|
| `POST /api/v1/sessions/{reservationId}/start` | 세션 시작 (양쪽 모두 호출) |
| `POST /api/v1/sessions/{id}/end` | 세션 종료 |
| `POST /api/v1/sessions/{reservationId}/token` | 고객용 Sendbird 세션 토큰 |
| `POST /api/v1/sessions/{reservationId}/counselor-token` | 상담사용 토큰 |

토큰은 짧은 TTL — 통화 시작 직전에 발급해야 함.

## 함정 / 안티패턴

- ❌ userId에 prefix 누락 (`String.valueOf(userId)`) → ✅ `"user_" + userId` (없으면 상담사 ID와 충돌 가능)
- ❌ 통화 시작 후 토큰 캐싱 → ✅ 매번 발급 (TTL 짧음)
- ❌ 400202 에러를 실패로 처리 → ✅ 기존 채널 재사용 신호로 해석
- ❌ `CHAT_PROVIDER=http` 인데 `SENDBIRD_APP_ID` 미설정 → ✅ env 검증 후 부팅 (config 단계에서 fail-fast)
- ❌ `startSession()` 재호출 시 신규 세션 가정 → ✅ 항상 idempotent — 같은 세션 반환 가능

## 검증 방법

- 통합: `./gradlew test --tests '*Consultation*'`
- 스킬: `.claude/skills/verify-sendbird-videocall/` 실행
- E2E: `web/e2e/video-call.spec.ts` (Playwright)
- 운영 디버깅: Sendbird 대시보드에서 `consultation-{id}` 채널 + member userId prefix 확인
