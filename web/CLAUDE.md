# CLAUDE.md (web)

## Project Overview

Next.js 15.1.6 (App Router) · React 19 · TypeScript 5.9 · **Tailwind v4** (`@import "tailwindcss"` + `@theme inline`) · **shadcn/ui** (style: new-york, RSC) · next-intl (ko/en) · lucide-react. 75 페이지 라우트, 78 components, Jest 30 (14 spec) + Playwright (13 spec). 빌드 약 76 routes.

**Monorepo root**: 상위 [`/CLAUDE.md`](../CLAUDE.md) 의 cross-cutting rule (Sendbird userId, conventional commits, Korean) 도 함께 적용.

## Architecture

```mermaid
graph TB
    subgraph Routes["app/ (App Router, 75 page.tsx)"]
        PUB[Public: /, /counselors, /fortune,<br/>blog/terms/privacy/faq]
        AUTH[Auth: /login, /signup, /verify-email,<br/>forgot-password, reset-password]
        USER[Authed: /dashboard, /mypage, /wallet,<br/>/credits, /favorites, /notifications]
        CONS[Immersive: /consultation/[sid]/{...}]
        COUN[/counselor portal — sidebar 9개 메뉴]
        ADMIN[/admin/* + /admin/dashboard]
    end

    subgraph Components
        DESIGN["@/components/design (30개 design barrel)"]
        UI[shadcn/ui base]
        CHROME[app-header + bottom-tab-bar<br/>usePathname immersive 가드]
        CTX[AuthProvider · RouteGuard ·<br/>SessionExpiryGuard]
    end

    subgraph Integration
        API[api-client.ts<br/>apiFetch + domain wrapper]
        SB[sendbird-calls SDK<br/>user_/counselor_ prefix]
        PORTONE[@portone/browser-sdk]
        I18N[next-intl<br/>messages/ko.json en.json]
    end

    Routes --> Components & Integration
    Components --> CTX & CHROME
    Integration --> API & SB & PORTONE & I18N
    API -->|REST| Backend((backend))
```

## Commands

```bash
npm run dev                              # port 3000
npm run build                            # 프로덕션 빌드 (~76 routes)
npx tsc --noEmit                         # 타입 체크 (lint 대용 — ESLint 미설정)
npm test                                 # Jest (14 spec, ~129 tests)
npm run test:coverage                    # 커버리지
npm run test:e2e                         # Playwright (backend 자동 시작)
npx playwright test e2e/<name>.spec.ts \
  --config=playwright-e2e.config.ts      # 기존 서버 재사용
```

## Key Rules

- **Design tokens only — hex 0 baseline**: 모든 색은 `hsl(var(--xxx))` 또는 Tailwind 유틸 (`bg-gold`, `text-text-primary`). 50 화면 + chrome baseline 에서 `grep -rEn '#[0-9A-Fa-f]{3,6}\b|&#[0-9]+;' web/src/app web/src/components` 0건. 토큰은 `src/app/globals.css` 의 `@theme inline` 블록. **명시 예외**: `--brand-kakao/-fg/--brand-naver` 토큰만 공식 브랜드 컴플라이언스로 hex 정의 유지. 동적 inline-style 은 score/bar width 등 런타임 값에만. → `.claude/docs/reference/design-system.md`
- **lucide-react only — emoji/HTML entity 금지**: 아이콘은 Lucide React. `&#128100;` 등 HTML entity 도 금지. ZEOM-21 게이트.
- **Design barrel 우선 — shadcn/ui 는 base**: 신규 컴포넌트는 `@/components/design` (30개 — GlowCard, Portrait, BookingCard, ProgressSteps, BreathingOrb, ChatPanel, FabBtn, EndCallModal, SidebarNav, AuthCard, AnchorNav 등) 우선. shadcn `<Card>` 직접 사용 시 토큰 매핑 누락 → 회색 톤 발생.
- **Immersive layout 분리는 pathname 가드**: `consultation/[sessionId]` 진입 시 `AppHeader`/`BottomTabBar` 는 `usePathname` 가드로 **self-hide**. `/consultation/[sid]/review` 는 chrome 유지 (segment 비교). **root layout 직접 수정 금지** — 다른 라우트 회귀 위험. 모든 hook 호출 *후* early return (rules-of-hooks). → `.claude/docs/reference/frontend-pages.md`
- **Dashboard 분리**: `/dashboard` = 사용자 대시보드 (`RequireLogin`) / `/admin/dashboard` = admin 운영 (`RequireAdmin`). admin login redirect → `/admin/dashboard`. app-header 일반 nav 가 `/dashboard` 를 가리키므로 admin 전용 페이지를 두면 일반 사용자 차단 회귀.
- **Korean text rules**: `word-break: keep-all`, Pretendard (`<html className="font-pretendard">`), 헤딩에 `text-wrap: balance` + `font-heading` (Gowun Batang). **금지 폰트**: Inter, Noto Sans KR, Noto Serif KR, Roboto.
- **E2E 는 backend 필요 — `npm run dev` 기반, 로컬 docker 금지**: Playwright (`npm run test:e2e`) 는 webServer 로 backend+frontend 자동 시작. 시각 회귀는 openchrome MCP 로 4 viewport (360/768/1024/1440) × 50 화면. 단 backend 는 docker 로 띄움 (`docker compose up backend`). E2E 전용 계정: `e2e-test@zeom.com` / `TestPass123!`.
- **Sendbird userId 규약** (cross-cutting): 클라이언트 SDK 초기화 시 `user_{userId}` / `counselor_{counselorId}` prefix 사용 — 백엔드와 동일. 안 그러면 채널 매칭 실패.

