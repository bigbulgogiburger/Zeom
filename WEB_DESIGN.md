# Design System: 천지연꽃신당 Web (Organic Warmth Dark)

> 본 문서는 Claude Design에서 넘어온 `천지연꽃신당 풀 플로우.html` 프로토타입 번들(`shared.jsx`, `screens-discovery.jsx`, `screens-booking.jsx`, `screens-session.jsx`, `styles.css`)을 기준으로 작성된 공식 웹 디자인 시스템입니다. Next.js 15(`web/`)에 1:1로 정렬되며, 9개 핵심 화면(홈·상담사 목록·상세·예약 확인·캐시 충전·예약 관리·대기실·상담실·후기) 전반의 시각·타이포·컴포넌트·인터랙션 규약을 정의합니다.
>
> 자매 문서: [MOBILE_DESIGN.md](./MOBILE_DESIGN.md) (Flutter 한지·먹·금 라이트 테마)

---

## 1. Visual Theme & Atmosphere

천지연꽃신당의 웹은 **밤에 조용히 마음을 정리하러 오는 사람**을 위한 서비스입니다. 모바일 앱이 한지(라이트) 위에서 의례적 차분함을 만든다면, 웹은 정반대 방향으로 — **늦은 밤 단정한 서재의 등잔불 한 점**처럼 — 깊은 먹빛 다크 캔버스 위에 단 하나의 금색 등불을 띄웁니다. 화면을 켜는 순간 "여기는 시끄러운 곳이 아닙니다"라는 묵묵한 메시지가 시각적으로 먼저 도착해야 합니다.

이 테마의 이름은 **Organic Warmth Dark**입니다. "Dark"인 이유는 명확합니다 — 신점은 사적이고 무거운 맥락이며, 밝은 SaaS의 활기는 이 자리에 어울리지 않습니다. "Organic Warmth"인 이유는 더 의도적입니다. 우리는 차가운 푸른 다크(`#0F172A` 류 tech-dark)를 거부합니다. 배경은 항상 **따뜻한 색상의 깊은 갈색 톤**(`hsl(24 15% 5%)` — 옻칠한 먹색)이며, 모든 그라디언트와 그림자는 금·단청·연꽃의 색온도를 머금습니다. 결과적으로 화면은 "어둡지만 차갑지 않은" 톤 — 등잔의 빛이 종이 한쪽 면에 떨어지는 듯한 — 을 유지합니다.

브랜드의 유일한 시각적 액센트는 **금(gold, `hsl(43 70% 56%)`)**입니다. 단청의 주색·연꽃의 분홍은 모두 보조이며, 화면당 1~2회 등장하는 절제된 변주로만 사용됩니다. 금은 **가격·예약 시간·카운트다운·CTA** 등 사용자가 "결정해야 하는 숫자"에 집중 배치됩니다. 트렌디한 네온 액센트나 채도 높은 보라/하늘색은 일절 등장하지 않습니다. 한지·먹·금이 모바일의 3색 한정 팔레트라면, 웹은 먹·금에 단청·연꽃이 정중히 따라붙는 **2+2 팔레트**입니다.

타이포는 **Pretendard Variable(본문) + Gowun Batang(`.serif` 헤딩) 페어링**으로 한국 전통의 정서를 현대적으로 풀어냅니다. 헤딩과 숫자에는 세리프가 들어가며, 본문은 산세리프로 빠르게 읽히게 합니다. 모든 숫자는 `tabular-nums`로 고정폭 정렬되어 의례적 정확성을 유지합니다.

웹과 모바일 사이의 **의도적 분기**: 두 매체는 같은 브랜드를 다루지만 분위기가 정반대입니다. 모바일은 **한지(라이트)** 위에서 일상 사용성을, 웹은 **먹(다크)** 위에서 의례적 깊이를 강조합니다. 사용자가 데스크톱으로 접속한다는 것은 보통 야간·집중 환경이며, 우리는 그 맥락을 디자인 톤으로 직접 응답합니다. 단, **상담실 화면만은 모바일·웹 모두 다크**로 통일됩니다 — 영상 몰입은 매체와 무관한 단일 요구이기 때문입니다.

**핵심 특성 요약**
- 배경 `hsl(24 15% 5%)`(웜 다크 먹) + 표면 `hsl(32 10% 13%)` + 금색 `hsl(43 70% 56%)` 단일 액센트
- Pretendard Variable(본문) + Gowun Batang(`.serif` 헤딩) 페어링
- 단청(`hsl(350 55% 45%)`)·연꽃(`hsl(340 40% 58%)`)·옥(`hsl(160 30% 45%)`)은 보조 — 화면당 1~2개 카운슬러/뱃지에만 등장
- 카드는 항상 `surface bg + border 1px + radius 14px` (그림자는 hover에만)
- 헤더 sticky `68px` + 메인 `max-width 1280px` + padding `40px`
- 숫자(가격·시간·평점·잔액)는 모두 `tabular-nums` + 세리프
- 단청 동심원 SVG, 연꽃 🪷(성공/감사 모멘트만), 라디얼 그라디언트로 "등불" 모티프 반복
- 다크 위 다크: 상담실은 fullscreen overlay로 `--bg-deep`(`hsl(24 18% 3%)`) 더 깊은 톤

---

## 2. Color Palette & Roles

프로토타입은 `:root` 커스텀 프로퍼티(`styles.css:4-34`)로 토큰을 정의하며, Next.js의 `web/src/app/globals.css` 토큰과 1:1로 정렬해야 합니다. 현재 코드베이스는 이미 `--gold/--surface/--text-primary/--dancheong/--lotus`를 사용 중이므로, 본 문서의 토큰명 충돌 시 **현재 globals.css를 진실의 원천(source of truth)**으로 삼고 본 문서를 그쪽 명명에 맞춰 어댑트합니다.

### 2.1 Canvas & Surface (캔버스와 표면)
| 토큰 | 값 (HSL) | 역할 |
|------|----------|------|
| `--bg` | `hsl(24 15% 5%)` | 페이지 기본 배경, app-shell 베이스 |
| `--bg-deep` | `hsl(24 18% 3%)` | 상담실 fullscreen, 모달 backdrop 베이스 |
| `--surface` | `hsl(32 10% 13%)` | 주요 카드·헤더 배경 |
| `--surface-2` | `hsl(32 10% 16%)` | 호버·선택 상태, segmented control 활성 |
| `--surface-3` | `hsl(32 10% 10%)` | 입력 필드, 시간 슬롯 비활성 |

