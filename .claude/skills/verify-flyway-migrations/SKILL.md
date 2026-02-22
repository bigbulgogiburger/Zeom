---
name: verify-flyway-migrations
description: Flyway DB 마이그레이션과 JPA Entity 일관성 검증. 마이그레이션 추가/수정 후 사용.
---

## Purpose

1. Flyway 마이그레이션 버전 번호가 연속적이고 gap이 없는지 검증
2. 마이그레이션 SQL의 테이블/컬럼이 JPA Entity와 일치하는지 검증
3. 명명 규칙(plural snake_case, FK/index prefix)이 일관적인지 검증
4. 테스트 전용 마이그레이션(V99)이 test 디렉토리에만 있는지 검증

## When to Run

- 새 Flyway 마이그레이션 SQL 파일 추가 후
- JPA Entity 필드를 변경한 후
- DB 스키마 관련 기능 구현 후
- `backend/src/main/resources/db/migration/` 파일 변경 시
- `backend/src/main/java/com/cheonjiyeon/api/**/*Entity.java` 변경 시

## Related Files

| File | Purpose |
|------|---------|
| `backend/src/main/resources/db/migration/V*.sql` | Flyway 마이그레이션 파일 (V1~V57) |
| `backend/src/test/resources/db/migration/V99__test_extra_slots.sql` | 테스트 전용 마이그레이션 |
| `backend/src/main/resources/application.yml` | Flyway 설정 (enabled, ddl-auto: none) |
| `backend/src/main/java/com/cheonjiyeon/api/auth/UserEntity.java` | users 테이블 |
| `backend/src/main/java/com/cheonjiyeon/api/auth/PasswordResetTokenEntity.java` | password_reset_tokens 테이블 (V32) |
| `backend/src/main/java/com/cheonjiyeon/api/auth/SocialAccountEntity.java` | social_accounts 테이블 (V45) |
| `backend/src/main/java/com/cheonjiyeon/api/counselor/CounselorEntity.java` | counselors 테이블 |
| `backend/src/main/java/com/cheonjiyeon/api/counselor/SlotEntity.java` | counselor_slots 테이블 |
| `backend/src/main/java/com/cheonjiyeon/api/counselor/FavoriteCounselorEntity.java` | favorite_counselors 테이블 (V37) |
| `backend/src/main/java/com/cheonjiyeon/api/counselor/CounselorBankAccountEntity.java` | counselor_bank_accounts 테이블 (V33) |
| `backend/src/main/java/com/cheonjiyeon/api/counselor/CounselorApplicationEntity.java` | counselor_applications 테이블 (V40) |
| `backend/src/main/java/com/cheonjiyeon/api/booking/BookingEntity.java` | bookings 테이블 |
| `backend/src/main/java/com/cheonjiyeon/api/booking/BookingSlotEntity.java` | booking_slots 테이블 |
| `backend/src/main/java/com/cheonjiyeon/api/wallet/WalletEntity.java` | wallets 테이블 |
| `backend/src/main/java/com/cheonjiyeon/api/cash/CashTransactionEntity.java` | cash_transactions 테이블 |
| `backend/src/main/java/com/cheonjiyeon/api/consultation/ConsultationSessionEntity.java` | consultation_sessions 테이블 |
| `backend/src/main/java/com/cheonjiyeon/api/review/ReviewEntity.java` | reviews 테이블 |
| `backend/src/main/java/com/cheonjiyeon/api/refund/RefundEntity.java` | refunds 테이블 |
| `backend/src/main/java/com/cheonjiyeon/api/dispute/DisputeEntity.java` | disputes 테이블 |
| `backend/src/main/java/com/cheonjiyeon/api/credit/CreditEntity.java` | consultation_credits 테이블 |
| `backend/src/main/java/com/cheonjiyeon/api/product/ProductEntity.java` | products 테이블 |
| `backend/src/main/java/com/cheonjiyeon/api/notification/NotificationEntity.java` | notifications 테이블 (V34) |
| `backend/src/main/java/com/cheonjiyeon/api/notification/NotificationLogEntity.java` | notification_logs 테이블 (V36) |
| `backend/src/main/java/com/cheonjiyeon/api/notification/NotificationPreferenceEntity.java` | notification_preferences 테이블 (V35, V47) |
| `backend/src/main/java/com/cheonjiyeon/api/coupon/CouponEntity.java` | coupons 테이블 (V43) |
| `backend/src/main/java/com/cheonjiyeon/api/coupon/CouponUsageEntity.java` | coupon_usages 테이블 (V43) |
| `backend/src/main/java/com/cheonjiyeon/api/referral/ReferralCodeEntity.java` | referral_codes 테이블 (V44) |
| `backend/src/main/java/com/cheonjiyeon/api/referral/ReferralRewardEntity.java` | referral_rewards 테이블 (V44) |
| `backend/src/main/java/com/cheonjiyeon/api/chat/ChatMessageEntity.java` | chat_messages 테이블 (V46) |
| `backend/src/main/java/com/cheonjiyeon/api/settlement/CounselorSettlementEntity.java` | counselor_settlements 테이블 (V50) |
| `backend/src/main/java/com/cheonjiyeon/api/fortune/FortuneEntity.java` | daily_fortunes 테이블 (V53, V57 확장) |
| `backend/src/main/java/com/cheonjiyeon/api/fortune/SajuChartEntity.java` | saju_charts 테이블 (V56) |

