# [ZEOM-3] [Phase 1] Primitive Library — 신규 15 + shadcn 8 + lib 정렬 — 개발 가이드

> 생성일: 2026-04-25
> 스택: Next.js 15 / React 19 / Tailwind v4 / shadcn (web/)
> 페르소나: React Expert — Server Components, Tailwind v4 토큰 시스템, shadcn primitive 정렬에 능숙

## 1. 요구사항 요약

### 비즈니스 목표
Phase 0(토큰·Gowun Batang·radial bg)이 머지된 상태에서, **재사용 가능한 디자인 primitive 19개 + shadcn 8개 + lib 위젯 정렬**을 마무리하여 Phase 2(페이지 단위 pixel-perfect 마이그레이션)의 차단 조건을 해제한다. 모든 컴포넌트는 토큰 기반(hex 0개) + reduced-motion 분기를 갖춘다.

### 인수조건 (Issue AC)
- [ ] 15 primitive 모두 단위 렌더 가능 (`/design-system` dev 카탈로그)
- [ ] shadcn 8개 모두 토큰 정렬 (hex 0개)
- [ ] reduced-motion 분기 모든 애니메이션
- [ ] tabular 사용처 검증 (Stars, WalletChip, Timer)
- [ ] `npm run typecheck` (`tsc --noEmit`) 통과
- [ ] 카테고리별 PR 그룹 (Phase별 단위)

### 제약사항
- **Phase 0 토큰**(`--bg-deep`, `--surface-2`, `--surface-3`, `--gold-deep`, `--jade`, `--shadow`, `--shadow-gold`, `breathe`/`scaleIn` keyframes, `.serif`/`.tabular` 유틸)은 이미 `web/src/app/globals.css`에 들어가 있음 — 신규 추가 X
- **현재 디렉토리 구조**: `web/src/components/`(평면) + `web/src/components/ui/`(shadcn). 신규 primitive는 **`web/src/components/design/`** 신규 디렉토리에 배치
- **Tailwind v4**: `hsl(var(--xxx))` 패턴 강제 (hex 금지). 토큰은 `@theme inline` 블록에 등록되어 `bg-gold`, `text-text-primary` 형태로 사용 가능
- 채팅(Sendbird) 의존 컴포넌트(`ChatPanel`)는 P2의 **시그니처만** 정의 — 실제 sendbird 클라이언트 통합은 별도 이슈
- `web/src/components/empty-state.tsx`(이미 존재, `EmptyStateCard` named export) 는 **개선** (move to `design/empty-state.tsx`, signature 통일)
- `sonner.tsx`(`web/src/components/ui/sonner.tsx`) vs `toast.tsx`(`web/src/components/toast.tsx`) → **sonner 유지**, 사용처 마이그레이션 + `toast.tsx` 제거

## 2. 영향 범위 분석

### 신규 생성 (Phase 1~3 — 신규 15 primitive)

