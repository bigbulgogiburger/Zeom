---
name: verify-implementation
description: 모든 검증 스킬을 순차적으로 실행하는 통합 검증. PR 전이나 기능 구현 완료 후 사용.
---

## Purpose

등록된 모든 verify 스킬을 순차 실행하여 코드베이스의 품질을 전방위로 검증합니다.

## When to Run

- PR 생성 전
- 기능 구현 완료 후
- 대규모 리팩토링 후
- 코드 리뷰 시

## 실행 대상 스킬

| # | 스킬 | 설명 |
|---|------|------|
| 1 | verify-flyway-migrations | Flyway DB 마이그레이션과 JPA Entity 일관성 검증 |
| 2 | verify-sendbird-videocall | Sendbird 화상통화 파이프라인 검증 |
| 3 | verify-payment-wallet | 결제/지갑/크레딧 시스템 무결성 검증 |
| 4 | verify-frontend-ui | 프론트엔드 UI/디자인 시스템 품질 검증 |
| 5 | verify-e2e-tests | E2E 테스트 설정 및 품질 검증 |
| 6 | verify-admin-auth | Admin API 엔드포인트 인증/인가 가드 검증 |
| 7 | verify-auth-system | 인증/인가 시스템 무결성 검증 (이메일 인증, 비밀번호 리셋, 소셜 로그인) |
| 8 | verify-notification-system | 알림/이메일/SMS 시스템 무결성 검증 |
| 9 | verify-flutter-app | Flutter 앱 품질 및 React-Flutter UX 동기화 검증 |

## Workflow

### Step 1: 변경 파일 확인

변경된 파일 목록을 확인하여 관련 스킬만 실행합니다:

```bash
git diff HEAD --name-only
```

### Step 2: 관련 스킬 실행

변경된 파일의 도메인에 해당하는 스킬만 순차 실행합니다:

- `backend/**/db/migration/` 또는 `**/*Entity.java` → `verify-flyway-migrations`
- `backend/**/sendbird/` 또는 `**/consultation/` 또는 `web/**/counselor/room/` → `verify-sendbird-videocall`
- `backend/**/wallet/` 또는 `**/cash/` 또는 `**/portone/` 또는 `**/refund/` → `verify-payment-wallet`
- `web/src/app/globals.css` 또는 `web/src/components/ui/` → `verify-frontend-ui`
- `web/e2e/` 또는 `web/playwright.config.ts` 또는 `web/src/__tests__/` → `verify-e2e-tests`
- `backend/**/admin/` 또는 `**/ops/` 또는 `**/settlement/*Controller*` → `verify-admin-auth`
- `backend/**/auth/` 또는 `web/src/app/login/` 또는 `web/src/app/signup/` 또는 `web/src/app/forgot-password/` → `verify-auth-system`
- `backend/**/notification/` 또는 `web/src/app/notifications/` 또는 `web/src/components/notification-bell.tsx` → `verify-notification-system`
- `app_flutter/lib/**/*.dart` → `verify-flutter-app`

### Step 3: 결과 집계

모든 스킬의 결과를 집계하여 최종 보고서를 생성합니다.

## Output Format

```markdown
## 통합 검증 결과

| 스킬 | 실행 여부 | PASS | FAIL | 요약 |
|------|-----------|------|------|------|
| verify-flyway-migrations | O/X | N | M | ... |
| verify-sendbird-videocall | O/X | N | M | ... |
| verify-payment-wallet | O/X | N | M | ... |
| verify-frontend-ui | O/X | N | M | ... |
| verify-e2e-tests | O/X | N | M | ... |

**전체:** PASS N / FAIL M
```