## Workflow

### Step 1: 마이그레이션 버전 연속성 확인

**도구:** Bash

```bash
ls backend/src/main/resources/db/migration/V*.sql | sed 's/.*V\([0-9]*\)__.*/\1/' | sort -n
```

**PASS:** 버전 번호가 연속적 (V20 gap은 기존 알려진 이슈, 허용)
**FAIL:** 예기치 않은 gap이나 중복 버전이 발견됨
**수정:** 누락된 버전 추가 또는 중복 버전 리네이밍

### Step 2: 마이그레이션 파일명 규칙 확인

**도구:** Glob, Grep

```bash
ls backend/src/main/resources/db/migration/ | grep -v '^V[0-9]*__[a-z_]*\.sql$'
```

**PASS:** 모든 파일이 `V{N}__{snake_case_description}.sql` 형식
**FAIL:** 대문자, 하이픈, 또는 잘못된 형식의 파일명 발견
**수정:** 파일명을 snake_case로 변경

### Step 3: JPA Entity @Table 이름과 마이그레이션 테이블 매칭

**도구:** Grep

Entity의 `@Table(name = "...")` 값을 추출하고, 마이그레이션 SQL의 `CREATE TABLE` 문과 비교:

```bash
grep -rn '@Table(name' backend/src/main/java/com/cheonjiyeon/api/ | sed 's/.*name = "\(.*\)".*/\1/' | sort
```

```bash
grep -rn 'CREATE TABLE' backend/src/main/resources/db/migration/ | sed 's/.*CREATE TABLE \([a-z_]*\).*/\1/' | sort
```

**PASS:** 모든 Entity의 테이블 이름이 마이그레이션에 존재
**FAIL:** Entity 테이블 이름이 마이그레이션에 없거나, 마이그레이션 테이블이 Entity 없이 존재
**수정:** 누락된 마이그레이션 추가 또는 Entity의 @Table 이름 수정

### Step 4: Hibernate ddl-auto가 none인지 확인

**도구:** Grep

```bash
grep -A 2 'ddl-auto' backend/src/main/resources/application.yml
```

**PASS:** `ddl-auto: none`
**FAIL:** `ddl-auto`가 `update`, `create`, `create-drop` 등으로 설정됨
**수정:** `ddl-auto: none`으로 변경 (Flyway에 위임)

### Step 5: 테스트 마이그레이션 분리 확인

**도구:** Glob

```bash
ls backend/src/test/resources/db/migration/V*.sql
ls backend/src/main/resources/db/migration/V*test*.sql 2>/dev/null
```