| 파일 | 위치 | 내용 |
|------|------|------|
| `web/src/components/design/stars.tsx` | P0 | `<Stars value size?>` — 별점 표시 (반쪽별 처리, `.tabular` 사용) |
| `web/src/components/design/portrait.tsx` | P0 | `<Portrait counselor size?>` — 상담사 원형 아바타 (gold ring) |
| `web/src/components/design/dot.tsx` | P0 | `<Dot color? pulse?>` — 상태 점 (online/busy/away) |
| `web/src/components/design/wallet-chip.tsx` | P0 | `<WalletChip>` — `useWallet()` 훅 사용, `.wallet-chip` 유틸 베이스 |
| `web/src/components/design/seg.tsx` | P0 | `<Seg items value onChange>` — 세그먼트 컨트롤 (`.seg` 유틸 베이스) |
| `web/src/components/design/progress-steps.tsx` | P1 | `<ProgressSteps steps current>` — 단계 진행 (`.progress-steps`) |
| `web/src/components/design/glow-card.tsx` | P1 | `<GlowCard padding?>` — `.glow-card` 유틸 베이스 |
| `web/src/components/design/empty-state.tsx` | P1 | 개선판 `<EmptyState icon? title body cta?>` |
| `web/src/components/design/timer.tsx` | P1 | `<Timer start total>` — 카운트다운 (mm:ss, `.tabular`) |
| `web/src/components/design/mic-level-meter.tsx` | P2 | `<MicLevelMeter level mic>` — 마이크 레벨 막대 |
| `web/src/components/design/breathing-orb.tsx` | P2 | `<BreathingOrb accent? initial?>` — 호흡 애니메이션 (`.breathe`) |
| `web/src/components/design/fab-btn.tsx` | P2 | `<FabBtn on onClick label icon>` — Floating Action Button |
| `web/src/components/design/chat-panel.tsx` | P2 | `<ChatPanel messages onSend onClose>` — 시그니처 + 정적 UI (sendbird 통합 X) |
| `web/src/components/design/star-rating.tsx` | P2 | `<StarRating value hover onChange onHover>` — 인터랙티브 별점 |
| `web/src/components/design/tag-toggle.tsx` | P2 | `<TagToggle tags selected onToggle>` — 태그 토글 |
| `web/src/components/design/index.ts` | export | 배럴 export |
| `web/src/hooks/useWallet.ts` | hook | `WalletChip` 의존 — `getWallet()` 호출, focus 시 자동 갱신 (기존 `wallet-widget.tsx` 로직 추출) |
| `web/src/app/design-system/page.tsx` | catalog | 모든 primitive 카탈로그 (dev only — `process.env.NODE_ENV === 'production'` 시 404) |

### 수정 (Phase 4 — shadcn 8 + lib 4)

| 파일 | 변경 |
|------|------|
| `web/src/components/ui/button.tsx` | gold-grad/secondary/ghost/danger × sm/default/lg/block variant 추가, focus halo gold 정렬 |
| `web/src/components/ui/card.tsx` | `--surface` + `--border-subtle` + 14px radius + 20px padding, `glow` variant 추가 |
| `web/src/components/ui/badge.tsx` | gold/success/warn/danger/muted/lotus 6 variant |
| `web/src/components/ui/tabs.tsx` | underline variant 추가 |
| `web/src/components/ui/dialog.tsx` | backdrop `--bg-deep/0.72` + blur 6px + `scaleIn` |
| `web/src/components/ui/sonner.tsx` | top:88, right:32, `--shadow` |
| `web/src/components/ui/table.tsx` | sticky header, zebra `--surface-3`, hover `--surface-2` |
| `web/src/components/ui/input.tsx` | focus halo gold 0.6 + 3px ring |
| `web/src/components/ui/textarea.tsx` | input과 동일 정렬 |
| `web/src/components/app-header.tsx` | height 64→68, blur 20 |
| `web/src/components/wallet-widget.tsx` | 토큰 정렬 (인라인 style → tailwind 클래스 + `<WalletChip>` 사용) |
| `web/src/components/credit-widget.tsx` | 토큰 정렬 |
| `web/src/components/notification-bell.tsx` | 토큰 정렬 |
| `web/src/components/toast.tsx` | **삭제** — 사용처를 `sonner` (`toast()` from `sonner` 또는 `<Toaster/>`)로 마이그레이션 |
| `web/src/components/empty-state.tsx` | **삭제 후 재export** — `design/empty-state.tsx`로 이동, 기존 `EmptyStateCard` 사용처를 새 API로 마이그레이션 |

### 연관 파일 (참조용)

| 파일 | 이유 |
|------|------|
| `web/src/app/globals.css` | 토큰 + 유틸 클래스 + keyframes 출처 (변경 없음) |
| `web/src/lib/utils.ts` | `cn()` 함수 (모든 primitive에서 사용) |
| `web/src/components/api-client.ts` | `getWallet()` API (useWallet 훅에서 사용) |

### DB 변경
없음 (frontend-only).

## 3. 구현 계획

