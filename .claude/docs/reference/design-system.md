# Design System — Organic Warmth Dark

> 참조 시점: UI 컴포넌트, 색상, 폰트, 레이아웃, 페이지 마이그레이션, design primitive 추가/수정 시
> 마지막 큰 변경: ZEOM-2/3/4/17 sweep (Phase 0 토큰 → Phase 1 primitives → P1·P2·P3 페이지 적용)

## 개요

Organic Warmth 바이브 아키타입. 따뜻한 다크 톤에 골드 단일 악센트 + dancheong/lotus 보조.
**Gowun Batang** (heading) + **Pretendard** (body) 폰트 페어링.

규칙은 단순: **색은 토큰만, 폰트는 두 종, 모션은 prefers-reduced-motion 존중, 컴포넌트는 design barrel(`@/components/design`) 우선**.

## 토큰 (`web/src/app/globals.css`)

`@theme inline` 블록에 등록. Tailwind 유틸리티(`bg-gold`, `text-text-primary` 등)로 노출.

```
core:    --background --foreground --card --popover --primary --secondary
         --muted --accent --destructive --border --input --ring --radius
brand:   --gold (43 70% 46%) --gold-soft --gold-muted
         --dancheong (350 55% 35% — 에러/경계) --lotus (340 40% 50% — required)
text:    --text-primary --text-secondary --text-muted
status:  --success (145 40% 35%) --warning (35 70% 55%)
surface: --surface --surface-hover (--surface-2/3는 카드 레이어용)
sidebar: --sidebar-* (counselor/admin portal 전용)
```

**사용법** — `hsl(var(--*))` 또는 Tailwind 유틸리티 단 두 가지만:
- ✅ `style={{ background: 'hsl(var(--gold))' }}`
- ✅ `className="bg-gold text-background"`
- ❌ `'#C9A227'` / `'#FFF'` / `rgba(...)` — hex 0건이 baseline (ZEOM-21 게이트)
- 투명도: `hsl(var(--gold)/0.15)` 또는 `bg-gold/15`

## Typography

- **Heading**: `font-heading` → `Gowun_Batang` (`next/font/google`, `--font-gowun-batang`)
- **Body**: `font-pretendard` → 외부 CDN(`pretendardvariable-dynamic-subset.min.css`) — `<html className="font-pretendard">`로 기본
- Korean: `word-break: keep-all`, 헤딩에 `text-wrap: balance`
- Fluid: `text-[clamp(2rem,5vw,3.5rem)]` — Hero 등
- **금지 폰트**: Inter, Noto Sans KR, Noto Serif KR, Roboto

## Design Barrel (`@/components/design`)

모든 신규 페이지·컴포넌트는 design barrel을 우선 사용. **shadcn/ui는 base 1차 지원** (Button, Dialog, Card 등은 그대로 사용 가능). 도메인 특화 패턴은 design barrel.

### Foundation (P0)
| 컴포넌트 | 용도 |
|---------|------|
| `Dot` | 8/12px 컬러 점 (상태 인디케이터) |
| `Portrait` | 상담사 초상 (sm/md/lg/xl) — 골드 ring + 이니셜 폴백 |
| `Stars` | 정수 별점 표시 |
| `WalletChip` | 지갑 잔액 칩 (`useWallet` 훅 연동) |
| `Seg` | 세그먼트 컨트롤 (탭) — `SegItem[]` |

### Layout & State (P1)
| 컴포넌트 | 용도 |
|---------|------|
| `GlowCard` | 기본 카드(반투명 surface + gold/gold-soft 라디얼 글로우) — `glow-card` Tailwind 클래스도 동일 |
| `ProgressSteps` | 단계 표시(예약/결제 위자드) — `current` index |
| `EmptyState` | 빈 상태 — icon + title + (sub) + action |
| `Timer` | 카운트다운/카운트업 |

### Interactive (P2)
| 컴포넌트 | 용도 |
|---------|------|
| `BreathingOrb` | 대기실 호흡 애니메이션 (size xl) — `motion-reduce` 안전 |
| `MicLevelMeter` | 마이크 레벨 게이지 (`level: 0~1`) |
| `FabBtn` | 풀스크린 컨트롤 버튼 (icon + 보이지 않는 라벨, aria-label 필수) |
| `StarRating` | hover/select 별점 입력 |
| `TagToggle` | 다중 토글 태그 (Set 기반) |
| `ChatPanel` | 채팅 슬라이드 패널 (`open` data 속성으로 translate-x) |

### Booking · Cash · Review (ZEOM-17 P2-1)
| 컴포넌트 | 용도 |
|---------|------|
| `BookingCard` | 예약 내역 카드 — `BookingStatus` (upcoming/completed/canceled), `BookingChannel` (video/voice) |
| `RadioCard` | role=radio 카드 — 결제수단/예약채널 등 큰 클릭 영역 + 키보드 Space/Enter |
| `SuccessState` | 80px circle + check/lotus 아이콘 + autoNavigateMs 자동 이동 |

### Counselors (ZEOM-18 P1-1)
| 컴포넌트 | 용도 |
|---------|------|
| `CounselorCard` | `variant: 'list' \| 'compact'` — 목록 카드(상세+CTA) / 홈 추천 카드(미니) |
| `FilterChip` | `selected` + `aria-pressed`, 키보드 Space/Enter, `count?` 배지 |

