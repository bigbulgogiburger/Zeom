# Database & Migrations

> 참조 시점: 스키마 변경, Flyway 마이그레이션 추가, JPA Entity 동기화

## 개요

Flyway 단일 소스 — JPA `ddl-auto: none`. **이미 적용된 마이그레이션은 절대 수정 금지** (체크섬 불일치로 부팅 실패). 변경 필요 시 새 버전 추가. dev/test는 H2 in-memory, prod는 MySQL 8.

현재 V1–V60 (계속 증가).

## 위치

```
backend/src/main/resources/db/migration/V<n>__<desc>.sql
```

네이밍: `V<숫자>__<snake_case>.sql` (밑줄 두 개 — Flyway 규약).

## 최근 흐름 (예시)

| 버전 | 설명 |
|------|------|
| V56 | `saju_charts_table.sql` |
| V57 | `alter_daily_fortunes_add_saju_fields.sql` |
| V58 | `counselor_profile_expansion.sql` |
| V59 | `signup_bonus_credits.sql` |
| V60 | `review_enhancements.sql` |

## 레시피: 새 마이그레이션 추가

1. 다음 버전 번호 결정 (`ls db/migration | tail -1` 후 +1)
2. `V<n>__<설명>.sql` 작성 — H2 + MySQL 양쪽에서 동작해야 함
3. JPA Entity가 영향받으면 동시 갱신 (필드 추가/제거)
4. 로컬: `cd backend && ./gradlew bootRun` — Flyway 자동 실행, 부팅 성공 확인
5. 통합 테스트: `./gradlew test` — H2에서 모든 마이그레이션 재적용

## 레시피: 적용된 마이그레이션 수정 필요할 때

수정 X. 새 버전 추가:

```sql
-- V61__fix_review_helpful_count_default.sql
ALTER TABLE reviews MODIFY COLUMN helpful_count INT NOT NULL DEFAULT 0;
```

## 레시피: H2/MySQL 호환 SQL

```sql
-- ✅ 양쪽 호환
ALTER TABLE reviews ADD COLUMN photo_urls VARCHAR(2000);
CREATE INDEX idx_reviews_user ON reviews(user_id);

-- ❌ MySQL 미지원 (Docker MySQL에서 실패)
CREATE INDEX IF NOT EXISTS idx_x ON ...

-- ❌ H2에서 동작 다름
ENUM(...) -- VARCHAR + CHECK 사용 권장
```

## 의사결정 트리

| 상황 | 선택 |
|------|------|
| 컬럼 추가 | `ALTER TABLE ... ADD COLUMN`, NULL 허용 또는 기본값 |
| NOT NULL 컬럼 추가 (기존 행 있음) | 1) 컬럼 추가 (NULL 허용) 2) 백필 UPDATE 3) NOT NULL 변경 — **3개 마이그레이션 분리** |
| 컬럼 제거 | 단일 PR에 하지 말 것 — 1) JPA에서 제거 + 배포 2) 다음 마이그레이션에서 DROP |
| 인덱스 추가 (대용량) | MySQL 온라인 DDL 확인 — 운영 배포 시간 영향 |
| Entity만 변경 | ❌ 작동 X — `ddl-auto: none` 이라 Flyway 미통과 시 schema 불일치 발생 |

## 함정 / 안티패턴

- ❌ 적용된 V<n> 파일 수정 → 부팅 시 `FlywayException: Migration checksum mismatch`
- ❌ `CREATE INDEX IF NOT EXISTS` (MySQL 8 미지원) → ✅ `CREATE INDEX` + 사전 존재 확인 X (마이그레이션은 1회만 실행)
- ❌ Entity 추가 후 마이그레이션 누락 → 컬럼 없는 채로 SELECT 실행 시 런타임 에러
- ❌ 같은 버전 번호 충돌 (브랜치 두 개에서 동시 V61 생성) → 머지 시 한쪽 rebase + 번호 변경

## 검증 방법

- `cd backend && ./gradlew bootRun` — Flyway 부팅 통과 (H2)
- `cd backend && ./gradlew test` — 전체 마이그레이션 재적용 + 통합 테스트
- Docker MySQL: `docker compose up backend` — MySQL 호환성 검증
- 스킬: `.claude/skills/verify-flyway-migrations/` (Entity ↔ 스키마 일치 검증)