**app-shell 라디얼 그라디언트 처방** (`.app-shell` background, `styles.css:108-116`):
```css
background:
  radial-gradient(1200px 600px at 85% -10%, hsl(43 70% 20% / 0.12), transparent 60%),
  radial-gradient(900px 500px at -10% 40%, hsl(350 55% 20% / 0.08), transparent 60%),
  var(--bg);
```
→ 우상단에서 금빛 노을, 좌측 중앙에서 단청 보랏빛 그림자가 은은하게 새어나오는 "등잔 두 점" 인상. 이 그라디언트는 모든 페이지에서 일관되게 깔립니다.

### 2.2 Brand Accent (브랜드 액센트)
| 토큰 | 값 | 역할 |
|------|-----|------|
| `--gold` | `hsl(43 70% 56%)` | 가격·CTA·타이머·로고·하이라이트 — 단일 브랜드 색 |
| `--gold-deep` | `hsl(43 70% 42%)` | 버튼 그라디언트 하단, 강조 hover |
| `--gold-soft` | `hsl(43 45% 65%)` | 그라디언트 상단, 다크 위 부드러운 텍스트 |
| `--gold-muted` | `hsl(43 20% 25%)` | 비활성 별점, 스크롤바 hover |

**금색 사용 규칙** (절대 어기지 말 것):
- 한 화면에 금색이 다 떠 있으면 안 됩니다. **결정점 1개 + 정보점 2~3개** 정도가 한계.
- 본문 텍스트에 금색 사용 금지. `--gold`는 항상 "숫자 또는 행동 신호".
- `linear-gradient(180deg, var(--gold), var(--gold-deep))`이 primary 버튼의 표준 처방.

### 2.3 Secondary Accents (보조 액센트, 단청·연꽃·옥)
| 토큰 | 값 | 역할 |
|------|-----|------|
| `--dancheong` | `hsl(350 55% 45%)` | 단청 주색 — 카운슬러 액센트 1, 빠른 액션 카드 강조 |
| `--lotus` | `hsl(340 40% 58%)` | 연꽃 — 카운슬러 액센트 2, 따뜻한 부속 뱃지 |
| `--jade` | `hsl(160 30% 45%)` | 옥색 — 카운슬러 액센트 3 (희소), 보조 |

이 셋은 **카운슬러별 고유 색**으로 사용됩니다(`shared.jsx:13/26/37/48/61/73`의 `accent` 필드). 각 카운슬러 카드의 portrait 그라디언트, hero 배경의 라디얼 광원이 이 색들을 입습니다. UI 시스템 색이 아니라 **데이터의 색**이라는 점이 중요합니다.

### 2.4 Text Scale (텍스트 단계)
| 토큰 | 값 | 역할 | Font-weight 권장 |
|------|-----|------|-----------------|
| `--text` | `hsl(35 20% 88%)` | 본문 1차, 헤딩, 버튼 텍스트 | 600-700 |
| `--text-2` | `hsl(30 15% 62%)` | 부연 설명, 메타데이터, 라벨 | 400-500 |
| `--text-3` | `hsl(30 10% 42%)` | 비활성 상태, 플레이스홀더 | 400 |

**중요**: `#FFFFFF` 순수 화이트를 텍스트로 쓰지 않습니다. `hsl(35 20% 88%)`의 미세한 황색기는 다크 배경에서 "오래된 종이에 인쇄된 잉크처럼" 자연스럽게 떠오르도록 설계되었습니다. 순백은 다크 위에서 깜빡거리는 LED처럼 거슬립니다.

### 2.5 Borders (테두리)
| 토큰 | 값 | 역할 |
|------|-----|------|
| `--border` | `hsl(35 15% 18%)` | 기본 1px 카드·구분선·입력 경계 |
| `--border-strong` | `hsl(43 50% 30%)` | 강조 (모달·toast·tweaks 패널), 호버 시 카드 승격 |

보더는 항상 1px. 2px+ 두꺼운 테두리는 다크 위에서 갈라진 종이처럼 보입니다. 포커스 시에는 두께 대신 **gold 0.6 alpha + box-shadow 3px outer halo**로 표현합니다(`styles.css:96-99`).

### 2.6 Functional States (기능 상태)
| 토큰 | 값 | 역할 |
|------|-----|------|
| `--success` | `hsl(145 40% 45%)` | 온라인 점, 결제 완료, 입금 |
| `--warning` | `hsl(35 70% 55%)` | 캐시 부족 경고, 10분 이내 타이머 |
| `--danger` | `hsl(0 55% 55%)` | 1분 남음 타이머, 통화 종료 버튼, 비가역 액션 |

상담실 타이머는 시간이 지남에 따라 **gold → warning → danger**로 점진 전환됩니다(`screens-session.jsx:201-203`). 색이 정보가 되는 가장 또렷한 사례.

### 2.7 Shadow & Effects
| 토큰 | 값 |
|------|-----|
| `--shadow` | `0 8px 32px rgba(0,0,0,0.4)` |
| `--shadow-gold` | `0 12px 40px hsl(43 70% 46% / 0.12), 0 4px 12px hsl(43 70% 46% / 0.06)` |

**그림자 철학**: 다크 위에서는 검은 그림자가 거의 보이지 않습니다. 우리가 정말로 만들고자 하는 건 "들어 올림"이 아니라 **"빛이 닿는 곳"** — 그래서 카드 hover 시 `--shadow-gold`(금빛 외광)을 입혀서 "선택받는다"는 인상을 줍니다.

---

## 3. Typography Rules

### 3.1 Font Stack
```css
--font-sans: 'Pretendard Variable', 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
--font-serif: 'Gowun Batang', 'Noto Serif KR', serif;
```

- **Pretendard Variable**: 본문 전체. 한글 가독성 최적화, variable-weight (45~920) 사용.
- **Gowun Batang**: 헤딩·브랜드·숫자(가격·타이머). 명조 계열로 한국 전통 정서.
- 영문 헤딩에 Geist를 함께 쓸 수도 있으나, 본 디자인은 **Gowun Batang을 한·영 공통**으로 사용해 일관된 음색을 유지합니다 (현재 codebase가 Geist를 쓰고 있다면 Gowun Batang으로 단일화하는 마이그레이션 필요).