## Path Aliases

- `@/` → `web/src/` (`tsconfig.json` `paths` + `jest.config.js` `moduleNameMapper`)
- shadcn alias (`components.json`): `@/components`, `@/lib/utils`, `@/components/ui`, `@/lib`, `@/hooks`

## App Router Layout (요약)

`src/app/` — root `layout.tsx` (AppHeader + BottomTabBar chrome) + `page.tsx`/`HomeContent.tsx`. **Public**: `/counselors`, `/counselors/[id]`, `/fortune`, `/blog`, `/terms`, `/privacy`, `/faq`. **Auth**: `/login`, `/signup`, `/verify-email`, `/forgot-password`, `/reset-password`. **Authed**: `/dashboard`, `/mypage/*`, `/wallet`, `/credits`, `/favorites`, `/notifications`, `/referral`, `/recommend`, `/share`, `/my-saju`. **Immersive** (`consultation/[sessionId]/{waiting,preflight,complete,summary,chat,page,review}` — chrome 가드로 hide, review 만 유지). **Flow**: `bookings/me`, `booking/confirm`, `cash/buy`, `credits/buy`, `disputes/*`, `refunds/*`. **Portal**: `counselor/` (sidebar 9 메뉴), `admin/`, `/dashboard`, `/design-system`. `api/og` (OG 이미지).

세부 인벤토리는 `.claude/docs/reference/frontend-pages.md`.

## Reference Docs

**Web 로컬** (`web/.claude/docs/reference/`) — sub 단독 작업 시 우선 참조:

| 문서 | 시점 | 경로 |
|------|------|------|
| Frontend Pages | 페이지 추가·라우팅·layout group | `.claude/docs/reference/frontend-pages.md` |
| Design System | UI 토큰·design barrel · Anti-Slop | `.claude/docs/reference/design-system.md` |
| Coding Style | TS/React/Next 컨벤션 | `.claude/docs/reference/coding-style.md` |
| Testing | Jest + Playwright | `.claude/docs/reference/testing.md` |

**Cross-cutting** (`/.claude/docs/reference/` at monorepo root) — 3 sub 공통:

| 문서 | 시점 | 경로 |
|------|------|------|
| Sendbird Guide | 통화 클라이언트 (userId 규약) | `../.claude/docs/reference/sendbird-guide.md` |
| Environment | 환경 변수 (web: `NEXT_PUBLIC_*`) | `../.claude/docs/reference/environment.md` |

**Backend cross-sub** — 인증·결제 API contract 확인 필요 시:

| 문서 | 시점 | 경로 |
|------|------|------|
| Backend Security | JWT 쿠키/헤더 양립 + CSRF | `../backend/.claude/docs/reference/security-checklist.md` |
| Backend API Layer | 호출하는 엔드포인트 contract | `../backend/.claude/docs/reference/api-layer.md` |

**ZEOM dev-guide** (마이그레이션 이력) — `../docs/ZEOM-<n>-dev-guide.md`: ZEOM-4/21 (hex 0 baseline), ZEOM-22/23 (chrome+auth: Logo/AuthCard/PasswordStrengthMeter), ZEOM-24 (정책 콘텐츠: Accordion/AnchorNav/.prose), ZEOM-25 (사용자 보조: SidebarNav/60px gold/오행 토큰), ZEOM-6 phase4 (26-28 분쟁·세션·dashboard).

## Verify Skills

- `verify-frontend-ui` (UI 변경 후), `verify-e2e-tests` (E2E spec), `verify-seo-analytics` (SEO/GA4), `verify-sendbird-videocall` (통화 클라이언트), `verify-payment-wallet` (결제 UI), `verify-auth-system` (auth 페이지)

---
Last Updated: 2026-05-17
