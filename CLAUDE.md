# CLAUDE.md

## Project Overview

천지연꽃신당 — Korean fortune-telling/counseling booking platform. Full-stack 모노레포: Spring Boot 3.5 (Java 21) + Next.js 15 (React 19) + Flutter.

## Architecture

```mermaid
graph TB
    subgraph Client
        WEB[Next.js 15<br/>React 19 + Tailwind v4]
        APP[Flutter 3.2+<br/>Riverpod + go_router]
    end

    subgraph Backend["Spring Boot 3.5 (Java 21)"]
        AUTH[auth + oauth] --> USER[(User)]
        BOOK[booking + counselor + favorite]
        PAY[payment + portone]
        MONEY[wallet + cash + credit + coupon<br/>+ settlement + refund + dispute]
        CHAT[chat + sendbird] --> CONSULT[consultation]
        FORTUNE[fortune + saju + recommendation]
        REVIEW[review + product + referral]
        NOTIF[notification]
        OPS[admin + audit + ops + alert<br/>+ scheduler + lock]
    end

    subgraph Providers
        PORTONE[PortOne<br/>결제]
        SENDBIRD[Sendbird<br/>채팅/화상]
        OAUTH_P[Kakao/Naver<br/>OAuth]
        ALIGO[Aligo<br/>SMS]
        NOTI_HTTP[Notification HTTP]
        REDIS[(Redis<br/>분산락/캐시)]
    end

    subgraph DB
        H2[H2 in-memory<br/>dev/test]
        MYSQL[(MySQL 8<br/>production)]
    end

    WEB & APP --> AUTH & BOOK & PAY & CHAT & FORTUNE
    PAY -.->|PAYMENT_PROVIDER=http| PORTONE
    CHAT -.->|CHAT_PROVIDER=http| SENDBIRD
    AUTH -.->|OAUTH_PROVIDER| OAUTH_P
    NOTIF -.->|SMS_PROVIDER=aligo| ALIGO
    NOTIF -.->|NOTIFICATION_PROVIDER=http| NOTI_HTTP
    MONEY -.-> REDIS
    Backend --> H2
    Backend -.->|production| MYSQL
```

## Commands

```bash
# Backend (port 8080) — H2 in-memory, fake providers
cd backend && ./gradlew bootRun
cd backend && ./gradlew test                      # 31 통합 테스트 클래스

# Frontend (port 3000)
cd web && npm run dev
cd web && npm test                                # Jest (14 spec, ~129 tests)
cd web && npm run test:e2e                        # Playwright (13 spec, backend 자동 시작)
cd web && npx tsc --noEmit                        # 타입 체크 (lint 대용)
cd web && npm run build                           # 프로덕션 빌드 (~76 routes, /dashboard 사용자/admin 분리)

# Flutter — 디바이스/시뮬레이터에 직접 실행 (build만 X)
cd app_flutter && flutter run
cd app_flutter && flutter test
```

## Key Rules