### 3.2 Type Scale
| 클래스 | 크기 | 사용 |
|--------|------|------|
| `.text-xs` | 12px | 메타데이터, 라벨, 세그먼트 컨트롤 |
| `.text-sm` | 13px | 보조 본문, 카드 메타 |
| (기본) | 15px | 본문 |
| `.text-lg` | 17px | 카드 제목, 영역 헤딩 |
| `.text-xl` | 22px | 섹션 헤딩 (h2) |
| `.text-2xl` | 28px | 화면 헤딩 (h1 일부) |
| `.text-3xl` | 36px | 화면 헤딩 (h1 표준) |
| `.text-4xl` | 48px | 타이머·잔액 같은 강조 숫자 |
| (커스텀 52px) | 52px | Home Hero h1 (`screens-discovery.jsx:14`) |

### 3.3 Heading Rules
- 모든 `<h1~h4>` 기본: `font-weight 700`, `line-height 1.25`, `letter-spacing -0.01em`, `text-wrap balance`
- `.serif` 클래스를 의도적으로 붙여 명조로 전환 — 화면 타이틀, 강조 숫자, 카운슬러 이름
- `letter-spacing -0.02em` (로고), `-0.005em` (.serif 일반) — 한글 자간 보정

### 3.4 Tabular Numbers (필수)
**모든 숫자에 `.tabular` (font-variant-numeric: tabular-nums) 적용**:
- 가격: `45,000 캐시`, `₩260,000`
- 평점: `4.9`, `(1,284)`
- 시간: `20:00`, `59:59`, `00:09` (카운트다운)
- 날짜: `4/25`, `D-3`

이 규칙을 어기면 숫자가 깜빡거리듯 흔들립니다 (특히 카운트다운). 의례적 안정감은 고정폭에서 옵니다.

### 3.5 Korean-specific
```css
word-break: keep-all;
overflow-wrap: break-word;
```
모든 본문에 적용. 특히 헤딩은 `text-wrap: balance`로 어절 단위 줄바꿈을 보장합니다.

---

## 4. Layout & Grid System

### 4.1 App Shell
```
┌─ .app-shell (radial bg) ──────────────────────┐
│ .header (sticky, 68px, blur 20px)            │
│ ┌──── logo ─── nav ──── wallet | bell | me ─┐ │
│ └────────────────────────────────────────────┘ │
│ .main (max-width 1280px, padding 40px)        │
│ ┌────────── 화면별 내용 ──────────┐           │
│ └────────────────────────────────┘           │
│ [floating flow jumper]   [tweaks panel]      │
└────────────────────────────────────────────── ┘
```

- **헤더**: `position: sticky; top: 0; z-index: 50; height: 68px`. 배경은 `hsl(24 15% 5% / 0.78)` + `backdrop-filter: blur(20px)`. 스크롤하면 본문이 헤더 뒤로 흐릿하게 비치는 효과.
- **메인 컨테이너**: `max-width: 1280px`, 좌우 `padding: 40px`. 1280px는 모니터 표준 + 사이드바 여유의 합리적 값.
- **상담실(`screen === 'room'`)만 fullscreen overlay** — 헤더 숨김, padding 0, `position: fixed; inset: 0`.

### 4.2 Common Layout Patterns
| 패턴 | 사용처 | grid-template-columns |
|------|--------|----------------------|
| **List + Sidebar** | Counselors | `280px 1fr` (필터 sticky 좌측) |
| **Detail + Booking** | Detail | `1fr 380px` (예약 패널 sticky 우측) |
| **Form + Summary** | Cash | `1fr 320px` (결제수단 + 주문요약) |
| **Video + Sidebar** | Waiting | `1fr 340px` |
| **4-column grid** | 추천 카운슬러, 캐시 패키지, 트러스트 스트립 | `repeat(4, 1fr) gap 16px` |
| **2-column grid** | 카운슬러 카드 리스트 | `repeat(2, 1fr) gap 16px` |
| **3-column grid** | 홈 빠른 액션 | `repeat(3, 1fr) gap 16px` |

### 4.3 Spacing Scale
| 토큰 | 값 | 사용 |
|------|-----|------|
| `gap-4` | 4px | 별점 간격, 작은 인라인 |
| `gap-6/8` | 6/8px | 인라인 일반 |
| `gap-12` | 12px | 카드 내 항목 |
| `gap-16` | 16px | 카드 간 간격 (그리드 표준) |
| `gap-20/24` | 20/24px | 섹션 내 그룹 |
| `gap-32` | 32px | 화면 내 큰 단위 |

마진 유틸: `mt-4/8/12/16/24/32/48` 그리고 `mb-8/12/16/24/32`. **48px 이상은 사용자 정의** (`marginTop: 60` 같이 inline).

### 4.4 Radius
| 토큰 | 값 | 사용 |
|------|-----|------|
| `--radius-sm` | 10px | 버튼, 입력 필드, 작은 카드 |
| `--radius` | 14px | **카드 표준** (가장 많이 등장) |
| `--radius-lg` | 20px | hero glow-card, 모달 |
| 999px | (직접) | wallet-chip, 별점 뱃지, 컨트롤 토큰 (캡슐) |

---

## 5. Components Catalog

### 5.1 Button Variants (`.btn`)
모든 버튼은 `.btn` 베이스 + 변형 클래스. 베이스는 `display: inline-flex`, `gap: 8px`, `padding: 12px 20px`, `border-radius: 10px`, `font-size: 14px`, `font-weight: 600`, `min-height: 42px`, `transition: all 180ms`, `:active { transform: scale(0.98) }`.

| 변형 | 처방 | 용도 |
|------|------|------|
| `.btn-primary` | 금색 그라디언트 + inset shadow + drop shadow | **단일 page CTA** (예약/결제/입장/등록) |
| `.btn-secondary` | `--surface-2` + border | 보조 액션 (이전, 취소, 새로고침) |
| `.btn-ghost` | 투명 배경, hover 시 `--surface` | 헤더 nav, 텍스트 링크 대용 |
| `.btn-danger` | red 0.3 alpha bg + red border + soft red text | "통화 종료" 같이 비가역 |

크기 변형: `.btn-lg` (48px min-height, 15px font), `.btn-sm` (34px min-height, 13px font). 폭 변형: `.btn-block` (100%).

**Primary 버튼 그라디언트 처방** (이 처방을 절대 단색으로 바꾸지 마세요 — 입체감이 사라집니다):
```css
background: linear-gradient(180deg, var(--gold), var(--gold-deep));
color: hsl(24 15% 5%);  /* 어두운 텍스트로 대비 */
box-shadow:
  0 4px 16px hsl(43 70% 46% / 0.3),
  inset 0 1px 0 hsl(43 90% 70% / 0.4);  /* 상단 하이라이트 */
```

