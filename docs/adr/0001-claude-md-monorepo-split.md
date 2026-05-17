# ADR 0001 — CLAUDE.md monorepo sub split

- **Status**: Accepted
- **Date**: 2026-05-17
- **Deciders**: pyeondohun
- **Supersedes**: 단일 root `CLAUDE.md` (188줄, sub 룰 모두 혼재)

## Context

Zeom 은 단일 root `CLAUDE.md` 에 backend / web / app_flutter 3 sub 의 모든 룰을 담아 왔다. 188 줄 시점에서 다음 문제가 누적:

1. **컨텍스트 비효율** — sub 단독 작업 (예: Flutter feature 추가) 시 backend·web 의 immersive layout / Flyway / Dashboard 분리 같은 무관한 룰까지 매 세션 로드.
2. **금지형 NEVER 의 신호 약화** — 한 파일에 모든 sub 의 NEVER 가 들어가니 sub 별 가장 critical 한 것 (예: Flutter `flutter run` vs `flutter build`) 이 묻힘.
3. **변경 이력 비대화** — Last Updated 클로저 6회 누적 (~2026-04-25 부터). 매 갱신 시 cache miss 비용 증가.
4. **agents/skills 디스패치 매핑** — 에이전트 트리거가 sub 별로 다르지만 root 한 곳에 묶여 sub 폴더 단독 작업 시 명시성이 떨어졌음.

`organize-claude-md` skill 의 `references/monorepo.md` 정책 — "Monorepo 는 본질이 다르다. 단일 CLAUDE.md 가 모든 sub 의 NEVER 를 담으면 sub 단독 작업 시 노이즈. root + sub 분리가 표준" — 에도 부합.

## Decision

CLAUDE.md 를 **monorepo root 1개 + sub 3개** 로 분할한다.

| 파일 | 줄수 상한 | 책임 |
|------|----------|------|
| `/CLAUDE.md` | 150 | Project Overview · 전체 architecture · sub index · cross-cutting rule · Harness · Skills · cross-cutting reference |
| `/backend/CLAUDE.md` | 120 | Spring Boot 3.5 / Java 21 stack-specific · domain modules · Flyway · provider pattern · admin 가드 |
| `/web/CLAUDE.md` | 120 | Next.js 15 / React 19 / Tailwind v4 stack-specific · design tokens · immersive layout · Dashboard 분리 · E2E |
| `/app_flutter/CLAUDE.md` | 120 | Flutter 3.2+ / Riverpod / go_router stack-specific · `flutter run` · `apiClientProvider` · `flutter_secure_storage` |

**책임 분리 원칙**:
1. **Cross-cutting (3 sub 모두 적용)** → root 만. 예: Sendbird userId 규약, provider env 토글, conventional commits, Korean.
2. **Sub-specific** → 해당 sub 만. root 에 복제 금지.
3. **Reference docs** (`.claude/docs/reference/`) 는 sub 가 공유. root + sub 양쪽에서 링크.
4. **변경 이력** 은 `docs/CLAUDE-CHANGELOG.md` 로 분리 (Last Updated 라인은 단일 날짜만 유지).

## Consequences

### Positive
- Sub 폴더에서만 작업 시 (Claude Code 가 sub `CLAUDE.md` 우선 로드) 무관한 룰이 컨텍스트에서 빠짐.
- Sub 별 NEVER 가 분리되어 신호 강화.
- 변경 이력 분리로 cache hit 안정.
- 새 sub 추가 시 (예: `app_ios/`) sub `CLAUDE.md` 만 만들면 됨. root 는 sub index 한 줄 추가.

### Negative
- 룰 갱신 시 cross-cutting 여부 판단 부담 (root vs sub). 잘못 분류하면 중복/누락.
- 신규 입장자가 컨텍스트 파악할 때 root + sub 둘 다 읽어야 함.

### Mitigations
- 각 sub `CLAUDE.md` 첫 문단에 "Monorepo root: 상위 `/CLAUDE.md` 의 cross-cutting rule 도 함께 적용" 명시.
- Root `Sub-Projects` 테이블에 각 sub CLAUDE.md 링크.
- 정기 `wiki-lint` / `organize-claude-md gap` 으로 중복/누락 감지.

## Alternatives Considered

- **A. 그대로 유지 (단일 root)**: 단순하지만 위 4가지 문제 누적. 50 화면 baseline 도달로 룰 추가 압력이 큰 시점에서 미래 비용 ↑.
- **B. CLAUDE.md 는 한 개, sub 룰은 reference 로 분리**: 이미 reference 분리는 했음에도 Key Rules 가 188 줄로 비대화된 원인은 sub 별 NEVER 가 root 에 누적된 구조 자체. reference 만으로는 해결 불가.
- **C. sub 만 두고 root 제거**: monorepo 전체 architecture / cross-cutting 룰 / Harness 디스패치 정책의 SSoT 가 없어짐.

→ 채택: **B 와 C 의 절충 = 본 ADR**.

## Follow-ups

- [x] **(2026-05-17)** `.claude/docs/reference/*.md` 의 헤더에 **Sub affinity** 줄 추가 (backend / web / app_flutter / cross-cutting 표기). 11개 reference 모두 완료.
- [x] **(2026-05-17)** Sub `CLAUDE.md` 내부 reference 경로를 root 기준 → sub 기준 상대경로 (`../.claude/docs/reference/...`, `../docs/...`) 로 보정. 모든 링크 정합성 검증 완료.
- [ ] `wiki-lint` 정기 실행으로 root ↔ sub 중복 / 미반영 감지.
- [ ] 새 sub 추가 시 본 ADR 의 책임 분리 원칙 준수 + 상대경로 규칙 적용.
