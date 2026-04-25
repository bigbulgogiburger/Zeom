# Security Checklist

> 참조 시점: 인증/인가 변경, admin 엔드포인트 추가, CORS·세션·결제 멱등성 작업

## 개요

JWT(쿠키 + Authorization 헤더 양립) + 역할 기반 admin 가드 + Redis 분산락 + 결제 멱등성. 신규 admin/payment/wallet 엔드포인트 추가 시 이 체크리스트 통과 필수.

## 인증 흐름

`config/CookieAuthFilter.java` — 가장 높은 우선순위 필터:
1. `Authorization` 헤더 있으면 그대로 통과
2. 없으면 `access_token` 쿠키 → `Authorization: Bearer <token>` 으로 변환
3. 다음 필터에서 JWT 검증

→ 클라이언트는 쿠키 또는 헤더 어느 쪽이든 사용 가능 (Web은 쿠키, Flutter는 헤더).

## 관리자 가드

```java
// auth/AuthService.java line 266
public UserEntity requireAdmin(String bearerToken) {
    UserEntity user = resolveUser(extractToken(bearerToken));
    if (!"ADMIN".equals(user.getRole())) throw new ApiException(403, "...");
    return user;
}
```

**모든 admin 컨트롤러 첫 줄에 호출**:
```java
// admin/AdminAuditController.java line 33
authService.requireAdmin(authHeader);
```

신규 `/api/v1/admin/**` 엔드포인트 추가 시 이 호출 누락은 즉시 권한 우회 — 코드 리뷰에서 가장 많이 잡히는 실수.

## 결제 멱등성

`cash_transactions` 테이블에 unique 키:
```sql
-- V11__cash_transactions.sql
idempotency_key VARCHAR(200) NOT NULL UNIQUE
CREATE INDEX idx_cash_tx_idempotency ON cash_transactions(idempotency_key);
```

`WalletService.charge()` 가 키 생성:
```java
String key = "charge-" + refType + "-" + refId + "-" + UUID.randomUUID();
```

→ 동일 webhook 재전송이나 retry 시 **두 번째 INSERT가 unique constraint 위반** → 안전하게 차단.

## 분산락 (Redis)

`lock/DistributedLock.java`:
```java
@ConditionalOnProperty(name = "redis.enabled", havingValue = "true")
public <T> T executeWithLock(String lockKey, Supplier<T> supplier);  // Redisson RLock 위임
```

설정: `redis.lock.wait-time-ms`, `redis.lock.lease-time-ms`.

**사용 케이스**: 잔액 차감, 슬롯 예약 (동시성 충돌 가능 영역).

## CORS

`config/CorsConfig.java`:
- 패턴: `/api/**`
- 메서드: `GET, POST, PUT, DELETE, OPTIONS`
- 헤더: `Authorization, Content-Type, X-Webhook-Secret, X-CSRF-Token`
- `allowCredentials(true)` (쿠키 인증 허용 → origin 와일드카드 X)
- `maxAge(3600)`

신규 origin 추가 시 운영 환경의 도메인 명시 — 와일드카드 + credentials 조합은 브라우저가 차단.

## OAuth 흐름

`OAUTH_PROVIDER` env 로 fake/kakao/naver 전환. 토큰은 백엔드에서 검증 후 자체 JWT 발급 — 클라이언트는 OAuth 토큰을 보관하지 않음.

## 신규 엔드포인트 체크리스트

- [ ] 인증 필요한가? — JWT 필터 통과 경로 확인
- [ ] admin 전용? — `authService.requireAdmin(authHeader)` 첫 줄 호출
- [ ] 외부 webhook? — `X-Webhook-Secret` 검증 (CORS 헤더 허용 목록 포함)
- [ ] 결제·잔액·재화 변경? — 멱등성 키 + `idempotency_key` 컬럼 활용
- [ ] 동시성 위험? — `DistributedLock.executeWithLock(...)` 으로 감싸기
- [ ] CSRF? — 쿠키 인증 사용 페이지면 `X-CSRF-Token` 검증
- [ ] 입력 검증 — `@Valid` + Bean Validation
- [ ] 에러 응답 — `ApiException` 사용 (스택트레이스 누설 X)

## 함정 / 안티패턴

- ❌ admin 엔드포인트에 `requireAdmin` 누락 → 일반 사용자 권한 우회
- ❌ webhook 엔드포인트에 JWT 강제 → 외부 호출 차단됨 (시크릿 헤더 검증으로 분리)
- ❌ 결제 webhook 재처리 보호 누락 → 잔액 중복 적립
- ❌ CORS 와일드카드 + credentials → 브라우저가 차단, 운영에서만 발견
- ❌ JWT 시크릿 hardcoding → ✅ `JWT_SECRET` env (32+ chars)

## 검증 방법

- 스킬: `.claude/skills/verify-admin-auth/`, `.claude/skills/verify-auth-system/`
- 통합: `./gradlew test --tests '*Auth*' --tests '*Admin*'`
- 수동: admin 엔드포인트에 일반 사용자 토큰으로 호출 → 403 응답 확인