### 5.2 Card Variants
- **`.card`**: 표준 카드. `surface bg + border 1px + radius 14px + padding 20px`. 모든 컨텐츠 그룹의 기본.
- **`.glow-card`**: Hero용. `linear-gradient bg + radius 20px` + `::before`로 상단 라디얼 금빛. Home hero에만 등장.
- **카운슬러 카드 (CounselorCard)**: 2단 구조 — 위쪽 portrait+meta, 아래쪽 가격 푸터(`--surface-3` 배경 + 상단 1px border). hover 시 `translateY(-2px) + --shadow-gold`.

### 5.3 Badge Variants
| 클래스 | 색상 |
|--------|------|
| `.badge-gold` | gold 0.12 bg + gold text + gold 0.25 border |
| `.badge-success` | green 0.2 bg + green text |
| `.badge-warn` | orange 0.15 bg + orange text |
| `.badge-danger` | red 0.15 bg + red text |
| `.badge-muted` | `--surface-2` + `--text-2` |
| `.badge-lotus` | lotus 0.15 bg + lotus text |

규격: `padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; line-height: 1`. `Dot` 컴포넌트와 자주 결합 (`<Dot pulse/> 지금 가능`).

### 5.4 Shared Primitives (`shared.jsx:113-177`)
| 컴포넌트 | API | 동작 |
|----------|-----|------|
| `Stars` | `value`, `size` | 채운 별 + 빈 별. 빈 별은 `--gold-muted`. 별점 표시 전용. |
| `Portrait` | `counselor`, `size` | 원형 + 카운슬러 accent 그라디언트 + 이니셜 + (online이면 2px gold ring) |
| `Dot` | `color`, `pulse` | 7px 원형. `pulse=true`면 `breathe 1.8s` 애니메이션. |
| `PlaceholderImg` | `label`, `height`, `style` | 사선 줄무늬 패턴 + 라벨. 디자인 단계 placeholder. |
| `ProgressSteps` | `steps[]`, `current` | 단계 점-선 네비. done(채워진 금)/active(테두리+halo)/pending. |

추가로 inline 컴포넌트들:
- `CounselorCard` (`screens-discovery.jsx:207`): 카운슬러 리스트 카드
- `Info` (`screens-booking.jsx:109`): 라벨/값 2단 (예약 확인 페이지)
- `BookingCard` (`screens-booking.jsx:291`): 예약 내역 카드 + 상태별 액션
- `CtrlBtn` (`screens-session.jsx:154`): 대기실 토글 (마이크/카메라)
- `FabBtn` (`screens-session.jsx:406`): 상담실 원형 컨트롤 (56px 원)
- `Check` (`screens-session.jsx:164`): 18px 원형 체크박스 + 라벨

### 5.5 Wallet Chip (`styles.css:170-183`)
사용자 지갑 잔액 표시 전용 컴포넌트. **헤더 우측 + 결제 페이지 잔액 카드** 두 곳에서 같은 모양으로 등장.
```html
<button class="wallet-chip">
  <div class="coin"/>          <!-- 16px gold-grad 원, 동전 메타포 -->
  <span class="amount tabular">45,000</span>
</button>
```
- 캡슐 형태 (`border-radius: 999px`)
- gold 텍스트 + tabular nums
- 클릭 시 `nav('cash')`

### 5.6 Segmented Control (`.seg`)
탭 대용. 카운슬러 페이지의 상담 방식(모두/화상/음성), 예약 관리의 상태별(예정/완료/취소), 상담사 상세의 video/voice 선택 등에서 일관 사용.
```html
<div class="seg">
  <button class="active">모두</button>
  <button>화상</button>
  <button>음성</button>
</div>
```
- 비활성: `--text-2` + 투명 bg
- 활성: `--surface` + `--gold` + 1px shadow

### 5.7 Progress Steps (`.progress-steps`)
4단계 점-선 네비. 예약 확인 페이지 상단(`current=2`).
- done: 금색 채운 원 + 체크
- active: 금 테두리 + halo (4px shadow)
- pending: 회색 테두리 + 숫자

### 5.8 Toast (`.toast-container`)
- 위치: `top: 88px; right: 32px` (헤더 바로 아래, 우측)
- 자동 사라짐: 3.2초 후
- 동시 다중 가능 (column stack, gap 8px)
- 성공/실패 아이콘 24px 원 + 텍스트
- 타이밍: `scaleIn 0.3s var(--ease)`로 등장

### 5.9 Modal (`.modal-backdrop` + `.modal`)
- backdrop: `hsl(24 18% 3% / 0.72)` + `blur(6px)` (전체 어두워짐 + 흐림)
- modal: `--surface` + `--border-strong` 1px + radius 20px + `0 24px 64px shadow`
- 등장: backdrop `fadeIn 0.2s` + modal `scaleIn 0.25s var(--ease)`
- max-width 440px

### 5.10 Tweaks Panel (개발/검토 도구, 프로덕션 비공개)
- 위치: 우하단 fixed
- accent 색조 슬라이더(10-360), 밀도, 세리프 토글, 점프 내비 토글
- `localStorage` + iframe postMessage로 호스트 환경(Claude Design)과 통신
- **프로덕션 빌드 시 Tweaks 패널과 floating flow jumper는 모두 제거**

---

## 6. Screen-by-Screen Specifications

각 화면은 `fade-up` 애니메이션으로 진입. 화면당 평균 1~2개의 sticky 영역, 모두 `top: 88px`(헤더 + 20px 여유).

### 6.1 Home (`screen === 'home'`)
**파일**: `screens-discovery.jsx:4`

**구조** (top-down):
1. **Hero** (`.glow-card`, padding 56/48px)
   - 좌측: badge `오늘 N명 상담 가능` (gold pulse dot) + `52px serif h1` (2줄, 두 번째 줄 첫 단어 gold) + 17px 본문 + primary/secondary 듀얼 CTA + 3 항목 trust list
   - 우측: 200px 단청 동심원 SVG 4겹 + radial dancheong 광원
2. **Quick Actions 3열** (24px gap)
   - 🏮 지금 상담 가능 (gold) | 📅 오늘 저녁 슬롯 (dancheong) | 🪷 이번 주 추천 (lotus)
   - 각 카드: 44px 컬러 박스 + 22px 이모지 + 제목/설명 + 우측 → 화살표