- **Design tokens**: 모든 색상은 `hsl(var(--xxx))` — hex 하드코딩 금지. 토큰은 `web/src/app/globals.css` 의 `@theme inline` 블록. 상세 → `design-system.md`
- **Provider pattern**: 외부 통합 5종(payment/chat/notification/oauth/sms)은 인터페이스 + fake/real + `@ConditionalOnProperty` 자동선택. 직접 SDK 주입 금지 → `provider-integration.md`
- **Sendbird userId 규약**: 고객 `user_{id}`, 상담사 `counselor_{id}`. 채널 `consultation-{reservationId}`. 클라이언트도 동일 prefix 사용. → `sendbird-guide.md`
- **Flyway only**: 모든 스키마 변경은 `db/migration/V<n>__<desc>.sql`. 적용된 파일 수정 금지 (체크섬 위반 → 부팅 실패). → `database-migrations.md`
- **결제 보상 전략**: 결제는 DB 먼저 영속화, 후속(채널 생성/알림) 실패는 `*_retry_needed` 플래그 + 웹훅 알림 + 스케줄러 재시도
- **Admin 가드**: 모든 `/api/v1/admin/**` 컨트롤러는 첫 줄에 `authService.requireAdmin(authHeader)`. → `security-checklist.md`
- **Korean text**: `word-break: keep-all`, Pretendard, 헤딩에 `text-wrap: balance`
- **Immersive layout 분리**: `consultation/[sessionId]` 진입 시 AppHeader/BottomTabBar는 `usePathname` 가드로 self-hide. `/review`는 chrome 유지(가드에서 segment 비교). root layout 흔들지 않는 게 핵심 — 이유: 다른 라우트 회귀 차단. → `frontend-pages.md`
- **50 화면 + chrome 토큰 baseline**: ZEOM-4(Core 9) + ZEOM-22(chrome 3) + ZEOM-23(Auth 7) + ZEOM-24(Group C 6: faq/terms/privacy/blog×3) + ZEOM-25(Group D 16: mypage×4/wallet+credits×4/fortune+saju/favorites+recommend+referral+share/notifications×2) + ZEOM-26(Group E 4: disputes×2/refunds×2) + ZEOM-27(Group F 7: consultation/[sid]/{preflight,complete,summary}+consultation/chat+consultations+sessions+sessions/[id]/chat) + ZEOM-28(Group G 1: /dashboard 사용자) — hex/entity/emoji 0건. 신규도 토큰만 — `grep -rEn '#[0-9A-Fa-f]{3,6}\b|&#[0-9]+;' web/src/app web/src/components` 0 보장. **명시 예외**: `--brand-kakao`/`--brand-kakao-fg`/`--brand-naver` 토큰은 공식 브랜드 컴플라이언스로 hex 정의 유지 (ZEOM-25). 동적 inline-style은 score/bar width 등 런타임 값에만 허용. → `docs/ZEOM-21-visual-report.md`, `docs/ZEOM-22~28-dev-guide.md`
- **공통 레이아웃 컴포넌트**: `<AuthCard>` (ZEOM-23, max-w 420 + Logo 자동) / `.prose`+`<AnchorNav>` 좌측 240px sticky (ZEOM-24, IntersectionObserver+mobile select) / `<SidebarNav>` (ZEOM-25, usePathname + danger 토큰) / `<ProgressSteps>` (ZEOM-26, 다단계 폼 — refunds/new 3단계 등) / `DancheongMandala` SVG inline (ZEOM-27 consultation/complete, 80px gold 단청 동심원 — emoji 대체). 도메인 토큰: 오행 5(`--ohaeng-wood/fire/earth/metal/water`, ZEOM-25). → `design-system.md`
- **Dashboard 분리**: `/dashboard`는 사용자 대시보드(`RequireLogin`, ZEOM-28 §4.7) / `/admin/dashboard`는 admin 운영 모니터링(`RequireAdmin`). admin login redirect → `/admin/dashboard`. 이유: app-header 일반 nav가 `/dashboard`를 가리키므로 admin 전용 페이지를 두면 일반 사용자 차단 회귀 → `frontend-pages.md`
- **E2E web 테스트**: Playwright(`npm run test:e2e`)는 spec 파일 작성·CI용. 시각 회귀는 별도 QA 회차에서 openchrome MCP로 4 viewport(360/768/1024/1440) × 50 화면 + chrome. 로컬 검증 시 docker 사용 금지 — `npm run dev` 기반

## Path Aliases

- `@/` → `web/src/` (tsconfig.json + jest.config.js `moduleNameMapper`)

## Monorepo Structure

```
backend/      Spring Boot 3.5 API (Java 21, Gradle, Flyway V1–V60)
web/          Next.js 15 (App Router, Tailwind v4, shadcn/ui, Playwright)
app_flutter/  Flutter (Riverpod + go_router + Dio, 11 features)
docs/         Architecture, OpenAPI spec, PRD, design plans
```

## Reference Docs

작업 종류별로 아래 문서를 읽으세요:

