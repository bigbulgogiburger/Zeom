# [ZEOM-8] Phase 6 — 어드민 포털 Group I (14페이지 + admin layout)

> 생성일: 2026-05-17
> 스택: Next.js 15 / React 19 / Tailwind v4
> 페르소나: React Expert (App Router + RSC + 토큰 시스템)
> 모드: `--subtasks` deep dive (`ZEOM-31`, `ZEOM-32`)
> 부모 에픽: ZEOM-1 (웹 리디자인 v2)

## 1. 요구사항 요약

### 비즈니스 목표
어드민 14페이지 (`/admin/login` ~ `/admin/users/[id]`)를 부록 C.2 *Admin Tone Recipe* 로 마이그레이션한다. 운영 dense 톤 (카드 padding 16, 색상 강도 -2단계, 상태 색만, sticky/zebra/bulk-selection 테이블). Recharts 차트는 `chart-1~5` 토큰에 매핑한다. admin 전용 chrome (240 sidebar + 64 header)을 분리하고 app-header/bottom-tab-bar 와의 가드 충돌을 해소한다.

### 인수조건 (부모 통합)
- [ ] 14 페이지가 §4.9 + 부록 C.2 일치 (카드 16px padding, density 최압축, gold 강도 -2단계)
- [ ] admin 진입 시 root `AppHeader` + `BottomTabBar` self-hide (consultation immersive 가드와 동일 패턴, segs[1]='admin')
- [ ] 모든 차트는 `CHART_COLORS` (`hsl(var(--chart-1~5))`) 만 사용 — hex 0건
- [ ] 모든 테이블 sticky header + zebra + bulk selection (Shift+Click 범위 + 키보드 Space) + 가로 스크롤 OK
- [ ] KPI/Analytics/Settlements: `tabular-nums` 클래스
- [ ] dialog/modal: scaleIn + Esc close + 포커스 트랩
- [ ] `verify-admin-auth` 스킬 PASS — admin 페이지에서 RequireAdmin 가드 회귀 0
- [ ] 4 뷰포트 (360/768/1024/1440) — admin은 desktop 우선, 모바일 가로 스크롤 허용 / 깨짐 없음
- [ ] hex / HTML entity / emoji audit 0건 (`web/src/app/admin` 범위)