3. **Featured Counselors** 4열 (`.stagger`)
   - 카드 구조: 140px 그라디언트 portrait (이니셜 36px serif gold) + name + Stars + speciality + (다음 슬롯 + 가격)
4. **Trust Strip** 4열 (mt-48)
   - `60분 / 24h / E2E / 1:1` 4개 큰 숫자 + 설명. 모든 큰 숫자는 `text-2xl serif text-gold`.

**히어로 카피 (필수)**:
> 마음이 복잡한 밤,
> **천지연꽃**이 조용히 듣겠습니다.

**카피 이유**: "마음이 복잡한 밤"은 사용자의 정서 진입점, "조용히 듣겠습니다"는 상품의 약속. 이 두 줄은 마케팅이 아니라 **계약**입니다.

### 6.2 Counselors (`screen === 'counselors'`)
**파일**: `screens-discovery.jsx:118`

**구조**: `grid 280px 1fr gap-24`
- **Sticky Filter (좌측 280px)**:
  - 카테고리 라디오 리스트 (전체/연애·재회/금전·사업/진로·직장/가족·조상/건강/종합운)
  - 상담 방식 segmented (모두/화상/음성)
  - "지금 가능한 상담사만" 체크박스
  - 가격 슬라이더 (30k–120k, 기본 80k)
  - 필터 초기화 ghost 버튼
- **Results (우측)**:
  - 상단: `N명의 상담사` + 정렬 select (추천순/평점순/후기순/가격 낮은순)
  - **2열 카드 그리드 + stagger** (60ms 간격)
  - 카드 hover: `translateY(-2px) + --shadow-gold`

### 6.3 Detail (`screen === 'detail'`)
**파일**: `screens-discovery.jsx:247`

**구조**: `← 목록으로` 뒤로가기 + `grid 1fr 380px gap-32`
- **Left (프로필 + 후기)**:
  - **프로필 카드**: 120px portrait + (badges: 지금 가능 + N년차) + 36px serif name + speciality + Stars + 태그 lotus 뱃지들
  - **탭 (intro/reviews/policy)**: 1px border-bottom + active gold underline 2px
  - intro: bio + 4분면 메타 그리드 (전문/스타일/경력/응답시간)
  - reviews: 4건 후기 카드 (user, tag, date, stars, text)
  - policy: 5개 항목 (60분/입장/환불/재연결/개인정보) — 라벨은 gold 80px width
- **Right (sticky 예약 패널 380px)**:
  - 가격 (28px gold tabular) + `예약형` 뱃지
  - **상담 방식** segmented (`🎥 화상 / 🎙 음성`)
  - **날짜** 7일 horizontal pill list (오늘/내일/요일+숫자)
  - **시간** 4×4 그리드 (1시간 단위, 13개 슬롯). 점유된 슬롯은 `text-decoration: line-through; text-3 color`
  - **CTA**: `{날짜} {시간} 예약하기` primary lg block. 슬롯 미선택 시 비활성 + "시간을 선택해주세요"
  - 작은 글씨: 60분 고정 / 캐시 hold

**핵심 인터랙션**: 슬롯 클릭 → CTA 텍스트 즉시 변경 + 활성화. CTA 누르면 `window.pendingBooking` 세팅 후 `nav('confirm')`.

### 6.4 Confirm (`screen === 'confirm'`)
**파일**: `screens-booking.jsx:3`

**구조** (`max-width 720px center`):
1. **ProgressSteps** (`current=2`, 4단계: 상담사 선택 / 시간 선택 / 예약 확인 / 결제)
2. **`예약을 확인해주세요`** h1 + 부연
3. **예약 정보 카드**: 72px portrait + name + speciality + 우측 채널 뱃지. divider 후 2×2 그리드 (날짜/시간/방식/입장)
4. **결제 카드**:
   - 헤더: "결제" + wallet-chip (보유 잔액)
   - 항목 리스트: 상담료 - 보유 차감 - (divider) - 차감 후 잔액
   - **잔액 부족 시**: orange-tinted 박스 + `캐시가 N 부족해요` + 충전하기 sm primary 버튼 (returnTo: 'confirm' 파라미터)
5. **약관 체크박스 카드**: 환불 정책 + 개인정보 처리 (둘 다 [필수])
6. **Footer**: 이전(secondary) + `45,000 캐시 예약 확정` (primary lg, flex 1)

**Loading 상태**: dots 애니메이션. 900ms 후 `bookingsList`에 추가 + toast `예약이 확정되었습니다` + `nav('bookings')`.

### 6.5 Cash (`screen === 'cash'`)
**파일**: `screens-booking.jsx:116`

**구조** (`max-width 880px`):
1. **`캐시 충전`** h1 + 부연
2. **패키지 4열 카드**:
   - p1: 60분 1회 — 55K (보너스 0)
   - p2: 60분 2회 — 110K + 10K 보너스
   - p3 (popular): 60분 5회 — 300K + 40K 보너스 (`인기` 뱃지 우상단)
   - p4: 60분 10회 — 600K + 100K 보너스
   - 선택 카드: gold 1px + gold 0.06 bg
3. **`grid 1fr 320px gap-20`**:
   - **결제 수단 카드 (좌)**: 4개 라디오 (카드/이체/카카오페이/토스페이) + 약관 체크박스
   - **주문 요약 카드 (우 sticky)**: 패키지 정보 + 충전 캐시 + (보너스 success 색) + 결제 금액 (28px gold) + primary lg block 결제 버튼 + "PortOne × KG이니시스" 안내

**Loading → Success 상태**: dots 1.4초 → checkmark 80px 원 + `충전이 완료되었습니다` + `45,000 캐시가 지갑에 반영되었습니다` + dots → 1.4초 후 `returnTo` 파라미터에 따라 `confirm` 또는 `home`으로 자동 복귀.

### 6.6 Bookings (`screen === 'bookings'`)
**파일**: `screens-booking.jsx:239`

**구조** (`max-width 960px`):
1. **`예약 관리`** h1 + 부연
2. **상단 줄**: segmented (예정 N / 완료 N / 취소 N) + 우측 ghost `+ 새 상담 예약`
3. **빈 상태**: 60px padding 카드 + 48px 🪷 (opacity 0.3) + 메시지 + (예정일 때만) primary 상담사 찾기
4. **카드 리스트** (col gap-12 stagger):
   - portrait 60px + name + 채널 뱃지 + 상태 뱃지 (예약 확정/완료)
   - 메타: `날짜 · 시간 — 종료시간 (60분) · 가격`
   - 우측 액션:
     - upcoming: 취소 (secondary sm) + 대기실 입장 (primary sm)
     - completed: 후기 작성 (primary sm) 또는 `후기 작성됨 ✓`
   - 취소 시 toast: `예약이 취소되었습니다 · 100% 환불 예정`

