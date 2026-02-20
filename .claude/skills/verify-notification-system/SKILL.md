---
name: verify-notification-system
description: 알림/이메일/SMS 시스템 무결성 검증. 알림 관련 코드 변경 후 사용.
---

## Purpose

1. 알림 Provider 패턴 (fake/http/sms) 올바른 조건 설정 검증
2. 알림 선호도(NotificationPreference) CRUD와 알림 발송 연동 검증
3. SSE(Server-Sent Events) 실시간 알림 연결 무결성 검증
4. 이메일 템플릿 서비스와 실제 발송 매칭 검증
5. SMS 서비스 프로바이더 (fake/aligo) 전환 검증

## When to Run

- `backend/.../notification/` 패키지 파일 추가/변경 시
- `web/src/app/notifications/`, `notification-preferences/` 변경 시
- `web/src/components/notification-bell.tsx` 변경 시
- `backend/.../scheduler/NotificationReminderScheduler.java` 변경 시
- SMS 서비스 관련 파일 변경 시

## Related Files

| File | Purpose |
|------|---------|
| `backend/src/main/java/com/cheonjiyeon/api/notification/NotificationService.java` | 알림 발송 비즈니스 로직 |
| `backend/src/main/java/com/cheonjiyeon/api/notification/NotificationController.java` | 알림 REST 엔드포인트 |
| `backend/src/main/java/com/cheonjiyeon/api/notification/NotificationEntity.java` | 알림 JPA 엔티티 |
| `backend/src/main/java/com/cheonjiyeon/api/notification/NotificationRepository.java` | 알림 레포지토리 |
| `backend/src/main/java/com/cheonjiyeon/api/notification/NotificationType.java` | 알림 유형 enum |
| `backend/src/main/java/com/cheonjiyeon/api/notification/NotificationPreferenceController.java` | 알림 선호도 엔드포인트 |
| `backend/src/main/java/com/cheonjiyeon/api/notification/NotificationPreferenceService.java` | 알림 선호도 서비스 |
| `backend/src/main/java/com/cheonjiyeon/api/notification/NotificationPreferenceEntity.java` | 알림 선호도 엔티티 |
| `backend/src/main/java/com/cheonjiyeon/api/notification/NotificationPreferenceRepository.java` | 알림 선호도 레포지토리 |
| `backend/src/main/java/com/cheonjiyeon/api/notification/NotificationLogEntity.java` | 알림 로그 엔티티 |
| `backend/src/main/java/com/cheonjiyeon/api/notification/NotificationLogRepository.java` | 알림 로그 레포지토리 |
| `backend/src/main/java/com/cheonjiyeon/api/notification/NotificationLogService.java` | 알림 로그 서비스 |
| `backend/src/main/java/com/cheonjiyeon/api/notification/SseEmitterService.java` | SSE 실시간 알림 서비스 |
| `backend/src/main/java/com/cheonjiyeon/api/notification/EmailService.java` | 이메일 서비스 인터페이스 |
| `backend/src/main/java/com/cheonjiyeon/api/notification/EmailTemplateService.java` | 이메일 템플릿 서비스 |
| `backend/src/main/java/com/cheonjiyeon/api/notification/FakeEmailService.java` | 개발용 fake 이메일 서비스 |
| `backend/src/main/java/com/cheonjiyeon/api/notification/SmsService.java` | SMS 서비스 인터페이스 |
| `backend/src/main/java/com/cheonjiyeon/api/notification/FakeSmsService.java` | 개발용 fake SMS 서비스 |
| `backend/src/main/java/com/cheonjiyeon/api/notification/AligoSmsService.java` | Aligo SMS 프로바이더 |
| `backend/src/main/java/com/cheonjiyeon/api/scheduler/NotificationReminderScheduler.java` | 알림 리마인더 스케줄러 |
| `web/src/app/notifications/page.tsx` | 알림 목록 페이지 |
| `web/src/app/notification-preferences/page.tsx` | 알림 선호도 설정 페이지 |
| `web/src/components/notification-bell.tsx` | 헤더 알림 벨 위젯 |
| `web/src/components/api-client.ts` | API 클라이언트 (알림 관련 메서드) |
| `backend/src/main/resources/db/migration/V34__notifications.sql` | 알림 테이블 마이그레이션 |
| `backend/src/main/resources/db/migration/V35__notification_preferences.sql` | 알림 선호도 마이그레이션 |
| `backend/src/main/resources/db/migration/V36__notification_logs.sql` | 알림 로그 마이그레이션 |
| `backend/src/main/resources/db/migration/V47__notification_preferences_sms.sql` | SMS 선호도 마이그레이션 |

## Workflow

### Step 1: 알림 Provider 패턴 확인

**도구:** Grep