### Phase 1 (ZEOM-13): P0 Primitives 5 — Stars, Portrait, WalletChip, Seg, Dot

**목표**: Phase 2 차단조건인 P0 5개 primitive 완료.

1. `web/src/hooks/useWallet.ts` 생성 — `wallet-widget.tsx`의 `loadBalance` 로직 + focus listener 추출
2. `web/src/components/design/dot.tsx` — color prop(`gold|success|warning|destructive|jade`), pulse 시 `animate-pulse` (reduced-motion 분기는 globals.css 글로벌 처리됨)
3. `web/src/components/design/portrait.tsx` — `next/image` 기반, size: `sm|md|lg|xl` (32/48/64/96px), gold 1px ring
4. `web/src/components/design/stars.tsx` — value(0~5, 0.5 단위), size, lucide `Star`/`StarHalf`, 숫자 옆 `<span className="tabular">`
5. `web/src/components/design/wallet-chip.tsx` — `useWallet()` + `.wallet-chip` + `.tabular` + 클릭 시 `/wallet`
6. `web/src/components/design/seg.tsx` — `items: {key, label, count?}[]`, `value`, `onChange(key)`, count는 `<Badge>` 사용
7. `web/src/components/design/index.ts` — 배럴 export
8. `/design-system` 카탈로그 페이지 초기 스캐폴드 + P0 5개 데모 섹션

**검증**: `npm run typecheck` 통과 + `npm run dev` 후 `/design-system` 5개 모두 렌더 + reduced-motion OS 토글 시 애니메이션 정지 확인

### Phase 2 (ZEOM-14): P1 Primitives 4 — ProgressSteps, GlowCard, EmptyState, Timer

1. `web/src/components/design/glow-card.tsx` — `.glow-card` 유틸 베이스, padding(`sm|md|lg`)
2. `web/src/components/design/progress-steps.tsx` — `steps: {key, label}[]`, `current` (index), 완료된 step에 gold dot, 진행 중에 pulse
3. `web/src/components/design/empty-state.tsx` — 개선 시그니처 `{icon? (ReactNode), title, body, cta? {label, href? | onClick?}}` (이전 EmptyStateCard 호환 wrapper 제공해 마이그레이션 안전)
4. `web/src/components/design/timer.tsx` — `useEffect` interval, `start`(Date) + `total`(seconds) → 남은 시간 mm:ss (`.tabular`)
5. `index.ts` 갱신 + 카탈로그 섹션 추가

**검증**: typecheck + 카탈로그 4개 데모 + Timer가 `total` 만료 시 0:00 고정

### Phase 3 (ZEOM-15): P2 Primitives 6 — MicLevelMeter, BreathingOrb, FabBtn, ChatPanel, StarRating, TagToggle

1. `web/src/components/design/mic-level-meter.tsx` — 8개 막대, level 0~1 → 막대 N개 active, mic prop은 `MediaStreamTrack | null` (UI만 — 실제 RMS 계산은 호출자 책임이라 prop 그대로 표시)
2. `web/src/components/design/breathing-orb.tsx` — `.breathe` 유틸, accent(`gold|jade|lotus`), initial(`크기 px`)
3. `web/src/components/design/fab-btn.tsx` — `on` boolean 상태로 색 토글, lucide icon
4. `web/src/components/design/chat-panel.tsx` — **시그니처 + 정적 UI만** (`messages: {id, from, text, ts}[]`, `onSend(text)`, `onClose()`). sendbird 통합 X
5. `web/src/components/design/star-rating.tsx` — Stars의 인터랙티브 버전 (`onHover` for half-star preview)
6. `web/src/components/design/tag-toggle.tsx` — `tags: string[]`, `selected: Set<string>`, `onToggle(tag)`
7. index.ts + 카탈로그 6개 섹션

**검증**: typecheck + 카탈로그 6개 데모 + breathe가 reduced-motion 시 정지

### Phase 4 (ZEOM-16): shadcn 8 정렬 + lib 4 정렬 + sonner/toast 단일화

