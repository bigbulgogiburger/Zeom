---
name: verify-admin-auth
description: Admin API 엔드포인트의 인증/인가 가드 검증. admin 엔드포인트 추가/변경 후 사용.
---

## Purpose

1. 모든 `/api/v1/admin/**` 엔드포인트에 `authService.requireAdmin()` 가드 존재 검증
2. Admin 엔드포인트의 `@RequestHeader("Authorization")` 파라미터 존재 검증
3. Counselor 전용 엔드포인트(`/api/v1/counselor/**`)에 역할 검증 존재 확인
4. 인증 누락 엔드포인트 탐지 (unauthenticated access 방지)

## When to Run

- `backend/.../admin/` 패키지 파일 추가/변경 시
- `backend/.../settlement/SettlementController.java` admin 엔드포인트 변경 시
- `backend/.../ops/` 패키지 파일 변경 시
- `backend/.../auth/AuthService.java` requireAdmin/requireCounselor 메서드 변경 시
- 새로운 `@RequestMapping("/api/v1/admin/")` 엔드포인트 추가 시

## Related Files

| File | Purpose |
|------|---------|
| `backend/src/main/java/com/cheonjiyeon/api/admin/AdminSessionController.java` | Admin 세션 모니터링 (/admin/sessions) |
| `backend/src/main/java/com/cheonjiyeon/api/admin/AdminAuditController.java` | Admin 감사로그 (/admin/audit) |
| `backend/src/main/java/com/cheonjiyeon/api/ops/OpsController.java` | 운영 대시보드 (requireAdmin) |
| `backend/src/main/java/com/cheonjiyeon/api/ops/OpsTimelineController.java` | 운영 타임라인 (requireAdmin) |
| `backend/src/main/java/com/cheonjiyeon/api/settlement/SettlementController.java` | 정산 관리 (/admin/settlements) |
| `backend/src/main/java/com/cheonjiyeon/api/refund/RefundService.java` | 환불 승인/거절 (requireAdmin) |
| `backend/src/main/java/com/cheonjiyeon/api/payment/PaymentController.java` | 결제 관리 (requireAdmin) |
| `backend/src/main/java/com/cheonjiyeon/api/auth/AuthService.java` | requireAdmin() 메서드 정의 |
| `backend/src/main/java/com/cheonjiyeon/api/counselor/CounselorPortalController.java` | 상담사 포털 엔드포인트 |

## Workflow

### Step 1: Admin URL 패턴 엔드포인트 수집

**도구:** Grep

모든 `/api/v1/admin/` 경로의 엔드포인트 추출:

```bash
grep -rn '/api/v1/admin' backend/src/main/java/ | grep -E '@.*Mapping|@RequestMapping'
```

**PASS:** 모든 admin URL 엔드포인트가 식별됨
**FAIL:** 누락된 admin 엔드포인트 존재

### Step 2: Admin 엔드포인트별 requireAdmin 가드 존재 확인

**도구:** Grep

각 admin 컨트롤러 파일에서 모든 `@GetMapping`, `@PostMapping` 등의 handler 메서드에 `requireAdmin` 호출이 있는지 확인:

```bash
grep -c 'requireAdmin' backend/src/main/java/com/cheonjiyeon/api/admin/AdminSessionController.java
grep -c '@GetMapping\|@PostMapping\|@PutMapping\|@DeleteMapping' backend/src/main/java/com/cheonjiyeon/api/admin/AdminSessionController.java
```

```bash
grep -c 'requireAdmin' backend/src/main/java/com/cheonjiyeon/api/admin/AdminAuditController.java
grep -c '@GetMapping\|@PostMapping' backend/src/main/java/com/cheonjiyeon/api/admin/AdminAuditController.java
```

```bash
grep -c 'requireAdmin' backend/src/main/java/com/cheonjiyeon/api/settlement/SettlementController.java
grep -n '/api/v1/admin' backend/src/main/java/com/cheonjiyeon/api/settlement/SettlementController.java
```

