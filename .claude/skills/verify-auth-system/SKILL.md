---
name: verify-auth-system
description: 인증/인가 시스템 무결성 검증 (이메일 인증, 비밀번호 리셋, 소셜 로그인, OAuth). auth 패키지 변경 후 사용.
---

## Purpose

1. 이메일 인증 플로우 (토큰 생성 → 이메일 발송 → 검증) 무결성 검증
2. 비밀번호 리셋 플로우 (요청 → 토큰 → 이메일 → 리셋) 무결성 검증
3. 소셜 로그인 (OAuth) 프로바이더 연동 일관성 검증
4. JWT 토큰 + Refresh Token 생명주기 검증
5. 프론트엔드-백엔드 인증 API 매칭 검증

## When to Run

- `backend/.../auth/` 패키지 파일 추가/변경 시
- `web/src/app/login/`, `signup/`, `forgot-password/`, `reset-password/`, `verify-email/` 변경 시
- `web/src/components/auth-context.tsx` 변경 시
- JWT/Refresh Token 관련 로직 변경 시
- 소셜 로그인 프로바이더 추가/변경 시

## Related Files

| File | Purpose |
|------|---------|
| `backend/src/main/java/com/cheonjiyeon/api/auth/AuthController.java` | 인증 REST 엔드포인트 (login, signup, refresh) |
| `backend/src/main/java/com/cheonjiyeon/api/auth/AuthService.java` | 인증 비즈니스 로직 (JWT, requireAdmin, requireCounselor) |
| `backend/src/main/java/com/cheonjiyeon/api/auth/AuthDtos.java` | 인증 DTO 정의 |
| `backend/src/main/java/com/cheonjiyeon/api/auth/UserEntity.java` | 사용자 엔티티 |
| `backend/src/main/java/com/cheonjiyeon/api/auth/EmailVerificationController.java` | 이메일 인증 엔드포인트 |
| `backend/src/main/java/com/cheonjiyeon/api/auth/EmailVerificationService.java` | 이메일 인증 로직 |
| `backend/src/main/java/com/cheonjiyeon/api/auth/PasswordResetController.java` | 비밀번호 리셋 엔드포인트 |
| `backend/src/main/java/com/cheonjiyeon/api/auth/PasswordResetService.java` | 비밀번호 리셋 로직 |
| `backend/src/main/java/com/cheonjiyeon/api/auth/PasswordResetTokenEntity.java` | 리셋 토큰 엔티티 |
| `backend/src/main/java/com/cheonjiyeon/api/auth/PasswordResetTokenRepository.java` | 리셋 토큰 레포지토리 |
| `backend/src/main/java/com/cheonjiyeon/api/auth/OAuthController.java` | 소셜 로그인 엔드포인트 |
| `backend/src/main/java/com/cheonjiyeon/api/auth/OAuthService.java` | 소셜 로그인 서비스 |
| `backend/src/main/java/com/cheonjiyeon/api/auth/SocialAccountEntity.java` | 소셜 계정 연동 엔티티 |
| `backend/src/main/java/com/cheonjiyeon/api/auth/refresh/RefreshTokenEntity.java` | 리프레시 토큰 엔티티 |
| `web/src/app/login/page.tsx` | 로그인 페이지 (소셜 로그인 버튼 포함) |
| `web/src/app/signup/page.tsx` | 회원가입 페이지 (소셜 가입 포함) |
| `web/src/app/forgot-password/page.tsx` | 비밀번호 찾기 페이지 |
| `web/src/app/reset-password/page.tsx` | 비밀번호 리셋 페이지 |
| `web/src/app/verify-email/page.tsx` | 이메일 인증 페이지 |
| `web/src/components/auth-context.tsx` | 인증 Context Provider |
| `web/src/components/api-client.ts` | API 클라이언트 (인증 관련 메서드) |
| `backend/src/main/resources/db/migration/V31__email_verification.sql` | 이메일 인증 마이그레이션 |
| `backend/src/main/resources/db/migration/V32__password_reset_tokens.sql` | 비밀번호 리셋 토큰 마이그레이션 |
| `backend/src/main/resources/db/migration/V45__social_accounts.sql` | 소셜 계정 마이그레이션 |

## Workflow

### Step 1: JWT 토큰 설정 확인

**도구:** Grep

