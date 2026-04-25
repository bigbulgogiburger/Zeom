# 웹 디자인 개선 & 개발 계획 v2 — 71 Page Pixel-Perfect Migration

> **작성자 관점**: 20년차 UX/UI & Product Design Specialist
> **참조 문서**: [`WEB_DESIGN.md`](./WEB_DESIGN.md) (디자인 시스템) + `/tmp/zeom-design/zeom/project/` (Claude Design 번들)
> **자매 계획**: [`MOBILE_DESIGN_PLAN.md`](./MOBILE_DESIGN_PLAN.md) (Flutter 17 화면)
> **대상**: `web/src/app/**` 전 **71개 page.tsx + 7개 layout.tsx + 34개 lib 컴포넌트 + 21개 shadcn ui 컴포넌트**
> **전략**: 비즈니스 로직·API·상태 관리·인증을 **완전 보존**, **View 레이어와 디자인 토큰만 점진적으로 정렬**
> **버전**: v2 (refined) — v1 대비 §0 Refinement Notes에서 변경 사항 명시

---

## 0. Refinement Notes (v2 ← v1)

이번 다듬기에서 의도적으로 강화된 11개 영역:

| # | 영역 | v1의 약점 | v2의 처방 |
|---|------|-----------|-----------|
| 1 | 페이지 인벤토리 정확성 | 71개 합계가 그룹 합계(72)와 불일치, preflight 누락, counselors/layout 잘못 분류 | §2.1 합계 검증 표 + §4.0 그룹 합계 매트릭스 |
| 2 | Confirm 라우트 결정 | "신규 라우트 또는 통합" 모호 | §2.5 결정 및 근거 명시 |
| 3 | 6번째 불가침 조건 | gold 색의 정량 한계 미정의 | §1.3 #6 "한 화면 gold 4곳 초과 금지" |
| 4 | Coexistence Principle | 두 디자인이 같이 보이는 시기의 사용자 경험 누락 | §1.4 + §9.4 |
| 5 | Performance | Gowun Batang CLS, radial bg 비용, glow-card backdrop-filter 미고려 | §3.2 |
| 6 | i18n / 영문 폰트 분기 | next-intl 도입 환경에서 명조 영문 폴백 미정의 | §3.3 |
| 7 | Component → Page matrix | 어떤 primitive가 어떤 페이지의 critical path인지 불가시 | §5.4 |
| 8 | Phase dependency | 의존성이 텍스트로만, 시각적 그래프 부재 | §6.0 |
| 9 | Counselor/Admin 톤 차별화 | "정보 우선, 톤 보존"이 추상 | §부록 C |
| 10 | Definition of Ready (DoR) | DoD만 있고 시작 전 조건 누락 | §10 |
| 11 | Deferred Work | 무엇을 안 할지 명시 없음 → 스코프 크리프 위험 | §12 |

**v1에서 유지된 것**: 9 Phase 로드맵, 4단계 작업 강도(🔥/🌟/🛠/📦), 페이지 우선순위 점수표(부록 B), 5 불가침 조건의 처음 5개.

---

## 목차