### 제약사항
- 색상은 `hsl(var(--xxx))` 또는 Tailwind 토큰만 사용 (`bg-gold` 등). Recharts에 직접 hex 주입 금지.
- 일반 사용자 chrome (AppHeader, BottomTabBar)을 admin/* 경로에서 hide하되, **root layout 직접 수정 금지** — 가드 패턴은 컴포넌트 측 `usePathname` 가드 강화.
- `/admin/dashboard` 는 **admin 운영 대시보드** (RequireAdmin) — `/dashboard` (사용자) 와 분리 유지. admin login redirect 는 `/admin/dashboard`.
- 외부 SDK/Provider 변경은 범위 외.
- Recharts 의존성 추가 시 `npm install recharts` 필요 — 로컬에서만 검증 후 commit, lock 충돌 주의.

## 2. 영향 범위 분석

### 슬라이스 진입점 (ADR-070 DAG)

```
┌───────────────────────────────────────────────────────────────────┐
│  Phase 1 (ZEOM-31)  admin layout + tokens + Recharts CHART_COLORS │
│    ↓ touched: layout.tsx · charts/ · chrome 가드 보강              │
│                                                                   │
│  Phase 2 (ZEOM-32)  14 page.tsx migration                         │
│    ↓ touched: web/src/app/admin/**/page.tsx                       │
│                                                                   │
│  Phase 3 (parent)   통합 검증 (tsc + jest + build + audit)          │
└───────────────────────────────────────────────────────────────────┘
```

- **disjoint touched-files** — 슬라이스 간 동일 파일 수정 0. 단 ZEOM-32 가 ZEOM-31 의 `charts/colors.ts`·`AdminTableShell` 컴포넌트를 *import 만* 함.
- **순서 의존**: ZEOM-31 완료 후 ZEOM-32 착수. 한 브랜치 (`feature/ZEOM-8`) 안에서 commit 단위로 분리 가능.

### 슬라이스 dev-guide

| Slice | 파일 | 책임 |
|-------|------|------|
| ZEOM-31 | `docs/ZEOM-8-ZEOM-31-dev-guide.md` | layout · admin chrome · 토큰 매핑 · 차트 베이스 |
| ZEOM-32 | `docs/ZEOM-8-ZEOM-32-dev-guide.md` | 14 페이지 dense migration |

### Cross-cutting 결정 (양 슬라이스 공통)

1. **Admin chrome 가드 패턴**: `app-header.tsx` 와 `bottom-tab-bar.tsx` 의 `isImmersive` 가드를 `isAdmin = segs[1] === 'admin'` 으로 확장 (`isImmersive || isAdmin` 조건으로 hide). admin 진입 시 root chrome 가 사라지고, admin layout 의 sidebar + header 가 단독 chrome 이 된다.
2. **CHART_COLORS 단일 출처**: `web/src/components/charts/colors.ts` (신규) 가 `chart-1~5` 토큰 배열을 export. Recharts 컴포넌트는 이 배열만 참조 (hex 금지).
3. **AdminTableShell**: sticky header + zebra + bulk selection + tabular-nums 를 캡슐화한 공통 컴포넌트 (신규, `web/src/components/admin/AdminTableShell.tsx`). 14페이지가 이걸 reuse → 일관성 + 코드 압축.
4. **RequireAdmin 위치**: layout 단에서 RequireAdmin 으로 감싸면 14 페이지 각자의 RequireAdmin 호출이 중복 — 기존 코드 정리하면서 layout 가드 하나로 통일. login 페이지만 예외 (게스트 접근 허용).

### DB 변경
없음.

### 의존성 변경
- `recharts` 패키지 추가 (`web/package.json`) — chart 사용 dashboard/analytics용. peer: react 19 호환 확인.

## 3. 구현 계획

### Phase 1: ZEOM-31 — admin layout + tokens + chart base
**목표**: admin 전용 chrome (sidebar 240 + header 64), CHART_COLORS 배열, AdminTableShell 컴포넌트, root chrome 가드 보강.

상세: `docs/ZEOM-8-ZEOM-31-dev-guide.md`

**검증**: tsc + admin 진입 시 AppHeader/BottomTabBar 미렌더 + sidebar nav 14개 active 토글.

### Phase 2: ZEOM-32 — 14 페이지 dense migration
**목표**: 각 페이지를 `AdminTableShell` + Card 16px padding + tabular-nums + Recharts CHART_COLORS 로 통일.

상세: `docs/ZEOM-8-ZEOM-32-dev-guide.md`

**검증**: per-page UI 회귀 + `verify-admin-auth` PASS + audit 0건.

### Phase 3: 통합 검증
1. `cd web && npx tsc --noEmit` — 0 error
2. `cd web && npm test` — 14 spec PASS
3. `cd web && npm run build` — 76 routes 빌드 성공
4. Audit:
   `rg -nE '#[0-9A-Fa-f]{3,6}\b|&#[0-9]+;' web/src/app/admin web/src/components/admin web/src/components/charts` → 0건
   `rg -nE '[📞👤⚠️★☆🛡️🔒]' web/src/app/admin` → 0건
5. `Skill('verify-admin-auth')` → PASS
6. `Skill('verify-frontend-ui')` → PASS

## 4. 기술 상세

### 핵심 판단

1. **Layout 가드 vs 페이지별 가드**: layout.tsx 에서 RequireAdmin 으로 감싸 14페이지의 중복 RequireAdmin 코드를 제거. `/admin/login` 은 layout 내부에서 `usePathname === '/admin/login'` 분기로 가드/chrome 우회. **route group `(auth)` 분리를 회피한 이유**: 13개 페이지 디렉토리를 route group 으로 이동하면 git rename 13건이 PR diff 를 폭증시키고 history grep 을 방해함. 단일 layout + 1줄 pathname 분기가 의도와 동작 모두 일치하고 회귀 위험 0.

2. **Chrome 가드 보강은 컴포넌트 측**: root layout 을 건드리지 않고 `app-header.tsx`·`bottom-tab-bar.tsx` 의 self-hide 가드만 확장. immersive 가드와 동일 패턴 → 회귀 리스크 최소.

3. **Recharts 색상**: ResponsiveContainer + `<Cell fill={CHART_COLORS[i]} />` 패턴. `chart-1~5` 가 globals.css에 이미 정의됨 (43°gold, 145°jade, 350°lotus, 35°dancheong, 340°lotus2). hex 주입 없음.

4. **Bulk selection 패턴**: React 상태로 `selectedIds: Set<string>` + Shift+Click 시 마지막 선택부터 범위 토글. `AdminTableShell` 의 props 로 expose.

### 위험 요소

| 위험 | 영향도 | 대응 |
|------|--------|------|
| Recharts react 19 미호환 | 높음 | 사전 `npm install recharts` 후 dummy 컴포넌트로 build/test 통과 확인 |
| AppHeader admin 링크 (`/admin/timeline`, `/admin/audit`) chrome hide 이후 fallback | 중간 | admin 진입은 별도 entry (`/admin/login` 후 sidebar nav) — 외부 링크는 deep-link 허용, chrome 만 hide |
| 14페이지 RequireAdmin 제거 시 일부 페이지 단독 접근 회귀 | 높음 | layout 가드로 일괄 처리, login만 예외. verify-admin-auth 로 회귀 0 확인 |
| Sheet 모바일 drawer 가 admin desktop UX 와 충돌 | 낮음 | counselor 패턴과 동일 — 1024px 이하만 drawer, 이상은 sticky sidebar |
| Bulk selection 상태 14페이지 중복 구현 | 중간 | `useBulkSelection` 훅으로 추출, AdminTableShell 이 props 로 expose |
| recharts bundle size 증가 | 낮음 | dynamic import (`next/dynamic`) 로 dashboard/analytics 만 lazy load |

### 외부 연동
없음 (UI 마이그레이션 한정). admin API 엔드포인트는 기존 그대로 사용.

## 5. 병렬 작업 가이드

> ZEOM-31 → ZEOM-32 **순차** 진행 권장 — ZEOM-32 가 ZEOM-31 의 layout/CHART_COLORS/AdminTableShell 을 import. file ownership 은 disjoint 하지만 의미적 dependency 가 있음.
>
> 병렬화 가능 영역: ZEOM-31 안에서 (a) layout.tsx (b) charts/colors.ts (c) AdminTableShell.tsx (d) chrome 가드 보강 — 4개는 disjoint 파일이므로 동시 commit 가능.

### Agent Teams 구성 (선택, 가속화 원할 때)

| 역할 | 담당 범위 | subagent 타입 |
|------|----------|---------------|
| ZEOM-31 layout/chrome slice | `web/src/app/admin/layout.tsx`, `web/src/components/{app-header,bottom-tab-bar}.tsx`, `web/src/components/admin/AdminTableShell.tsx`, `web/src/components/charts/colors.ts` | zeom-component-reviewer |
| ZEOM-32 14p slice | `web/src/app/admin/**/page.tsx` | zeom-component-reviewer |

### 파일 소유권

```
ZEOM-31 소유:
  web/src/app/admin/(auth)/layout.tsx                  [신규]
  web/src/components/admin/AdminTableShell.tsx         [신규]
  web/src/components/admin/use-bulk-selection.ts       [신규]
  web/src/components/charts/colors.ts                  [신규]
  web/src/components/charts/admin-charts.tsx           [신규 — Recharts wrapper]
  web/src/components/app-header.tsx                    [수정 — isAdmin 가드]
  web/src/components/bottom-tab-bar.tsx                [수정 — isAdmin 가드]
  web/package.json                                     [수정 — recharts deps]