```bash
grep -n 'JWT_SECRET\|jwt.secret\|jwtSecret' backend/src/main/java/com/cheonjiyeon/api/auth/AuthService.java backend/src/main/resources/application.yml
```

**PASS:** JWT_SECRET이 환경변수로 주입되며 기본값이 프로덕션에 안전한 값이 아님
**FAIL:** JWT_SECRET이 하드코딩되어 있거나 기본값이 위험한 값
**수정:** 환경변수 주입으로 변경

### Step 2: Refresh Token 생명주기 확인

**도구:** Grep

```bash
grep -n 'refreshToken\|RefreshToken' backend/src/main/java/com/cheonjiyeon/api/auth/AuthService.java | head -20
grep -n 'hashToken\|hash' backend/src/main/java/com/cheonjiyeon/api/auth/refresh/RefreshTokenEntity.java
```

**PASS:** Refresh Token이 해시 저장되고, 만료 시간이 설정됨
**FAIL:** 평문 저장 또는 만료 시간 미설정
**수정:** 해시 저장 + TTL 설정

### Step 3: 이메일 인증 플로우 매칭

**도구:** Grep

백엔드 엔드포인트:
```bash
grep -n '@PostMapping\|@GetMapping' backend/src/main/java/com/cheonjiyeon/api/auth/EmailVerificationController.java
```

프론트엔드 API 호출:
```bash
grep -rn 'verify-email\|email.*verif' web/src/app/verify-email/page.tsx web/src/components/api-client.ts
```

**PASS:** 인증 토큰 발송 + 검증 엔드포인트 매칭
**FAIL:** 프론트엔드에서 호출하는 API가 백엔드에 없음
**수정:** 누락된 엔드포인트 추가

### Step 4: 비밀번호 리셋 플로우 매칭

**도구:** Grep

```bash
grep -n '@PostMapping\|@GetMapping' backend/src/main/java/com/cheonjiyeon/api/auth/PasswordResetController.java
grep -rn 'reset-password\|forgot-password\|password.*reset' web/src/app/forgot-password/page.tsx web/src/app/reset-password/page.tsx
```

**PASS:** 비밀번호 리셋 요청 + 토큰 검증 + 리셋 실행 매칭
**FAIL:** 플로우 단계 누락
**수정:** 누락 단계 구현

### Step 5: 소셜 로그인 프로바이더 확인

**도구:** Grep

```bash
grep -n 'KAKAO\|NAVER\|GOOGLE\|provider' backend/src/main/java/com/cheonjiyeon/api/auth/OAuthService.java
grep -n 'kakao\|naver\|google\|social' web/src/app/login/page.tsx
```

**PASS:** 백엔드에서 지원하는 프로바이더와 프론트엔드 버튼이 일치
**FAIL:** 프론트엔드에 버튼이 있으나 백엔드에서 미지원
**수정:** 백엔드 프로바이더 추가 또는 프론트엔드 버튼 제거

### Step 6: 인증 Context 상태 관리

**도구:** Grep

```bash
grep -n 'login\|logout\|refreshToken\|me' web/src/components/auth-context.tsx | head -20
```

**PASS:** login/logout/refresh/me 함수가 모두 존재하고, API 호출과 매칭
**FAIL:** 상태 관리 함수 누락
**수정:** 누락 함수 추가

## Output Format

| 검사 | 결과 | 상세 |
|------|------|------|
| JWT 설정 | PASS/FAIL | 환경변수 주입: ... |
| Refresh Token | PASS/FAIL | 해시 저장: ... |
| 이메일 인증 | PASS/FAIL | API 매칭: ... |
| 비밀번호 리셋 | PASS/FAIL | 플로우: ... |
| 소셜 로그인 | PASS/FAIL | 프로바이더: ... |
| 인증 Context | PASS/FAIL | 상태 관리: ... |

## Exceptions

1. **Fake 이메일 서비스**: 개발 환경에서 FakeEmailService가 실제 이메일을 보내지 않는 것은 정상
2. **소셜 로그인 리다이렉트**: 개발 환경에서 OAuth 콜백 URL이 localhost인 것은 정상
3. **E2E admin bootstrap**: `AUTH_ALLOW_E2E_ADMIN_BOOTSTRAP=true` 설정으로 테스트용 admin 계정 자동 생성은 테스트 환경 전용