```bash
grep -n '@ConditionalOnProperty\|@Bean\|@Service' backend/src/main/java/com/cheonjiyeon/api/notification/FakeEmailService.java backend/src/main/java/com/cheonjiyeon/api/notification/FakeSmsService.java
```

```bash
grep -n 'notification.provider\|NOTIFICATION_PROVIDER\|sms.provider\|SMS_PROVIDER' backend/src/main/resources/application.yml
```

**PASS:** fake/real 프로바이더가 조건부 Bean으로 등록되고, application.yml에 설정 존재
**FAIL:** 프로바이더 전환 조건 누락
**수정:** @ConditionalOnProperty 추가

### Step 2: 알림 유형과 선호도 매칭

**도구:** Grep

```bash
grep -n 'enum\|BOOKING\|PAYMENT\|CHAT\|REVIEW\|SYSTEM' backend/src/main/java/com/cheonjiyeon/api/notification/NotificationType.java
```

```bash
grep -rn 'NotificationType\|notificationType' backend/src/main/java/com/cheonjiyeon/api/notification/NotificationPreferenceService.java
```

**PASS:** NotificationType의 모든 값에 대해 선호도 조회 가능
**FAIL:** 새 알림 유형이 선호도 체크에서 누락
**수정:** 선호도 서비스에 새 유형 처리 추가

### Step 3: SSE 연결 엔드포인트 확인

**도구:** Grep

```bash
grep -n 'SseEmitter\|text/event-stream\|@GetMapping.*subscribe\|@GetMapping.*stream' backend/src/main/java/com/cheonjiyeon/api/notification/NotificationController.java backend/src/main/java/com/cheonjiyeon/api/notification/SseEmitterService.java
```

프론트엔드 SSE 연결:
```bash
grep -rn 'EventSource\|event-stream\|sse\|subscribe' web/src/components/notification-bell.tsx
```

**PASS:** 백엔드 SSE 엔드포인트와 프론트엔드 EventSource 연결이 매칭
**FAIL:** SSE 엔드포인트 불일치
**수정:** URL 경로 수정

### Step 4: 알림 API 엔드포인트-프론트엔드 매칭

**도구:** Grep

```bash
grep -n '@GetMapping\|@PostMapping\|@PutMapping' backend/src/main/java/com/cheonjiyeon/api/notification/NotificationController.java backend/src/main/java/com/cheonjiyeon/api/notification/NotificationPreferenceController.java
```

```bash
grep -rn '/api/v1/notifications' web/src/app/notifications/page.tsx web/src/app/notification-preferences/page.tsx web/src/components/notification-bell.tsx web/src/components/api-client.ts
```

**PASS:** 프론트엔드 API 호출에 대응하는 백엔드 엔드포인트 존재
**FAIL:** 엔드포인트 불일치
**수정:** 불일치 수정

### Step 5: 알림 로그 기록 확인

**도구:** Grep

```bash
grep -n 'NotificationLog\|logNotification\|saveLog' backend/src/main/java/com/cheonjiyeon/api/notification/NotificationService.java backend/src/main/java/com/cheonjiyeon/api/notification/NotificationLogService.java
```

**PASS:** 알림 발송 시 로그가 기록됨
**FAIL:** 알림 발송 후 로그 미기록
**수정:** 로그 기록 로직 추가

### Step 6: SMS 서비스 프로바이더 확인

**도구:** Grep

```bash
grep -n 'SmsService\|sendSms\|sms' backend/src/main/java/com/cheonjiyeon/api/notification/NotificationService.java
grep -n 'implements SmsService\|@Service' backend/src/main/java/com/cheonjiyeon/api/notification/FakeSmsService.java backend/src/main/java/com/cheonjiyeon/api/notification/AligoSmsService.java
```

**PASS:** SmsService 인터페이스에 FakeSmsService/AligoSmsService 구현 존재
**FAIL:** 인터페이스 미구현 또는 프로바이더 누락
**수정:** 구현 추가

## Output Format

| 검사 | 결과 | 상세 |
|------|------|------|
| Provider 패턴 | PASS/FAIL | fake/real 전환: ... |
| 알림 유형-선호도 | PASS/FAIL | 누락 유형: ... |
| SSE 연결 | PASS/FAIL | 엔드포인트: ... |
| API 매칭 | PASS/FAIL | 불일치: ... |
| 알림 로그 | PASS/FAIL | 로그 기록: ... |
| SMS 프로바이더 | PASS/FAIL | 구현: ... |

## Exceptions

1. **Fake 서비스**: FakeEmailService/FakeSmsService가 실제 발송하지 않는 것은 개발 환경 정상 동작
2. **SSE 타임아웃**: SSE 연결이 일정 시간 후 끊기는 것은 브라우저 정책에 따른 정상 동작 (재연결 로직 필요)
3. **알림 리마인더 스케줄러**: 스케줄러가 고정 주기로 실행되며, 중복 알림 방지는 로그 테이블로 처리