| 문서 | 참조 시점 | 경로 |
|------|----------|------|
| Backend API | API 엔드포인트 추가/수정 시 | `.claude/docs/reference/backend-api.md` |
| Service Layer | 도메인 서비스/트랜잭션/예외 작업 시 | `.claude/docs/reference/service-layer.md` |
| Provider Integration | 외부 SDK 통합 (fake/real) 작업 시 | `.claude/docs/reference/provider-integration.md` |
| Sendbird Guide | 채팅/화상통화 작업 시 | `.claude/docs/reference/sendbird-guide.md` |
| Database & Migrations | 스키마/마이그레이션 작업 시 | `.claude/docs/reference/database-migrations.md` |
| Security Checklist | 인증/admin/CORS/멱등성 작업 시 | `.claude/docs/reference/security-checklist.md` |
| Frontend Pages | 페이지/라우팅 작업 시 | `.claude/docs/reference/frontend-pages.md` |
| Design System | UI 컴포넌트/색상/폰트 작업 시 | `.claude/docs/reference/design-system.md` |
| Flutter Architecture | Flutter feature/라우팅 작업 시 | `.claude/docs/reference/flutter-architecture.md` |
| Testing | 테스트 작성/수정 시 | `.claude/docs/reference/testing.md` |
| Environment | 환경 변수/배포 설정 시 | `.claude/docs/reference/environment.md` |
| ZEOM-4 / 21 sweep | Core 9 마이그레이션 결과 / hex·entity 0 게이트 | `docs/ZEOM-4-remaining-dev-guide.md`, `docs/ZEOM-21-visual-report.md` |
| ZEOM-22 / 23 chrome+auth | Logo, AuthCard, PasswordStrengthMeter 패턴 | `docs/ZEOM-22-dev-guide.md`, `docs/ZEOM-23-dev-guide.md` |
| ZEOM-24 정책/콘텐츠 | shadcn Accordion, AnchorNav, .prose, .stagger-grid | `docs/ZEOM-24-dev-guide.md` |
| ZEOM-25 사용자 보조 | SidebarNav, 60px serif tabular gold, 오행/브랜드 토큰 | `docs/ZEOM-25-dev-guide.md` |
| ZEOM-6 / 26-28 분쟁·세션·dashboard | ProgressSteps 다단계, 단청 SVG, dashboard 분리, sessions/chat 분리 결정 | `docs/ZEOM-6-phase4-efg-dev-guide.md` |

## Skills

검증 스킬 (`.claude/skills/verify-*/SKILL.md`):

| 스킬 | 설명 |
|------|------|
| `verify-flyway-migrations` | Flyway 마이그레이션과 JPA Entity 일관성 |
| `verify-sendbird-videocall` | Sendbird 화상통화 파이프라인 |
| `verify-payment-wallet` | 결제/지갑/크레딧 시스템 무결성 |
| `verify-frontend-ui` | 프론트엔드 UI/디자인 시스템 품질 |
| `verify-e2e-tests` | E2E 테스트 설정 및 품질 |
| `verify-admin-auth` | Admin API 인증/인가 가드 |
| `verify-auth-system` | 인증/인가 시스템 무결성 |
| `verify-notification-system` | 알림/이메일/SMS 시스템 |
| `verify-flutter-app` | Flutter 앱 품질 및 React-Flutter UX 동기화 |
| `verify-fortune` | 운세 엔진 도메인 무결성 |
| `verify-seo-analytics` | SEO/GA4/온보딩 시스템 |
| `verify-implementation` | 통합 검증 (위 스킬 순차 실행) |

## Conventions

- Commit: conventional commits (`feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`)
- 한국어: 문서/PR 본문/UI 텍스트/코드 주석
- OpenAPI spec: `docs/openapi.yaml`
- ESLint/Prettier/Checkstyle 미설정 (린터 의존 컨벤션 작성 금지)

## Harness Engineering Integration

### 운영 모드
- `HARNESS_MODE`는 `.claude/settings.local.json`의 `env` 참조 (현재 `auto`)
- `auto`: Hook이 harness 단계를 강제 주입 + `git commit` 게이트 차단 (verdict ITERATE/ESCALATE 시)
- `suggest`: Hook이 제안만 (차단 없음)
- `off`: Harness 비활성

