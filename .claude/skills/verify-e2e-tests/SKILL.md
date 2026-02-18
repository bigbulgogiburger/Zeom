---
name: verify-e2e-tests
description: E2E 테스트 설정 및 품질 검증. 테스트 코드 변경 후 사용.
---

## Purpose

1. Playwright 설정 (WebRTC flags, permissions, webServer) 완전성 검증
2. E2E 테스트 헬퍼 패턴 (apiSignup, apiLogin, browserLogin) 일관성 검증
3. E2E 부트스트랩 메커니즘 (`e2e_admin_`, `e2e_counselor_` prefix) 동작 검증
4. Jest 유닛 테스트와 E2E 테스트의 커버리지 확인
5. 테스트 스크립트 (npm test, npm run test:e2e) 설정 검증

## When to Run

- `web/playwright.config.ts` 변경 시
- `web/e2e/*.spec.ts` 파일 추가/수정 시
- `web/src/__tests__/*.test.tsx` 파일 추가/수정 시
- `backend/src/main/java/com/cheonjiyeon/api/auth/AuthService.java` E2E 부트스트랩 변경 시
- `web/package.json` 테스트 스크립트 변경 시

## Related Files

| File | Purpose |
|------|---------|
| `web/playwright.config.ts` | Playwright 설정 (WebRTC flags, webServer, permissions) |
| `web/e2e/video-call.spec.ts` | 화상통화 E2E 테스트 |
| `web/e2e/consultation-journey.spec.ts` | 상담 여정 E2E 테스트 |
| `web/e2e/wallet-journey.spec.ts` | 지갑 E2E 테스트 |
| `web/e2e/review-journey.spec.ts` | 리뷰 E2E 테스트 |
| `web/e2e/refund-journey.spec.ts` | 환불 E2E 테스트 |
| `web/e2e/korean-theme.spec.ts` | 한국 디자인 E2E 테스트 |
| `web/src/__tests__/cash-buy.test.tsx` | 캐시 구매 Jest 테스트 |
| `web/src/__tests__/consultation-page.test.tsx` | 상담 페이지 Jest 테스트 |
| `web/src/__tests__/wallet-page.test.tsx` | 지갑 페이지 Jest 테스트 |
| `web/src/__tests__/wallet-widget.test.tsx` | 지갑 위젯 Jest 테스트 |
| `web/src/__tests__/session-timer.test.tsx` | 세션 타이머 Jest 테스트 |
| `web/src/__tests__/review-form.test.tsx` | 리뷰 폼 Jest 테스트 |
| `web/src/__tests__/refund-page.test.tsx` | 환불 페이지 Jest 테스트 |
| `web/package.json` | 테스트 스크립트 정의 |
| `backend/src/main/java/com/cheonjiyeon/api/auth/AuthService.java` | E2E 부트스트랩 (e2e_admin_, e2e_counselor_ prefix) |
| `backend/src/main/resources/application.yml` | AUTH_ALLOW_E2E_ADMIN_BOOTSTRAP 설정 |

## Workflow

### Step 1: Playwright WebRTC Flags 확인

**도구:** Grep

```bash
grep -n 'use-fake-device-for-media-stream\|use-fake-ui-for-media-stream\|permissions.*camera\|permissions.*microphone' web/playwright.config.ts
```

**PASS:** `--use-fake-device-for-media-stream`, `--use-fake-ui-for-media-stream` flags + `permissions: ['camera', 'microphone']`
**FAIL:** WebRTC 관련 flags 또는 permissions 누락
**수정:** playwright.config.ts에 flags/permissions 추가

### Step 2: webServer 설정 확인

**도구:** Grep

```bash
grep -A 5 'webServer\|AUTH_ALLOW_E2E_ADMIN_BOOTSTRAP\|SENDBIRD' web/playwright.config.ts
```

**PASS:** webServer에 백엔드 (AUTH_ALLOW_E2E_ADMIN_BOOTSTRAP=true) + 프론트엔드 설정, Sendbird env 전달
**FAIL:** webServer 설정 누락 또는 E2E 부트스트랩 미활성화
**수정:** 설정 추가

### Step 3: E2E 부트스트랩 Prefix 매칭

**도구:** Grep

백엔드 prefix 확인:
```bash
grep -n 'e2e_admin_\|e2e_counselor_' backend/src/main/java/com/cheonjiyeon/api/auth/AuthService.java
```

E2E 테스트에서 사용하는 prefix 확인:
```bash
grep -rn 'e2e_admin_\|e2e_counselor_' web/e2e/
```

**PASS:** 백엔드와 E2E 테스트의 prefix가 일치 (`e2e_admin_` → ADMIN, `e2e_counselor_` → COUNSELOR + CounselorEntity 자동생성)
**FAIL:** prefix 불일치
**수정:** prefix 통일

### Step 4: Jest 테스트 실행 확인

**도구:** Bash

```bash
cd web && npm test -- --passWithNoTests 2>&1 | tail -10
```

**PASS:** 모든 테스트 통과
**FAIL:** 테스트 실패
**수정:** 실패한 테스트 수정

### Step 5: E2E Spec 파일 구조 확인

**도구:** Glob, Grep

```bash
ls web/e2e/*.spec.ts
```

각 spec 파일에 `test.describe` 블록 존재 확인:
```bash
grep -n 'test.describe' web/e2e/*.spec.ts
```

**PASS:** 모든 spec 파일에 적절한 describe 블록 존재
**FAIL:** 빈 spec 파일이나 describe 없는 테스트
**수정:** 테스트 구조 정리

### Step 6: 조건부 테스트 Skip 패턴

**도구:** Grep

```bash
grep -n 'test.skip\|test.fixme' web/e2e/*.spec.ts
```

**PASS:** Sendbird 크레덴셜 필요한 테스트만 조건부 skip
**FAIL:** 무조건 skip된 테스트가 과도하게 많음
**수정:** 가능한 테스트 활성화

## Output Format

| 검사 | 결과 | 상세 |
|------|------|------|
| WebRTC Flags | PASS/FAIL | flags: ... |
| webServer 설정 | PASS/FAIL | 설정: ... |
| E2E Prefix 매칭 | PASS/FAIL | 불일치: ... |
| Jest 테스트 | PASS/FAIL | 통과/전체: ... |
| Spec 구조 | PASS/FAIL | 파일 수: ... |
| 조건부 Skip | PASS/FAIL | skip 수: ... |

## Exceptions

1. **Sendbird 크레덴셜 없는 환경**: `test.skip(!hasSendbirdCredentials)` 패턴으로 실제 Sendbird 필요 테스트를 건너뛰는 것은 정상
2. **Playwright 단일 워커**: E2E가 `workers: 1`로 실행되는 것은 의도적 (서버 상태 공유 때문)
3. **테스트 데이터 마이그레이션**: V99__test_extra_slots.sql이 test/resources에 있는 것은 정상 패턴
