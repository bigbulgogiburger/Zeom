# Design System — Organic Warmth Dark

> 참조 시점: UI 컴포넌트, 색상, 폰트, 레이아웃 작업 시

## 개요

Organic Warmth 바이브 아키타입. 따뜻한 다크 톤에 골드 단일 악센트.
Pretendard (body) + Geist (headings) 폰트 페어링.

## Color Tokens (`globals.css :root`)

```
Background:    --background: 24 15% 5%      (#0f0d0b)
Surface:       --surface: 32 10% 13%         (#231f1b) — 카드 배경
Gold:          --gold: 43 70% 46%            (#C9A227) — 주 악센트
Gold Soft:     --gold-soft: 43 45% 55%       (#C4AD5C)
Gold Muted:    --gold-muted: 43 20% 25%      (#4D4632)
Dancheong:     --dancheong: 350 55% 35%      (#8B2D3A) — destructive/에러
Lotus:         --lotus: 340 40% 50%          (#B35C73) — required 표시
Text Primary:  --text-primary: 35 20% 88%    (#E8DFD2)
Text Secondary: --text-secondary: 30 15% 55% (#9A8B78)
Text Muted:    --text-muted: 30 10% 40%      (#70655A)
Border Subtle: --border-subtle: 35 15% 18%   (#352F28)
Border Accent: --border-accent: 43 50% 30%   (#6B5A23)
Success:       --success: 145 40% 35%        (#357A50)
Warning:       --warning: 35 70% 45%         (#C38A1A)
```

**사용법**: 항상 `hsl(var(--token-name))` 형태. hex 직접 사용 금지.
**투명도**: `hsl(var(--gold)/0.1)` 형태로 Tailwind에서 사용.

## Typography

- **Heading**: `font-heading` → Geist + Pretendard 폴백
- **Body**: `font-body` → Pretendard Variable
- **CDN**: layout.tsx `<head>`에서 로드
- Korean: `word-break: keep-all`, `text-wrap: balance` (headings)
- Fluid: `text-[clamp(2.5rem,6vw,4.5rem)]` for hero titles
- **금지 폰트**: Inter, Noto Sans KR, Noto Serif KR, Roboto

## Card Variants (`components/ui.tsx`)

```tsx
<Card variant="surface" />  // 기본 — bg-surface, hover glow
<Card variant="glass" />    // 강조 — backdrop-blur-xl, 반투명
<Card variant="elevated" /> // CTA — gradient bg, tinted shadow
```

## Button Variants (`ActionButton`)

```tsx
<ActionButton variant="primary" />  // 골드 그라디언트
<ActionButton variant="ghost" />    // 보더만, 투명 배경
<ActionButton variant="danger" />   // dancheong 배경
```

## StatusBadge

20개 상태에 한글 라벨 + Lucide 아이콘 매핑:
- success: Check (결제완료, 예약됨, 충전 등)
- warning: Clock (대기중, 진행중 등)
- destructive: XCircle (취소됨, 실패 등)

## Micro-interactions (`globals.css`)

- `.card-hover-glow` — translateY(-3px) + tinted shadow
- `.form-group:focus-within label` — 라벨 골드 변화
- `.tab-bounce` — keyframe bounce animation
- `button:active` — scale(0.98)

## Anti-Slop Rules

- 이모지 금지 → Lucide React 아이콘 사용
- 순수 #000000 금지 → 틴티드 다크
- 3열 균등 그리드 금지 → Bento/Spotlight/Stagger
- 인접 섹션 동일 레이아웃 금지
- Gradient text 페이지당 최대 1곳
- 골드 외 악센트: dancheong (에러), lotus (필수표시)