### Home (ZEOM-19 P1-2)
| 컴포넌트 | 용도 |
|---------|------|
| `Hero` | radial-gold 배경 + balanced h1 + gold-grad CTA, `min-h-[480px]` (CLS 안정) |
| `CategoryGrid` | 4–6칸 글래스 카드(연애/금전/취업/건강/가족/이별) — Lucide 아이콘 |
| `ReviewSlider` | 모바일 `snap-x mandatory` + 데스크톱 좌우 화살표·키보드 ←→ |

### Immersive (ZEOM-20 P3-1)
| 컴포넌트 | 용도 |
|---------|------|
| `EndCallModal` | shadcn Dialog 기반 종료 confirm — autoFocus + Escape close + focus trap |

## Layout Patterns

### glow-card 클래스 (CSS)
```css
.glow-card { /* surface-2 + 골드 라디얼 글로우 + 호버 lift */ }
```
GlowCard 컴포넌트와 동일 스타일을 div에서 쓰고 싶을 때 사용.

### gold-grad 버튼
```tsx
<Button variant="gold-grad" size="lg">예약하기</Button>
// 또는 인라인:
className="bg-gradient-to-r from-gold to-gold-soft text-background hover:shadow-[var(--shadow-gold)]"
```

### Sticky 우측 카드 (Booking confirm, Counselor detail)
```tsx
<div className="lg:grid-cols-[1fr_360px] gap-8">
  <div>{/* 본문 */}</div>
  <aside className="lg:sticky lg:top-[88px]"><GlowCard /></aside>
</div>
```

### 모바일 fixed bottom CTA
모바일(<lg)에서 sticky 카드 대신:
```tsx
<div className="lg:hidden fixed inset-x-0 bottom-[var(--bottom-tabs-h)] z-30 ...">
```

## Anti-Slop Rules

- 이모지 금지 → Lucide React 아이콘 사용 (HTML entity `&#128100;` 같은 것도 금지 — Lucide `<User>`로)
- 순수 `#000000` / `#FFFFFF` 금지 → 토큰(`background`/`text-primary`) 사용
- 3열 균등 그리드 금지 → Bento/Spotlight/Stagger 유도(예: `grid-cols-[1fr_360px]`)
- 인접 섹션 동일 레이아웃 금지
- Gradient text 페이지당 최대 1곳
- 골드 외 악센트: `dancheong` (에러/destructive), `lotus` (필수표시·required)

## Motion

- `motion-reduce:hidden` 또는 `motion-reduce:animate-none`을 모든 장식 모션에 부착
- BreathingOrb / DotPulse / glow-card animate-pulse / FabBtn 호흡 — 모두 reduced-motion 안전
- 사용자가 `prefers-reduced-motion` 활성화 시 핵심 콘텐츠는 그대로, 장식만 정지

## 페이지별 적용 결과 (ZEOM-4 §6)

| 화면 | 핵심 컴포넌트 | 출처 |
|------|--------------|------|
| `/` | Hero, CounselorCard variant='compact', CategoryGrid, ReviewSlider | ZEOM-19 |
| `/counselors` | CounselorCard variant='list', FilterChip, EmptyState | ZEOM-18 |
| `/counselors/[id]` | Portrait XL + sticky GlowCard 예약 카드 + RadioCard 채널 | ZEOM-18 |
| `/booking/confirm` | ProgressSteps, GlowCard, gold-grad 버튼 | ZEOM-17 |
| `/cash/buy` | RadioCard 패키지 4 + 결제수단 4 + sticky 주문 요약 + SuccessState | ZEOM-17 |
| `/bookings/me` | Seg 3탭, BookingCard | ZEOM-17 |
| `/consultation/[sid]/waiting` | BreathingOrb + Portrait + Timer + FabBtn | ZEOM-20 |
| `/consultation/[sid]` (Room) | full-bleed video + self PIP + MicLevelMeter + ChatPanel + EndCallModal | ZEOM-20 |
| `/consultation/[sid]/review` | StarRating + TagToggle + textarea + SuccessState | ZEOM-17 |

## 검증 방법

신규 페이지/컴포넌트 작성 후:

```bash
# 1. hex/HTML entity 0 (필수)
grep -rEn "#[0-9A-Fa-f]{3,6}\b|&#[0-9]+;" <변경 경로>

# 2. 빌드/타입
cd web && npx tsc --noEmit
cd web && npm run build

# 3. 키보드/접근성
# - aria-label/aria-pressed 부착 확인
# - focus-visible:ring-2 focus-visible:ring-gold 일관

# 4. 모션
# - 장식 모션에 motion-reduce:* 부착 확인
```

## 함정

- ❌ shadcn `<Card>` 그대로 사용 시 토큰 매핑 누락 → 회색 톤 발생. **GlowCard 또는 `glow-card` 클래스** 사용
- ❌ Lucide 미사용 + emoji/HTML entity 폴백 → ZEOM-21 베이스라인 위반
- ❌ Hero·BookingCard 등에서 height 미지정 → CLS 악화. `min-h-[<px>]` 또는 aspect-* 명시
- ❌ FabBtn에 aria-label 누락 → 스크린리더 사용 불가
- ❌ root layout의 chrome(AppHeader/BottomTabBar)을 Modal/Slide-over로 대체 시도 → 다른 페이지 회귀 위험. 대신 페이지·layout level fixed/absolute로