### 워크플로 규칙
- `/jira-plan` 완료 후 `/harness-plan` 실행을 제안하라 (auto 모드에서는 강제 주입)
- `/jira-execute` 각 Phase 완료 후 `/harness-review`를 제안하라 (auto 모드에서는 강제 주입)
- `/jira-commit` 전 `aggregate-verdict.md` 확인을 권장하라

### 에이전트 디스패치 (zeom-* 우선)
- Entity / Repository 변경 → `zeom-jpa-reviewer`
- Controller / DTO / openapi.yaml 변경 → `zeom-api-contract-reviewer` + `zeom-security-reviewer`
- `/api/v1/admin/**` 컨트롤러 변경 → `zeom-admin-guard-reviewer` (필수)
- Service 변경 → `zeom-cqrs-refactorer`
- payment/chat/notification/oauth/sms provider 변경 → `zeom-provider-pattern-reviewer`
- `web/src/**/*.tsx` 변경 → `zeom-component-reviewer`
- 빌드 실패 → `zeom-build-resolver`
- 테스트 작성 → `zeom-test-writer`
- 구조 탐색 → `zeom-explorer`

### 아티팩트 경로
- dev-guide: `docs/{ISSUE-KEY}-dev-guide.md`
- Sprint Contract: `.claude/runtime/sprint-contract/{ISSUE-KEY}.md`
- Verdict: `.claude/runtime/aggregate-verdict.md`
- State: `.claude/runtime/workflow-state.json`
- Metrics: `.claude/runtime/harness-metrics/scorecard.md` (집계: `bash .claude/runtime/harness-metrics/aggregate.sh`)

<!-- 갱신 이력
2026-04-25: V1-V19→V60 동기화, provider 3→5 반영, reference 6개 추가, design-system 중복 섹션 제거
2026-04-26~28: ZEOM-2/3/4/17 sweep — Phase 0 토큰·Gowun Batang, Phase 1 primitive 23개, ZEOM-17 P2-1 4페이지 + design 컴포넌트 3개(BookingCard/RadioCard/SuccessState), ZEOM-18/19/20 P1·P3 통합 + 컴포넌트 6개(CounselorCard/FilterChip/Hero/CategoryGrid/ReviewSlider/EndCallModal) + immersive layout 분리, ZEOM-21 hex/entity 0 baseline + legacy dead code 삭제. 도메인 수 표기 제거(변동성). 테스트 카운트 갱신
2026-04-28: Harness Engineering Integration 섹션 추가(에이전트 디스패치·아티팩트 경로). hook 명령 절대경로화(`$CLAUDE_PROJECT_DIR`)
2026-05-03: ZEOM-22(chrome 정렬+Logo)/ZEOM-23(인증 7페이지+AuthCard+PasswordStrengthMeter) 누락 분 통합 반영. baseline 9→16 화면+chrome
2026-05-05: ZEOM-24(정책/콘텐츠 6페이지: shadcn Accordion/AnchorNav/.prose/.stagger-grid) + ZEOM-25(사용자 보조 16페이지: SidebarNav/60px serif tabular gold 잔액/오행 5 토큰/브랜드 3 토큰) main 머지(68fcf41). baseline 16→38 화면+chrome. 공통 레이아웃 컴포넌트 Key Rule 추가. Reference table에 ZEOM-22~25 dev-guide 통합 행. 카카오/네이버 브랜드 hex는 토큰화(`--brand-kakao/-fg/--brand-naver`)로 audit 0건 + 컴플라이언스 양립
2026-05-06: ZEOM-6 Phase 4(E+F+G 12 페이지) 통합 마이그레이션 — ZEOM-26(disputes/[id] 타임라인+thread, refunds/new ProgressSteps 3단계) + ZEOM-27(preflight emoji→lucide, complete 단청 SVG+60s 카운트다운, summary print stylesheet, consultations status filter Seg) + ZEOM-28(/dashboard 사용자판 신규 + /admin/dashboard 분리). baseline 38→50 화면+chrome. 공통 컴포넌트에 ProgressSteps/DancheongMandala 추가. Key Rule에 Dashboard 분리 추가. 추가 6 deep-dive 버그 수정(stream leak / reason 길이 검증 / me.name 가드 / Array.isArray 가드 / timeline 흐름 / print stylesheet)
-->