**4-1. shadcn 정렬 (병렬 가능)**

| 파일 | 핵심 변경 | 검증 |
|------|----------|------|
| `ui/button.tsx` | `variant`: gold-grad(`bg-gradient-to-r from-gold to-gold-soft text-background`), danger(=destructive), ghost gold-tint hover. `size`: `block`(w-full h-12) 추가 | `<Button variant="gold-grad">` 카탈로그 |
| `ui/card.tsx` | wrapper에 `bg-surface border-border-subtle rounded-[14px] p-5`. `<Card variant="glow">` 시 `.glow-card` 클래스 부착 | 카탈로그 |
| `ui/badge.tsx` | 6 variant: `gold` `success` `warn`(=warning) `danger`(=destructive) `muted` `lotus` | 카탈로그 |
| `ui/tabs.tsx` | `<TabsList variant="underline">` 시 border-b + active 시 gold underline | 카탈로그 |
| `ui/dialog.tsx` | overlay `bg-bg-deep/72 backdrop-blur-md`, content `animate-[scaleIn_0.3s_var(--ease-spring)_both]` | 카탈로그 |
| `ui/sonner.tsx` | `position="top-right"`, `offset={{ top: 88, right: 32 }}`, `--normal-shadow: var(--shadow)` | 카탈로그 |
| `ui/table.tsx` | `<thead>` sticky top-0 bg-surface-3, `<tr>` even:bg-surface-3 hover:bg-surface-2 | 카탈로그 |
| `ui/input.tsx` + `textarea.tsx` | focus-visible: `border-gold/60 ring-gold/25 ring-[3px]` | 카탈로그 |

**4-2. lib 정렬**

1. `app-header.tsx` — `h-[68px]` (기존 64), `backdrop-blur-[20px]` (이미 있는 경우 확인)
2. `wallet-widget.tsx` — 인라인 `style={{...}}` 제거 → `<WalletChip>` 또는 토큰 클래스로 교체
3. `credit-widget.tsx`, `notification-bell.tsx` — 동일 패턴

**4-3. sonner/toast 단일화**

1. `grep -rn "from '@/components/toast'\|from './toast'\|useToast" web/src` → 사용처 목록 추출
2. 각 사용처에서 `import { toast } from 'sonner'`로 교체, `<ToastProvider>` 래퍼는 layout에서 `<Toaster/>` (sonner)로 통일
3. `web/src/components/toast.tsx` 삭제
4. `app/layout.tsx`에 `<Toaster />` (sonner) 마운트 확인

**검증**: typecheck + 빌드 (`npm run build`) + 모든 페이지 hex 검색 0개 (`rg "#[0-9a-fA-F]{3,8}" web/src/components web/src/app/globals.css | grep -v "globals.css\|svg viewBox"` 공집합)

### Phase 5: 최종 통합 + 카탈로그 마무리 + 테스트

1. `/design-system` 페이지에서 모든 19 primitive + shadcn 8 + lib 위젯 데모 (production-build 시 404 가드: `notFound()` from `next/navigation`)
2. 기존 `web/src/components/empty-state.tsx` → `EmptyStateCard` named export를 `design/empty-state.tsx`의 thin wrapper로 변경 (호환성), 또는 사용처 마이그레이션 후 삭제
3. `npm run typecheck`, `npm run lint`(있으면), `npm test`(Jest 회귀), `npm run build` 모두 통과
4. Lighthouse 회귀 ≥ 90 (수동 검증 — `/design-system`은 제외)

## 4. 기술 상세

### 핵심 로직 (페르소나 관점)

**1. shadcn primitive는 "패치"가 아니라 "variant 추가"**: 기존 default variant를 깨면 미리 작성된 페이지들이 망가진다. **신규 variant를 추가**하는 것이 안전. 예: `button`의 `default`(=gold)는 그대로, `gold-grad`는 신규.

