# Backend Testing

> **Sub affinity**: backend 전용
> 참조 시점: 백엔드 통합/단위 테스트 작성·수정·실행

## 개요

JUnit 5 + Spring Boot Test + `TestRestTemplate`. **31 통합 테스트 클래스** 가 컨트롤러·서비스를 커버. H2 in-memory DB, 모든 provider 는 fake (env 미설정 → `matchIfMissing=true`).

## 실행

```bash
./gradlew test                              # 전체 (31 클래스)
./gradlew test --tests '*AuthSession*'      # 단일 클래스 / 패턴
./gradlew test --tests '*Auth*' --tests '*Admin*'  # 다중 패턴
./gradlew compileJava                       # 빌드만
```

## 패턴

### 통합 테스트 (`@SpringBootTest`)

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class XxxControllerTest {
    @Autowired TestRestTemplate rest;

    @Test
    void create_returns_201() {
        var res = rest.postForEntity("/api/v1/xxx", new XxxRequest(...), XxxResponse.class);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.CREATED);
    }
}
```

### Auth/Admin 테스트

- E2E admin 부트스트랩: `AUTH_ALLOW_E2E_ADMIN_BOOTSTRAP=true` 필요 시 환경변수로 활성
- JWT 헤더 또는 쿠키 (CookieAuthFilter 가 양립) — 테스트 helper 로 토큰 발급 후 `setAuthHeaders` 헬퍼 사용

### Provider 검증

통합 테스트는 fake provider 로 모두 통과해야 함. Real provider 호출이 들어간 테스트는 격리 깨짐 — `provider-integration.md` 의 환경 변수 토글 패턴 참조.

## 함정

- ❌ `@MockBean` 으로 Repository 모킹 → ✅ H2 + Flyway 실행으로 실제 SQL 검증
- ❌ admin 엔드포인트 테스트에 일반 사용자 토큰만 사용 → 403 케이스 누락. positive + negative 둘 다
- ❌ 트랜잭션 의존하지 않는 보상 전략 (결제 `*_retry_needed` 등) 을 `@Transactional` 테스트로 래핑 → 실제 동작 못 잡음. `@Transactional(propagation = NOT_SUPPORTED)` 또는 `@Rollback(false)`
- ❌ 마이그레이션 V<n> 추가 후 테스트 미실행 → CI 까지 가서 발견. 로컬에서 `./gradlew test` 먼저

## 관련 reference

- `api-layer.md` — 엔드포인트 contract
- `service-layer.md` — 트랜잭션 경계 + 예외 매핑
- `database-migrations.md` — H2/MySQL 호환 SQL
- `provider-integration.md` — fake/real 토글
- `security-checklist.md` — admin/auth 가드 검증