ZEOM-32 소유:
  web/src/app/admin/login/page.tsx                     [수정]
  web/src/app/admin/dashboard/page.tsx                 [수정]
  web/src/app/admin/analytics/page.tsx                 [수정]
  web/src/app/admin/audit/page.tsx                     [수정]
  web/src/app/admin/counselor-applications/page.tsx    [수정]
  web/src/app/admin/coupons/page.tsx                   [수정]
  web/src/app/admin/disputes/page.tsx                  [수정]
  web/src/app/admin/disputes/[id]/page.tsx             [수정]
  web/src/app/admin/refunds/page.tsx                   [수정]
  web/src/app/admin/reviews/page.tsx                   [수정]
  web/src/app/admin/settlements/page.tsx               [수정]
  web/src/app/admin/timeline/page.tsx                  [수정]
  web/src/app/admin/users/page.tsx                     [수정]
  web/src/app/admin/users/[id]/page.tsx                [수정]
```

겹침 0. ZEOM-32 는 ZEOM-31 의 모듈을 *import 만*.

## 6. 참조

- §4.9 Group I (어드민 14페이지 명세)
- §6.7 Phase 6
- 부록 C.2 Admin Tone Recipe / C.3 Table 패턴 / C.4 차트 색상
- `web/CLAUDE.md` — Dashboard 분리 규칙, Korean text rules, design barrel 우선
- `web/.claude/docs/reference/design-system.md` — 토큰 baseline
- `web/.claude/docs/reference/frontend-pages.md` — chrome 가드 패턴
- `docs/ZEOM-7-dev-guide.md` — counselor 포털 layout 선례
- `docs/ZEOM-6-phase4-efg-dev-guide.md` — dashboard 차트 토큰 선례
