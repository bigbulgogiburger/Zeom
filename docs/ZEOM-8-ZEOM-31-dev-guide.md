# [ZEOM-31] P6-1 — admin layout + Admin Tone + Recharts CHART_COLORS

> 부모: [ZEOM-8](./ZEOM-8-dev-guide.md)
> 슬라이스: P6-1 (layout · 토큰 · 차트 베이스)
> 생성일: 2026-05-17

## 0. Touched Files (ADR-070)

```
[신규]
  web/src/app/admin/layout.tsx
  web/src/components/admin/AdminTableShell.tsx
  web/src/components/admin/use-bulk-selection.ts
  web/src/components/admin/AdminPageHeader.tsx
  web/src/components/charts/colors.ts
  web/src/components/charts/admin-charts.tsx

[수정]
  web/src/components/app-header.tsx          # isAdmin chrome 가드
  web/src/components/bottom-tab-bar.tsx      # isAdmin chrome 가드
  web/package.json                           # recharts dep
```

`disjoint` 보장 — ZEOM-32 와 동일 파일 0.

## 1. 목표

1. admin 전용 chrome (sidebar 240 + header 64) 을 단독 layout 으로 분리
2. RequireAdmin 가드를 layout 단으로 끌어올려 14페이지 중복 제거 (login 제외)
3. `CHART_COLORS` 단일 출처 (`chart-1~5` 토큰)
4. `AdminTableShell` 공통 컴포넌트 — sticky/zebra/bulk-selection/tabular-nums 캡슐화
5. 일반 사용자 chrome 가드 보강 — admin/* 경로에서 AppHeader + BottomTabBar self-hide

## 2. 구현 단계

### 2-1. `web/src/components/charts/colors.ts` (신규)

```ts
// 부록 C.4 — Recharts 토큰 매핑 단일 출처
export const CHART_COLORS = [
  'hsl(var(--chart-1))', // gold (43° 70% 46%)
  'hsl(var(--chart-2))', // jade (145° 40% 35%)
  'hsl(var(--chart-3))', // lotus (350° 55% 35%)
  'hsl(var(--chart-4))', // dancheong (35° 70% 45%)
  'hsl(var(--chart-5))', // warn (340° 40% 50%)
] as const;

export type ChartColorIndex = 0 | 1 | 2 | 3 | 4;
```

### 2-2. `web/src/components/charts/admin-charts.tsx` (신규)

Recharts 의존성을 lazy import 로 감싼 wrapper. ResponsiveContainer + LineChart/BarChart/PieChart preset 3 종 (admin dashboard/analytics 가 쓰는 형태). `<Cell fill={CHART_COLORS[i]} />` 패턴.

```ts
'use client';
import dynamic from 'next/dynamic';

// Recharts 는 client only — bundle 분리
export const LineChartCard = dynamic(() => import('./line-chart-card'), { ssr: false });
export const BarChartCard = dynamic(() => import('./bar-chart-card'), { ssr: false });
export const PieChartCard = dynamic(() => import('./pie-chart-card'), { ssr: false });
```

각 `*-card.tsx` 가 실제 Recharts 사용 + `CHART_COLORS` 만 reference.

### 2-3. `web/src/components/admin/use-bulk-selection.ts` (신규)

```ts
import { useState, useCallback } from 'react';

export function useBulkSelection<T extends string | number>(items: readonly T[]) {
  const [selected, setSelected] = useState<Set<T>>(new Set());
  const [lastIndex, setLastIndex] = useState<number | null>(null);

  const toggle = useCallback((id: T, idx: number, shiftKey: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (shiftKey && lastIndex !== null) {
        const [from, to] = idx < lastIndex ? [idx, lastIndex] : [lastIndex, idx];
        items.slice(from, to + 1).forEach((it) => next.add(it));
      } else if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    setLastIndex(idx);
  }, [items, lastIndex]);

  const toggleAll = useCallback(() => {
    setSelected((prev) => (prev.size === items.length ? new Set() : new Set(items)));
  }, [items]);

  const clear = useCallback(() => setSelected(new Set()), []);

  return { selected, toggle, toggleAll, clear, count: selected.size };
}
```

### 2-4. `web/src/components/admin/AdminTableShell.tsx` (신규)

- props: `columns`, `rows`, `selectable?: boolean`, `getRowKey`, `onBulkAction?`
- sticky header (`sticky top-0 z-10 bg-card`)
- zebra: `[&_tr:nth-child(even)]:bg-surface-2/40`
- 행 높이 압축: `[&_td]:py-2 [&_th]:py-2.5`
- tabular-nums column: `<col className="tabular-nums">` 지원
- bulk bar: 선택 N개 + bulk ghost 액션
- 키보드: row Space 토글, Shift+Click 범위

### 2-5. `web/src/components/admin/AdminPageHeader.tsx` (신규)

- 64px header — 검색 input (320, `lucide:Search`) + admin avatar dropdown + 로그아웃 ghost
- sticky top-0, bg-card border-b
- 검색 input 은 currently placeholder-only (실제 전역 검색은 후속 작업)

### 2-6. `web/src/app/admin/layout.tsx` (신규 — 단일 layout + pathname 분기)

```tsx
'use client';
import { usePathname } from 'next/navigation';
import { RequireAdmin } from '@/components/route-guard';
import { AdminSidebarNav, AdminSidebarHeader } from '@/components/admin/AdminSidebar';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === '/admin/login') return <>{children}</>;  // 게스트 접근 — 가드/chrome 우회
  return (
    <RequireAdmin>
      <div className="flex min-h-[100dvh] bg-background">
        <aside className="hidden md:flex w-[240px] ...">
          <AdminSidebarHeader />
          <AdminSidebarNav />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminPageHeader leftSlot={/* mobile drawer trigger */} />
          <main className="flex-1 overflow-x-auto bg-background p-4 md:p-6">
            {children}
          </main>
        </div>
      </RequireAdmin>
    </div>
  );
}
```

`AdminSidebar` (counselor 패턴 차용) 는 240px desktop / Sheet drawer mobile. 14개 메뉴 (운영/사용자/거래/감사 4그룹).

**route group `(auth)` 회피 결정**: 13개 페이지를 `(auth)` 그룹으로 이동시키면 git rename 13건이 PR diff 를 폭증시키고 history grep 을 방해함. 단일 layout + 1줄 pathname 분기가 동작·의도 모두 일치하고 회귀 위험 0. `/admin/login` 만 layout 내부에서 `usePathname === '/admin/login'` 분기로 chrome/RequireAdmin 우회.

### 2-7. Root chrome 가드 (수정)

`web/src/components/app-header.tsx`:
```ts
const seg = pathname.split('/');
const isImmersive = seg[1] === 'consultation' && !!seg[2] && seg[3] !== 'review';
const isAdmin = seg[1] === 'admin';
if (isImmersive || isAdmin) return null;
```

`web/src/components/bottom-tab-bar.tsx`: 동일 가드 + `isAdmin || isImmersive` 일 때 `return null`.

기존 AppHeader 의 `/admin/timeline`, `/admin/audit` 데스크탑/모바일 nav 링크는 유지 (admin 진입은 deep link 허용, chrome 만 hide).

### 2-8. `web/package.json` (수정)

```
"dependencies": {
  ...
  "recharts": "^3.0.2",
  ...
}
```

설치 후 `npm run build` 한 번 통과 확인 (react 19 peer 경고만 무시 가능).

## 3. AC 매핑 (ZEOM-31 description)

- [x] sidebar 240 + 상단 64 헤더 (모든 admin 페이지)
- [x] 검색 input 동작 (placeholder)
- [x] 카드 padding 16, density 최압축 → AdminTableShell + 컨테이너 `p-4`
- [x] gold 출현 빈도 -2단계 → 액티브 nav만 gold (counselor 패턴 차용)
- [x] Recharts 모든 차트 hex 0 → CHART_COLORS 단일 출처
- [x] keyboard nav → sidebar Tab + 검색 focus + table row Space
- [x] verify-admin-auth → layout 가드로 14페이지 일괄 보호

## 4. 검증

```bash
cd web
npx tsc --noEmit                                  # 0 error
npm run build                                     # admin 13 + login 1 route
rg -nE '#[0-9A-Fa-f]{3,6}\b|&#[0-9]+;' \
    web/src/components/admin web/src/components/charts  # 0건
