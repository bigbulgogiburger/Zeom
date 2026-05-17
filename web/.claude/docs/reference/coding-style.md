# Web Coding Style

> **Sub affinity**: web 전용 (Next.js 15 · React 19 · TypeScript 5.9 · Tailwind v4)
> 참조 시점: 신규 컴포넌트/페이지/유틸 작성, 기존 코드 수정 시 컨벤션 확인

## 언어/툴체인

- **TypeScript** (`strict: false`, `noEmit: true`) — `tsconfig.json`. lint 대용은 `npx tsc --noEmit`
- **ESLint / Prettier 미설정** — IDE 기본 포맷. PR 에 lint 의존 컨벤션 작성 금지
- `@/` → `web/src/` (`tsconfig.paths` + `jest.config.js moduleNameMapper`)
- shadcn alias (`components.json`): `@/components`, `@/components/ui`, `@/lib/utils`, `@/lib`, `@/hooks`

## 컴포넌트 패턴

### Server Component (기본)

```tsx
// app/<route>/page.tsx — async 가능, hook 사용 X
export default async function Page() {
  const data = await fetchData();
  return <RouteContent data={data} />;
}
```

### Client Component (인터랙션)

```tsx
'use client';
import { useState } from 'react';

interface ContentProps {
  data: DataType;
}

export function RouteContent({ data }: ContentProps) {
  const [state, setState] = useState(false);
  return <div>...</div>;
}
```

### Design Component (`web/src/components/design/`)

```tsx
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type BookingStatus = 'upcoming' | 'completed' | 'canceled';

interface BookingCardProps {
  status: BookingStatus;
  dateLabel: string;
  className?: string;
  children?: ReactNode;
}

const STATUS_LABEL: Record<BookingStatus, string> = {
  upcoming: '예약 확정',
  completed: '완료',
  canceled: '취소',
};

export function BookingCard({ status, dateLabel, className, children }: BookingCardProps) {
  return (
    <article className={cn('glow-card p-6', className)}>
      <span>{STATUS_LABEL[status]}</span>
      <time>{dateLabel}</time>
      {children}
    </article>
  );
}
```

핵심:
- **`export function ComponentName()`** — default export 지양 (page.tsx 제외)
- Props 는 `interface XxxProps` (외부 노출 안하면 안 export)
- 상수 라벨 매핑은 컴포넌트 위에 `const STATUS_LABEL: Record<...>` 패턴
- `className?: string` + `cn(...)` 으로 합성 (overridability)
- 도메인 union type 은 export — 페이지에서 재사용

## Hook 사용

- **Rules-of-hooks**: 모든 hook 호출 *후* early return (immersive 가드의 `if (isImmersive) return null` 도 hook 호출 다음 줄)
- `useState`, `useEffect`, `useMemo`, `useCallback` — React 표준
- `usePathname()`, `useRouter()` — next/navigation (App Router)
- 커스텀 hook: `web/src/hooks/use<Name>.ts` (`useWallet` 패턴)

## State 관리

전역 상태 라이브러리 없음 — React Context (`auth-context.tsx`) + 도메인 hook (`useWallet`) 조합.

## API 호출

```ts
// 항상 web/src/components/api-client.ts 경유
import { apiFetch, chargeCash, getWallet } from '@/components/api-client';

const wallet = await getWallet();
await chargeCash(amount);
```

- `apiFetch` 가 CSRF 토큰 + JWT refresh (`refresh_token` 쿠키) + retry 자동
- **직접 `fetch()` 호출 금지** — refresh/CSRF 누락
- 신규 엔드포인트 wrapper 는 `api-client.ts` 에 함수 1개 추가 (`api.ts` 는 base URL 만)

## Tailwind v4 + shadcn/ui

- 모든 색은 `hsl(var(--xxx))` 또는 Tailwind 유틸 (`bg-gold`, `text-text-primary`)
- **hex 0 baseline** — `grep -rEn '#[0-9A-Fa-f]{3,6}\b|&#[0-9]+;' web/src/app web/src/components` 0건
- 명시 예외: `--brand-kakao/-fg/--brand-naver` 토큰만 hex 정의 (브랜드 컴플라이언스)
- 디자인 토큰은 `src/app/globals.css` `@theme inline` 블록
- shadcn `<Card>` 직접 사용 시 회색 톤 → `<GlowCard>` 또는 `glow-card` 클래스
- **lucide-react only** — emoji / HTML entity 금지

## i18n (next-intl)

- 키 분리: `messages/ko.json`, `messages/en.json`
- 사용: `const t = useTranslations('Namespace'); t('key')`

## Naming

| 종류 | 규칙 | 예시 |
|------|------|------|
| Component file | `kebab-case.tsx` | `booking-card.tsx`, `auth-card.tsx` |
| Component name | `PascalCase` | `BookingCard`, `AuthCard` |
| Hook file | `useXxx.ts` (camelCase) | `useWallet.ts` |
| Util file | `kebab-case.ts` | `error-reporter.ts` |
| Page | `page.tsx` (App Router 규약) | `app/dashboard/page.tsx` |
| Route segment | `kebab-case` | `app/notification-preferences/` |
| Type/Interface | `PascalCase` | `BookingStatus`, `BookingCardProps` |
| Constant | `UPPER_SNAKE` | `STATUS_LABEL`, `DEFAULT_LIMIT` |

## Import 정렬

1. `import type { ... }` (type-only)
2. 외부 (`react`, `next/*`, `lucide-react`, `@portone/*`, `@sendbird/*`)
3. `@/components/*`, `@/hooks/*`, `@/lib/*`
4. relative (`./`, `../`)

그룹 간 빈 줄 1.

## 금지

- ❌ Server Component 에서 client hook 사용 — data fetch=server, 인터랙션=client 분리
- ❌ Root layout 직접 수정해 immersive 만들기 — `usePathname` 가드 패턴 사용 (frontend-pages.md)
- ❌ shadcn `<Card>` 그대로 사용 (토큰 매핑 누락 → 회색)
- ❌ Lucide 미사용 + emoji/HTML entity (ZEOM-21 베이스라인 위반)
- ❌ Hero/BookingCard 등에서 height 미지정 (CLS 악화) — `min-h-[<px>]` 명시
- ❌ FabBtn 등 아이콘 버튼에 `aria-label` 누락
- ❌ inline hex (`style={{ color: '#fff' }}`) — 토큰 사용

## 관련 reference

- `frontend-pages.md` — 페이지 구조 + immersive 가드 + 페이지 레시피
- `design-system.md` — 토큰 + design barrel 인벤토리 + anti-slop
- `testing.md` — Jest + Playwright 테스트 컨벤션
- `../../../.claude/docs/reference/sendbird-guide.md` — 통화 클라이언트 (userId 규약 cross-cutting)