**2. `useWallet` 훅 추출 우선**: `WalletChip`이 가장 사용자 영향 큰 P0 컴포넌트. `wallet-widget.tsx`의 fetch 로직을 훅으로 빼면 (a) 테스트 가능 (b) 다른 화면에서도 재사용 (c) 위젯 자체가 얇아짐. 기존 위젯은 훅 사용으로 전환만.

**3. 카탈로그 페이지는 dev-only**: production 빌드에서 검색엔진/사용자 노출 금지. `app/design-system/page.tsx` 첫 줄에 `if (process.env.NODE_ENV === 'production') notFound()`.

**4. EmptyState 마이그레이션 전략**: 기존 `EmptyStateCard`는 named export로 사용 중이라 grep로 사용처 추적 가능. 새 `EmptyState`는 `<EmptyState/>` (default-ish 시그니처). 동일 파일에서 두 export를 일정 기간 공존시키지 않고 **한 PR에서 사용처 동시 변경** (이슈 권한 — 카테고리별 PR 그룹).

**5. ChatPanel은 시그니처만**: sendbird 통합은 별도 이슈(`web/src/components/consultation-chat.tsx` 참조). 본 이슈는 디자인 토큰 + 정적 메시지 표시만.

### 위험 요소

| 위험 | 영향도 | 대응 |
|------|--------|------|
| shadcn variant 추가가 default 동작 변경 | 높음 | default variant는 절대 건드리지 않음 — 신규 variant만 추가. 기존 사용처 회귀 테스트(jest) 필수 |
| `EmptyStateCard` → `EmptyState` API 변경 사용처 깨짐 | 중간 | grep로 모든 사용처 추출 후 한 PR에서 마이그레이션. 시그니처 호환 wrapper 일시 제공 |
| `toast.tsx` 제거 시 임포트 깨짐 | 중간 | grep `from '@/components/toast'` → `from 'sonner'` 일괄 치환 + 빌드 검증 |
| `wallet-widget.tsx` 인라인 style 제거 시 시각 회귀 | 낮음 | 대응되는 토큰 클래스 매핑표 유지 + 카탈로그 비교 |
| Phase 0 토큰 누락분 발견 | 낮음 | 발견 즉시 globals.css에 추가 (이슈 범위 내) |

### 외부 연동
없음 (frontend-only).

## 5. 병렬 작업 가이드

> 각 Phase 내부 primitive들은 **파일이 모두 다르므로** 안전하게 병렬 가능. Phase 간은 의존(P1 EmptyState → 카탈로그 갱신 등)이 약하나 순차 권장.

### Phase 1 (P0) 병렬 매핑 — 4-way fan-out

| 역할 | 담당 파일 | 의존 |
|------|----------|------|
| Hook author | `web/src/hooks/useWallet.ts` | 선행 (WalletChip 의존) |
| P0-A | `design/dot.tsx`, `design/portrait.tsx` | 독립 |
| P0-B | `design/stars.tsx`, `design/seg.tsx` | 독립 |
| P0-C | `design/wallet-chip.tsx` | useWallet 의존 |
| Catalog | `app/design-system/page.tsx` + `design/index.ts` | 모든 primitive 완료 후 |

### Phase 4 shadcn 병렬 매핑 — 8-way fan-out

| 담당 | 파일 |
|------|------|
| shadcn-A | button, card |
| shadcn-B | badge, tabs |
| shadcn-C | dialog, sonner |
| shadcn-D | table, input+textarea |

각 담당이 서로 다른 파일만 수정 → 충돌 0. lib 정렬은 shadcn 완료 후 (의존: `<Button>`/`<Card>` 변경 반영).

### 파일 충돌 방지
- `web/src/components/design/index.ts` — 모든 primitive 작업 완료 후 한 명이 일괄 갱신
- `app/design-system/page.tsx` — 모든 primitive 완료 후 한 명이 카탈로그 작성

---

다음 단계: `/harness-plan ZEOM-3` (Sprint Contract 보강) → 사용자 승인 → `/jira-execute ZEOM-3` Phase별 진행