```

브라우저 수동:
- `/admin/dashboard` → AppHeader/BottomTabBar 미렌더 + admin chrome 단독
- 로그아웃 → `/login` 으로
- `/admin/login` → RequireAdmin 가드 외부 (게스트 접근 가능)

## 5. 위험 및 대응

| 위험 | 대응 |
|------|------|
| recharts react 19 peer 경고 | `--legacy-peer-deps` 사용하지 않고 일반 install — peer 가 *18 || 19 가 아니면* 빌드 확인 후 fork 검토 |
| AdminSidebar 의 14개 메뉴가 길어서 모바일 drawer 스크롤 | `overflow-y-auto` + 카테고리 grouping (counselor 패턴) |
| RequireAdmin 가드 이중 적용 (layout + 페이지 잔존) | ZEOM-32 에서 각 페이지의 RequireAdmin 제거 — 잔존 시 무해하지만 중복 redirect 가능, 일괄 cleanup |
| `/admin/login` 이 (auth) layout 안에 들어가면 무한 redirect | route group `(auth)` 안에 두지 말고 `web/src/app/admin/login/page.tsx` 단독 유지 — layout 은 `(auth)` 그룹에만 적용 |

## 6. Out of Scope

- 14페이지 개별 컨텐츠 dense 변환 (ZEOM-32)
- 전역 검색 input 의 실제 검색 기능 (별도 이슈)
- admin API 엔드포인트 변경
- 2FA prompt 백엔드 로직 (login page에 UI 자리만)
