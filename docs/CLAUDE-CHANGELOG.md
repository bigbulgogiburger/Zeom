# CLAUDE.md Changelog

CLAUDE.md (root + sub) 의 의미 있는 갱신 이력. 작은 sweep·typo 는 제외.

## 2026-05-17 (P2) — Nested reference docs per sub

ADR 0001 분할 직후 reference docs (11개) 가 여전히 root 에 집중되어 있어 sub self-containment 가 깨졌던 문제 해결. Reference 를 sub-affinity 기준으로 nested 재배치:
- root `/.claude/docs/reference/` → cross-cutting 만 (sendbird-guide, environment) 2개
- `backend/.claude/docs/reference/` → 7개 (api-layer, service-layer, provider-integration, database-migrations, security-checklist, **coding-style (NEW)**, testing)
- `web/.claude/docs/reference/` → 4개 (frontend-pages, design-system, **coding-style (NEW)**, testing)
- `app_flutter/.claude/docs/reference/` → 3개 (architecture, **coding-style (NEW)**, testing)
- 기존 `testing.md` 1개 → 3 sub 로 분할 (JUnit5 / Jest+Playwright / widget+integration)
- 신규 `coding-style.md` 3개 — Spring/Java vs TS/React vs Dart 컨벤션
- `backend-api.md` → `api-layer.md` (rename, sub 컨텍스트에서 더 명확)
- `flutter-architecture.md` → `architecture.md` (sub 안에서는 prefix 불필요)
- 부수 변경: 10개 zeom-* agent reference 경로 갱신, `.gitignore` `**/.claude/runtime/` 등 nested 매칭, sub CLAUDE.md reference table 을 "로컬 / Cross-cutting / Backend cross-sub" 3-group 으로 재구조화.

결정 근거 → `docs/adr/0002-nested-reference-docs.md`.

## 2026-05-17 (P1) — Monorepo CLAUDE.md split

**구조 변경**: 단일 root CLAUDE.md (188줄) 를 4개 파일로 분할:
- `/CLAUDE.md` (136줄) — cross-cutting + sub index + Harness
- `/backend/CLAUDE.md` (110줄) — Spring Boot 3.5 / Java 21 stack-specific
- `/web/CLAUDE.md` (114줄) — Next.js 15 + React 19 + Tailwind v4 stack-specific
- `/app_flutter/CLAUDE.md` (110줄) — Flutter 3.2+ + Riverpod stack-specific

결정 근거 → `docs/adr/0001-claude-md-monorepo-split.md`.

이전까지의 모든 갱신 이력은 아래 `### Pre-split history (~2026-05-06)` 보존.

### Pre-split history (~2026-05-06)

- **2026-04-25**: V1-V19→V60 동기화, provider 3→5 반영, reference 6개 추가, design-system 중복 섹션 제거
- **2026-04-26~28**: ZEOM-2/3/4/17 sweep — Phase 0 토큰·Gowun Batang, Phase 1 primitive 23개, ZEOM-17 P2-1 4페이지 + design 컴포넌트 3개(BookingCard/RadioCard/SuccessState), ZEOM-18/19/20 P1·P3 통합 + 컴포넌트 6개(CounselorCard/FilterChip/Hero/CategoryGrid/ReviewSlider/EndCallModal) + immersive layout 분리, ZEOM-21 hex/entity 0 baseline + legacy dead code 삭제. 도메인 수 표기 제거(변동성). 테스트 카운트 갱신
- **2026-04-28**: Harness Engineering Integration 섹션 추가(에이전트 디스패치·아티팩트 경로). hook 명령 절대경로화(`$CLAUDE_PROJECT_DIR`)
- **2026-05-03**: ZEOM-22(chrome 정렬+Logo)/ZEOM-23(인증 7페이지+AuthCard+PasswordStrengthMeter) 누락 분 통합 반영. baseline 9→16 화면+chrome
- **2026-05-05**: ZEOM-24(정책/콘텐츠 6페이지: shadcn Accordion/AnchorNav/.prose/.stagger-grid) + ZEOM-25(사용자 보조 16페이지: SidebarNav/60px serif tabular gold 잔액/오행 5 토큰/브랜드 3 토큰) main 머지(68fcf41). baseline 16→38 화면+chrome. 공통 레이아웃 컴포넌트 Key Rule 추가. Reference table에 ZEOM-22~25 dev-guide 통합 행. 카카오/네이버 브랜드 hex는 토큰화(`--brand-kakao/-fg/--brand-naver`)로 audit 0건 + 컴플라이언스 양립
- **2026-05-06**: ZEOM-6 Phase 4(E+F+G 12 페이지) 통합 마이그레이션 — ZEOM-26(disputes/[id] 타임라인+thread, refunds/new ProgressSteps 3단계) + ZEOM-27(preflight emoji→lucide, complete 단청 SVG+60s 카운트다운, summary print stylesheet, consultations status filter Seg) + ZEOM-28(/dashboard 사용자판 신규 + /admin/dashboard 분리). baseline 38→50 화면+chrome. 공통 컴포넌트에 ProgressSteps/DancheongMandala 추가. Key Rule에 Dashboard 분리 추가. 추가 6 deep-dive 버그 수정(stream leak / reason 길이 검증 / me.name 가드 / Array.isArray 가드 / timeline 흐름 / print stylesheet)
