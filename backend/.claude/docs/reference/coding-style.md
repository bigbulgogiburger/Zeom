# Backend Coding Style

> **Sub affinity**: backend 전용 (Spring Boot 3.5 · Java 21)
> 참조 시점: 신규 Service/Controller/Entity/DTO 작성, 기존 코드 수정 시 컨벤션 확인

## 언어/툴체인

- **Java 21** (`languageVersion = 21`) — records, pattern matching, sealed 사용 가능
- **Lombok 미사용** — 모든 boilerplate 는 직접 작성 (build.gradle 에 의존성 X). PR 에서 Lombok 추가 금지
- **Checkstyle/Spotless 미설정** — IDE 기본 포맷 + 본 문서 컨벤션
- 패키지: `com.cheonjiyeon.api.<domain>` — 한 도메인 = 한 패키지

## 클래스 패턴

### Service (`@Service`)

```java
@Service
public class XxxService {

    private final XxxRepository repo;
    private final SomeProvider provider;  // 외부 통합은 인터페이스

    public XxxService(XxxRepository repo, SomeProvider provider) {
        this.repo = repo;
        this.provider = provider;
    }

    @Transactional
    public XxxDto create(Long actorId, CreateXxxRequest req) {
        if (req.name() == null) throw new ApiException(400, "name 필수");
        var entity = repo.save(buildEntity(req));
        provider.notify(entity);  // 보상 전략 대상이면 트랜잭션 후
        return XxxDto.from(entity);
    }
}
```

- 생성자 주입만 — `@Autowired` 필드/세터 주입 금지
- `final` 필드 — 불변
- 트랜잭션은 **서비스 메서드** — 컨트롤러에 `@Transactional` 금지

### Entity (JPA)

```java
@Entity
@Table(name = "users")
public class UserEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 200)
    private String email;
    // ...
}
```

- `public class XxxEntity` — 접미사 `Entity` 통일
- `@Table(name = "snake_case")` 명시
- `@Column(nullable = ..., unique = ..., length = ...)` 명시 — Flyway 스키마와 일치 (단일 SSoT 는 Flyway)

### DTO (`record`)

```java
public class AuthDtos {
    public record SignupRequest(@NotBlank String email,
                                @NotBlank @Size(min = 8) String password,
                                String name) {}

    public record UserResponse(Long id, String email, String name, String role) {
        public static UserResponse from(UserEntity u) {
            return new UserResponse(u.getId(), u.getEmail(), u.getName(), u.getRole());
        }
    }
}
```

- DTO 는 **record** 우선 (Java 16+ 표준)
- 한 도메인 DTO 모음은 `XxxDtos` outer class 에 nested record 로 (auth/AuthDtos.java 패턴)
- Entity ↔ DTO 변환은 `static from(entity)` factory — 서비스/컨트롤러 양쪽에서 호출

### Controller

```java
@RestController
@RequestMapping("/api/v1/xxx")
public class XxxController {

    private final XxxService service;
    private final AuthService authService;

    public XxxController(XxxService service, AuthService authService) {
        this.service = service;
        this.authService = authService;
    }

    @PostMapping
    public ResponseEntity<XxxResponse> create(
        @RequestHeader(name = "Authorization", required = false) String authHeader,
        @Valid @RequestBody CreateXxxRequest req
    ) {
        UserEntity actor = authService.requireUser(authHeader);
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(actor.getId(), req));
    }
}
```

- 컨트롤러는 트랜잭션 X (서비스 위임)
- `/api/v1/admin/**` 은 **첫 줄에 `authService.requireAdmin(authHeader)`** (security-checklist.md)
- `@Valid` + Bean Validation — DTO 의 `@NotBlank` 등이 자동 동작

## 예외 처리

- 도메인 예외는 모두 `ApiException(int status, String message)` (common 패키지)
- `GlobalExceptionHandler` 가 자동 매핑 → `{ "error": true, "status": ..., "message": ... }`
- SDK/외부 예외는 catch 후 `ApiException(502, ...)` 변환 — 호출자가 SDK 모름
- `Optional.get()` 직접 호출 금지 → `.orElseThrow(() -> new ApiException(404, ...))`

## Naming

| 종류 | 규칙 | 예시 |
|------|------|------|
| Class | `PascalCase` + 접미사 | `XxxService`, `XxxController`, `XxxEntity`, `XxxRepository`, `XxxProvider`, `XxxDtos` |
| Record DTO | `PascalCase` | `CreateXxxRequest`, `XxxResponse` |
| Field/Variable/Method | `camelCase` | `actorId`, `findByEmail` |
| Constant | `UPPER_SNAKE` | `DEFAULT_TIMEOUT_MS` |
| Package | `lowercase` | `com.cheonjiyeon.api.payment.provider` |
| DB column | `snake_case` | `created_at`, `user_id` |
| API path | `kebab-case` segments | `/api/v1/refresh-tokens` |

## Import 정렬

JDK → 외부 (Spring, Jackson, ...) → `com.cheonjiyeon.*`. 각 그룹 간 빈 줄 1.

## 금지

- ❌ Lombok (`@RequiredArgsConstructor`, `@Data` 등) — 의존성 미선언, 직접 작성
- ❌ 컨트롤러에 `@Transactional`
- ❌ Field/Setter 주입
- ❌ DTO 를 일반 class 로 작성 — record 사용
- ❌ JPA `ddl-auto: update` — `none` 만 (Flyway 단일 SSoT)
- ❌ Real provider 예외 throw — `ApiException` 으로 변환
- ❌ `System.out.println` — `org.slf4j.Logger` (SLF4J)

## 관련 reference

- `service-layer.md` — 트랜잭션 경계 + 보상 전략 + 예외 매핑 디테일
- `api-layer.md` — 도메인 패키지 layout + 엔드포인트 인벤토리
- `database-migrations.md` — Flyway 단일 SSoT 정책
- `security-checklist.md` — admin 가드 + 멱등성 + CORS
