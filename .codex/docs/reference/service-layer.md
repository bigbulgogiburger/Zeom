# Service Layer Patterns

> 참조 시점: 백엔드 도메인 서비스 추가/수정, 트랜잭션 경계 결정, 예외 처리

## 개요

컨트롤러 → 서비스 → 리포지토리 + Provider 의 3+1 레이어. 트랜잭션 경계는 **서비스 메서드**, 컨트롤러는 트랜잭션 X. 모든 도메인 예외는 `ApiException(int status, String message)` 로 통일 — `GlobalExceptionHandler` 가 JSON 응답으로 변환.

## 표준 시그니처 패턴

```java
@Service
@RequiredArgsConstructor
public class XxxService {

    private final XxxRepository repo;
    private final SomeProvider provider;  // 외부 통합은 인터페이스로

    @Transactional
    public XxxDto create(Long actorId, CreateXxxRequest req) {
        validate(req);                           // 입력 검증 → ApiException(400, ...)
        var entity = repo.save(buildEntity(req)); // 영속화 우선
        provider.notify(entity);                 // 부수 효과 (실패 보상 전략)
        return XxxDto.from(entity);
    }
}
```

## 대표 서비스

### PaymentService (`payment/PaymentService.java`)
- `PaymentResponse create(Long actorId, CreatePaymentRequest req)` — 결제 의도 생성
- `PaymentResponse confirm(Long actorId, Long paymentId)` — webhook 후 확정

**보상 전략**: 결제는 **DB 먼저 영속화**, 후속 챗 채널 생성/알림 발송 실패는 `*_retry_needed` 플래그 + 웹훅 알림 → 스케줄러가 재시도.

### WalletService (`wallet/WalletService.java`)
- `WalletEntity getOrCreateWallet(Long userId)` — idempotent
- `void charge(Long userId, Long amount, String refType, Long refId)` — 멱등성 키: `"charge-" + refType + "-" + refId + "-" + UUID`

**동시성**: 잔액 변경은 분산락(`DistributedLock`) 또는 DB 비관락. 단일 인스턴스면 트랜잭션만으로 충분, 다중 인스턴스 시 Redis 락 필수.

### ConsultationSessionService (`consultation/ConsultationSessionService.java`)
- `startSession(Long reservationId)` — **idempotent**: 기존 세션 있으면 그대로 반환 (Sendbird 가이드 참조)
- `endSession(Long sessionId, String endReason)` — 종료 + 정산 트리거

## 예외 처리

```java
// common/ApiException.java
throw new ApiException(403, "ADMIN 권한 필요");

// common/GlobalExceptionHandler.java 가 자동 매핑:
// → 응답: { "error": true, "status": 403, "message": "ADMIN 권한 필요" }
```

처리되는 타입:
- `ApiException` → 지정 상태 + 메시지
- `MethodArgumentNotValidException` (Bean Validation) → 400 + 필드 에러 요약
- 그 외 `Exception` → 500 (스택트레이스 로깅, 메시지는 sanitize)

## 의사결정 트리

| 상황 | 선택 |
|------|------|
| 서비스 메서드 1개에 외부 호출 + DB 쓰기 | `@Transactional` + 외부 호출은 마지막 (또는 별도 `@Transactional(propagation = REQUIRES_NEW)`) |
| 외부 호출 실패 시 DB 롤백 원함 | 같은 트랜잭션에 묶기 (`@Transactional` 단일) |
| 외부 호출 실패해도 DB 유지 (보상 전략) | 트랜잭션 커밋 후 호출 + 실패 시 retry 큐 |
| 도메인 검증 실패 | `ApiException(400, ...)` |
| 권한 부족 | `ApiException(403, ...)` (또는 `AuthService.requireAdmin`) |
| 리소스 없음 | `ApiException(404, ...)` |
| 외부 SDK 예외 | catch 후 `ApiException(502, ...)` 변환 (호출자가 SDK 모름) |

## 함정 / 안티패턴

- ❌ 컨트롤러에 `@Transactional` → ✅ 서비스에서 트랜잭션 (테스트/재사용 용이)
- ❌ Real provider 예외를 그대로 throw → ✅ catch + `ApiException` 으로 변환
- ❌ DTO ↔ Entity 변환을 컨트롤러에서 → ✅ DTO `from(entity)` static factory (서비스 또는 DTO 자체)
- ❌ `Optional.get()` 직접 호출 → ✅ `.orElseThrow(() -> new ApiException(404, ...))`
- ❌ 결제·정산을 외부 호출과 같은 트랜잭션에 묶기 → ✅ DB 우선 커밋 + 보상 전략
- ❌ N+1 쿼리 (lazy fetch in loop) → ✅ `@EntityGraph` 또는 fetch join

## 검증 방법

- 통합: `./gradlew test --tests '*<Domain>Service*'`
- 트랜잭션 경계: `@Transactional` 빠진 서비스 메서드는 IDE inspection 또는 코드 리뷰
- 예외 매핑: 컨트롤러 통합 테스트로 status code 검증
