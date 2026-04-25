---
paths:
  - "backend/src/main/resources/db/migration/V*.sql"
---

# Flyway Migration Safety

이 파일을 편집/조회 중이라면 다음 규칙이 적용됩니다.

- **이미 적용된 마이그레이션 파일은 절대 수정 금지** — Flyway 체크섬 불일치로 부팅 실패. 변경이 필요하면 새 버전(`V<next>__fix_xxx.sql`)을 추가하세요.
- **버전 번호 충돌 주의** — 브랜치 작업 시 `git fetch origin && ls db/migration | tail -3` 으로 최신 번호 확인 후 +1.
- **MySQL/H2 양립 SQL만 작성** — `CREATE INDEX IF NOT EXISTS`, `ENUM(...)` 등은 Docker MySQL 8에서 실패. 일반 `CREATE INDEX` + `VARCHAR + CHECK` 사용.
- **NOT NULL 컬럼 추가는 3단계** — (1) NULL 허용 추가 → (2) 백필 UPDATE → (3) NOT NULL 변경. 한 번에 하면 기존 행에서 실패.
- **JPA Entity 동기 변경 필수** — `ddl-auto: none` 이라 마이그레이션만 추가하고 Entity 누락 시 런타임에 컬럼 불일치 에러.
- **Destructive 변경(DROP COLUMN/TABLE)은 별도 PR** — 동일 PR에서 Entity 제거 + DROP 동시 진행 시 롤백 어려움. 1) Entity에서 제거 + 배포 2) 다음 PR에서 DROP.

## 검증

- `cd backend && ./gradlew bootRun` — H2 부팅 통과
- `cd backend && ./gradlew test` — 전체 마이그레이션 재적용 + 31개 통합 테스트 통과
- Docker: `docker compose up backend` — MySQL 호환성

상세는 `.claude/docs/reference/database-migrations.md` 참조.