**PASS:** 테스트 마이그레이션이 `src/test/resources/db/migration/`에만 존재
**FAIL:** main/resources에 테스트 데이터 마이그레이션이 존재 (V21은 기존 알려진 이슈)
**수정:** 테스트 데이터를 test 디렉토리로 이동

### Step 6: FK/Index 명명 규칙 확인

**도구:** Grep

```bash
grep -n 'CONSTRAINT\|CREATE INDEX' backend/src/main/resources/db/migration/V*.sql
```

**PASS:** FK는 `fk_{table}_{relation}`, Index는 `idx_{table}_{column}` 형식
**FAIL:** 일관되지 않은 명명 패턴 발견
**수정:** 새 마이그레이션에서 ALTER로 이름 수정

### Step 7: MySQL 호환성 검증

**도구:** Grep, Bash

H2에서는 통과하지만 MySQL 8.0에서 실패하는 비호환 SQL 패턴을 검출한다.

**1. CREATE INDEX IF NOT EXISTS 금지**: MySQL 8.0은 CREATE INDEX에서 IF NOT EXISTS를 지원하지 않음

```bash
grep -rn "CREATE INDEX IF NOT EXISTS" backend/src/main/resources/db/migration/V*.sql
```

**PASS**: 해당 패턴 없음
**FAIL**: MySQL에서 마이그레이션 실패 — 프로시저로 감싸거나 INFORMATION_SCHEMA 체크 필요

**2. ALTER COLUMN SET NULL 금지**: MySQL에서는 `ALTER TABLE ... ALTER COLUMN ... SET NULL` 대신 `MODIFY COLUMN` 사용

```bash
grep -rn "ALTER COLUMN.*SET NULL\|ALTER COLUMN.*SET DEFAULT" backend/src/main/resources/db/migration/V*.sql
```

**PASS**: 해당 패턴 없음
**FAIL**: MySQL에서 구문 오류 — `MODIFY COLUMN <name> <full_type> NULL` 으로 변경

**3. ADD COLUMN IF NOT EXISTS 금지**: MySQL 8.0은 ADD COLUMN에서 IF NOT EXISTS를 지원하지 않음

```bash
grep -rn "ADD COLUMN IF NOT EXISTS" backend/src/main/resources/db/migration/V*.sql
```

**PASS**: 해당 패턴 없음
**FAIL**: MySQL에서 마이그레이션 실패 — 프로시저 사용 필요

**예외**: H2 전용 테스트 마이그레이션 파일(`src/test/resources/db/migration/`)은 이 검증 대상에서 제외

## Output Format

| 검사 | 결과 | 상세 |
|------|------|------|
| 버전 연속성 | PASS/FAIL | 누락 버전: ... |
| 파일명 규칙 | PASS/FAIL | 위반 파일: ... |
| Entity-Migration 매칭 | PASS/FAIL | 불일치: ... |
| ddl-auto 설정 | PASS/FAIL | 현재 값: ... |
| 테스트 마이그레이션 분리 | PASS/FAIL | 위치: ... |
| FK/Index 명명 | PASS/FAIL | 위반: ... |
| MySQL 호환성 | PASS/FAIL | 비호환 패턴: ... |

## Exceptions

1. **V20 gap**: V19 → V21 사이의 gap은 기존 알려진 이슈이며 위반이 아님
2. **V21 테스트 데이터**: `V21__add_test_counselor_slots.sql`이 main에 있는 것은 기존 이슈이며 즉시 수정 불필요
3. **H2 MODE=MySQL 차이**: H2와 MySQL 간의 미세한 SQL 차이는 위반이 아님 (예: AUTO_INCREMENT 지원)
4. **V31~V53 다중 테이블 마이그레이션**: 하나의 마이그레이션 파일에 여러 CREATE TABLE이 포함되는 것은 관련 테이블 그룹의 경우 허용 (예: V43 coupons + coupon_usages)
5. **ALTER TABLE 마이그레이션**: V50~V52처럼 기존 테이블에 컬럼/인덱스를 추가하는 마이그레이션은 대응 Entity가 이미 존재하므로 별도 Entity 생성 불필요
