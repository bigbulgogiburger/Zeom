# ADR 0002 — Nested reference docs per sub-project

- **Status**: Accepted
- **Date**: 2026-05-17
- **Deciders**: pyeondohun
- **Builds on**: ADR 0001 (CLAUDE.md sub split)

## Context

ADR 0001 에서 CLAUDE.md 를 root + 3 sub 로 분할했으나, **reference docs 11개는 여전히 root `/.claude/docs/reference/` 한 곳에 집중** 되어 있었다. 그 결과:

1. **Sub 단독 컨텍스트 깨짐** — `cd backend` 작업 시 Claude Code 가 `backend/CLAUDE.md` 를 우선 로드하지만, reference 가 `../.claude/docs/reference/...` 처럼 cwd 밖을 향함. sub 가 self-contained 가 아님.
2. **에이전트 디스패치 비효율** — 10개의 zeom-* 에이전트가 reference 경로를 하드코딩하고 있어, sub-specific 에이전트(jpa/admin-guard 등 backend 전용) 도 cross-cutting 위치를 가리킴.
3. **Sub 분리 추출 시 깨짐** — 만약 `backend/` 를 별도 repo 로 extract 하면, 자기 reference 들이 떨어져 나감.
4. **Sub-specific coding style 부재** — 단일 root 구조에서는 각 sub 의 coding style (Java 21 + Spring vs TS + React + Tailwind v4 vs Dart + Riverpod) 을 분리해서 두기 어려웠음.

사용자 의도 (요약): **"api layer 나 coding style 이 nested project 의 `.claude/docs/` 에 있어야 한다. 지금은 다 루트 것만 참조해서 문제다."**

## Decision

Reference docs 를 **sub-affinity 기준으로 nested 구조** 로 재배치:

### Root `/.claude/docs/reference/` — cross-cutting 만 (2개)

| 문서 | 이유 |
|------|------|
| `sendbird-guide.md` | userId prefix 규약을 backend·web·flutter 가 **모두 enforce**. 진짜 cross-cutting. |
| `environment.md` | 환경 변수·Docker·CI/CD — operator/deploy view, sub 도메인이 아님. |

### `backend/.claude/docs/reference/` (7개)

`api-layer.md` (← was `backend-api.md`) · `service-layer.md` · `provider-integration.md` · `database-migrations.md` · `security-checklist.md` · **`coding-style.md` (NEW)** · `testing.md` (split from root)

### `web/.claude/docs/reference/` (4개)

`frontend-pages.md` · `design-system.md` · **`coding-style.md` (NEW)** · `testing.md` (split)

### `app_flutter/.claude/docs/reference/` (3개)

`architecture.md` (← was `flutter-architecture.md`) · **`coding-style.md` (NEW)** · `testing.md` (split)

### 분류 원칙

- **Sub 안에 산다**: 그 sub 의 도메인/스택에서만 의미 있는 패턴 (예: Flyway = backend 만, Tailwind v4 = web 만)
- **Root 에 산다**: 모든 sub 가 동시에 enforce 해야 하는 규약 (Sendbird userId), 또는 sub 도메인이 아닌 operator 관점 (env/Docker/CI)
- **Provider integration → backend**: 패턴 구현 자체 (Spring `@ConditionalOnProperty`) 는 backend 의 책임. 다른 sub 는 env 토글 결과만 인지.
- **Security checklist → backend**: admin 가드·JWT 발급·CORS 가 backend 주. 클라이언트 측 (web cookie/header, Flutter JWT 헤더) 은 sub CLAUDE.md 에서 1줄로 언급 + backend reference 로 cross-link.
- **Testing 3-way split**: JUnit5 / Jest+Playwright / widget+integration — 3 stack 이 전혀 다름. 통합 reference 1개 보다 sub-local 3개가 더 명확.

### Cross-sub reference

Sub A 가 sub B 의 reference 를 봐야 할 때 (예: web 이 backend API contract):
- 상대경로: `../backend/.claude/docs/reference/api-layer.md`
- Sub CLAUDE.md 의 "Backend cross-sub" 섹션에 명시 — 정직하게 cross-boundary 임을 드러냄

## Consequences

### Positive

- **Sub self-containment**: `cd backend` 후 모든 reference 가 `backend/.claude/docs/reference/` 안에. 컨텍스트 손실 없음.
- **에이전트 정밀도**: zeom-jpa-reviewer 가 `backend/.claude/docs/reference/database-migrations.md` 만 로드 — 컨텍스트 노이즈 ↓.
- **Sub 추출 용이**: backend 를 별도 repo 로 분리하면 `backend/` 전체가 자기완결적으로 따라감.
- **Coding style 분리**: Spring/Java vs TS/React vs Dart 의 NEVER 가 섞이지 않음.
- **개발자 멘탈모델**: "어디 reference 가 있지?" → "내가 일하는 sub 안에" — 직관적.

