# Design System: 천지연꽃신당 Mobile (한지·먹·금 Ceremonial)

> 본 문서는 Claude Design에서 넘어온 `천지연꽃신당 모바일 인터랙티브.html` 프로토타입 번들을 기준으로 작성된 공식 모바일 디자인 시스템입니다. Flutter 앱(`app_flutter/lib/shared/theme.dart`)과 1:1로 정렬되며, 17개 모바일 화면 전반을 아우르는 시각·타이포·컴포넌트 규약을 정의합니다.

---

## 1. Visual Theme & Atmosphere

천지연꽃신당의 모바일은 **한국 전통 무속 상담**이라는 무거운 맥락을 다루는 제품입니다. 상담 전 긴장된 마음, 상담 중의 집중, 상담 후의 정리 — 이 세 단계의 감정을 모두 수용해야 하기 때문에, 이 디자인은 상업적인 활기(밝은 버튼·네온 악센트)가 아니라 **의례적 차분함(ceremonial calm)**을 지향합니다. 종이 위에 먹으로 쓴 글씨, 단청의 금박, 연꽃의 은은한 분홍처럼 한국 전통 물성이 "디자인 언어" 자체로 번역되어 있습니다.

팔레트의 뿌리는 **한지(#F5EBDD)**입니다. 순백이 아닌 약간 따뜻한 종이 톤이 화면 전체의 기반이 되고, 여기에 **먹(#111)**이 본문·탭바·주요 CTA로 얹힙니다. 브랜드의 유일한 악센트는 **금(#C9A227)**이며, 이는 가격·카운트다운·리워드·사주팔자 같은 "의례적 숫자"에만 집중 배치됩니다. **노토 세리프 한글(Noto Serif KR)**이 모든 헤딩·숫자·브랜드 모멘트를 담당하고, 본문은 **Pretendard Variable**이 한국어 최적 자간으로 받쳐줍니다. 이 조합은 트렌디한 산세리프-온리 SaaS와 명확히 선을 그으며 "전통을 현대에 풀어낸" 인상을 만듭니다.

이 디자인을 차별화하는 또 하나의 장치는 **맥락별 테마 분기**입니다. 대부분의 화면이 라이트 한지 테마(`hanji` 배경 + `ink` 텍스트)를 유지하지만, **대기실·상담실** 두 화면만 `ink` 배경 + `hanji` 텍스트로 반전합니다. 이는 영상 몰입을 위한 의도적 브레이크이며, 동시에 "상담 중"이라는 공간적 맥락을 사용자 시각적으로 각인시킵니다. 그리고 모든 "경사스러운" 상태(결제 완료·후기 감사·세션 종료)에는 **연꽃 🪷**이 유일한 이모지 예외로 등장합니다.

**핵심 특성 요약**
- 한지(#F5EBDD) 캔버스 + 먹(#111) 텍스트 + 금(#C9A227) 악센트 — 3색 위주
- Noto Serif KR(헤딩·숫자) + Pretendard Variable(본문) 페어링
- 카드 기본 규칙: `white` bg + `borderSoft(#E8DDC9)` 1px + 반경 14px (그림자 없음)
- 다크 반전: 대기실·상담실만 예외, 나머지 15개 화면은 라이트 일관
- 단청·연꽃·만다라 SVG 모티프를 장식으로 사용, 이모지는 최소화
- 숫자는 항상 `tabular-nums` + Noto Serif → 의례적 정확성
- 모든 CTA는 "60분"·"24h 전 100%"·"1,000 캐시 적립" 같이 **계약을 숫자로 명시**

---

## 2. Color Palette & Roles

프로토타입은 MC2 토큰 객체(`m-screens-1.jsx:4`)로 팔레트를 정의하며, Flutter `AppColors`(`app_flutter/lib/shared/theme.dart:5`)와 동일한 값을 공유합니다. Flutter에서는 `AppColors` 정적 필드, 웹에서는 CSS 커스텀 프로퍼티 `--hanji`, `--ink` 등으로 매핑합니다.

### 2.1 Canvas & Surface (바탕과 표면)
| 토큰 | 값 | 역할 |
|------|-----|------|
| `hanji` | `#F5EBDD` | 페이지 기본 배경, 스크롤 뷰 최상단 |
| `hanjiDeep` | `#EDE0CC` | 그라디언트 마지막 단, 눌린 표면, 태그 배경 |
| `hanjiCard` | `#FBF3E4` | 강조 카드의 따뜻한 변주 (선택적) |
| `white` | `#FFFFFF` | 주요 카드 표면 (리스트·폼·패키지) |
| `ink` | `#111111` | 다크 캔버스 (대기실·상담실), 인버스 히어로 카드 |

### 2.2 Brand Accent (브랜드 악센트)
| 토큰 | 값 | 역할 |
|------|-----|------|
| `gold` | `#C9A227` | 가격, 카운트다운, 브랜드 원·로고, 핵심 CTA 변형 |
| `goldSoft` | `#D9B74A` | 그라디언트 하이라이트 (라이트 → 세츄레이트), 다크 배경 위 gold 변주 |
| `goldBg` | `#F5E8B8` | 금색 톤 필 (배지·"오늘의 운세" 라벨) |

### 2.3 Text Scale (텍스트 단계)
| 토큰 | 값 | 역할 | Font-weight 권장 |
|------|-----|------|-----------------|
| `ink` | `#111111` | 본문 1차, 제목, 버튼 텍스트 | 600-700 |
| `ink2` | `#333333` | 본문 2차, 부연 설명 | 400-500 |
| `ink3` | `#666666` | 메타(시간·횟수), 플레이스홀더 라벨 | 400 |
| `ink4` | `#999999` | 비활성 상태, 저밀도 보조 | 400 |

**중요**: 어떤 상황에서도 `#000000` 순수 블랙을 쓰지 않습니다. `ink(#111)`의 미세한 따뜻함은 한지 바탕 위에서 인쇄된 먹글씨처럼 읽히도록 설계되었습니다.

### 2.4 Functional States (기능 상태)
| 토큰 | 값 | 역할 |
|------|-----|------|
| `success` (jade) | `#2D5016` | 온라인 점, 입금·적립, 긍정 배지 |
| `warning` | `#B87333` | 캐시 부족 경고, 주의 박스 테두리·텍스트 |
| `darkRed` | `#8B0000` | 종료 통화, 분쟁 신고, 목적지가 비가역인 액션 |
| `lotus` | `#C36B85` | 프로필 아바타 그라디언트 상단, 따뜻한 부속 |

### 2.5 Borders (테두리)
| 토큰 | 값 | 역할 |
|------|-----|------|
| `border` | `#D4C4B0` | 기본 1px 디바이더, 강조 경계선 |
| `borderSoft` | `#E8DDC9` | 카드 내부 1px (가장 일반적), 폼 입력 경계 |

**보더의 철학**: 한지 톤 위에서 지나치게 진한 테두리는 "잘린 종이"처럼 보입니다. `borderSoft`를 기본으로, 포커스·선택 시에만 `ink` 1.5px로 전환합니다.

### 2.6 Extended (확장 이해용 참고)
- **Sendbird 채팅 말풍선 상대방**: `rgba(255,255,255,0.08)` on ink
- **사용자 말풍선**: `gold` + 30% alpha 덧칠 on ink
- **네트워크 상태 "우수"**: `rgba(45,80,22,0.3)` 배경 + `#a8c47a` 텍스트

---

## 3. Typography Rules

### 3.1 Font Stack

| 용도 | CSS / Flutter |
|------|---------------|
| 헤딩·숫자 | `'Noto Serif KR', serif` / `GoogleFonts.notoSerif()` |
| 본문 | `'Pretendard Variable', 'Noto Sans KR', system-ui, sans-serif` / `GoogleFonts.notoSans()` |

**Noto Serif KR**는 CDN `https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;500;600;700&display=swap`로 로드합니다. **Pretendard Variable**은 `https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.css`를 사용합니다.

### 3.2 Type Scale (프로토타입 실측 기반)

| Role | Font | Size (px) | Weight | LH | LS | Notes |
|------|------|-----------|--------|-----|-----|------|
| Hero Display | Noto Serif | 40 | 700 | 1.0 | -0.5 | 대기실 카운트다운 숫자 |
| Display LG | Noto Serif | 34 | 700 | 1.1 | -0.3 | 지갑 잔액 |
| Display | Noto Serif | 30 | 700 | 1.1 | -0.5 | 로그인 브랜드 타이틀 |
| Display SM | Noto Serif | 24–26 | 700 | 1.15 | -0.3 | 성공 화면 타이틀 |
| Page Title | Noto Serif | 22 | 700 | 1.3 | -0.2 | 각 탭 페이지 상단 |
| Sub Title | Noto Serif | 20 | 700 | 1.3 | -0.2 | 사주 핵심 결과 |
| Section | Noto Serif | 17–18 | 700 | 1.4 | 0 | "오늘의 운세", 섹션 헤더 |
| Card Title | Noto Serif | 14–16 | 700 | 1.4 | 0 | 상담사 이름, 예약 카드 |
| Body LG | Pretendard | 15 | 500–600 | 1.5 | 0 | 버튼 라벨 (md) |
| Body | Pretendard | 13–14 | 400–500 | 1.6 | 0 | 본문 단락, 카드 디스크립션 |
| Body SM | Pretendard | 12–13 | 500 | 1.5 | 0 | 보조 문단, 체크박스 라벨 |
| Meta | Pretendard | 11–12 | 400 | 1.5 | 0 | 시간·횟수·"오늘" |
| Tag / Badge | Pretendard | 10–11 | 600–700 | 1.3 | 0 | 상태 배지, pill |
| Micro | Pretendard | 9–10 | 400 | 1.3 | 0.5–1 | "/60분", 법적 고지 |

### 3.3 숫자 렌더링 규칙 (중요)

천지연꽃신당은 "60분·10초·1,000캐시·24h"라는 **계약적 숫자**가 사용자 신뢰를 결정합니다. 그래서 숫자에만 적용하는 강한 규칙을 둡니다.

- **`font-variant-numeric: tabular-nums` 필수**: 가격, 타이머, 카운트다운, 잔액, 리뷰 수, 별점 수치
- **Noto Serif KR 강제 적용**: 가격·타이머·잔액은 세리프 폰트로 "인쇄물"처럼 보이게
- **`font-weight: 700` 기본**: 숫자가 문장 안에서도 "의례적 정확성"을 가지도록
- **금색 강조**: 핵심 숫자는 `gold(#C9A227)`로 색상 분리 (예: "60,000캐시", "00:05")

### 3.4 한국어 타이포그래피 원칙

1. **`word-break: keep-all`** — 한국어 단어가 줄 끝에서 분절되지 않도록
2. **`text-wrap: balance`** — 2-3줄 헤딩의 균형 강제 (지원 환경에서)
3. **줄간격 1.5–1.7** — 한글은 라틴 문자보다 복잡도가 높아 넉넉한 LH 필요
4. **문장 끝 구두점 생략** — 짧은 라벨·CTA에서 마침표 제거 ("후기 작성" O, "후기 작성." X)
5. **경어 일관성** — 모든 UI 텍스트는 `-요/-세요` 높임말. "예약" 동사형은 "예약하기"가 아닌 "예약 확정"처럼 의례적 톤

### 3.5 Noto Serif vs Pretendard 매핑 규칙

| 시나리오 | 사용 | 이유 |
|---------|------|------|
| 숫자 단독 | Noto Serif 700 | 의례적 정확성 |
| 한글 브랜드·타이틀 | Noto Serif 600–700 | 세리프의 격식 |
| 긴 본문 단락 | Pretendard 400 | 가독성 |
| 버튼 라벨 | Pretendard 600 | UI 명료성 |
| 별점 ★ | Noto Serif (default) | 문자 패밀리 일관 |
| 사주 한자 `戊辰` | Noto Serif 700 | 한자 렌더링 품질 |
| 카드 제목 + 메타 | Serif(제목) + Sans(메타) 혼합 | 시각적 리듬 |

---

## 4. Component Stylings

### 4.1 Buttons (`Btn`)

프로토타입 `m-screens-1.jsx:119`의 `Btn` 컴포넌트가 정식 스펙입니다.

```
// 사이즈
sm  → padding 10 16 / font-size 13
md  → padding 14 20 / font-size 15 (기본)

// 공통
border-radius: 10px (CTA) | 12px (sticky footer) | 8px (small inline)
font-family: Pretendard, weight 600
transition: transform 120ms ease
```

| Variant | Background | Text | Border | 용도 |
|---------|-----------|------|--------|------|
| `primary` | `ink` | `hanji` | none | 주 CTA (예약·결제·입장) |
| `gold` | `gold` | `ink` | none | 브랜드·리워드·충전 CTA |
| `danger` | `darkRed` | `hanji` | none | 종료 통화, 신고 접수 |
| `outline` | transparent | `ink` | 1.5px `ink` | 보조 CTA (홈으로) |
| `ghost` | transparent | `ink` | none | 리스트 내부 소형 액션 |

**Disabled 규칙**: `opacity: 0.4`, 배경 유지. `ink4`로 바꿔 죽은 느낌을 내지 않습니다 (우리 서비스는 "조금만 기다리면 활성화"되는 맥락이 많아, 버튼이 여전히 존재감을 가져야 함).

**Press feedback**: 모바일 탭 시 `transform: scale(0.98)` 120ms. 의례적 탭 감각을 위해 `0.95` 이하로는 내려가지 않음.

### 4.2 Cards

**Standard Card (가장 흔한 유형)**
```
background: white
border: 1px solid borderSoft
border-radius: 14px
padding: 14px (소형) | 16px (중형) | 18-20px (대형)
shadow: none
```

**Selected Card (선택 상태)**
- `border: 1.5px solid ink` + 배경은 `ink`로 반전, 텍스트 `hanji`
- 다크 반전은 "선택되었음"을 촉각적으로 확정시키는 역할

**Hero Inverse Card (히어로)**
- 홈 지갑 카드, 지갑 히어로, 상담 완료 프로필 카드
```
background: linear-gradient(135deg, ink 0%, #2a2a2a 100%)
color: hanji
position: relative; overflow: hidden
```
- 내부에 `LotusMandala` SVG를 `absolute right -30 top -30 opacity 0.15`로 배치하여 금실 자수 느낌 연출

**Warning Box (경고 박스)**
- `background: rgba(184,115,51,0.08)` + `border: 1px solid rgba(184,115,51,0.3)` + `color: warning`
- 캐시 부족, 분쟁 주의 등에 사용. 빨간 에러와 명확히 구분.

### 4.3 Inputs

**텍스트 필드**
```
background: hanji (약간 눌린 페이지 배경) 또는 white (카드 내부)
border: 1px solid borderSoft
border-radius: 8-10px
padding: 12px 14px
font-size: 14
font-family: Pretendard
outline: none
```
- Focus: `border: 1px solid ink` (ring 없음 — 한지 바탕에 링은 과함)
- Placeholder: `ink3` 색상
- Icon prefix (검색): 16x16 `ink3` stroke

**Textarea**
- 5–6 rows 기본
- `resize: vertical`
- 우하단에 `{length}/500` 카운터 (색상 `ink3` 10px)

**Date/Time Native**
- iOS 네이티브 `<input type="date|time">` 활용 (Flutter: `showDatePicker` + `showTimePicker`)
- 배경은 hanji, 터치 영역 48px 이상

**Radio / Checkbox**
- `accent-color: ink` (브라우저 네이티브 스타일 활용)
- 체크박스 옆 라벨 텍스트: Pretendard 12.5, weight 400, `ink2`
- "**[필수]**" 굵은 prefix 허용

### 4.4 Chips (`Chip`)

```
padding: 7px 14px
border-radius: 999px
font-size: 12.5
font-family: Pretendard, weight 500 (inactive) / 600 (active)
white-space: nowrap
flex-shrink: 0
```

| 상태 | BG | Text | Border |
|------|----|----|--------|
| Inactive | `white` | `ink2` | 1px `border` |
| Active | `ink` | `hanji` | 1px `ink` |
| 카테고리 chip (horizontal scroll) | 좌우 스와이프로 전체 가능 |

**Tag chip (배지)**
- `hanjiDeep` 배경 + `ink2` 텍스트 + 10px font + `2px 8px` padding + 999 radius
- 상담사 카드 내부 `종합운·연애·가족` 등에 사용

### 4.5 Bottom Tab Bar (`TabBar`)

```
position: absolute; bottom: 0
height: 80px
padding-bottom: 20px (iOS 홈 인디케이터 대응)
background: white
border-top: 0.5px solid border
display: flex
z-index: 20
```

**탭 5개 고정 순서**: 홈 · 상담사 · 예약 · 지갑 · 더보기

각 탭 버튼:
- `flex: 1`, `padding: 8px 0`
- SVG icon 22x22 (stroke 기반, filled state만 `fill`)
- 라벨 Pretendard 10.5px
- Active: stroke `ink` + weight 700 + stroke-width 2.2
- Inactive: stroke `ink3` + weight 500 + stroke-width 1.8

**중요**: 탭바는 "현재 탭 루트" 스크린에서만 노출되며, 상세 스택 진입(예: 상담사 상세) 시 숨김. 이는 모바일에서 한 손 사용 시 하단 엄지 영역을 돌려받기 위함입니다.

### 4.6 App Bar (`AppBar`)

```
height: 48px
padding: 4px 8px 10px
position: relative
border-bottom: 0.5px solid borderSoft (elevate=true일 때)
```

구조: `[‹ Back 40x40] [Centered Title] [Right Slot 40x40]`
- Title: Noto Serif 17px weight 600, `ink` (라이트) / `#fff` (다크)
- Back button: font-size 22 `‹` 글리프, 클릭 영역 40x40 확보
- Right slot: 하트(찜), 공유, 설정 아이콘 용도

**Dark variant**: `대기실·상담실`에서 `fg: #fff`, `border-bottom: rgba(255,255,255,0.08)` + `background: transparent`.

### 4.7 Status Bar (`StatusBar`)

iOS 상단 상태바를 프로토타입에 그려 넣은 것. 실제 Flutter 앱에서는 `SystemChrome.setSystemUIOverlayStyle`로 대체:

- 라이트 화면: `statusBarIconBrightness: Brightness.dark`
- 다크 화면(대기실·상담실): `statusBarIconBrightness: Brightness.light`
- 높이: 54px 포함 (notch + safe area)

### 4.8 Avatar (`Av`)

```
shape: circle
background: linear-gradient(135deg, #111, #2a2a2a)
color: gold (C9A227)
font-family: Noto Serif
font-weight: 700
font-size: size * 0.42 (크기 비례)
```

**사이즈 프리셋**
- 28 (상담실 탑바 인라인)
- 40 (리스트 예약 카드)
- 48 (리스트 카드, 완료 카드)
- 52–58 (예약 확인, 상담사 리스트)
- 84 (상담사 상세 히어로)

**Online dot (온라인 표시)**
- 사이즈: 아바타의 22%
- 우하단 절대 배치
- `success` green fill + 2px `hanji` border (겹침 방지)
- `mcbreathe` 펄스 애니메이션 선택 적용

**프로필 사진 대체 (마이페이지)**
- 연꽃 톤 그라디언트: `linear-gradient(135deg, lotus, darkRed)`
- 이니셜 `hanji` 색상

### 4.9 Star Rating (`St`)

```
★ (U+2605) 문자 사용
filled: gold
empty: border (D4C4B0)
letter-spacing: 1
```

- 인라인 표시: 10–12px
- 후기 입력 시: 36px + hover state (`hv`) 별도 관리
- 항상 5개 fixed, 부분 채움은 반올림(floor) 기준

### 4.10 Presence Dot (`Dot`)

```
default size: 7x7px
border-radius: 50%
background: success (2D5016) 또는 custom
animation: mcbreathe 1.8s ease-in-out infinite (pulse=true일 때)
```

**LIVE 인디케이터**: 호스트 카드 상단에 `<Dot pulse/> LIVE`로 병기. LIVE 레이블은 `success` 색, 9-10px, 600.

### 4.11 Lotus Mandala (장식 SVG)

브랜드를 장식할 때 로고·이모지 대신 사용하는 핵심 모티프.

**로그인 화면 (대형)**
```
viewBox="0 0 300 300"
- 중심 동심원 4개 (r=120, 90, 60, 30) — stroke ink 0.5, fill none
- 8개 꽃잎 타원 (cx=150 cy=80, rx=22 ry=50) — 45도 간격 회전 — stroke gold 0.8
- opacity 0.08 (배경 워터마크)
```

**히어로 카드 (소형)**
```
viewBox="0 0 140 140" 또는 "0 0 180 180"
- 동심원 3–4개만
- position: absolute; right: -30; top: -30
- opacity 0.15
- stroke gold
```

### 4.12 Animations

전역 CSS keyframes(HTML head 내부 정의):

```css
@keyframes mcbreathe {
  0%, 100% { transform: scale(1); opacity: 0.85; }
  50%      { transform: scale(1.08); opacity: 1; }
}
@keyframes mcspin {
  to { transform: rotate(360deg); }
}
@keyframes mcfade {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: none; }
}
```

| 이름 | 지속 | 이징 | 용도 |
|------|------|------|------|
| `mcbreathe` | 1.8s | ease-in-out infinite | presence dot, 음성 상담 아바타 |
| `mcspin` | 0.8s | linear infinite | 로그인 로딩, 결제 로딩 |
| `mcfade` | 0.25–0.5s | ease-out | 토스트, 운세 결과 펼침 |

### 4.13 Toast

```
position: fixed; bottom: 40px (from phone frame bottom)
left: 50%; transform: translateX(-50%)
padding: 12px 20px
background: #111; color: hanji; border: 1px solid gold
border-radius: 10px; font-size: 13px
box-shadow: 0 8px 24px rgba(0,0,0,0.5)
animation: mcfade 0.25s
```

**자동 사라짐**: 2.4초 (참을성 있는 한국어 원칙에 맞춰 조금 길게)
**사용 예**: "예약이 확정되었습니다", "예약이 취소되었습니다"

### 4.14 Timer & Countdown

대기실·상담실의 핵심 컴포넌트. 색상은 **잔여 시간에 따라 3단계**로 전환.

```js
const urgent = rem <= 60;        // 빨강 (1분 이하)
const near   = rem <= 600;       // 주황 (10분 이하)
// 그 외 → gold
```

| 상태 | Color | Font |
|------|-------|------|
| 정상 (> 10분) | `gold #C9A227` | Noto Serif 18–40 weight 700 |
| 임박 (10분 이하) | `#d9a64a` 주황 | 동일 |
| 긴급 (1분 이하) | `#e06a6a` 연빨강 | 동일 + 소폭 `mcbreathe` |

타이머 아래 **progress bar**: `height: 2px`, `width: (el/TOTAL)*100%`, 색상 동일 전환, `transition: width 1s linear`.

---

## 5. Layout Principles

### 5.1 Device Canvas

- **기준 해상도**: iPhone 14 (390 × 844 logical)
- **프레임**: 10px 패딩의 폰 프레임 + 54px 상단 노치 공간
- **실제 콘텐츠 높이**: 844 − 54(status) − 34(home indicator) = 756px

### 5.2 Spacing Scale

| 값 | 용도 |
|----|------|
| 2, 3, 4 | 텍스트 내부 줄간격·아이콘 얼라인 |
| 6, 8, 10 | 칩·태그 간격, 작은 패딩 |
| 12, 14, 16 | 카드 내부 패딩, 주요 섹션 간격 |
| 18, 20 | 페이지 좌우 패딩(기본 20), 섹션 상단 마진 |
| 24, 28 | 큰 섹션 구분 |
| 32, 40 | 히어로 상단/하단, 성공 화면 중앙 여백 |

**페이지 좌우 패딩 규칙**: 모든 스크롤 콘텐츠의 좌우 여백은 **20px 고정**. 단, 카드 내부 컨텐츠는 카드 패딩에 따름.

### 5.3 Grid Patterns

| 화면 | Grid | 간격 |
|------|------|------|
| 홈 Quick Actions | `repeat(4, 1fr)` | gap 10 |
| 상담사 상세 타임 슬롯 | `repeat(4, 1fr)` | gap 6 |
| 예약 확인 정보 (날짜/시간/방식/소요) | `repeat(2, 1fr)` | gap 12 |
| 캐시 패키지 | `repeat(2, 1fr)` | gap 10 |
| 사주 팔자 | `repeat(4, 1fr)` | gap 8 |
| 분쟁 카테고리 | `repeat(2, 1fr)` | gap 8 |

### 5.4 Horizontal Scroll Patterns

- 날짜 스트립 (7일): 고정 52px width 아이템
- LIVE 상담사 캐러셀: 고정 160px width 아이템
- 카테고리 칩: 고정 없음, content-hugging
- 스크롤바 항상 숨김 (`scrollbar-width: none`, `::-webkit-scrollbar { display: none }`)

### 5.5 Sticky CTA Footer

하단 고정 CTA는 **길이 긴 폼 화면**의 핵심 패턴입니다.

```
position: absolute; bottom: 0; left: 0; right: 0
padding: 14px 20px 34px (하단 34px = home indicator)
background:
  linear-gradient(180deg, rgba(245,235,221,0), hanji 30%)
  또는 solid hanji + border-top borderSoft
display: flex; gap: 12; align-items: center
```

CTA 버튼 자체는 `height: 52–54px`, `border-radius: 12px`.
좌측에 가격·요약 정보를 세로로 배치(예: "60분 / 60,000")하는 2열 레이아웃 허용.

### 5.6 Tab Root Scroll Rules

탭 루트 화면(홈·상담사·예약·지갑·더보기)은 공통 규칙:
- `paddingBottom: 90px` (탭바 80 + 여유 10)
- 탭 스위치 시 `scrollTop: 0` 자동 리셋
- `localStorage`에 스크린 + 탭 상태 저장 (새로고침 복원)

### 5.7 Empty States

```
padding: 60px
text-align: center
icon: 48px, opacity 0.3 (🪷 또는 중립 아이콘)
message: 13px Pretendard, ink3
```

**문구 원칙**: "아직" 이라는 표현보다 "조용한 시간을" 같은 감성 문구를 우선.

---

## 6. Depth & Elevation

한지 기반 디자인에서는 **그림자가 강하면 안 됩니다**. 종이 위에 물건이 얹힌 느낌 — 그림자는 거의 없고, 테두리로 깊이를 암시합니다.

### 6.1 Elevation Table

| Level | 이름 | 처리 | 용도 |
|-------|------|------|------|
| 0 | Flat | no border, no shadow | 페이지 배경, 텍스트 블록 |
| 1 | Card | `1px solid borderSoft` | 일반 카드 (가장 흔함) |
| 2 | Selected / Focus | `1.5px solid ink`, 배경 반전 허용 | 선택된 패키지, 활성 칩 |
| 3 | Hero Glow | `0 8px 24px rgba(201,162,39,0.4)` | 로그인 브랜드 원, gold CTA 선택적 |
| 4 | Modal Overlay | `rgba(20,20,20,0.92)` + `backdrop-filter: blur(20px)` + `1px rgba(255,255,255,0.1)` | 상담실 채팅 패널 |
| 5 | Video Ambient | radial-gradient 배경(자체 광원) | 상담실 비디오 영역 |

### 6.2 Shadow 사용 금지 영역

- 한지 바탕의 일반 카드 (그림자 없음)
- 리스트 아이템 사이
- 탭바 (0.5px border-top만, 그림자 금지)
- Input 필드 (never)

### 6.3 Shadow 사용 허용 영역

- **다크 버튼**: `box-shadow: 0 4px 16px rgba(139,0,0,0.4)` (상담실 종료 버튼)
- **브랜드 글로우**: 금색 원·CTA gold
- **토스트**: 0 8px 24px rgba(0,0,0,0.5)
- **Phone Frame (프로토타입 전용)**: 0 40px 80px rgba(0,0,0,0.6) — 실 앱에서는 제거

### 6.4 Backdrop Filter

`backdrop-filter: blur(10–20px)`은 다음에서만 사용:
- 상담실 탑바 (영상 위 반투명 오버레이)
- 채팅 패널 (영상 위 덮임)
- 그 외 카드/탭바에 절대 적용 금지

---

## 7. Do's and Don'ts

### ✅ Do

1. **`ink(#111)` 기본, `#000` 절대 금지.** 한지와의 대비에서 미세한 따뜻함이 "인쇄된 먹"의 느낌을 만듭니다.
2. **숫자는 `Noto Serif` + `tabular-nums`**. 가격·타이머·별점·잔액 전부.
3. **`gold`는 악센트로만**. 큰 표면(배경·히어로 전체)에는 절대 사용하지 않습니다. 선택적 CTA 1회, 숫자 강조 1회, 브랜드 심볼 1회까지.
4. **카드는 `white` + 1px `borderSoft`**. 그림자 대신 경계선으로 깊이를 표현.
5. **`word-break: keep-all`**를 모든 한국어 텍스트에 기본 적용.
6. **성공 상태에는 🪷 연꽃**. 작은 의례적 축하. 다른 이모지는 UI에서 배제.
7. **대기실·상담실만 다크**. 나머지 15개 화면은 라이트 일관.
8. **"60분·24h·1,000캐시" 계약 숫자를 본문 안에도 굵게 유지**. 사용자 신뢰 자산.
9. **탭바는 탭 루트에서만 노출**. 상세 스택 진입 시 숨김.
10. **서브 파라미터 CTA는 활성/비활성을 변경하지 말고 라벨을 변경**. 예: "시간을 선택해주세요" → "오늘 20:00 예약". 사용자가 이유를 텍스트로 이해하게.
11. **네트워크 상태·네트워크 전송 상태 배지**는 항상 상단 우측에 배치 (대기실 "네트워크 우수").
12. **비디오 화면은 flex column**으로 구성. `position: absolute`로 영상 레이아웃 강제하지 않기 (프로토타입 버그 학습).

### ❌ Don't

1. **순수 블랙(`#000`) 사용 금지**. 반드시 `ink(#111)`.
2. **파스텔 배경 카드 금지**. 한지 위에 또 다른 톤의 "페이지"를 만들지 마세요.
3. **카드에 `box-shadow` 금지** (버튼·토스트 제외).
4. **기울어진 각도·비대칭 라운드 금지**. 라운드는 항상 수평·수직 균등.
5. **UI 리스트에 이모지 아이콘 금지** (홈 Quick Actions는 예외적 4개만 — 🔮📅🪷💬).
6. **에러 상태 전체 빨간 배경 금지**. `warning(#B87333)`·`darkRed(#8B0000)`의 8% 틴트만 허용.
7. **애니메이션 과용 금지**. `mcbreathe`·`mcfade`·`mcspin` 외에 커스텀 keyframe 추가는 제안하지 마세요.
8. **"지금 가능" 상태를 단순 텍스트로 표기 금지**. 반드시 `<Dot pulse/>` + 녹색 + "LIVE" 라벨 세트.
9. **`ink` 텍스트 위에 `darkRed` 배치 금지**. 색약 시 가독성 하락. 반드시 `hanji`/`white`.
10. **폰트 weight 300·100 사용 금지**. 최소 400, 일반 500, 강조 600–700.
11. **카드 border-radius `< 10px` 금지** (작은 칩·버튼 제외).
12. **카카오·네이버 로고 단독 배치 금지**. 반드시 "카카오로 시작하기" 같이 **한국어 CTA 텍스트와 병기**.

---

## 8. Responsive Behavior (Mobile-First)

### 8.1 Breakpoints

Flutter 앱은 폰 전용이지만, 실제 기기 다양성을 고려한 3단계 대응:

| Name | Width (dp) | 주요 변경 |
|------|-----------|----------|
| Compact | 320–374 | iPhone SE. 좌우 패딩 16, Quick Actions 3-col 허용 |
| Standard | 375–414 | iPhone 12–14. 기본값. 좌우 20 |
| Comfort | 415–440 | iPhone 15 Plus, 대부분 Android. 좌우 24 |

**440dp 초과 (태블릿·폴더블)**: `max-width: 440px` 강제, 좌우 `auto` 마진. 데스크탑 대응은 별도 `풀 플로우.html`에 위임.

### 8.2 Safe Area

- **Top**: `MediaQuery.padding.top` — iOS 노치·다이내믹 아일랜드 대응. StatusBar 54px는 이 값 + α로 계산.
- **Bottom**: `MediaQuery.padding.bottom` — iOS 홈 인디케이터 34dp. TabBar의 `paddingBottom: 20`은 기본값, 실제 기기값과 합산.
- **Keyboard**: 입력 필드 포커스 시 `resizeToAvoidBottomInset: true` + 스크롤 자동 포커스 유지.

### 8.3 Orientation

- **Portrait 강제**: 로그인·홈·상담사·예약·충전·지갑·더보기 (15 화면)
- **Portrait + Landscape 허용**: 상담실 (화상 몰입 확장 허용)
- **Portrait lock**: Flutter `SystemChrome.setPreferredOrientations`로 제어

### 8.4 Dynamic Type / 글자 크기 스케일

- iOS 설정 "글자 크기" (Dynamic Type) 허용 배율: 0.85–1.3
- Pretendard은 `textScaleFactor`에 자연스럽게 대응
- Noto Serif 숫자(카운트다운 등)는 스케일 상한 1.15로 고정 (40px 이상 확대 시 레이아웃 깨짐 방지)

### 8.5 Touch Target

- **최소 44x44 dp** (iOS HIG) — 아이콘 버튼, 탭바 아이템, 백 버튼
- **48x48 dp 권장** — 주 CTA, 슬롯 선택, 패키지 카드
- **72x72 dp** — 로그인 소셜 버튼 (실수 방지)

### 8.6 접근성 & 다크/다이내믹

- **VoiceOver/TalkBack 레이블**: 모든 버튼에 `Semantics(label: '...')` 지정. 특히 아바타·별점은 텍스트 대체 필수.
- **명도 대비**: `gold(#C9A227)` on `hanji(#F5EBDD)` = 3.8:1 — **큰 텍스트·아이콘에만 허용** (본문 금지). 본문 gold는 `ink` 배경 위에서만.
- **시스템 다크 모드 대응**: 현 버전은 라이트-only. 향후 다크 모드 추가 시 `ink` 배경 + `hanji` 텍스트로 완전 반전 (대기실 테마가 참조 모델).
- **애니메이션 민감도**: 사용자가 "Reduce Motion" 켰을 때 `mcbreathe`·`mcfade` 비활성화. Flutter `MediaQuery.disableAnimations` 확인.

---

## 9. Agent Prompt Guide

### 9.1 Quick Color Reference (복사용)

```
// Canvas
Hanji:       #F5EBDD   (페이지 배경)
HanjiDeep:   #EDE0CC   (그라디언트 끝, 태그 배경)
White:       #FFFFFF   (카드 표면)
Ink:         #111111   (다크 캔버스, 본문)

// Brand
Gold:        #C9A227   (가격·CTA gold·브랜드)
GoldSoft:    #D9B74A   (그라디언트 하이라이트)
GoldBg:      #F5E8B8   (금색 필 배경)

// Text
Ink:         #111111   (본문 1차)
Ink2:        #333333   (본문 2차)
Ink3:        #666666   (메타)
Ink4:        #999999   (비활성)

// Functional
Success:     #2D5016   (온라인, 입금)
Warning:     #B87333   (주의 박스)
DarkRed:     #8B0000   (종료·신고)
Lotus:       #C36B85   (프로필 그라디언트)

// Border
Border:      #D4C4B0   (기본)
BorderSoft:  #E8DDC9   (카드)

// Font
Serif:       'Noto Serif KR', serif
Sans:        'Pretendard Variable', 'Noto Sans KR', system-ui, sans-serif
```

### 9.2 Example Component Prompts

**상담사 리스트 카드**
> "상담사 카드: 흰색 배경, 14px 라운드, borderSoft(#E8DDC9) 1px 테두리, 14px 패딩. 좌측에 58px 원형 아바타 — 배경은 `linear-gradient(135deg, #111, #2a2a2a)`, 중앙에 이니셜을 Noto Serif 700 24px 금색(#C9A227)으로. 아바타 우하단에 7x7 녹색(#2D5016) 점 + 2px hanji 테두리(온라인 시). 우측 콘텐츠: 이름 Noto Serif 15/700, 부제 '{style} · {years}년차' Pretendard 11/400 #666666, 별점 5개 ★ + 수치 + 리뷰 수, 태그 칩 3개(hanjiDeep 배경 pill, 10px). 카드 우측 끝에 세로 컬럼: 'nextSlot' 10px #666666, 가격 Noto Serif 16/700 gold, '/60분' 9px #999999."

**대기실 카운트다운**
> "대기실 카운트다운 카드: 상담실 전체는 ink(#111) 배경 + hanji 텍스트. 카운트다운 컨테이너는 `rgba(255,255,255,0.06)` 배경 + 14px 라운드 + 16px 패딩, 중앙 정렬. 상단 11px '입장까지' 라벨(opacity 0.6). 메인 숫자: Noto Serif 40px/700/gold, `tabular-nums`, `00:08` 포맷. 하단 프로필 행: 36px 아바타 + 이름 12/600 + '20:00 시작 · 화상' 메타 10px opacity 0.6. 카운트다운이 0이 되면 문구 '지금'으로 변경하고 하단 버튼을 gold 활성화."

**사주팔자 카드**
> "사주팔자 카드: ink(#111) 배경 + hanji 텍스트. 16px 라운드 + 20px 패딩. 상단 센터 '四柱八字' 11px letter-spacing 2 opacity 0.7 goldSoft 색. 하단 4-컬럼 그리드 `repeat(4, 1fr) gap 8`. 각 pillar 아이템: `rgba(201,162,39,0.08)` 배경 + `1px rgba(201,162,39,0.15)` 테두리 + 8px 라운드 + 12px 패딩. 내부 세로 정렬: 한자 기둥명(年月日時) Noto Serif 10 goldSoft, 메인 천간 Noto Serif 22/700 gold, 지지 Noto Serif 18/500 hanji."

**운세 카드 플립**
> "운세 카드 3장: 각 100x150 크기, 3D flip 애니메이션. 앞면(덮인): `linear-gradient(135deg, ink, #2a2a2a)` + 2px gold 테두리 + 10px 라운드 + 중앙에 40x40 원(`radial-gradient(circle, gold, darkRed)` opacity 0.7). 뒷면(뒤집힌): white 배경 + 2px gold 테두리 + 10px 라운드 + 중앙에 Noto Serif 28/700 darkRed '동(東)' + 아래 10px #666 '오늘의 흐름'. 카드 컨테이너 `perspective: 1000`, 플립 시 `transform: rotateY(180deg)` 0.8s transition. 3장 모두 뒤집히면 0.5초 mcfade 인트로로 해석 패널 등장."

**지갑 히어로**
> "지갑 히어로 카드: ink 배경 + hanji 텍스트 + 16px 라운드 + 20px 패딩 + `position: relative; overflow: hidden`. 우상단에 180x180 만다라 SVG(동심원 3개, stroke gold 0.5, fill none) `absolute right -40 top -40 opacity 0.15`로 배치. 상단 11px letter-spacing 1 opacity 0.7 '보유 캐시'. 메인 금액: Noto Serif 34/700 gold `tabular-nums` '45,000' + 뒤에 14/500 hanji '캐시'. 하단 2개 버튼 row (gap 8): '충전'은 gold bg + ink 텍스트, '환불 요청'은 `rgba(255,255,255,0.12)` bg + hanji 텍스트."

### 9.3 Iteration Guide

1. **캔버스는 `hanji`부터**. `white`로 시작하지 마세요 — 한지 톤의 따뜻함이 디자인 전체의 기반입니다.
2. **카드는 흰색 + 얇은 테두리**. 그림자 금지.
3. **숫자는 `Noto Serif` 700 + `tabular-nums`**. 예외 없음.
4. **CTA 색상 규칙**:
   - 일반 확정 → `primary`(ink)
   - 리워드·충전·브랜드 → `gold`
   - 되돌릴 수 없는 종료 → `danger`(darkRed)
   - 보조·취소 → `outline`·`ghost`
5. **한글 텍스트는 반드시** `word-break: keep-all` + LH 1.5 이상.
6. **연꽃 🪷**은 성공·감사·완료에만. 다른 맥락에서 쓰면 의미가 희석됩니다.
7. **다크 테마는 대기실·상담실만**. 다른 곳에서 "좀 더 몰입감을 위해" 다크를 제안하지 마세요.
8. **요소가 선택되었는지 여부는 배경 반전(ink↔hanji)으로** 표시합니다. 보더 색만 바꾸는 약한 표시 금지.
9. **탭바는 항상 5개 고정 순서**: 홈·상담사·예약·지갑·더보기. 순서 변경·추가 금지.
10. **에러·경고는 색상 대신 아이콘 + 문장으로** 설명합니다. 사용자가 색상만 보고 의미를 유추할 수 없게.

### 9.4 State Persistence Rules

- `window.mWallet` (number): 사용자 캐시 잔액
- `window.mBookings` (array): 예약 기록 스택
- `window.mActive` (object): 현재 활성 세션 (대기실·상담실 공유)
- `window.mPending` (object): 예약 확인 단계 임시 데이터
- `localStorage.zeom_m_screen`: 마지막 스크린 (새로고침 복원)
- `localStorage.zeom_m_tab`: 마지막 탭

Flutter 이식 시: `Provider`·`Riverpod`로 각각 `WalletProvider`·`BookingsProvider`·`ActiveSessionProvider`로 분리하고, `SharedPreferences`로 마지막 라우트 저장.

---

**끝.** 이 문서는 17개 모바일 화면의 모든 시각적 결정의 기준입니다. 신규 컴포넌트 추가·변경 시 반드시 이 문서를 먼저 업데이트하고, 변경사항은 `app_flutter/lib/shared/theme.dart`와 `web/src/app/globals.css`에 동시 반영해야 합니다.
