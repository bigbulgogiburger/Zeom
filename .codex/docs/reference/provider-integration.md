# Provider Integration

> 참조 시점: 외부 SDK/API 통합 추가, fake↔real 전환, 환경별 동작 디버깅

## 개요

외부 의존성(결제·채팅·알림·OAuth·이메일·SMS)은 모두 **인터페이스 + fake/real 구현 + `@ConditionalOnProperty` 자동선택** 패턴. 환경 변수 한 줄로 전환되며, 미설정 시 fake가 기본 (`matchIfMissing = true`).

## 패턴 코드

```java
public interface PaymentProvider { ... }

@Component
@ConditionalOnProperty(name = "payment.provider", havingValue = "fake", matchIfMissing = true)
public class FakePaymentProvider implements PaymentProvider { ... }

@Component
@ConditionalOnProperty(name = "payment.provider", havingValue = "http")
public class HttpPaymentProvider implements PaymentProvider { ... }
```

스프링이 환경 변수에 따라 **하나의 빈만** 컨텍스트에 등록 → 서비스 코드는 인터페이스만 주입받아 변경 불필요.

## Provider 매트릭스

| 영역 | 인터페이스 | Fake 구현 | Real 구현 | 환경 변수 (값) |
|------|-----------|-----------|-----------|----------------|
| 결제 | `payment/provider/PaymentProvider` | `FakePaymentProvider` | `HttpPaymentProvider` (PortOne 위임) | `PAYMENT_PROVIDER` (`fake`\|`http`) |
| 채팅/통화 | `chat/provider/ChatProvider` | `FakeChatProvider` | `HttpChatProvider` (Sendbird 위임) | `CHAT_PROVIDER` (`fake`\|`http`) |
| 알림 | `notification/provider/NotificationProvider` | `FakeNotificationProvider` | `HttpNotificationProvider` | `NOTIFICATION_PROVIDER` (`fake`\|`http`) |
| OAuth | `oauth/OAuthProvider` | `FakeOAuthProvider` | `KakaoOAuthProvider`, `NaverOAuthProvider` | `OAUTH_PROVIDER` (`fake`\|`kakao`\|`naver`) |
| 이메일 | (서비스 클래스) | `FakeEmailService` | (미구현 — fake만) | `EMAIL_PROVIDER` (`fake`) |
| SMS | (서비스 클래스) | `FakeSmsService` | `AligoSmsService` | `SMS_PROVIDER` (`fake`\|`aligo`) |

## 레시피: 새 외부 의존성 추가

1. `domain/provider/XxxProvider.java` 인터페이스 정의 (호출 시그니처는 도메인 언어로 — SDK 타입 노출 X)
2. `FakeXxxProvider` 작성 — 메모리에 결과 저장 또는 고정 응답
3. `HttpXxxProvider` (또는 SDK wrapper) — 실 호출, 예외는 도메인 예외로 변환
4. 둘 다 `@ConditionalOnProperty` 부착 — fake에 `matchIfMissing = true`
5. `application.yml` 에 `xxx.provider: ${XXX_PROVIDER:fake}` 추가
6. `.env.example` 에 키 추가 (값 X)

## 레시피: fake → real 전환 (운영 배포)

```bash
# .env / 배포 시크릿
PAYMENT_PROVIDER=http
PORTONE_API_KEY=...
PORTONE_API_SECRET=...
PORTONE_STORE_ID=...
PORTONE_WEBHOOK_SECRET=...

CHAT_PROVIDER=http
SENDBIRD_APP_ID=...
SENDBIRD_API_TOKEN=...

NOTIFICATION_PROVIDER=http
NOTIFICATION_HTTP_BASE_URL=...
NOTIFICATION_HTTP_API_KEY=...
```

## 의사결정 트리

| 상황 | 선택 |
|------|------|
| 통합 테스트 (`@SpringBootTest`) | fake 유지 — 실 SDK 호출 X |
| 스테이징 환경 | real provider + Sendbird/PortOne 테스트 계정 |
| 로컬 통화 디버깅 | `CHAT_PROVIDER=http` + 본인 Sendbird app id |
| CI 빌드 | 모두 fake (env 미설정 → matchIfMissing) |

## 함정 / 안티패턴

- ❌ 서비스에서 `SendbirdClient` / `PortOneClient` 직접 주입 → ✅ `ChatProvider` / `PaymentProvider` 인터페이스 주입 (테스트 격리)
- ❌ Real 구현이 SDK 예외를 그대로 throw → ✅ `ApiException` 또는 도메인 예외로 변환 (호출자 코드가 SDK 모름)
- ❌ fake에서 매번 새 ID 발급 (테스트 간 누수) → ✅ `@PostConstruct` 또는 `@BeforeEach` 로 리셋 가능한 상태
- ❌ 환경 변수 키를 `application.yml` 에 하드코딩 → ✅ `${VAR:default}` 형식으로 fallback 명시

## 검증 방법

- 빈 등록 확인: `./gradlew bootRun --args='--debug'` 후 `XxxProvider` 검색 — 단일 빈만 등록되어야 함
- 통합 테스트 (`./gradlew test`) 가 fake 로 모두 통과해야 함 (real 의존성 없이)
- 환경 변수 토글: `PAYMENT_PROVIDER=http ./gradlew bootRun` 시 `HttpPaymentProvider` 로 교체되는지 로그 확인