### Negative

- **Cross-sub 참조 시 ../ 경로** (예: `../backend/.claude/docs/reference/api-layer.md`) — 약간 어색하지만 정직함.
- **Sub 간 중복 위험**: 비슷한 패턴 (예: testing 의 fake provider 사용법) 이 3 sub 에 분산될 수 있음. → 각 testing.md 가 backend 의 provider-integration.md 를 cross-link 으로 가리켜 해결.
- **신규 sub 추가 부담**: 새 sub 만들면 `.claude/docs/reference/` 디렉토리 + coding-style/testing 최소 2개를 생성해야 함.
- **에이전트 정의 갱신 비용** (1회성): 10개 zeom-* agent 의 reference 경로 갱신 필요했음 (완료).

### Mitigations

- 각 sub `CLAUDE.md` 의 Reference Docs 섹션에 **"로컬 / Cross-cutting / Backend cross-sub"** 3-group 으로 명시 (어느 sub 가 어디를 보는지 즉시 보임).
- 옮긴 파일의 cross-link 은 same-dir 파일명만 사용 (대부분 영향 X). root cross-cutting 참조 시 `../../../.claude/docs/reference/sendbird-guide.md` 명시.
- Reference 헤더에 **`Sub affinity: <어디용>`** 박스 유지 (ADR 0001 후속).

## Alternatives Considered

- **A. 그대로 (모든 reference root)**: ADR 0001 직후 상태. Sub 단독 self-containment 깨짐. 사용자가 명시적으로 거부.
- **B. Reference 를 frontmatter 메타로 분류 (이동 X)**: 파일은 root 그대로, frontmatter `applies_to: backend` 만 추가. 가벼우나 sub 추출 시 여전히 따라가지 않고, 에이전트는 여전히 root 경로 로드.
- **C. Reference 를 완전히 sub 안으로만 (root 폐기)**: cross-cutting (Sendbird userId) 의 SSoT 위치 모호. 3 sub 중 어디? backend? → 다른 두 sub 가 backend 안으로 cross 참조해야 하는데 부자연스러움. 채택 X.
- **D. ADR 채택안 = B + C 의 절충**: cross-cutting 2개만 root, sub-specific 은 sub 안.

→ 채택: **D**.

## Files Migrated (2026-05-17)

| 옛 위치 | 새 위치 |
|--------|---------|
| `/.claude/docs/reference/backend-api.md` | `/backend/.claude/docs/reference/api-layer.md` (rename) |
| `/.claude/docs/reference/service-layer.md` | `/backend/.claude/docs/reference/service-layer.md` |
| `/.claude/docs/reference/provider-integration.md` | `/backend/.claude/docs/reference/provider-integration.md` |
| `/.claude/docs/reference/database-migrations.md` | `/backend/.claude/docs/reference/database-migrations.md` |
| `/.claude/docs/reference/security-checklist.md` | `/backend/.claude/docs/reference/security-checklist.md` |
| `/.claude/docs/reference/frontend-pages.md` | `/web/.claude/docs/reference/frontend-pages.md` |
| `/.claude/docs/reference/design-system.md` | `/web/.claude/docs/reference/design-system.md` |
| `/.claude/docs/reference/flutter-architecture.md` | `/app_flutter/.claude/docs/reference/architecture.md` (rename) |
| `/.claude/docs/reference/testing.md` | 3-way split: backend/web/app_flutter 각자 `testing.md` |
| `/.claude/docs/reference/sendbird-guide.md` | (변경 없음 — cross-cutting 유지) |
| `/.claude/docs/reference/environment.md` | (변경 없음 — cross-cutting 유지) |

신규: 3개 sub 의 `coding-style.md`.

## Follow-ups

- [x] 10개 zeom-* agent reference 경로 갱신 (2026-05-17 완료)
- [x] `.gitignore` 의 `.claude/runtime/` 등을 `**/.claude/runtime/` 형태로 nested 매칭 (2026-05-17 완료)
- [ ] `docs/ZEOM-22~24-dev-guide.md` 의 옛 경로 (`.claude/docs/reference/design-system.md` 등) 는 history 로 두되, 후속 dev-guide 작성 시 새 경로 사용.
- [ ] `wiki-lint` 정기 실행으로 sub-affinity 누락 / 중복 감지.
- [ ] 새 sub 추가 시 (예: `app_ios/`) 본 ADR 의 nested 패턴 동일 적용.