**PASS:** requireAdmin 호출 수 >= admin endpoint 수 (모든 admin 메서드에 가드 존재)
**FAIL:** requireAdmin 수 < admin endpoint 수 (인증 누락 엔드포인트 존재)
**수정:** 누락된 handler에 `authService.requireAdmin(authHeader)` 추가

### Step 3: Authorization 헤더 파라미터 존재 확인

**도구:** Grep

Admin 컨트롤러에서 `@RequestHeader` 없이 `@GetMapping`/`@PostMapping` 등이 있는지 탐지:

```bash
grep -B 2 'requireAdmin' backend/src/main/java/com/cheonjiyeon/api/admin/AdminSessionController.java | grep 'Authorization'
grep -B 2 'requireAdmin' backend/src/main/java/com/cheonjiyeon/api/settlement/SettlementController.java | grep 'Authorization'
```

**PASS:** 모든 requireAdmin 호출 직전에 `@RequestHeader("Authorization")` 파라미터 존재
**FAIL:** Authorization 헤더 수신 없이 requireAdmin 호출 (null이 전달됨)
**수정:** handler 메서드에 `@RequestHeader(value = "Authorization", required = false) String authHeader` 추가

### Step 4: Counselor 엔드포인트 역할 검증 확인

**도구:** Grep

```bash
grep -n 'resolveCounselor\|requireCounselor' backend/src/main/java/com/cheonjiyeon/api/counselor/CounselorPortalController.java
grep -c '@GetMapping\|@PostMapping\|@PutMapping' backend/src/main/java/com/cheonjiyeon/api/counselor/CounselorPortalController.java
```

**PASS:** 모든 counselor 엔드포인트에 역할 검증 존재
**FAIL:** 역할 검증 없이 접근 가능한 counselor 엔드포인트 존재
**수정:** resolveCounselor() 호출 추가

### Step 5: 테스트에서 admin 토큰 사용 확인

**도구:** Grep

Admin 엔드포인트를 호출하는 테스트가 admin 토큰을 전달하는지 확인:

```bash
grep -n '/api/v1/admin' backend/src/test/java/com/cheonjiyeon/api/AdminSettlementIntegrationTest.java
grep -n 'header.*Authorization' backend/src/test/java/com/cheonjiyeon/api/AdminSettlementIntegrationTest.java
```

**PASS:** admin 엔드포인트 호출 수 <= Authorization 헤더 수 (모든 admin 호출에 인증 포함)
**FAIL:** 인증 없이 admin 엔드포인트를 호출하는 테스트 존재
**수정:** 테스트에 admin 토큰 추가 (`e2e_admin_` prefix로 가입 후 토큰 사용)

## Output Format

| 검사 | 결과 | 상세 |
|------|------|------|
| Admin 엔드포인트 수집 | PASS/FAIL | 총 N개 발견 |
| requireAdmin 가드 | PASS/FAIL | 누락: ... |
| Authorization 헤더 | PASS/FAIL | 누락: ... |
| Counselor 역할 검증 | PASS/FAIL | 누락: ... |
| 테스트 인증 확인 | PASS/FAIL | 누락: ... |

## Exceptions

1. **공개 API 엔드포인트**: `/api/v1/counselors`, `/api/v1/products` 등 비로그인 사용자도 접근 가능한 공개 API는 인증 가드가 불필요
2. **Webhook 엔드포인트**: PortOne 웹훅 (`/api/v1/payments/portone/webhooks`)은 외부에서 호출하므로 JWT 인증 대신 시그니처 검증 사용
3. **E2E 부트스트랩**: `AUTH_ALLOW_E2E_ADMIN_BOOTSTRAP=true` 설정 시 `e2e_admin_` prefix로 가입하면 ADMIN 역할 자동 부여 — 이는 테스트 환경 전용