### 6.7 Waiting (`screen === 'waiting'`)
**파일**: `screens-session.jsx:3`

**구조** (`max-width 1040px`):
1. **헤더 줄**: 좌측 `대기실 / 상담 준비 중` (sm muted + 22px serif) + 우측 `← 나가기`
2. **`grid 1fr 340px gap-20`**:
   - **비디오 프리뷰 (좌)**:
     - aspect 16/10 라디얼 그라디언트 (cam이 켜져있으면 dancheong 풍 그라디언트, 꺼져있으면 surface-3)
     - 내부 self tile (40px inset margin) — silhouette SVG (원형 머리 + 사다리꼴 어깨, 35% opacity)
     - 좌하단 마이크 레벨 미터 (6 bar, gold)
     - 우상단 네트워크 뱃지 (`Dot color + 우수/양호/불안정`)
     - 컨트롤 줄: CtrlBtn 마이크 + 카메라 + 설정 / 우측 `상대방은 아직 입장 전입니다`
   - **사이드바 (우 col gap-16)**:
     - **카운트다운 카드** (text-center): "입장까지" + 48px serif gold tabular `00:09` + 시작 시각 + 입장 버튼
     - **상담사 카드**: 44px portrait + name + 채널/60분
     - **체크리스트 카드**: 4 항목 (마이크/카메라/네트워크/조용한 공간)
     - **유의사항 박스**: 12px 텍스트, 60분 자동종료 / 5분 재입장 / 녹음 금지

**핵심 인터랙션**:
- 매 1초 `demo` 카운트다운 (10 → 0)
- 매 120ms 마이크 레벨 랜덤 갱신 (`micLevel`)
- 입장 버튼은 `demo === 0 && cam && mic`일 때만 활성

### 6.8 Room (`screen === 'room'`)
**파일**: `screens-session.jsx:179`

**Fullscreen overlay** (`position: fixed; inset: 0; z-index: 70; bg: --bg-deep`).

**구조** (`flex column`):
1. **Top Bar** (12/24px padding, blur):
   - 좌: 32px portrait + name + 채널/진행 중
   - 중앙: "남은 시간" + 22px serif tabular timer (`mm:ss`)
   - 우: 상황 뱃지 (1분 남음 danger pulse / 10분 이내 warn / HD success)
2. **Progress Bar 2px**: width 진행률 % + color matches timer color
3. **Video Area (flex 1)**:
   - 메인 뷰: 라디얼 (counselor accent) — 화상이면 큰 silhouette + 좌하단 name 뱃지, 음성이면 220px breathing orb (이니셜 80px serif gold) + 하단 name
   - 우하단 self PIP (200px aspect 16/10) — 화상 모드일 때만
4. **Chat Panel (조건부 우측 340px)**:
   - 헤더: 메시지 + ✕
   - 메시지 영역 (flex 1, scroll, gap 10px)
     - me: gold 0.15 bg + gold 0.3 border, align-self end
     - counselor: surface-2 bg + border, align-self start
   - 입력 줄: input + 전송 sm primary
5. **Bottom Controls**: 5 FabBtn (마이크/카메라/스피커/채팅) + 빨간 종료 (`hsl(0 60% 50→40%)` 그라디언트, 캡슐, drop shadow)

**핵심 인터랙션**:
- 매 1초 `elapsed` 증가 → mm/ss 갱신 + progress bar width 갱신
- 타이머 색상: `>10min: gold`, `1-10min: warning`, `≤1min: danger`
- 종료 버튼 클릭 → ending 상태 → 1.2초 후 `bookingsList`의 해당 예약을 `completed`로 갱신 + `nav('review')`

### 6.9 Review (`screen === 'review'`)
**파일**: `screens-session.jsx:418`

**구조** (`max-width 600px center`):
1. **헤더** (text-center): badge `✓ 상담 완료` + 36px serif `{name}님과의 상담, 어떠셨나요?` + 부연
2. **별점 카드** (text-center): 5개 ★ (40px) + hover/click 양쪽 처리. 마우스 오버 텍스트: `아쉬웠어요/보통이에요/괜찮아요/좋았어요/완벽했어요`
3. **태그 카드**: `차분해요 / 현실적이에요 / 깊이 있어요 / 공감 잘해요 / 명쾌해요 / 따뜻해요` 6개 토글 뱃지 (선택 시 gold border + gold 0.15 bg)
4. **자세한 후기 카드**: textarea rows=5 + 500자 카운터 + 익명 처리 안내
5. **푸터**: 나중에 작성 (secondary) + 후기 등록 (primary lg flex 1, 별점 0이면 비활성)

**완료 상태**: 80px 원 (gold 0.15 bg) + 🪷 + `고맙습니다` + `후기가 {name}님께 전달됩니다.` → 1.6초 후 `nav('bookings')`

---

## 7. Motion & Interaction

### 7.1 Easing Tokens
```css
--ease: cubic-bezier(0.16, 1, 0.3, 1);          /* 표준 — 대부분 */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1); /* 스프링 — pop-in */
```

### 7.2 Animation Keyframes
| 키프레임 | 지속 | 곡선 | 사용 |
|----------|------|------|------|
| `fadeUp` | 0.5s | `--ease` | **모든 화면 진입** (`fade-up` 클래스) — translateY 12px |
| `fadeIn` | 0.4s/0.2s | `--ease`/ease | 탭 전환, 내부 컨텐츠 |
| `scaleIn` | 0.3s/0.25s | `--ease` | toast, modal, chat panel |
| `pulse` | 1.2s | infinite | dots 로딩 (3 stagger 0/0.2/0.4s) |
| `breathe` | 1.8~3s | infinite | online dot, 음성 모드 orb |
| `shimmer` | (skeleton 용) | — | 로딩 그라디언트 |
| `spin` | 1s | infinite | 스피너 |