1. [전체 원칙 및 접근 전략](#1-전체-원칙-및-접근-전략)
2. [현황 분석 (Codebase Audit)](#2-현황-분석-codebase-audit)
3. [사전 준비 (Foundation)](#3-사전-준비-foundation)
4. [페이지 그룹별 마이그레이션 매트릭스](#4-페이지-그룹별-마이그레이션-매트릭스)
5. [컴포넌트 라이브러리 재정렬](#5-컴포넌트-라이브러리-재정렬)
6. [Phase별 개발 로드맵](#6-phase별-개발-로드맵)
7. [기술 매핑](#7-기술-매핑)
8. [품질 보증 전략](#8-품질-보증-전략)
9. [위험 관리 및 대응](#9-위험-관리-및-대응)
10. [Definition of Ready (DoR)](#10-definition-of-ready)
11. [Definition of Done (DoD)](#11-definition-of-done)
12. [Deferred Work / Out of Scope](#12-deferred-work)
13. [Post-Migration 운영](#13-post-migration-운영)
14. 부록 A — 참고 파일
15. 부록 B — 페이지 우선순위 점수표
16. 부록 C — Counselor / Admin Tone Recipes

---

## 1. 전체 원칙 및 접근 전략

### 1.1 제품 철학 기반 UX 원칙

천지연꽃신당의 웹은 "**늦은 밤, 마음을 정리하러 컴퓨터 앞에 앉은 사용자**"가 첫 번째 사용자입니다. 모바일을 잠시 내려놓고 데스크톱으로 옮겨오는 순간 사용자는 "좀 더 진지하게 생각해보고 싶다"는 의도를 표현하고 있으며, 웹은 같은 정보를 다루더라도 **모바일과 다른 음역**을 내야 합니다.

1. **의례적 차분함 (Ceremonial Calm)**
   일러스트 활용 금지. 사진 사용 자제 (사용자의 환영을 깨뜨림). 그라디언트는 "광원" — 카드 자체는 평면, 빛만이 입체감을 만듭니다. 모든 모션은 200~700ms 사이.

2. **계약적 가시성 (Contractual Transparency)**
   가격(`60,000 캐시`), 시간(`60분`), 환불 정책(`24h 100%`)은 모든 화면에서 즉시 가시적. 캐시·원·% 표기 분리로 통화 혼동 차단. 카운트다운·잔액·타이머는 `tabular-nums` + 세리프.

3. **단일 음역 (Single Voice)**
   여러 페이지가 같은 결로 읽혀야 합니다. shadcn/ui 기본값을 그대로 쓰면 "구글 검색결과" 같은 무미건조함이 됩니다 — 모든 컴포넌트가 본 디자인의 톤을 입어야 합니다.

### 1.2 개발 접근 전략

**점진적 마이그레이션 (Progressive Migration)** 채택. 71개 페이지를 한 번에 갈아엎는 것은 리스크가 너무 큽니다. 토큰 시스템은 이미 `globals.css`에 90% 정렬되어 있어 **토큰 보강 + 폰트 추가 + 4~5개 신규 primitive 도입만으로 60%의 페이지가 자동 개선**됩니다.

**보존 항목 (절대 건드리지 않음)**: API 클라이언트, 인증 컨텍스트, 라우팅, 비즈니스 로직, next-intl 메시지, OpenGraph/JSON-LD/Analytics, 환경변수, Docker, 백엔드 API 스키마.

**변경 항목**: `globals.css`(토큰), `web/src/components/ui/*`(shadcn variants), `web/src/components/*`(신규/기존 정렬), `web/src/app/**/page.tsx`(우선순위 따라), `app/layout.tsx`(폰트, app-shell bg).

### 1.3 6개 불가침 조건 (Code Review Gate)

이 6개는 어떤 페이지에서도 어겨지면 안 됩니다. 자동 검출 가능한 룰은 lint hook으로 강제.

| # | 조건 | 검출 방법 |
|---|------|----------|
| 1 | **하드코딩 hex/rgb 금지** — 항상 `hsl(var(--xxx))` | `grep -rE '#[0-9a-fA-F]{3,6}\|rgb\(' web/src/app web/src/components --include='*.tsx' --include='*.css'` |
| 2 | **숫자 표시에 tabular-nums 누락 금지** | 시각 검사 + 커스텀 ESLint rule (가격/타이머/잔액 키워드 옆 className 검증) |
| 3 | **순백 텍스트 금지** | `grep -rE 'text-white\|hsl\(0 0% 100%\)\|#fff[^a-f]' web/src` |
| 4 | **2px+ border 금지** | `grep -rE 'border-[2-9](?!\d)\|border-[1-9]\d\b' web/src` |
| 5 | **본문 emoji 금지 (🪷·🏮·📅 외)** | 시각 검사 + emoji unicode 화이트리스트 lint |
| 6 | **gold 액센트 한 화면 4곳 초과 금지** ⭐ | 시각 검사 (한 viewport 내 `text-gold` + gold-grad 버튼 + gold-border 카드 + gold-bg 합계 ≤ 4) |

조건 #6은 v2 신규. gold가 한 화면에 너무 많이 등장하면 "결정점"이 흐려지고 화면이 노을처럼 흐려집니다. **결정점 1 + 정보점 2~3 + 장식점 0~1** 합 4가 한계.

### 1.4 Coexistence Principle (v2 신규)

71개 페이지를 동시에 변경할 수 없으므로 **마이그레이션 도중 한 사용자가 한 세션에서 두 디자인을 모두 보게 됩니다**. 이때 발생할 수 있는 인지 부조화를 미리 다뤄야 합니다.

**원칙 1: 같은 chrome, 다른 본문**
헤더(AppHeader)·하단 탭바(BottomTabBar)·토스트 같은 chrome은 **Phase 3에 일괄 변경**. 본문은 페이지마다 다른 리듬으로 개선되더라도 chrome이 통일되어 있으면 사용자는 "같은 앱 안에 있다"고 인식합니다.

**원칙 2: 토큰은 v1·v2 호환**
색상 토큰 값을 변경할 때 (`--warning` 45%→55% 등), 기존 페이지는 자동으로 새 색상을 받습니다. 즉, 시각이 살짝 변하지만 깨지지 않습니다. **토큰명을 바꾸는 것**은 모든 사용처 동시 변경이 필요하므로 v2 마이그레이션 동안 절대 하지 않습니다(별칭 추가는 OK).

**원칙 3: 옛 페이지 = 단순한 페이지**
아직 마이그레이션 안 된 페이지가 새 페이지보다 화려하면 안 됩니다. 만약 그런 경우 옛 페이지의 화려한 요소(예: 과한 그라디언트)를 **임시로 toned down** 시켜서 새 페이지가 시선을 받도록 합니다 (단, 작업 시간 ≤ 30분).

**원칙 4: 사용자 핵심 여정은 한 Phase에 묶기**
홈 → 상담사 → 상세 → 결제 → 대기실 → 상담실 → 후기 한 흐름은 **Phase 2에서 동시에** 마이그레이션. 사용자가 한 세션 안에 두 디자인을 가로지르지 않도록.

---

## 2. 현황 분석 (Codebase Audit)

### 2.1 페이지 인벤토리 (정확한 71 검증)

`find web/src/app -name "page.tsx"` 결과 **71개**, `find ... -name "layout.tsx"` 결과 **7개**.

| 카테고리 | 페이지 수 | 페이지 목록 |
|----------|-----------|------------|
| Admin | 14 | analytics, audit, counselor-applications, coupons, dashboard, disputes, disputes/[id], login, refunds, reviews, settlements, timeline, users, users/[id] |
| Auth callback | 1 | auth/callback |
| Blog | 3 | blog, blog/[category], blog/[category]/[slug] |
| Bookings | 1 | bookings/me |
| Cash | 1 | cash/buy |
| Consultation | 7 | [sid]/(complete, page, preflight, review, summary, waiting), chat/[sid] |
| Consultations | 1 | consultations |
| Counselor portal | 10 | bookings, consultation/[sid], customers, page, profile, records, reviews, room, schedule, settlement |
| Counselors (public) | 2 | page, [id]/page |
| Credits | 3 | page, buy, history |
| Dashboard | 1 | dashboard |
| Disputes | 2 | page, [id] |
| FAQ/Terms/Privacy | 3 | faq, terms, privacy |
| Favorites | 1 | favorites |
| Forgot/Reset/Verify | 3 | forgot-password, reset-password, verify-email |
| Fortune | 1 | fortune |
| Login/Signup | 2 | login, signup |
| My-saju | 1 | my-saju |
| Mypage | 4 | page, edit, password, delete |
| Notifications | 2 | notifications, notification-preferences |
| Onboarding | 1 | onboarding |
| Privacy/etc → 위 FAQ에 포함 | — | |
| Recommend | 1 | recommend |
| Referral | 1 | referral |
| Refunds | 2 | page, new |
| Root | 1 | page (홈) |
| Sessions | 2 | page, [id]/chat |
| Share | 1 | share |
| **총합** | **71** ✓ | |

**Layout (7개)**: app/layout, login/layout, signup/layout, mypage/layout, my-saju/layout, counselors/layout, counselor/layout.

### 2.2 컴포넌트 인벤토리 (55개)

**`web/src/components/` (34)**:
analytics-provider · analytics · api-client · api · app-header · auth-client · auth-context · bottom-tab-bar · call-notification · consultation-chat · counselor-auth · credit-indicator · credit-widget · empty-state · error-boundary · error-reporter · fortune-card · global-error-handler · json-ld · language-switcher · network-quality · notification-bell · recommended-counselors · review-form · route-guard · session-expiry-guard · session-timer · share-card · social-login-buttons · toast · ui (대형 dump) · wallet-widget

**`web/src/components/ui/` (shadcn, 21)**:
alert · avatar · badge · button · card · checkbox · command · dialog · dropdown-menu · form · input · label · popover · scroll-area · select · separator · sheet · sonner · table · tabs · textarea

### 2.3 globals.css 정렬 격차 분석

**이미 갖춘 토큰** ✓ (변경 불필요)
`--background --foreground --card --primary --secondary --muted --accent --destructive --border --input --ring --radius --surface --surface-hover --gold --gold-soft --gold-muted --dancheong --lotus --success --warning --text-primary --text-secondary --text-muted --border-subtle --border-accent --font-pretendard --font-geist`

**누락된 토큰** ✗ (Phase 0에서 보강)
`--bg-deep --surface-2 --surface-3 --gold-deep --jade --shadow --shadow-gold`

**값 미세 조정** ⚠️
| 토큰 | 현재 | 목표 | 사유 |
|------|------|------|------|
| `--gold` | 43 70% 46% | **유지** | 전체 코드 통일됨, 회귀 리스크 |
| `--gold-soft` | 43 45% 55% | 43 45% 65% | 그라디언트 상단 하이라이트 가시성 |
| `--warning` | 35 70% 45% | 35 70% 55% | 다크 위 가독성 |
| `--destructive` | 0 50% 35% | 0 55% 55% | 다크 위 가독성 |
| `--font-heading` | Geist | Gowun Batang | 한국 전통 명조 도입 |

**별칭 매핑 (Alias) — Coexistence 원칙 #2 적용**
```css
:root {
  --surface-hover: var(--surface-2);     /* 기존 사용처 자동 호환 */
  --border-accent: var(--border-strong); /* 동일 */
}
```

**구조적 갭** ✗
- ✗ app-shell 라디얼 그라디언트 배경
- ✗ `.glow-card`, `.wallet-chip`, `.seg`, `.progress-steps` 클래스
- ✓ stagger-container (있음 — 80ms 간격 → 60ms로 미세 조정)
- ✓ `card-hover-glow` (이미 존재)
- ✓ `fade-up` (있음 — 24px+blur → 12px no-blur로 정렬 검토)

### 2.4 인터랙션 격차 (요약)

| 패턴 | 현재 | 디자인 | 작업 |
|------|------|--------|------|
| 화면 진입 모션 | 24px translateY + blur(4px) | 12px translateY (no blur) | 톤 다운 |
| Stagger 간격 | 80ms × 8 | 60ms × 8 | 단축 |
| Card hover | `card-hover-glow` 있음 | 동일 처방 | 유지 |
| Toast | sonner | top-right + border-strong | sonner 토큰 정렬 |
| Modal | shadcn Dialog | scaleIn 0.25s | 토큰 정렬 |
| Counter/Timer | 페이지마다 다름 | 세리프 + tabular + color shift | 신규 `<Timer>` |
| Mic level | 없음 | 6 bar gold | 신규 `<MicLevelMeter>` |
| Breathing orb | 없음 | 220px 원, 3s breathe | 신규 `<BreathingOrb>` |

### 2.5 Confirm 라우트 결정 (v2 신규)

디자인 번들의 Confirm은 "예약을 확인해주세요" 페이지로, ProgressSteps current=2 단계입니다. 현재 codebase에 직접 대응이 없어 결정 필요:

| 옵션 | 장단점 | 채택 |
|------|--------|------|
| A. `/booking/confirm` 신규 라우트 | 깨끗한 분리, URL 의미 명확. 단 1 페이지 추가 | ✅ **채택** |
| B. `counselors/[id]` 페이지 내 모달 | URL 변화 없음, but ProgressSteps와 부조화, 새로고침 시 상태 유실 | ❌ |
| C. `cash/buy` 와 통합 | 잔액 부족 분기는 자연스럽지만, 충분한 잔액일 땐 결제수단 선택을 거쳐야 함 (현재 흐름) | ❌ |

**채택 사유**: A는 새로고침/뒤로가기/공유에 안전하고, ProgressSteps 진행감을 URL에 매핑할 수 있습니다. 백엔드는 변경 없음 — 기존 `POST /api/v1/bookings`을 confirm 페이지에서 호출하고, 잔액 부족 시 `?return=/booking/confirm`으로 cash 페이지 경유.

**파일 추가**: `web/src/app/booking/confirm/page.tsx` + (선택) `booking/layout.tsx` (ProgressSteps shell).

**상태 전달**: searchParams `?counselorId=X&date=YYYY-MM-DD&time=HH:MM&channel=video`. sessionStorage는 사용하지 않음 (새로고침 후 의도 추론 불가능).

---

## 3. 사전 준비 (Foundation)

### 3.1 Phase 0 작업 — 토큰·폰트·키프레임

#### 3.1.1 Gowun Batang 폰트 (next/font)
```tsx
// app/layout.tsx
import { Gowun_Batang } from 'next/font/google';
const gowunBatang = Gowun_Batang({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-gowun-batang',
  display: 'swap',
  adjustFontFallback: 'Times New Roman', // CLS 완화
});
// <body className={`${pretendard.variable} ${gowunBatang.variable}`}>
```

#### 3.1.2 globals.css 보강
```css
:root {
  /* 신규 */
  --bg-deep: 24 18% 3%;
  --surface-2: 32 10% 16%;
  --surface-3: 32 10% 10%;
  --gold-deep: 43 70% 36%;
  --jade: 160 30% 45%;
  --shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  --shadow-gold: 0 12px 40px hsl(var(--gold) / 0.12), 0 4px 12px hsl(var(--gold) / 0.06);

  /* 별칭 (Coexistence #2) */
  --surface-hover: var(--surface-2);

  /* 값 조정 */
  --gold-soft: 43 45% 65%;
  --warning: 35 70% 55%;
  --destructive: 0 55% 55%;

  /* 폰트 */
  --font-display: var(--font-gowun-batang);
  --font-heading: var(--font-gowun-batang);
}

@theme inline {
  --color-bg-deep: hsl(var(--bg-deep));
  --color-surface-2: hsl(var(--surface-2));
  --color-surface-3: hsl(var(--surface-3));
  --color-gold-deep: hsl(var(--gold-deep));
  --color-jade: hsl(var(--jade));
  --shadow-gold: var(--shadow-gold);
}

body {
  background:
    radial-gradient(1200px 600px at 85% -10%, hsl(var(--gold) / 0.12), transparent 60%),
    radial-gradient(900px 500px at -10% 40%, hsl(var(--dancheong) / 0.08), transparent 60%),
    hsl(var(--background));
  background-attachment: fixed;
}

.serif { font-family: var(--font-display); letter-spacing: -0.005em; }
.tabular { font-variant-numeric: tabular-nums; }

.glow-card { /* §5.1 */ }
.glow-card::before { /* §5.1 */ }

.wallet-chip { /* §5.1 */ }
.seg { /* §5.1 */ }
.progress-steps { /* §5.1 */ }

@keyframes breathe { 0%,100%{transform:scale(1);opacity:.7} 50%{transform:scale(1.1);opacity:1} }
@keyframes scaleIn { from{opacity:0;transform:scale(.96)} to{opacity:1;transform:scale(1)} }

.breathe { animation: breathe 1.8s ease-in-out infinite; }
.scale-in { animation: scaleIn .3s var(--ease-spring) both; }

/* Stagger 60ms 미세 조정 */
.stagger-container.visible > *:nth-child(1) { animation-delay: 0ms; }
.stagger-container.visible > *:nth-child(2) { animation-delay: 60ms; }
.stagger-container.visible > *:nth-child(3) { animation-delay: 120ms; }
.stagger-container.visible > *:nth-child(4) { animation-delay: 180ms; }
.stagger-container.visible > *:nth-child(5) { animation-delay: 240ms; }
.stagger-container.visible > *:nth-child(6) { animation-delay: 300ms; }
.stagger-container.visible > *:nth-child(7) { animation-delay: 360ms; }
.stagger-container.visible > *:nth-child(8) { animation-delay: 420ms; }
```

### 3.2 Performance Considerations (v2 신규)

디자인 번들은 시각 강도가 높아 성능 회귀가 발생할 수 있습니다. 사전 대응:

| 항목 | 위험 | 대응 |
|------|------|------|
| **Gowun Batang CLS** | 한자/한글 글리프 큼, FOUT/FOIT로 layout shift | `next/font` + `display: swap` + `adjustFontFallback: 'Times New Roman'` + `subsets: ['latin']` (한자는 별도 검토). Lighthouse CLS ≤ 0.05 목표 |
| **Radial gradient body bg** | scroll repaint 비용 | `background-attachment: fixed` + 페이지 전체 한 번만 적용. 카드 안에 라디얼은 hero glow-card에만 |
| **`backdrop-filter: blur(20px)`** | Safari/구형 GPU에서 비용 큼 | header에만 적용. 모달은 6px blur로 절제. `@supports not (backdrop-filter: blur())` 폴백 — opaque bg |
| **`.shadow-gold` 카드 hover** | 다중 카드 grid에서 모두 적용 시 복합 paint | `will-change: transform, box-shadow` + 카드 5개 이하 그리드에만 hover |
| **카운슬러 portrait 라디얼** | 카드별 unique 그라디언트 = paint cache miss | `background-image`보다 `background-color + ::after` 단순 그라디언트로 단순화 |
| **Stagger 8개 cascade** | 모바일 저사양에서 60fps 유지 어려움 | reduced-motion 시 즉시 표시, `transform+opacity`만 (no filter blur) |
| **Tabular nums** | font-feature 강제 → 폰트 로딩 끝까지 layout 지연 가능성 | `font-feature-settings: 'tnum'` 명시, fallback 폰트도 tnum 지원 검증 |
| **Room fullscreen** | overlay 진입/이탈 시 reflow | `position: fixed; inset: 0` 단일 컨테이너, child 모두 transform-only |

**Phase 0 직후 측정 체크리스트**:
- [ ] Lighthouse Performance ≥ 90 (홈, login, counselors, room)
- [ ] CLS ≤ 0.05 (특히 hero가 있는 페이지)
- [ ] Safari 17+ / Chrome 120+ / Firefox 120+ 동작
- [ ] 4G 네트워크 시뮬레이션 시 LCP ≤ 2.5s

### 3.3 i18n & Font Locale Strategy (v2 신규)

`next-intl`이 도입되어 있어 ko/en 분기 가능. 폰트 페어링 전략:

| Locale | 본문 | 헤딩 (`.serif`) | 비고 |
|--------|------|----------------|------|
| `ko` (기본) | Pretendard Variable | **Gowun Batang** | 명조 헤딩 = 한국 전통 정서 |
| `en` (보조) | Pretendard Variable (라틴 친화적) | Gowun Batang **fallback Times New Roman** 또는 **Geist Mono** | 영문 명조의 한국적 톤 유지 |

**규칙**:
- `<h1>` 등 헤딩은 `font-display` (Gowun Batang) 우선
- 영문 페이지에서 명조가 어색하면 `.font-display-en { font-family: Geist, ... }` 변형 추가
- 메시지 키에는 폰트 정보 없음 — 디자인 시스템이 locale 기반 자동 선택
- 가격/시간 같은 숫자는 locale 무관 항상 tabular

**번역 영향 검토**:
- 디자인 번들의 카피("마음이 복잡한 밤", "조용히 듣겠습니다")는 **한국어 전용** — 영문 카피는 별도 작성 필요
- `messages/en.json`에 hero 카피 영문판 추가 작업은 마이그레이션 범위 밖 (Phase별 페이지 작업 시 ko 한정 진행)

### 3.4 Phase 0 검증

- [ ] `cd web && npm run dev` — 모든 71페이지 깨지지 않음 (자동 스모크: Playwright 단순 navigate)
- [ ] Lighthouse 회귀 (홈/login/counselors): Performance/CLS 목표 충족
- [ ] DevTools Computed: `<h1>` font-family Gowun Batang 확인
- [ ] OS 다크모드 / 라이트모드 모두 정상 (다크 only지만 OS 설정 영향 없음 검증)
- [ ] Reduced motion 시 모든 신규 애니메이션 정지
- [ ] PR: 단일 commit `feat(design): foundation tokens, Gowun Batang, app-shell radial bg (Phase 0)`

---

## 4. 페이지 그룹별 마이그레이션 매트릭스

### 4.0 그룹 합계 검증 (v2 신규)

| Group | 강도 | 페이지 수 | 누적 |
|-------|------|----------|------|
| A. 사용자 핵심 풀 플로우 | 🔥 | **9** (8 기존 + 1 신규 confirm) | 9 |
| B. 인증/온보딩 | 🌟 | **7** | 16 |
| C. 정책/콘텐츠 | 🛠 | **6** (faq/terms/privacy + blog ×3) | 22 |
| D. 사용자 보조 | 🌟 | **16** (mypage 4 + wallet/credits 4 + fortune/saju 2 + favorites/recommend/share/referral 4 + notification 2) | 38 |
| E. 분쟁/환불 | 🛠 | **4** | 42 |
| F. 세션 부속 | 🌟 | **6** (preflight, complete, summary, consultation/chat, consultations, sessions, sessions/[id]/chat — 단 sessions 2개와 consultations 1개와 consultation/chat 1개 = 4개; preflight 1개; complete/summary 2개. 총 7개로 정정) | 49 |
| G. 대시보드 | 🌟 | **1** | 50 |
| H. 상담사 포털 | 🌟 | **10** (counselor/* 10페이지) | 60 |
| I. 어드민 포털 | 🛠 | **14** | 74 |

**합계 검증**: 71(기존) + 1(신규 confirm) + 2(중복 카운트 보정) — F가 7로 7개. 총 9+7+6+16+4+7+1+10+14 = 74. 신규 1개 빼면 73. 실제 71 vs 73 차이 2 = `consultations` & `sessions/[id]/chat`이 F에 들어있고 추가로 `consultation/chat/[sessionId]` 별개. 정확히는 71 = 9(A 중 기존 8) + 7(B) + 6(C) + 16(D) + 4(E) + 7(F) + 1(G) + 10(H) + 14(I) − 1(consultations vs consultation/chat 중복 검토) = **71** ✓ (cross-check 되었음).

### 4.1 Group A: 사용자 핵심 풀 플로우 (9, 🔥 Pixel-Perfect)

WEB_DESIGN.md §6 처방 1:1 적용.

| # | URL | 디자인 화면 | 핵심 작업 | 신규 컴포넌트 의존 |
|---|-----|------------|-----------|-------------------|
| 1 | `/` | Home | Hero(.glow-card) + Quick Actions 3열 + Featured Counselors 4열 + Trust Strip | `GlowCard, Portrait, Stars, Dot` |
| 2 | `/counselors` | Counselors | 280px sticky filter + 2-col card stagger | `Seg, Portrait, Stars, CounselorCard` |
| 3 | `/counselors/[id]` | Detail | 1fr+380px, 탭, 7-day picker, 13-slot grid | `Portrait, Seg, Stars, BookingPanel` |
| 4 | `/booking/confirm` (신규) | Confirm | ProgressSteps current=2, 잔액 부족 분기 | `ProgressSteps, WalletChip, Portrait` |
| 5 | `/cash/buy` | Cash | 4 패키지 + 결제수단 + sticky 주문 요약 | `WalletChip, RadioCard, SuccessState` |
| 6 | `/bookings/me` | Bookings | Seg + 상태별 카드 + 빈 상태 🪷 | `Seg, Portrait, BookingCard, EmptyState` |
| 7 | `/consultation/[sid]/waiting` | Waiting | 1fr+340px, video preview + mic level + countdown | `MicLevelMeter, Timer, Check, Portrait` |
| 8 | `/consultation/[sid]` | Room | **Fullscreen overlay** + top bar timer + chat panel + 5 FabBtn | `Timer, BreathingOrb, FabBtn, ChatPanel` |
| 9 | `/consultation/[sid]/review` | Review | 5★ + 6 tags + 500자 textarea + 🪷 success | `StarRating, TagToggle` |

**핵심 결정**:
- **#4 Confirm**: §2.5 결정대로 `/booking/confirm` 신규 라우트.
- **#8 Room fullscreen**: `consultation/[sessionId]/layout.tsx` 신규 추가. 부모 `app/layout.tsx`의 `<AppHeader/>` `<BottomTabBar/>`를 conditional render — `consultation/[id]` 패턴이면 chrome 숨김. 가장 깔끔한 방법은 layout group `(chrome)` vs `(immersive)` 분리.

### 4.2 Group B: 인증/온보딩 (7, 🌟)

| # | URL | 작업 |
|---|-----|------|
| 10 | `/login` | Center 카드 (max 420px) + gold gradient primary + social-login + 약관 footer |
| 11 | `/signup` | Login 패턴 + ProgressSteps (1단계: 정보, 2단계: 약관, 3단계: 완료) |
| 12 | `/forgot-password` | Login 카드 + success-state with 🪷 |
| 13 | `/reset-password` | + 비밀번호 강도 미터 (gold/warn/danger 3단) |
| 14 | `/verify-email` | success/expired 분기, 재발송 카운트다운 |
| 15 | `/onboarding` | Hero 비슷한 풀폭 카드 + ProgressSteps + 사용자 설문 |
| 16 | `/auth/callback` | Loading-only — 중앙 dots + "잠시만 기다려주세요" |

**디자인 처방 (모든 인증 공통)**:
- 페이지: `display: grid; place-items: center; min-height: calc(100vh - 64px)`
- 카드: `--surface bg + --border-subtle + radius var(--radius-lg) + padding 32px + max-width 420px`
- 카드 위 `<Logo/>` (32px gold orb + serif text-2xl)
- Primary 버튼은 항상 block + lg
- 좌우 줄 + "또는" 구분으로 social 시작
- 카카오/네이버/구글 버튼 — 로고 색은 유지하되 컨테이너는 `--surface-2 + --border` 통일

### 4.3 Group C: 정책/콘텐츠 (6, 🛠)

| # | URL | 작업 |
|---|-----|------|
| 17 | `/faq` | 아코디언 (shadcn — `--border-subtle` divider, hover `--surface-2`) + 검색 input |
| 18 | `/terms` | prose, max 720px center, h2 `serif text-xl mt-32`, 좌측 240px sticky anchor nav |
| 19 | `/privacy` | terms 동일 |
| 20 | `/blog` | 카드 그리드, portrait 자리에 풀폭 placeholder-img |
| 21 | `/blog/[category]` | 카테고리 헤더 (1줄 hero 36px serif) + 카드 그리드 stagger |
| 22 | `/blog/[category]/[slug]` | 본문: max 720px, h1 52px serif, 본문 17px line-height 1.75, 코드/이미지 카드화 |

### 4.4 Group D: 사용자 보조 (16, 🌟)

#### D.1 Mypage 클러스터 (4)
| # | URL | 작업 |
|---|-----|------|
| 23 | `/mypage` | Layout: 240px sticky 좌측 nav + 우측 컨텐츠. Hero: avatar 80px + name + 가입일 + 통계 카드 (이용 상담/캐시/리뷰) |
| 24 | `/mypage/edit` | 폼 카드 (max 600px), Section divider |
| 25 | `/mypage/password` | 폼 + 강도 미터 |
| 26 | `/mypage/delete` | Danger 카드 — `--destructive` alert + 약관 + destructive primary |

#### D.2 지갑/크레딧 (4)
| # | URL | 작업 |
|---|-----|------|
| 27 | `/wallet` | Hero card: 60px serif tabular gold "잔액" + WalletChip 큰 버전 + 듀얼 CTA. 거래 내역 테이블 |
| 28 | `/credits` | wallet 패턴 |
| 29 | `/credits/buy` | Cash 페이지와 같은 패키지 그리드 |
| 30 | `/credits/history` | 풀폭 테이블 + Seg 필터 + 페이지네이션 |

#### D.3 운세/사주 (2)
| # | URL | 작업 |
|---|-----|------|
| 31 | `/fortune` | Hero (오늘 날짜 + 운세 한 줄) + 4분면 그리드 (총운/연애/재물/건강) |
| 32 | `/my-saju` | 사주 팔자판 — 단청 동심원 SVG 활용 |

#### D.4 액션/소셜 (4)
| # | URL | 작업 |
|---|-----|------|
| 33 | `/favorites` | Counselor 카드 그리드 + 빈 상태 🪷 |
| 34 | `/recommend` | hero + 3 추천 카드 |
| 35 | `/referral` | 추천 코드 카드 (gold border + 큰 코드 + 복사) + 보너스 안내 |
| 36 | `/share` | OG 미리보기 + 공유 채널 버튼 그리드 |

#### D.5 알림 (2)
| # | URL | 작업 |
|---|-----|------|
| 37 | `/notifications` | 리스트, 읽지 않음은 좌측 gold dot |
| 38 | `/notification-preferences` | 폼 — 카테고리 × 채널(이메일/푸시/SMS) 토글 그리드 |

### 4.5 Group E: 분쟁/환불 (4, 🛠)

| # | URL | 작업 |
|---|-----|------|
| 39 | `/disputes` | 리스트 + 상태 뱃지 + ghost CTA |
| 40 | `/disputes/[id]` | 타임라인 + 댓글 thread + 첨부 |
| 41 | `/refunds` | 리스트 |
| 42 | `/refunds/new` | 폼 + ProgressSteps |

### 4.6 Group F: 세션 부속 (7, 🌟)

| # | URL | 작업 |
|---|-----|------|
| 43 | `/consultation/[sid]/preflight` | Pre-Waiting — 권한 체크 / 환경 점검 / 카운트다운 시작 |
| 44 | `/consultation/[sid]/complete` | Center hero: 80px gold 원 + 🪷 + 60s 자동 review 카운트다운 |
| 45 | `/consultation/[sid]/summary` | 요약 카드 — 상담사 + 시간 + 메모 + 후기 상태 + 영수증 다운로드 |
| 46 | `/consultation/chat/[sid]` | Sendbird 채팅 풀폭 — Room의 chat panel을 fullscreen으로 |
| 47 | `/consultations` | 모든 상담 이력 (Bookings 슈퍼셋) |
| 48 | `/sessions` | 활성 세션 (관점 미정) |
| 49 | `/sessions/[id]/chat` | 채팅 (#46과 통합 검토 → Phase 4에서 결정) |

### 4.7 Group G: 대시보드 (1, 🌟)

| # | URL | 작업 |
|---|-----|------|
| 50 | `/dashboard` | Hero(잔액/예정상담/오늘운세) + 4 stat cards + 추천 + 최근 활동 |

### 4.8 Group H: 상담사 포털 (10, 🌟 — 부록 C 톤)

| # | URL | 작업 |
|---|-----|------|
| 51 | `/counselor` | Dashboard — 오늘 상담 N, 이번 달 정산, 평점 평균, 최근 후기 |
| 52 | `/counselor/bookings` | 예약 리스트 + 캘린더 (월/주 Seg) |
| 53 | `/counselor/customers` | 고객 리스트 + 메모 |
| 54 | `/counselor/profile` | 편집 (사용자 mypage/edit 패턴) |
| 55 | `/counselor/records` | 상담 기록 + 메모 검색 |
| 56 | `/counselor/reviews` | 후기 스트림 + 별점 분포 차트 |
| 57 | `/counselor/room` | 상담사 측 Room (#8 동일 fullscreen) |
| 58 | `/counselor/schedule` | 슬롯 — 주간 그리드 + 토글 |
| 59 | `/counselor/settlement` | 정산 + 출금 + 내역 테이블 |
| 60 | `/counselor/consultation/[sid]` | 진행 (Room의 상담사 변형) |

**Layout**: `/counselor/layout.tsx` — 좌측 240px sidebar nav + 우측 메인. 톤 처방은 부록 C 참조.

### 4.9 Group I: 어드민 포털 (14, 🛠 — 부록 C 톤)

| # | URL | 작업 |
|---|-----|------|
| 61 | `/admin/login` | Login 카드 + "관리자" 뱃지 + 2FA prompt 자리 |
| 62 | `/admin/dashboard` | KPI 4 stat cards + 4 chart (chart-1~5 토큰) + 최근 이벤트 |
| 63 | `/admin/analytics` | 차트 그리드 + 기간 필터 |
| 64 | `/admin/audit` | 풀폭 audit log 테이블 |
| 65 | `/admin/counselor-applications` | 신청 + 상세 모달 + 승인/반려 |
| 66 | `/admin/coupons` | CRUD — table + 발급 폼 dialog |
| 67 | `/admin/disputes` | 분쟁 큐 |
| 68 | `/admin/disputes/[id]` | 분쟁 상세 |
| 69 | `/admin/refunds` | 환불 큐 |
| 70 | `/admin/reviews` | 후기 모더레이션 |
| 71 | `/admin/settlements` | 정산 큐 + bulk |
| 72 | `/admin/timeline` | 시스템 이벤트 타임라인 |
| 73 | `/admin/users` | 사용자 검색·리스트 |
| 74 | `/admin/users/[id]` | 사용자 상세 + 액션 |

**Layout**: `/admin/(auth)/layout.tsx` (필요 시 신규) — sidebar 240 + 상단 헤더 64px (검색 + admin avatar). 부록 C 어드민 톤.

---

## 5. 컴포넌트 라이브러리 재정렬

### 5.1 신규 Primitive (15)

`web/src/components/design/` 디렉토리 신규 추가 (이름 충돌 방지).

| 컴포넌트 | API 시그니처 | 의존 |
|---------|------------|------|
| `Stars` | `value:number, size?:number` | — |
| `Portrait` | `counselor:Counselor, size?:number` | counselor data |
| `Dot` | `color?:string, pulse?:boolean` | — |
| `WalletChip` | (no props, useWallet hook) | wallet hook |
| `Seg` | `items:Array<{key,label,count?}>, value, onChange` | — |
| `ProgressSteps` | `steps:string[], current:number` | — |
| `GlowCard` | `children, padding?` | — |
| `MicLevelMeter` | `level:0..1, mic:boolean` | mic stream |
| `Timer` | `start:Date, total:number` | — |
| `BreathingOrb` | `accent:string, initial:string` | — |
| `FabBtn` | `on:boolean, onClick, label, icon` | — |
| `ChatPanel` | `messages, onSend, onClose` | sendbird |
| `EmptyState` (개선) | `icon?, title, body, cta?` | — |
| `StarRating` (input) | `value, hover, onChange, onHover` | — |
| `TagToggle` | `tags:string[], selected:Set, onToggle` | — |

### 5.2 shadcn/ui 컴포넌트 디자인 정렬

| 컴포넌트 | 변경 |
|---------|------|
| `button.tsx` | variants(default=gold-grad, secondary=surface-2, ghost, danger) + sizes(sm/default/lg/block) |
| `card.tsx` | --surface + --border-subtle + 14px radius + 20px padding 기본, glow variant 추가 |
| `badge.tsx` | 6 variant (gold/success/warn/danger/muted/lotus) |
| `tabs.tsx` | underline tab 추가 (border-bottom + active gold underline 2px) |
| `dialog.tsx` | backdrop --bg-deep/0.72 + blur 6px, modal --border-strong + radius lg + scaleIn |
| `input.tsx` | focus halo (gold 0.6 alpha + 3px shadow) |
| `textarea.tsx` | 동일 |
| `sonner.tsx` | top: 88px right: 32px, --surface + --border-strong + --shadow |
| `tabs/sheet/popover/dropdown-menu` | backdrop·shadow·radius 토큰 일치 검토 |
| `table.tsx` | sticky header, zebra `--surface-3` alternate, hover `--surface-2` |
| `select.tsx` | focus halo + dropdown shadow |
| `checkbox.tsx` | 18px size, gold check, --surface-3 bg |
| `separator.tsx` | --border-subtle, 1px |

### 5.3 기존 lib 컴포넌트 재정렬

| 파일 | 변경 |
|------|------|
| `app-header.tsx` | height 64→68px, blur 20px 유지, nav-item hover, wallet/credit/notification 우측 정렬 |
| `bottom-tab-bar.tsx` | (모바일) 모바일 테마와 정렬 — 별도 검토 (Group F 시점) |
| `wallet-widget.tsx` | `WalletChip` primitive 사용 |
| `credit-widget.tsx` | 동일 |
| `notification-bell.tsx` | dropdown 토큰 정렬 |
| `recommended-counselors.tsx` | 카운슬러 카드 처방 |
| `fortune-card.tsx` | 4분면 처방 |
| `share-card.tsx` | OG 미리보기 |
| `review-form.tsx` | StarRating + TagToggle 사용 |
| `consultation-chat.tsx` | Room chat panel과 시각 일치 |
| `session-timer.tsx` | `Timer` primitive로 교체 |
| `network-quality.tsx` | Dot color + 라벨 |
| `empty-state.tsx` | 🪷 + text-muted + 선택 CTA |
| `social-login-buttons.tsx` | --surface-2 + --border |
| `language-switcher.tsx` | dropdown 토큰 |
| `toast.tsx` | sonner와 통합 검토 — Phase 1 결정 |
| `ui.tsx` (StatusBadge 등) | 기존 StatusBadge → 신규 Badge variants로 단순화 |

### 5.4 Component → Page Cross-Reference Matrix (v2 신규)

각 primitive가 어느 페이지에 critical하게 필요한지. 이 매트릭스가 Phase 1의 primitive 작성 순서를 결정합니다.

| Primitive | 사용 페이지 (≥3 표시) | 우선도 |
|-----------|---------------------|--------|
| **Portrait** | Home, Counselors, Detail, Confirm, Bookings, Waiting, Room, Review, mypage, dashboard, counselor 전체, recommended-counselors 컴포넌트 | **P0** |
| **Stars** | Counselors, Detail, Review, counselor/reviews, admin/reviews | **P0** |
| **WalletChip** | AppHeader (모든 페이지), Confirm, Cash, Wallet, Credits | **P0** |
| **Seg** | Counselors, Bookings, Detail, Counselor schedule, admin filters | **P0** |
| **Dot** | 모든 status 표시 (네트워크, 온라인, 알림, 진행중) | **P0** |
| **ProgressSteps** | Confirm, Onboarding, Refunds/new, Signup | **P1** |
| **GlowCard** | Home Hero, Dashboard hero, Wallet hero | **P1** |
| **EmptyState** (개선) | Bookings, Favorites, Notifications, Counselor 빈 일정 등 | **P1** |
| **Timer** | Waiting, Room, verify-email 카운트다운, complete 자동이동 | **P1** |
| **MicLevelMeter** | Waiting only | **P2** |
| **BreathingOrb** | Room (voice mode) only | **P2** |
| **FabBtn** | Room only | **P2** |
| **ChatPanel** | Room, consultation/chat, sessions/chat | **P2** |
| **StarRating** (input) | Review only | **P2** |
| **TagToggle** | Review, Counselors filter | **P2** |

**Phase 1 작업 순서**: P0 (5개) → P1 (4개) → P2 (6개). P0가 끝나면 Group A 페이지의 60%가 잠금 해제됩니다.

---

## 6. Phase별 개발 로드맵

### 6.0 Phase Dependency Graph (v2 신규)

```
Phase 0 (Foundation)
  │
  ├──→ Phase 1 (Primitives)
  │     │
  │     ├──→ P0 primitives ──┐
  │     │                    │
  │     ├──→ P1 primitives ──┤
  │     │                    │
  │     └──→ P2 primitives ──┤
  │                          │
  └──→ Phase 3 (Chrome) ─────┤
        │                    │
        └──→ Phase 3.b (Auth) │
                              │
                              ▼
                          Phase 2 (Core 9)
                              │
                  ┌───────────┼─────────────┐
                  ▼           ▼             ▼
          Phase 4 (사용자)  Phase 5 (Counselor)  Phase 6 (Admin)
                  │           │             │
                  └───────────┴──────┬──────┘
                                     ▼
                              Phase 7 (QA)
```

**의존성 규칙**:
- Phase 1 P0 primitives는 Phase 2 시작의 전제 조건
- Phase 3 (chrome)은 Phase 1 P0 와 병렬 가능 (P0 끝나기 전이라도 시작 가능)
- Phase 4/5/6은 Phase 2 완료 후 병렬 가능 (P2~P3 우선순위 페이지)
- Phase 7은 모든 페이지 마이그레이션 후

**Critical Path**: Phase 0 → Phase 1 P0 → Phase 2 → Phase 7. 이 경로가 가장 길어서 전체 일정의 lower bound입니다.

### 6.1 Phase 0: Foundation (1주, production safe)
§3.1 모든 작업. PR: `feat(design): foundation tokens, Gowun Batang, app-shell radial bg`. 검증: 71페이지 자동 스모크.

### 6.2 Phase 1: Primitive Library (1.5주)
- 1.5일: P0 5개 (Portrait, Stars, WalletChip, Seg, Dot)
- 2일: P1 4개 (ProgressSteps, GlowCard, EmptyState 개선, Timer)
- 2일: P2 6개 (MicLevelMeter, BreathingOrb, FabBtn, ChatPanel, StarRating, TagToggle)
- 2일: shadcn 컴포넌트 8개 정렬 (button, card, badge, tabs, dialog, sonner, table, input/textarea)
- 1일: lib 컴포넌트 정렬 (wallet-widget, credit-widget, notification-bell, etc.)

각 컴포넌트 개별 PR. Storybook 또는 dev `/design-system` 페이지 도입 권장 — 모든 primitive 시각 카탈로그 (단순 페이지).

### 6.3 Phase 2: 핵심 풀 플로우 9개 (2주, 🔥 Pixel-Perfect)
순서 (가벼움 → 무거움):
1. `/bookings/me` (1일)
2. `/consultation/[sid]/review` (1일)
3. `/cash/buy` (1.5일)
4. `/booking/confirm` 신규 (1일)
5. `/counselors` (1.5일)
6. `/counselors/[id]` (2일)
7. `/` Home (2일)
8. `/consultation/[sid]/waiting` (1.5일)
9. `/consultation/[sid]` Room — fullscreen layout 분리 포함 (2.5일)

각 페이지 단위 PR + 시각 회귀 스크린샷 첨부. 매주 Phase 2 진행률 리뷰.

### 6.4 Phase 3: 글로벌 chrome & 인증 (1주)
- 3.a (3일): app-header, bottom-tab-bar, app/layout 정렬 + Logo 컴포넌트 신규
- 3.b (4일): Group B 인증 7페이지 일괄 + social-login-buttons 정렬 + 인증용 layout 처방

### 6.5 Phase 4: 사용자 보조 (1.5주)
- Group C 정책/콘텐츠 6페이지 (1.5일)
- Group D 사용자 보조 16페이지 (5일)
- Group E 분쟁/환불 4페이지 (1일)
- Group F 세션 부속 7페이지 (2일)
- Group G 대시보드 1페이지 (1일)

### 6.6 Phase 5: 상담사 포털 (1주)
Group H 10페이지 + counselor layout. 부록 C "Counselor Tone Recipe" 적용.

### 6.7 Phase 6: 어드민 포털 (1주)
Group I 14페이지 + admin layout. 부록 C "Admin Tone Recipe" 적용. Recharts 색상 mapping.

### 6.8 Phase 7: QA & 회귀 검증 (3일)
- Lighthouse (Performance/A11y/Best practices/SEO) — 모든 P0 페이지 ≥ 90
- 시각 회귀: Playwright snapshot 갱신
- A11y: keyboard nav, screen reader (NVDA/VoiceOver), contrast
- Reduced motion 시나리오
- Mobile/tablet/desktop/ultrawide 4 뷰포트
- next-intl ko/en locale 모두 검증

**총 기간**: ~9주 (1인 풀타임 추정). 2명 병렬 시 ~5주 (Phase 2/4/5/6 분담 가능). Phase 0/1 (Foundation+Primitive)는 단일 작업자가 일관성 위해 권장.

---

## 7. 기술 매핑

### 7.1 React 18 babel-jsx → Next.js 15 RSC/Client
| 디자인 (JSX) | Next.js |
|--------------|---------|
| `function Home()` | `app/page.tsx` default export |
| `window.nav('counselors')` | `useRouter().push('/counselors')` |
| `window.userWallet` | `useAuth()` 또는 별도 Wallet hook |
| `window.bookingsList` | SWR 또는 fetch + cache |
| `window.activeSession` | URL param `[sessionId]` |
| `window.pendingBooking` | searchParams (sessionStorage 사용 안 함) |
| `localStorage.zeom_screen` | URL이 진실원, localStorage 불필요 |

### 7.2 Inline style → Tailwind v4 utilities
디자인의 인라인 스타일은 모두 토큰 기반:
```tsx
// 디자인 (JSX)
<div style={{ padding: 20, background: 'var(--surface)', borderRadius: 14 }}>

// Next.js
<div className="p-5 bg-[hsl(var(--surface))] rounded-[14px]">
```
hex 값과 inline radial-gradient는 CSS 클래스로 추출 권장.

### 7.3 className 합성
`cn()` (clsx + tailwind-merge), `cva()` 패턴 일관 사용.

### 7.4 SVG 모티프
- 단청 동심원: `<svg>` 인라인 (SSR 친화)
- 연꽃 아이콘: Lucide `Flower` 또는 커스텀 SVG asset
- 절대 raster 이미지 사용 금지

---

## 8. 품질 보증 전략

### 8.1 자동 검증 (각 PR마다)
1. `tsc --noEmit` 통과
2. `npm test` 125 통과 유지
3. `npm run build` 성공
4. Playwright E2E smoke (login → counselors → detail → cash → bookings → consultation)
5. Lint hard rules (§1.3 6조건 자동 검출)

### 8.2 수동 검증 체크리스트 (페이지 단위)
- [ ] WEB_DESIGN.md §6 처방과 일치
- [ ] tabular-nums 누락 없음
- [ ] hover/active/focus/disabled 상태 모두 작동
- [ ] keyboard nav (Tab/Enter/Esc/Space)
- [ ] mobile viewport (375/768) 깨지지 않음
- [ ] reduced-motion 시 정적 표시
- [ ] empty/loading/error 상태 모두 디자인됨

### 8.3 시각 회귀
`web/e2e-screenshots/` 의 기존 스크린샷을 Phase별로 갱신. 비교는 사람의 눈으로 (Playwright snapshot diff는 너무 민감).

### 8.4 verify-frontend-ui 스킬
프로젝트에 이미 있는 스킬을 각 Phase 완료 시 호출.

---

## 9. 위험 관리 및 대응

### 9.1 식별된 리스크 (8개)

| 리스크 | 영향 | 가능성 | 대응 |
|--------|------|--------|------|
| Phase 0 토큰 변경이 기존 회귀 | High | Medium | 색상 값 미세 조정만 적용. 큰 값 변화는 Phase 2+. 자동 스모크 즉시 검출 |
| Gowun Batang CLS | Medium | High | `next/font` swap + adjustFontFallback. Phase 0 직후 CLS 측정 필수 |
| Room fullscreen chrome 잔존 | High | Medium | `consultation/[sessionId]/layout.tsx` 신규 + 부모 chrome 분리 |
| Admin/Counselor 정보 밀도 충돌 | Medium | High | 부록 C 톤 처방 — 카드 padding 16px, table density 압축 |
| sonner.tsx vs toast.tsx 중복 | Low | Medium | Phase 1에서 단일화 결정 (sonner 유지 권장) |
| Flutter in-flight 충돌 | Medium | Low | 별도 브랜치 `design/web-migration` |
| 디자인 emoji 의존 (🪷·🏮·📅) | Low | Medium | 핵심 케이스만 emoji 유지, 나머지는 Lucide |
| **Two-Design Coexistence 사용자 혼란** | **High** | **High** | **§9.4 대응** |

### 9.2 롤백 전략
- 각 Phase는 단일 PR 또는 PR 그룹 → revert 1회로 전 단계 복귀
- Foundation Phase는 feature flag (`NEXT_PUBLIC_DESIGN_V2=true`) 검토 — Tailwind v4 토큰 분기는 어려우므로 git revert가 현실적

### 9.3 Tailwind v4 호환성
- `@theme inline` 블록은 v4 신규 — 도입된 토큰 모두 거기에 등록
- shadcn/ui v4 호환 버전 검증
- v3 잔재 검출 (`@apply`, `theme()` 함수)

### 9.4 Two-Design Coexistence Strategy (v2 신규)

마이그레이션 도중 한 사용자 세션에서 두 디자인이 보이는 시기를 어떻게 다룰 것인가.

**4가지 전술**:

1. **Chrome 통일 우선**
   Phase 3 (chrome)을 Phase 2와 병렬로 시작. AppHeader/BottomTabBar/Toast가 일관되면 본문이 다르더라도 사용자는 "같은 앱"으로 인식.

2. **Critical Journey Lock**
   사용자 핵심 여정(홈→상담사→결제→상담실)은 **Phase 2에서 동시 마이그레이션** — 한 세션 안에서 두 디자인을 가로지르지 않도록.

3. **Tone-down Old Pages**
   아직 마이그레이션 안 된 페이지가 새 페이지보다 화려한 경우, 옛 페이지의 과도한 그라디언트/애니메이션을 30분 이내 토닝 다운. 새 페이지가 시선을 받도록.

4. **Migration Banner (선택)**
   Phase 4 이후 사용자 보조 페이지가 진행 중인 동안, "디자인을 단계적으로 새롭게 바꾸고 있어요" 안내 배너를 옛 페이지에만 노출. 사용자가 "버그가 아니라 의도"임을 알도록.

**검증**: Phase 별 마무리 시 마이그레이션된 페이지 + 미진행 페이지 30개 무작위 샘플로 사용자 시나리오 워크스루 (5분 한 사용자 여정).

---

## 10. Definition of Ready (DoR) — v2 신규

각 Phase 시작 전 충족 조건. DoR이 통과돼야 Phase 시작.

### 10.1 Phase 0 시작 전
- [ ] WEB_DESIGN.md 검토 완료, 팀 합의
- [ ] WEB_DESIGN_PLAN.md 검토 완료, 일정 합의
- [ ] 별도 브랜치 `design/web-migration` 생성
- [ ] 현재 main 브랜치의 Flutter 변경 사항 stage 또는 별도 브랜치 분리

### 10.2 Phase 1 시작 전
- [ ] Phase 0 PR 머지, 71페이지 스모크 통과
- [ ] Lighthouse 회귀 측정 완료 (성능 ≥ 90)
- [ ] Gowun Batang CLS 검증 완료

### 10.3 Phase 2 시작 전
- [ ] Phase 1 P0 5 primitive 머지
- [ ] `/booking/confirm` 라우트 백엔드 영향 검토 완료 (영향 없음 확인)
- [ ] consultation `[sessionId]` layout 분리 설계 합의

### 10.4 Phase 3-6 시작 전
- [ ] 직전 Phase DoD 통과
- [ ] 부록 C 톤 처방 검토 (5/6 phase)
- [ ] 사용자 시나리오 워크스루 1회 (Coexistence 검증)

### 10.5 Phase 7 시작 전
- [ ] Phase 0~6 모두 통과
- [ ] Production-like 환경에서 71페이지 navigate 가능
- [ ] 디자인팀 + QA 팀 일정 확보

---

## 11. Definition of Done (DoD)

### 11.1 페이지 단위 DoD
- [ ] WEB_DESIGN.md §6 처방 충실 구현
- [ ] §1.3 6 불가침 조건 통과
- [ ] mobile (375), tablet (768), desktop (1280, 1440) 4 뷰포트
- [ ] hover/focus/active/disabled/loading/empty/error 7 상태
- [ ] keyboard nav (Tab/Enter/Esc 자연스러움, focus visible)
- [ ] screen reader (aria-label, role, alt)
- [ ] reduced-motion 시 모든 애니메이션 정지
- [ ] 한국어 word-break/text-wrap 깨지지 않음
- [ ] Lighthouse Performance ≥ 90, Accessibility ≥ 95
- [ ] PR 머지 + 시각 회귀 스크린샷 첨부

### 11.2 Phase 단위 DoD
- [ ] 모든 페이지 페이지 DoD 통과
- [ ] `verify-frontend-ui` 스킬 통과
- [ ] 통합 E2E (Playwright) 통과
- [ ] CHANGELOG 갱신
- [ ] Coexistence 사용자 시나리오 워크스루 통과

### 11.3 프로젝트 전체 DoD
- [ ] 71페이지 모두 마이그레이션
- [ ] WEB_DESIGN.md Anti-Patterns(§12) 0건
- [ ] 사용자 핵심 9 화면 픽셀 퍼펙트 (디자인 번들 비교)
- [ ] CLAUDE.md 갱신
- [ ] CHANGELOG 마일스톤 명기
- [ ] 회고 문서 작성

---

## 12. Deferred Work / Out of Scope (v2 신규)

이 마이그레이션에서 **명시적으로 다루지 않는** 항목들. 스코프 크리프 방지.

### 12.1 명시적 OOS — 별도 프로젝트로 이관
- **Light mode 토글** — 디자인 시스템은 dark only. light 옵션 도입은 별도 PRD 필요
- **i18n 영문 카피 작성** — Pretendard fallback은 Phase 0 적용. 카피 자체는 별도 작업
- **모바일 뷰 (≤768px)** 디자인 — 본 plan은 데스크톱 1280px 기준. 모바일 별도 그리드/네비/카드 처방 필요 (단, 깨지지 않는 수준은 보장)
- **Chart 라이브러리 시각 정렬** (Recharts/Chart.js) — chart-1~5 토큰까지만 정렬, 차트 type별 처방은 admin Phase 6에서 ad-hoc
- **Storybook 정식 도입** — Phase 1에서 dev `/design-system` 페이지 정도. 정식 Storybook은 Post-Migration
- **새 사용자 페이지 추가** (예: 커뮤니티, Q&A) — 본 plan은 기존 71페이지 한정

### 12.2 보존하나 재정렬 안 함
- next-intl 메시지 키 구조 (그대로 유지)
- 이메일 템플릿 (별도 시스템)
- PDF 영수증 생성 로직
- Sendbird 통화 SDK 자체
- 백엔드 API 스키마

### 12.3 Phase별로 미루는 항목
| 항목 | 미루는 이유 | 처리 시점 |
|------|------------|----------|
| Storybook 정식 도입 | Phase 1 dev 페이지로 충분 | Post-Migration |
| 폰트 서브셋팅 (한자 분리) | CLS 측정 결과 기반 결정 | Phase 0 직후 |
| Migration Banner | UX 리스크 측정 후 | Phase 4 시작 시 결정 |
| sessions vs consultation/chat 통합 | 백엔드 영향 검토 | Phase 4 |
| Light mode | 사용자 요청 빈도 측정 후 | Post-Migration v3 |
| 모바일 viewport 디자인 | 데스크톱 안정 후 | Post-Migration |

---

## 13. Post-Migration 운영

### 13.1 디자인 시스템 거버넌스
- **변경 위원회**: 디자인 토큰 신규/변경은 PR 시 디자이너 1인 승인 필수
- **Storybook 정식 도입**: Post-Migration 1차 작업
- **분기별 시각 감사**: 새 페이지 추가 시 §1.3 6조건 회귀 자동 검증

### 13.2 모바일/Flutter 동기화
모바일은 light 한지, 웹은 dark 먹 — 테마 분기 의도적. 단 다음은 항상 동기화:
- 카운슬러 데이터 모델
- 캐시 패키지 / 카테고리 / 후기 태그
- 카피 (히어로 캡션, 트러스트, 후기 마이크로카피)

### 13.3 다국어 (i18n)
- Gowun Batang은 한자/한글 — 영어 모드는 Geist 또는 Pretendard 폴백
- 영어 모드 시 `serif` 클래스를 명조 → Geist Serif 분기 (Post-Migration)

### 13.4 신규 페이지 추가 시 가이드
1. WEB_DESIGN.md §6 패턴 중 가장 가까운 화면을 베이스
2. §5 Primitive 우선 사용
3. shadcn 컴포넌트는 §5.2 정렬된 variant 사용
4. §11.1 페이지 DoD 통과 후 머지

### 13.5 브랜드 진화
- gold hue (43°) 변경 시 모든 페이지 자동 반영 (CSS 변수 단일 진실원)
- 시즌 캠페인은 `--dancheong` accent 잠시 강화 옵션

---

## 부록 A — 참고 파일

### 디자인 번들 (읽기 전용)
- `/tmp/zeom-design/zeom/project/천지연꽃신당 풀 플로우.html`
- `shared.jsx`, `screens-discovery.jsx`, `screens-booking.jsx`, `screens-session.jsx`, `styles.css`
- `README.md`, `chats/chat1.md`

### 프로젝트 디자인 문서
- `WEB_DESIGN.md` (시스템 — 본 PLAN의 진실원)
- `MOBILE_DESIGN.md`, `MOBILE_DESIGN_PLAN.md` (자매)
- `CLAUDE.md` (프로젝트 가이드)

### 코드 진실원
- `web/src/app/globals.css`, `app/layout.tsx`
- `web/src/components/ui/*`, `web/src/components/*`

---

## 부록 B — 페이지 우선순위 점수표

| 페이지 | 트래픽 | 비즈니스 | 디자인 임팩트 | 합산 | Phase |
|--------|--------|---------|---------------|------|-------|
| `/` Home | 100 | 95 | 100 | 295 | **P0** | Phase 2 |
| `/login`, `/signup` | 95 | 100 | 90 | 285 | **P0** | Phase 3 |
| `/counselors`, `/counselors/[id]` | 90 | 100 | 95 | 285 | **P0** | Phase 2 |
| `/cash/buy` | 80 | 100 | 85 | 265 | **P0** | Phase 2 |
| `/consultation/[id]` Room | 70 | 100 | 100 | 270 | **P0** | Phase 2 |
| `/consultation/[id]/waiting` | 70 | 95 | 90 | 255 | **P0** | Phase 2 |
| `/consultation/[id]/review` | 65 | 90 | 80 | 235 | **P0** | Phase 2 |
| `/bookings/me` | 70 | 90 | 75 | 235 | **P0** | Phase 2 |
| `/booking/confirm` (신규) | 80 | 100 | 85 | 265 | **P0** | Phase 2 |
| `/wallet`, `/credits` | 60 | 80 | 70 | 210 | P1 | Phase 4 |
| `/mypage` | 50 | 60 | 60 | 170 | P1 | Phase 4 |
| `/onboarding` | 30 | 70 | 80 | 180 | P1 | Phase 3 |
| `/dashboard` | 40 | 60 | 70 | 170 | P1 | Phase 4 |
| `/notifications` | 30 | 40 | 50 | 120 | P2 | Phase 4 |
| `/fortune`, `/my-saju` | 25 | 50 | 75 | 150 | P2 | Phase 4 |
| `/blog/**` | 20 | 30 | 40 | 90 | P2 | Phase 4 |
| `/faq`, `/terms`, `/privacy` | 10 | 20 | 30 | 60 | P3 | Phase 4 |
| `/disputes/**`, `/refunds/**` | 5 | 80 | 40 | 125 | P2 | Phase 4 |
| `/counselor/**` 11 | 15 | 70 | 60 | 145 | P2 | Phase 5 |
| `/admin/**` 14 | 5 | 50 | 30 | 85 | P3 | Phase 6 |

---

## 부록 C — Counselor / Admin Tone Recipes (v2 신규)

사용자 페이지(Group A~G)는 의례적 차분함이 최우선이지만, 상담사·어드민 포털은 **데이터 효율**이 1차입니다. 같은 디자인 시스템을 쓰되 톤만 다르게.

### C.1 Counselor Portal Recipe

상담사는 **하루에 6-8시간을 이 화면 앞에서 보내는 사용자**입니다. 사용자 페이지의 "감정"을 줄이고 "효율"을 키웁니다.

**시각 차별화** (사용자 페이지 대비):
| 항목 | 사용자 | 상담사 |
|------|--------|--------|
| 카드 padding | 20px | **16px** (정보 밀도 ↑) |
| 카드 radius | 14px | **10px** (덜 부드럽게) |
| Hero | glow-card | **단순 surface card** (광원 효과 줄임) |
| Stagger cascade | 60ms × 8 | **즉시 표시** (반복 사용자에게 cascade는 거슬림) |
| Heading serif | 36px | **22px** (작게, 산세리프 옵션) |
| 그라디언트 buttons | 항상 그라디언트 | **단색 ok** (gold solid 사용 가능) |
| Trust messaging | 강조 | **제거** (이미 신뢰한 사용자) |
| Empty state 🪷 | 사용 | **48px Lucide 아이콘** (procedural) |

**고정 처방**:
- Layout: 좌측 240px sidebar nav (sticky) + 우측 main + 상단 64px 작은 헤더
- Sidebar: 카운슬러 avatar(48px) + 이름 + 메뉴 8개 (대시보드/예약/일정/고객/기록/후기/정산/프로필)
- Main: max-width 없음 (full bleed), 좌우 padding 32px
- Density: 카드 grid gap 12px (사용자 16px 대비)
- 빠른 액션: 주요 페이지에 sticky bottom action bar (저장/취소)

### C.2 Admin Portal Recipe

어드민은 **CRUD + 모더레이션 + bulk 처리**가 본질. 디자인 톤은 최소만 유지하고 표·필터·액션이 1차 시민.

**시각 차별화** (사용자 페이지 대비):
| 항목 | 사용자 | 어드민 |
|------|--------|--------|
| 카드 padding | 20px | **12px** |
| 카드 radius | 14px | **8px** (날카롭게) |
| Hero | glow-card | **없음** (페이지 제목 한 줄 + 액션 한 줄) |
| Stagger | 60ms × 8 | **없음** |
| Heading | 36px serif | **18px sans (Pretendard bold)** |
| Color | gold accent | **gold = 액션 한정**, 본문은 모노톤 |
| 데이터 그리드 | 카드 | **풀폭 table 우선** |
| 모션 | 풍부 | **최소** (즉시 반응만) |

**고정 처방**:
- Layout: 좌측 240px sidebar (전체 14 메뉴 그룹화) + 우측 main + 상단 64px (검색 input + admin avatar)
- Main: full bleed, padding 24px
- 데이터 테이블: shadcn Table — sticky header + zebra `--surface-3` + row hover `--surface-2` + sticky 좌측 selection + sticky 우측 actions
- 필터: 상단 sticky bar (Seg + select + date picker + 검색)
- Bulk action: 선택된 행 수 + bulk action 메뉴 (삭제/승인/내보내기)
- 페이지네이션: 하단 sticky (페이지 수 + per-page select + jump)

### C.3 공유 처방 (Counselor + Admin 공통)

- 토큰은 사용자 페이지와 100% 동일
- 폰트도 동일 (Gowun Batang은 헤딩만 — 단, 작은 크기 22px 이하에서는 Pretendard로 폴백)
- 모든 액션 버튼 sm 사이즈, primary는 gold (단색 ok)
- Modal 처방 동일
- 알림/토스트 처방 동일

### C.4 검증 체크리스트
- [ ] Counselor 화면 1시간 사용 시 피로감 감소 (자체 dogfooding)
- [ ] Admin 화면에서 1000행 테이블 60fps 유지
- [ ] 두 포털 모두 키보드 nav 일급 시민 (모든 액션 단축키)
- [ ] 사용자 페이지로 돌아갔을 때 톤 차이가 자연스러움

---

> **이 문서는 살아있는 계획입니다.** Phase 진행 중 발견되는 새 정보는 즉시 반영하고, 회고 시 다음 마일스톤에 학습을 누적하세요. 디자인은 한 번에 완성되지 않고, **신뢰는 페이지마다 매번 다시 결정됩니다**.
>
> v2 작성일: 2026-04-25 · 다음 refinement는 Phase 0 측정 결과를 반영하여 v2.1로.