### 7.3 Stagger Cascade (`stagger > *`)
가장 중요한 모션 패턴. 카드 그리드(추천 카운슬러, 카운슬러 리스트, 예약 카드)가 60ms 간격으로 순차 등장.
```css
.stagger > *:nth-child(1) { animation-delay: 0ms; }
.stagger > *:nth-child(2) { animation-delay: 60ms; }
/* ... 8까지 ... 420ms */
```
이 패턴은 사용자에게 "정보가 차곡차곡 도착한다"는 페이스 감각을 줍니다. 한 번에 다 떠오르면 정보가 아니라 광고처럼 보입니다.

### 7.4 Hover/Press Patterns
- 모든 버튼: `:active { transform: scale(0.98) }` 표준
- 카운슬러 카드: hover `translateY(-2px) + --shadow-gold` (180ms)
- nav-item: hover `surface bg + text-1 color`
- 입력 포커스: gold 0.6 alpha border + gold 0.18 alpha 3px halo

### 7.5 Page Transitions
화면 전환 시 `nav()` 호출 → `setScreen` + `setParams` + `window.scrollTo({ top: 0, behavior: 'instant' })`. 이전 화면 페이드 아웃은 없음 (instant unmount). 새 화면이 `fade-up`으로 진입 → 약 200ms의 시각적 갭이 자연스럽게 채워짐.

### 7.6 Microcopy Timing
| 액션 | 타이밍 |
|------|--------|
| 예약 확정 → bookings 이동 | 900ms (loading dots) |
| 캐시 충전 → 성공 화면 | 1400ms (loading dots) |
| 충전 성공 → 자동 이동 | 1400ms 후 |
| 상담 종료 → review 이동 | 1200ms |
| 후기 등록 → bookings 이동 | 1600ms |
| Toast 자동 소멸 | 3200ms |

이 시간들은 **느낌상의 정직함**을 만듭니다. 즉시 이동하면 "버튼을 눌렀는데 진짜 처리됐나?"는 의심이 생기고, 너무 길면 답답합니다. 0.9~1.6초가 결제 도메인의 표준입니다.

---

## 8. Data Models (프로토타입 시드)

> 이 모델은 디자인 표현을 위한 참고 시드입니다. 실제 백엔드(`backend/`) 스키마는 별도 source of truth입니다.

### 8.1 Counselor (`shared.jsx:4-77`)
```ts
type Counselor = {
  id: string;
  name: string;       // "달무리 보살"
  initial: string;    // "달" — Portrait/orb에 표시
  tags: string[];     // ['종합운', '연애', '가족']
  rating: number;     // 4.7~4.9
  reviews: number;    // 후기 개수
  price: number;      // 50000~90000 (60분 기준)
  years: number;      // 경력
  bio: string;        // 자기소개 1~2문장
  style: string;      // '차분한 경청형' / '직설적 분석형' / ...
  speciality: string; // '연애·재회·가족 갈등'
  accent: string;     // HSL — 카드 그라디언트 + 상담실 배경 광원
  online: boolean;    // 지금 가능 여부
  nextSlot: string;   // '오늘 20:00' / '내일 14:00' / '지금 가능'
};
```

**시드 6명** (디자인 검토 시 그대로 사용):
| 이름 | 전문 | 평점 | 가격 | accent |
|------|------|------|------|--------|
| 달무리 보살 | 연애·재회·가족 | 4.9 | 60K | dancheong |
| 소담 법사 | 사업 타이밍·금전 | 4.8 | 75K | gold |
| 연지 선녀 | 재회·궁합·이별 | 4.9 | 55K | lotus |
| 청산 거사 | 조상·건강·가정 | 4.7 | 80K | jade |
| 서리 동자 | 진로·시험·이직 | 4.8 | 50K | gold |
| 밤길 보살 | 택일·작명·종합 | 4.9 | 90K | dancheong |

### 8.2 Categories
`전체 / 연애·재회 / 금전·사업 / 진로·직장 / 가족·조상 / 건강 / 종합운`

### 8.3 Time Slots (`shared.jsx:89-93`)
1시간 단위, `10:00` ~ `22:00` (총 13개). 점심·저녁 분리 없이 단일 그리드.

### 8.4 Cash Packages (`shared.jsx:95-100`)
| id | label | cash | price | bonus | 보너스율 |
|----|-------|------|-------|-------|---------|
| p1 | 60분 1회 | 55,000 | ₩55,000 | 0 | 0% |
| p2 | 60분 2회 | 110,000 | ₩100,000 | 10,000 | 10% |
| p3 | **60분 5회** (인기) | 300,000 | ₩260,000 | 40,000 | 15.4% |
| p4 | 60분 10회 | 600,000 | ₩500,000 | 100,000 | 20% |

**경제 설계 원칙**: 1회는 보너스 없음 → 2회부터 의미 있는 보너스. 인기 패키지(p3)는 5회 — "이번 분기 5회 정도 써볼 만하다"는 사용자 마음의 진입점. p4(10회)는 충성 사용자.

### 8.5 Review Tags
`차분해요 / 현실적이에요 / 깊이 있어요 / 공감 잘해요 / 명쾌해요 / 따뜻해요`

이 6개는 카운슬러 `style` 필드와 의미적으로 짝을 이룹니다. (예: 차분한 경청형 ↔ 차분해요/공감 잘해요 / 직설적 분석형 ↔ 현실적이에요/명쾌해요)

### 8.6 Formatters
```js
formatCash(n) → "45,000 캐시"
formatWon(n)  → "₩260,000"
```
캐시는 단위 글자, 원은 기호. 모든 출력에 `.toLocaleString('ko-KR')`. 통화/캐시 혼동을 방지하는 표기 분리는 **사용자 신뢰의 기본**입니다.

---

## 9. Tweaks (디자인 변주 토큰)

`window.TWEAKS` 객체로 노출되는 설정 (`풀 플로우.html:17-23`):
| 키 | 타입 | 기본값 | 효과 |
|----|------|--------|------|
| `accentHue` | number (10-360) | 24 | gold 색조 (HSL hue). 24 = 따뜻한 금. 다른 값으로 무드 테스트. |
| `density` | 'comfortable' \| 'compact' | 'comfortable' | 카드 padding 분기 (현재 implementation은 미적용) |
| `useSerif` | boolean | true | 헤딩 세리프 토글 |
| `showJourneyNav` | boolean | true | 예약 플로우 breadcrumb 표시 |

**프로덕션 정책**: `accentHue=24`, `density=comfortable`, `useSerif=true`, `showJourneyNav=true` 고정. Tweaks 패널 자체는 빌드에서 제거.

---

## 10. Gap Analysis: 현재 Next.js codebase 대비

CLAUDE.md에 따르면 현재 `web/`은 이미 같은 9 화면을 가지고 있고 토큰 통일 100% 완료 상태입니다. 디자인 번들과의 갭은 다음과 같이 추정됩니다 (실제 갭은 별도 비교 작업으로 검증 필요).

### 10.1 토큰 명명 차이
- 본 문서: `--bg, --surface, --text, --gold-deep` 등
- 현재 코드: `--surface, --text-primary, --text-secondary, --gold` (CLAUDE.md 기준)
- **결정**: 현재 globals.css 명명을 유지. 본 문서의 추가 토큰(`--bg-deep`, `--gold-soft`, `--gold-muted`, `--border-strong`, `--surface-2`, `--surface-3`)을 globals.css에 보강.

### 10.2 폰트 페어링
- 본 문서: Pretendard + **Gowun Batang** (`.serif`)
- 현재: Pretendard + **Geist** (CLAUDE.md 기준)
- **결정**: Gowun Batang 도입을 권장. Geist는 기능적 산세리프지만, 본 디자인의 의례적 무드는 명조 헤딩에서 옵니다. CDN으로 추가 가능 (`https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700`).

### 10.3 누락 가능성 있는 컴포넌트
- `Portrait` (online ring + accent gradient) — 현재 Avatar 컴포넌트와 다름
- `Stars` 컴포넌트 (별점 표시 전용)
- `ProgressSteps` (예약 확인 페이지 상단)
- `WalletChip` (헤더 + 결제 페이지)
- `Seg` (segmented control) — shadcn Tabs와 다른 디자인
- `Toast` 시스템 — 현재 ToastProvider 있음, 디자인 매칭 검토
- `Dot pulse` 애니메이션
- `glow-card` (Hero 전용 라디얼 배경 카드)

### 10.4 인터랙션 갭
- Stagger cascade 애니메이션 (60ms 간격)
- 카운트다운 → 활성화 전환 (대기실)
- 타이머 색상 점진 전환 (gold → warning → danger)
- 마이크 레벨 6-bar 미터
- 음성 모드 breathing orb

### 10.5 레이아웃 갭
- 헤더 height 68px + blur 20px backdrop
- max-width 1280px (현재값과 비교 필요)
- 상담실 fullscreen overlay (헤더 숨김)

---

## 11. Implementation Priority

권장 순서 (각 단계 commit 분리):

**Phase 1 — 디자인 토큰·폰트** (production safe)
1. `web/src/app/globals.css`에 누락 토큰 추가 (`--bg-deep`, `--surface-2/3`, `--gold-soft/deep/muted`, `--border-strong`, `--dancheong`, `--lotus`, `--jade`)
2. Gowun Batang CDN 추가 + `.serif` 클래스 정의
3. `--ease`, `--ease-spring`, `--shadow`, `--shadow-gold` 모션 토큰
4. `fade-up`, `fade-in`, `scale-in`, `stagger`, `breathe`, `pulse` 키프레임

**Phase 2 — 공통 Primitive** (`web/src/components/`)
5. `Stars`, `Portrait`, `Dot`, `WalletChip`, `Seg`, `ProgressSteps`
6. Card variants (.card / .glow-card / hover .shadow-gold)
7. Button variants (primary gradient + inset shadow)
8. Badge variants (gold/success/warn/danger/muted/lotus)

**Phase 3 — 화면별 적용** (한 PR per 화면, 가벼운 화면부터)
9. Bookings (가장 단순 — 리스트)
10. Review (단일 컬럼)
11. Cash (4-pkg + 사이드바)
12. Confirm (ProgressSteps 실전 검증)
13. Counselors (필터 sticky)
14. Detail (sticky 예약 패널 — 가장 복잡한 정적 레이아웃)
15. Home (hero + 다중 섹션)
16. Waiting (실시간 카운트다운/마이크)
17. Room (fullscreen + 실시간 타이머/채팅)

**Phase 4 — 검증**
- `verify-frontend-ui` 스킬로 토큰 일관성 자동 검증
- Lighthouse + Playwright 시각 회귀 (현재 e2e-screenshots 기반)

---

## 12. Anti-Patterns (절대 하지 말 것)

1. **순백 텍스트** — `--text(#hsl(35 20% 88%))` 사용. 순백은 다크 배경에서 깜빡거립니다.
2. **순흑 배경** — `--bg(#hsl(24 15% 5%))`. 차가운 다크는 본 디자인의 정서와 충돌.
3. **gold 단색 버튼** — 항상 그라디언트 + inset shadow. 단색은 평면이 되어 입체감이 사라집니다.
4. **2px+ 보더** — 1px만. 두꺼운 보더는 갈라진 종이.
5. **숫자에 tabular-nums 누락** — 카운트다운/잔액이 흔들립니다.
6. **3개 이상 액센트색 한 화면** — 단청·연꽃·옥은 카운슬러 데이터에서만. UI는 gold만.
7. **이모지 남용** — 🪷는 성공/감사 모멘트만. 🏮·📅·🪷는 홈 빠른 액션 카드만. 그 외 이모지는 임시 placeholder로 간주, Lucide 아이콘으로 교체.
8. **이전 화면 페이드 아웃** — 새 화면 fade-up만. 양쪽 페이드는 답답합니다.
9. **헤더 비투명 배경** — `0.78 alpha + blur 20px` 유지. 스크롤 콘텐츠가 비치는 것이 의도.
10. **fullscreen Room 중 헤더 노출** — 화면 어디에도 외부 nav가 보이면 몰입 깨짐.

---

## 13. 참고 파일

| 파일 | 역할 |
|------|------|
| `천지연꽃신당 풀 플로우.html` | 진입점, App Shell + 라우팅 + Tweaks |
| `shared.jsx` | 데이터(Counselors/Packages/Reviews) + 공통 컴포넌트(Stars/Portrait/Dot/ProgressSteps) |
| `screens-discovery.jsx` | Home / Counselors / Detail |
| `screens-booking.jsx` | Confirm / Cash / Bookings |
| `screens-session.jsx` | Waiting / Room / Review |
| `styles.css` | 503줄 토큰·레이아웃·컴포넌트·애니메이션 통합 |

원본 번들 위치: `/tmp/zeom-design/zeom/project/`. 본 문서는 이 번들의 모든 파일을 1:1로 분석한 결과이며, 디자인 의도가 모호하면 **항상 원본 파일을 다시 참조**하세요.
