# 모바일 디자인 개선 & 개발 계획 — 17 Screen Pixel-Perfect Rewrite

> **작성자 관점**: UX/UI & Product Design Specialist
> **참조 문서**: `MOBILE_DESIGN.md` (디자인 시스템) + `/tmp/zeom-design/zeom/project/` (Claude Design 번들)
> **대상**: `app_flutter/lib/features/**` 전 17개 화면
> **전략**: 기존 비즈니스 로직·Provider·API 연동은 보존, **View 레이어(Widget Tree)를 프로토타입 스펙에 맞춰 픽셀 퍼펙트 재작성**
> **최종 결과물**: 프로토타입 `천지연꽃신당 모바일 인터랙티브.html`과 시각·상호작용이 **100% 일치하는 Flutter 앱**

---

## 목차

1. [전체 원칙 및 접근 전략](#1-전체-원칙-및-접근-전략)
2. [사전 준비 (공통 기반 작업)](#2-사전-준비-공통-기반-작업)
3. [화면별 개선 방향 & 구현 스펙 (전 17화면)](#3-화면별-개선-방향--구현-스펙)
4. [Phase별 개발 로드맵](#4-phase별-개발-로드맵)
5. [기술 스택 매핑 (JSX → Flutter)](#5-기술-스택-매핑-jsx--flutter)
6. [품질 보증 전략](#6-품질-보증-전략)
7. [위험 관리 및 대응](#7-위험-관리-및-대응)
8. [완성 정의 (Definition of Done)](#8-완성-정의-definition-of-done)
9. [향후 확장 (Post-Launch)](#9-향후-확장-post-launch)

---

## 1. 전체 원칙 및 접근 전략

### 1.1 제품 철학 기반 UX 원칙

천지연꽃신당은 "**불안한 사용자가 신뢰를 결정하는 순간**"을 다루는 제품입니다. 상담이라는 감정 노동 서비스에서 UX/UI는 다음 세 층위를 동시에 만족해야 합니다.

1. **기능적 신뢰 (Functional Trust)**
   예약·결제·세션 입장 플로우가 **3탭 이내** 완료되어야 하며, 모든 단계에서 "언제·얼마·몇 분·몇 % 환불" 같은 **계약적 숫자가 항상 가시적**이어야 합니다. 숨은 조건은 용서받지 못합니다.

2. **감정적 신뢰 (Emotional Trust)**
   사용자는 "상담이 어떻게 진행되는지" 이미지화할 수 있어야 안심합니다. 대기실에서 카운트다운, 상담실에서 진행바, 종료 후 완료 화면 — 각 단계의 **시각적 랜드마크**가 감정적 여정을 안내합니다.

3. **문화적 신뢰 (Cultural Trust)**
   한국 전통 무속 맥락을 **적절한 격식**으로 다뤄야 합니다. 이모지·팝컬러·만화적 일러스트는 오히려 경박해 보일 수 있고, 반대로 너무 미니멀한 글로벌 SaaS 톤은 "진짜 신점가"의 권위감을 떨어뜨립니다. 이 균형이 `MOBILE_DESIGN.md`의 한지/먹/금 팔레트의 존재 이유입니다.

### 1.2 개발 접근 전략

**왜 재작성(Rewrite)인가?**
- 기존 Flutter 화면과 프로토타입은 **비주얼 완성도 차이**가 명확합니다. 부분 패치로는 만다라 SVG·카드 플립·오행 차트·사주 팔자 같은 **프로토타입 시그니처 디테일**에 도달하기 어렵습니다.
- 팔레트 토큰은 이미 `AppColors`에 1:1 정렬되어 있으므로 **백엔드 연동부 파괴 없이 View 교체만으로 가능**합니다.
- Riverpod/Provider 기반 상태 관리는 대부분 이미 도입되어 있어, 위젯 교체가 컨트롤러·모델을 건드리지 않습니다.

**보존 항목 (절대 건드리지 않음)**
- 백엔드 API 클라이언트 (`services/api_client.dart` 등)
- 인증·결제·Sendbird 연동 (`auth_provider.dart`, `services/`)
- 라우팅 기본 골격 (`main.dart`의 GoRouter/MaterialApp — 필요한 경우 라우트 이름만 보강)
- Flyway·JPA 백엔드 (100% 무관)

**변경 항목**
- 각 feature의 `*_screen.dart` View 위젯 트리
- `shared/widgets/` 하위 공통 위젯 (Avatar, TabBar, Button, Card 등) — 신규 또는 교체
- `shared/theme.dart` — 누락된 토큰 보강 (HanjiDeep, GoldSoft, BorderSoft 등)
- 폰트 로딩 (`pubspec.yaml`) — Noto Serif KR + Pretendard

### 1.3 UX/UI 최우선 불가침 조건

프로토타입에서 가져와야 할 **절대 보존 요소 13가지** (이 중 하나라도 빠지면 재작업):

| # | 요소 | 위치 |
|---|------|------|
| 1 | 한지(#F5EBDD) 바탕 | 전 15개 라이트 화면 |
| 2 | 다크 반전 (대기실·상담실) | 2개 다크 화면 |
| 3 | Noto Serif 브랜드 타이틀 | 홈·로그인·페이지 제목 |
| 4 | `tabular-nums` 숫자 | 가격·타이머·잔액 |
| 5 | 만다라 SVG 장식 | 로그인·홈 지갑·지갑 탭 히어로 |
| 6 | 60분 일관 표기 | 리스트·상세·예약·완료 전부 |
| 7 | "환불 정책" 명시 박스 | 상세 정책 탭·예약 확인·환불 요청 |
| 8 | 대기실 10초 카운트다운 | 대기실 |
| 9 | 상담실 3색 타이머 (정상·임박·긴급) | 상담실 |
| 10 | 카드 플립 3D 애니메이션 | 운세 |
| 11 | 사주팔자 4기둥 그리드 + 오행 막대 | 사주 |
| 12 | 후기 작성 +1,000캐시 리워드 | 후기·완료 |
| 13 | `hasReview` 상태 표시 | 예약 완료 탭 |

---

## 2. 사전 준비 (공통 기반 작업)

모든 화면 재작업에 선행해야 하는 **기반 작업 7가지**. 이 단계 없이는 화면별 작업이 일관될 수 없습니다.

### 2.1 [P0] Theme 토큰 보강

`app_flutter/lib/shared/theme.dart`의 `AppColors`에 누락 토큰 추가:

```dart
class AppColors {
  // 기존 유지
  static const Color inkBlack = Color(0xFF111111);
  static const Color hanji = Color(0xFFF5EBDD);
  static const Color gold = Color(0xFFC9A227);
  static const Color darkRed = Color(0xFF8B0000);
  static const Color lotusPink = Color(0xFFC36B85);

  // 신규 추가 (프로토타입 MC2 완전 매핑)
  static const Color hanjiDeep = Color(0xFFEDE0CC);
  static const Color hanjiCard = Color(0xFFFBF3E4);
  static const Color ink2 = Color(0xFF333333);
  static const Color ink3 = Color(0xFF666666);
  static const Color ink4 = Color(0xFF999999);
  static const Color goldSoft = Color(0xFFD9B74A);
  static const Color goldBg = Color(0xFFF5E8B8);
  static const Color jadeSuccess = Color(0xFF2D5016);
  static const Color warning = Color(0xFFB87333);
  static const Color borderSoft = Color(0xFFE8DDC9);
}
```

**검증**: `verify-frontend-ui` 스킬로 팔레트 일관성 확인.

### 2.2 [P0] 폰트 셋업

`pubspec.yaml`에 `google_fonts` 유지, 로컬 Pretendard Variable 폰트 번들 옵션 평가:

```yaml
dependencies:
  google_fonts: ^6.1.0  # 기존 유지

flutter:
  fonts:
    - family: Pretendard
      fonts:
        - asset: assets/fonts/PretendardVariable.ttf
```

**선택 이유**: Pretendard Variable은 한국어 렌더링이 Noto Sans보다 자간 최적화가 뛰어남. 초기 다운로드 비용 vs 로컬 번들 트레이드오프를 평가하여 **로컬 번들 권장**.

### 2.3 [P0] 공통 primitive 위젯 생성

`app_flutter/lib/shared/widgets/` 하위에 프로토타입 primitive 대응:

| 신규 파일 | 프로토타입 원본 | Flutter 위젯 |
|-----------|----------------|-------------|
| `zeom_avatar.dart` | `Av` | `ZeomAvatar({counselor, size, online})` |
| `zeom_star_rating.dart` | `St` | `ZeomStarRating({value, size})` |
| `zeom_presence_dot.dart` | `Dot` | `ZeomPresenceDot({color, pulse})` |
| `zeom_chip.dart` | `Chip` | `ZeomChip({label, active, onTap})` |
| `zeom_button.dart` | `Btn` | `ZeomButton({variant, size, onPressed, label})` |
| `zeom_status_bar.dart` | `StatusBar` | `ZeomStatusBar({dark})` — `SystemChrome` 래퍼 |
| `zeom_app_bar.dart` | `AppBar` | `ZeomAppBar({title, dark, elevate, actions})` |
| `zeom_tab_bar.dart` | `TabBar` | `ZeomBottomTabBar({activeTab, onTabChange})` |
| `zeom_lotus_mandala.dart` | 인라인 SVG | `ZeomLotusMandala({size, color, opacity, variant})` |
| `zeom_hero_card.dart` | Hero Inverse | `ZeomHeroCard({child, showMandala, mandalaPosition})` |
| `zeom_countdown.dart` | Timer | `ZeomCountdown({remainingSeconds, totalSeconds, urgentAt, nearAt})` |

**구현 노트**:
- `ZeomLotusMandala`는 `CustomPaint`로 구현. SVG import 아닌 네이티브 그리기 (성능·정합성).
- `ZeomCountdown`은 Stream/Timer.periodic 기반 + 색상 자동 전환 로직 내장.
- 모든 위젯은 `const` 생성자 가능한 한 최대화.

### 2.4 [P1] Navigation 구조 정리

프로토타입의 탭+스택 이중 네비게이션을 Flutter에서 재현:

```
MaterialApp
└─ HomeShell (bottom tab bar 5개)
   ├─ Tab 홈     → HomeScreen
   ├─ Tab 상담사 → CounselorsScreen
   ├─ Tab 예약   → BookingsScreen
   ├─ Tab 지갑   → WalletScreen
   └─ Tab 더보기 → MoreScreen

각 탭 내부: 독립 Navigator 스택
- 상세 push: CounselorDetailScreen, BookingConfirmScreen, CashChargeScreen, WaitingRoomScreen, ConsultationRoomScreen, CompleteScreen, ReviewScreen, FortuneScreen, SajuScreen, RefundScreen, DisputeScreen
- 스택 깊이 > 1일 때 TabBar 자동 숨김 (or 유지 옵션 논의)
```

**라이브러리 선택**: `go_router` 권장 (shell routes 지원). `Navigator 2.0` 직접 사용도 가능하나 관리 비용 높음.

### 2.5 [P1] 상태 관리 컨벤션

프로토타입의 `window.m*` 전역 상태를 Riverpod로 분리:

```dart
// providers/wallet_provider.dart
final walletProvider = StateNotifierProvider<WalletNotifier, int>((ref) => ...);

// providers/bookings_provider.dart
final bookingsProvider = StateNotifierProvider<BookingsNotifier, List<Booking>>((ref) => ...);

// providers/active_session_provider.dart
final activeSessionProvider = StateNotifierProvider<ActiveSessionNotifier, Session?>((ref) => ...);

// providers/pending_booking_provider.dart
final pendingBookingProvider = StateProvider<PendingBooking?>((ref) => null);
```

**기존 `auth_provider.dart` 형식이 Provider 기반이면 Provider 유지**. 혼재 금지.

### 2.6 [P1] 애니메이션 공통화

프로토타입 CSS keyframe → Flutter:

```dart
// shared/animations/zeom_animations.dart
class ZeomAnimations {
  // mcbreathe
  static const breatheDuration = Duration(milliseconds: 1800);
  static Animation<double> breathe(AnimationController c) =>
      Tween(begin: 1.0, end: 1.08).animate(CurvedAnimation(parent: c, curve: Curves.easeInOut));

  // mcspin
  static const spinDuration = Duration(milliseconds: 800);

  // mcfade
  static const fadeDuration = Duration(milliseconds: 250);
  static Animation<Offset> fadeUpSlide(AnimationController c) =>
      Tween(begin: const Offset(0, 0.04), end: Offset.zero).animate(c);
}
```

**Reduce Motion 대응**: `MediaQuery.of(context).disableAnimations`가 true면 애니메이션 컨트롤러 duration을 0으로.

### 2.7 [P2] 프로토타입 스크린샷 레퍼런스 저장

`/tmp/zeom-design/zeom/project/screenshots/` 디렉토리를 `app_flutter/design_refs/`에 복사. 각 화면 PR에 "프로토타입 vs Flutter 스크린샷 비교 이미지" 첨부 의무화.

---

## 3. 화면별 개선 방향 & 구현 스펙

각 화면은 다음 템플릿으로 문서화:

> **목표** / **As-Is (현 Flutter)** / **To-Be (프로토타입 스펙)** / **Widget Tree** / **주요 인터랙션** / **데이터 바인딩** / **엣지 케이스** / **접근성** / **UX Specialist Notes**

---

### 3.1 S01 — 로그인 (`SLogin`)

**목표**: 사용자의 첫 접촉점. **3초 안에 "어떤 앱인지" 전달**되어야 하며, 동시에 "이게 안전한 상담 앱"임을 시각·텍스트로 증명.

**As-Is (예상)**: `features/auth/login_screen.dart` — 기본 Material 로그인 버튼 나열.

**To-Be**:
- 배경: `linear-gradient(180deg, hanji, hanjiDeep)` (아주 미세한 그라디언트, 거의 플랫)
- **로터스 만다라 SVG** 중앙 상단 60px 위치, opacity 0.08 (워터마크)
- 브랜드 원 (72×72 금색 radial gradient + gold 글로우 shadow `0 8px 24px rgba(201,162,39,0.4)`)
- 타이틀 "천지연꽃신당" Noto Serif 30/700, letter-spacing -0.5
- 서브카피 "마음이 복잡한 밤,\n조용히 이야기 나눌 한 분을 찾으세요." Pretendard 14, LH 1.6, `ink3` 색
- 소셜 로그인 3개 (카카오 #FEE500 / 네이버 #03C75A / Apple `ink`) 52px 높이 10px 라운드
- "또는" 구분선 (양쪽 1px border)
- "휴대폰 번호로 시작" outline 버튼 (48px, 1.5px ink border)
- 법적 고지 11px `ink3` 중앙

**Widget Tree** (간략)
```
Scaffold(backgroundColor: hanji)
└─ SafeArea
   └─ Stack
      ├─ Positioned(top: 60) → ZeomLotusMandala(variant: full, opacity: 0.08)
      └─ Column
         ├─ ZeomStatusBar()
         ├─ SizedBox(height: 100)
         ├─ BrandOrb(size: 72, glow: true)
         ├─ BrandTitle()
         ├─ SubCopy()
         ├─ SizedBox(height: 40)
         ├─ SocialButton(provider: 'kakao')
         ├─ SocialButton(provider: 'naver')
         ├─ SocialButton(provider: 'apple')
         ├─ OrDivider()
         ├─ PhoneLoginButton()
         └─ LegalFooter()
```

**주요 인터랙션**:
- 버튼 탭 시 해당 provider 로딩 상태(`mcspin` 아이콘) 표시
- 900ms 지연 후 홈 네비게이션 (실제 OAuth는 `auth_provider`에 위임)
- 로딩 중 다른 버튼 disabled (opacity 0.4)

**데이터 바인딩**: `authProvider.signInWithKakao() / signInWithNaver() / signInWithApple()`. 성공 시 `homeRoute`로 `pushReplacement`.

**엣지 케이스**:
- 이미 로그인된 상태 → 자동 홈 이동 (스플래시 처리)
- OAuth 취소 → 로딩 해제, 토스트 "취소되었습니다"
- 네트워크 오류 → 토스트 "연결이 불안정합니다. 다시 시도해주세요"

**접근성**:
- 각 버튼 `Semantics(label: "카카오 계정으로 로그인")`
- 브랜드 원은 `excludeSemantics: true`
- `Noto Serif` 타이틀에 `semanticsLabel: "천지연꽃신당"` 명시 (한자 오독 방지)

**UX Specialist Notes**:
- 소셜 로그인 순서는 **한국 시장 점유율 기반 카카오 → 네이버 → Apple**. 이 순서는 A/B 테스트 없이 고정.
- "만 19세 이상" 고지는 법적 요구. 폰트 11px 이하로 내리지 말 것 (가독성 하한).
- 로그인 지연을 900ms로 두는 이유: 즉시 이동은 "페이크"처럼 느껴져 신뢰 하락. 의도된 의례적 대기.

---

### 3.2 S02 — 홈 (`SHome`)

**목표**: 사용자가 앱을 열자마자 **"지금 무엇을 할 수 있는지" 3초 안에 파악** 가능. 동시에 브랜드 무드 유지.

**As-Is**: `features/home/home_screen.dart`

**To-Be**:
- 헤더 영역 (좌측 브랜드 + 사용자 인사말 / 우측 알림 아이콘)
  - "천지연**꽃**신당" — 꽃자 gold 처리
  - 서브 "안녕하세요, {mUser.name}님"
  - 알림 아이콘 40×40 white 배경 + 우상단 7×7 darkRed 점 (미확인 시)
- **지갑 히어로 카드** (ink 그라디언트 + 만다라 SVG 우상단 오버레이)
  - "내 캐시" 11px uppercase letter-spacing 1 opacity 0.7
  - 금액 Noto Serif 30/700 gold + "캐시" 14/500 hanji
  - "충전"·"내역" 2개 버튼 row
- **Quick Actions 4-col 그리드** (aspect-ratio 1)
  - 🔮 오늘의 운세 → `/fortune`
  - 📅 바로 예약 → tab `counselors`
  - 🪷 사주 보기 → `/saju`
  - 💬 상담 내역 → tab `bookings`
- **오늘의 운세 프리뷰 카드**
  - "오늘의 운세" 배지 + 날짜
  - 시적 인용문 Noto Serif 17/600 LH 1.5
  - 4개 운세 별점 (총운/애정/금전/건강)
- **지금 상담 가능 캐러셀** (온라인 상담사 horizontal scroll)
  - 각 카드 160px fixed, 14px 라운드
  - LIVE dot + 이름 + 전문 + 별점 + K단위 가격
- **다가오는 예약 배너** (예약 있을 때만)
  - ink 배경 + 아바타 + 이름/시간 + "입장" gold 버튼

**Widget Tree**
```
TabRootShell
└─ SingleChildScrollView
   └─ Column
      ├─ HomeHeader()
      ├─ WalletHeroCard()
      ├─ QuickActionsGrid()
      ├─ FortunePreviewCard()
      ├─ SectionTitle("지금 상담 가능") + TextButton("전체 보기 ›")
      ├─ LiveCounselorsCarousel()
      └─ UpcomingBookingBanner()  // conditional
```

**주요 인터랙션**:
- 지갑 카드 "충전" → `push /cash`
- "내역" → tab 전환 `wallet` (root reset)
- Quick action 카드 탭 → 각각 라우팅
- LIVE 상담사 카드 탭 → `push /counselors/detail?id={id}`
- "다가오는 예약" 배너 "입장" → `ActiveSessionProvider.set(booking)` + `push /waiting`

**데이터 바인딩**:
- `walletProvider` watch → 잔액 실시간
- `bookingsProvider.upcoming` → 배너 조건
- `counselorsProvider.onlineNow` → 캐러셀 소스
- `fortuneProvider.today` → 운세 프리뷰

**엣지 케이스**:
- 온라인 상담사 0명 → 섹션 자체 숨김 (빈 상태 아닌 제거)
- 캐시 0원 → 잔액 Noto Serif 20/600 `ink4` + "지금 충전해보세요" 서브 카피
- 알림 0 → 빨간 점 제거

**접근성**:
- 지갑 히어로 `Semantics(label: "보유 캐시 45,000원, 충전 또는 내역")`
- LIVE 카드 "LIVE 상담 가능한 {이름}, {전문 분야}, 별점 {값}, 60분 {가격}원"

**UX Specialist Notes**:
- 홈 화면은 **"가장 자주 오는 탭"**입니다. 스크롤을 최소화해야 하므로 LIVE 캐러셀은 **가로 스크롤**로 밀도 높임.
- 운세 프리뷰는 **매일 바뀌는 이유**(날짜 표시)를 명시해야 사용자가 매일 열 유인이 생깁니다.
- "꽃" 단어만 gold 처리하는 것은 브랜드 네임의 핵심 심상(연꽃) 강조. 다른 글자에 악센트 적용 금지.

---

### 3.3 S03 — 상담사 목록 (`SList`)

**목표**: 사용자가 **자신의 고민에 맞는 상담사**를 3-5 스크롤 내에 발견.

**As-Is**: `features/counselor/counselor_list_screen.dart`

**To-Be**:
- 탭 루트 화면 (탭바 노출)
- 상단: "상담사 찾기" Noto Serif 22/700
- 검색 바 (돋보기 아이콘 + "이름, 분야로 검색" placeholder, 40px 높이, 12px 라운드, white bg)
- 카테고리 칩 row (horizontal scroll): 전체 / 연애·재회 / 금전 / 진로 / 가족 / 건강
- 필터 row: "지금 가능" 체크박스 + "추천순 ↓" 정렬
- 상담사 카드 리스트 (1-col, gap 10)
  - 58px 아바타 + 이름 + 온라인 dot
  - 스타일·경력 부제
  - 별점 + 숫자 + 리뷰 수
  - 태그 칩 3개
  - 우측: nextSlot + 가격 K단위 + "/60분"

**Widget Tree**
```
TabRootShell
└─ Column
   ├─ Header(Text)
   ├─ SearchBar()
   ├─ CategoryChipsRow() // horizontal scroll
   ├─ FilterRow(onlineOnly, sortBy)
   └─ Expanded(
        child: ListView.builder(
          itemBuilder: (ctx, i) => CounselorCard(data: counselors[i])
        )
      )
```

**주요 인터랙션**:
- 검색어 입력 시 debounce 300ms 후 `counselorsProvider.search(q)` 호출
- 카테고리 칩 단일 선택 (전체 → 리셋)
- "지금 가능" 토글 시 `onlineNow` 필터 추가
- 카드 탭 → push `/counselors/detail?id={id}`

**데이터 바인딩**: `counselorsProvider` — 무한 스크롤 (20개씩 페이지네이션). 스크롤 80% 도달 시 `fetchNext()`.

**엣지 케이스**:
- 검색 결과 0개 → "해당 조건의 상담사가 없어요" 엠프티
- 오프라인 → 캐시된 리스트 + 상단 "오프라인 상태" 배너

**접근성**:
- 카드 전체를 `InkWell` 탭 영역으로 — `Semantics` 레이블에 전체 정보 포함
- 별점은 "5점 만점에 4.9점, 1,284개 리뷰"로 읽어줌

**UX Specialist Notes**:
- 가격을 **K단위(60K)로 축약** 표시하는 이유: 리스트에서 세로 정렬 시 자리수가 일정해야 스캔이 쉽기 때문. 상세 페이지에서는 풀 단위(60,000원)로 회복.
- "지금 가능" 체크박스는 디폴트 OFF. 사용자가 **"언젠가는 상담하고 싶다"** 단계일 때 전체 목록이 더 도움이 됨.
- `nextSlot` 필드가 "오늘 20:00", "내일 14:00", "지금 가능" 3가지로만 표현되는 것은 **인지 부담 최소화** 설계. 정확한 분 단위 대신 범주화.

---

### 3.4 S04 — 상담사 상세 (`SDetail`)

**목표**: 사용자 **결정 순간**의 화면. "이 사람에게 맡길 수 있을까?"를 30초 안에 판단시키고, 바로 예약으로 이어지게.

**As-Is**: `features/counselor/counselor_detail_screen.dart`

**To-Be**:
- AppBar (‹ 뒤로 + "상담사" + ♡ 찜)
- 프로필 영역 (84px 아바타 + 우측 텍스트)
  - "지금 가능" / "예약형" 배지
  - "{년차}년차" 금색 배지
  - 이름 Noto Serif 22/700
  - 스타일 부제 Pretendard 12/400 `ink3`
  - 별점 + 숫자 + 리뷰 수
- **Tab 구분 (소개 / 후기 / 안내)**
  - 선택 탭 bottom-border 2px ink
  - 소개: 바이오 + 4x2 정보 그리드 (전문/스타일/경력/응답)
  - 후기: 후기 카드 3+개 (사용자·별점·내용·태그)
  - 안내: 정책 리스트 (60분/입장/환불/재연결)
- **날짜 선택 스트립** (7일, horizontal scroll, 52px 고정)
  - 라벨 ("오늘"·"내일"·요일) + 숫자
  - 선택: ink 배경 + hanji 텍스트
- **시간 슬롯 그리드** (4-col, 13개 `10:00–22:00`)
  - 선택: gold 배경 + ink 텍스트 + 1px gold 테두리
  - 예약됨: hanjiDeep 배경 + `ink4` + line-through
- **상담 방식** (화상 🎥 / 음성 🎙 2-col)
- **스티키 하단 CTA**
  - 좌측: "60분" 메타 + 가격 Noto Serif gold
  - 우측: "{날짜} {시간} 예약" gold/ink 버튼
  - 미선택 시: ink4 배경 "시간을 선택해주세요"

**Widget Tree**
```
Scaffold
├─ body: CustomScrollView
│    ├─ ZeomAppBar(title: "상담사", actions: [HeartButton()])
│    ├─ ProfileHeader(counselor)
│    ├─ TabSelector(tabs: ['소개', '후기', '안내'])
│    ├─ TabContent(switch tab)
│    ├─ SectionTitle("날짜 선택")
│    ├─ DateStripScroll(7 days)
│    ├─ SectionTitle("시간 선택 · 1시간 단위")
│    ├─ TimeSlotsGrid()
│    ├─ SectionTitle("상담 방식")
│    └─ ChannelToggle()
└─ bottomSheet: StickyBookingCta()
```

**주요 인터랙션**:
- 날짜 변경 시 슬롯 선택 자동 리셋
- `booked` 슬롯 계산: 클라이언트 로컬 해시(실제 서비스는 API) — 일관된 가짜 예약 분포
- "예약" 버튼 탭 → `pendingBookingProvider.set({counselor, date, time, channel, price})` + push `/confirm`

**데이터 바인딩**:
- `counselorProvider(id)` → 상세 + 후기 + 정책
- `slotsProvider(counselorId, date)` → 예약된 시간

**엣지 케이스**:
- 모든 슬롯 예약됨 → "이 날 예약 가득 찼어요" 안내
- 네트워크 실패 → 슬롯만 skeleton, 프로필·후기는 캐시

**접근성**:
- 시간 슬롯 예약됨 상태 `Semantics(label: "${time} 예약됨", enabled: false)`
- 탭 전환 `Tab`·`TabBarView` 사용 시 swipe 지원

**UX Specialist Notes**:
- 탭을 **"소개 / 후기 / 안내"** 3개로 제한한 이유: 4개 이상이면 화면 폭에서 각 탭 터치 영역이 줄어듦. "자격/경력" 같은 추가 탭은 "소개"에 통합.
- 시간 슬롯이 `line-through`로 표시되는 이유: 단순 회색 비활성보다 **"있었는데 사라짐"의 서사성**이 강해 사용자가 "다음 슬롯을 기대"하게 됨.
- 화상/음성 선택은 **탭 선택이 아닌 2-col 버튼 토글**. 사용자가 신중히 선택하도록 시각 비중을 동등하게.
- CTA 버튼의 라벨이 **상태에 따라 변하는 것(미선택·선택·대기)**은 핵심 UX. 라벨을 "확인"으로 고정하고 disabled만 변경하면 "왜 눌리지 않는지" 사용자 불만이 발생.

---

### 3.5 S05 — 예약 확인 (`SConfirm`)

**목표**: **결제 직전 마지막 검증**. 모든 계약적 숫자를 한 눈에, 환불 조건 명시 동의 유도.

**As-Is**: `features/booking/booking_create_screen.dart` (※ 실제 파일명은 `create`)

**To-Be**:
- AppBar (‹ + "예약 확인")
- 요약 카드 (white + borderSoft)
  - 상단: 아바타 + 이름 + 전문 분야 (dashed border로 구분)
  - 하단: 2x2 그리드 (날짜·시간·방식·소요)
- 결제 카드
  - "결제" 타이틀
  - 상담료 (금액 +표기) / 캐시 차감 (금액 -표기)
  - "차감 후 잔액" Noto Serif gold 강조
  - **캐시 부족 시**: warning box (8% tint) + "충전" 링크 버튼
- 약관 동의 카드 (필수 체크박스 2개)
  - [필수] 환불 정책 동의 (24h 100% / 1h 50% / 이후 불가)
  - [필수] 상담 진행 및 개인정보 처리방침 동의
- 하단 CTA
  - 활성: "{금액} 예약 확정" ink
  - 잔액 부족: "캐시 부족"
  - 약관 미동의: "약관 동의가 필요합니다"
  - 로딩: "확정 중…" + spinner

**Widget Tree**
```
Scaffold(backgroundColor: hanji)
├─ AppBar
└─ SingleChildScrollView + Column
   ├─ SummaryCard(pending)
   ├─ PaymentCard(pending, wallet)
   │   └─ if (wallet < price) InsufficientCashBanner()
   ├─ AgreementsCard()
   └─ ConfirmCtaButton()
```

**주요 인터랙션**:
- 체크박스 둘 다 체크 AND 잔액 충분 → CTA 활성
- "충전" 탭 → push `/cash?returnTo=confirm` (충전 후 자동 복귀)
- CTA 탭 → 900ms 로딩 → `walletProvider.debit(price)` + `bookingsProvider.add(record)` + `activeSessionProvider.set(record)` + `mToast` 설정 → tab reset `bookings`

**데이터 바인딩**: `pendingBookingProvider` 읽기, `walletProvider` watch, 확정 시 두 provider 업데이트.

**엣지 케이스**:
- `pendingBookingProvider == null` (직접 진입) → "예약 정보 없음" + "홈" 버튼
- 결제 실패 (서버) → 토스트 "결제 실패, 다시 시도해주세요", CTA 활성 유지

**접근성**:
- 결제 카드 전체 `Semantics(container: true, label: "상담료 60,000 마이너스 캐시 차감, 차감 후 잔액 0")`
- 체크박스 레이블은 필수 여부 명확히 음독

**UX Specialist Notes**:
- "차감 후 잔액"을 Noto Serif + gold로 강조하는 것은 **결제 직전 최종 확인 심리**에 맞춰 **"이 금액 괜찮아요?"라는 질문을 무의식 중 던지도록** 설계.
- 약관을 2개로 분리한 이유: 법적 유효성. 한 개로 묶으면 환불 정책 부분이 "동의한 줄 모름"이 될 수 있음.
- 캐시 부족 warning을 **darkRed 아닌 warning(주황)**으로 처리: 빨강은 "막혔다", 주황은 "해결 가능". 사용자가 충전 액션을 심리적으로 자연스럽게 택하도록.

---

### 3.6 S06 — 캐시 충전 (`SCash`)

**목표**: 충전 경로를 **"가장 합리적인 선택"으로 유도**. 인기 패키지 prominence 강조.

**As-Is**: **중복 존재** — `features/credit/credit_buy_screen.dart` + `features/wallet/cash_buy_screen.dart`. 두 파일이 무엇을 구분하는지 우선 감사 후 **하나로 통합** 권장 (권장: `wallet/cash_buy_screen.dart` 유지, credit은 제거 또는 래퍼).

**To-Be**:
- AppBar (‹ + "캐시 충전")
- 상단 힌트 "패키지가 클수록 보너스가 많아요" Pretendard 12 `ink3`
- 패키지 2x2 그리드 (4개)
  - 선택: ink 배경 + hanji 텍스트 (강한 반전)
  - "인기" 배지 (우상단, gold 배경 ink 텍스트, 9px)
  - 라벨("60분 2회") + 캐시 Noto Serif 24 gold + "캐시" + 보너스 "+10K 보너스" + 가격 "₩100,000"
- 결제 수단 리스트 (4개)
  - 신용·체크카드 / 카카오페이 / 토스페이 / 계좌이체
  - 라디오 + 라벨 + 하위 설명(KG이니시스/간편결제)
  - 선택: ink border 1px
- 하단 CTA (sticky)
  - "₩{가격} 결제하기" ink 52px
  - 로딩: "결제 중…"
  - 성공: 화면 전체 전환 → 체크 아이콘 + "충전 완료" + "반영됨" + 1.2초 후 자동 복귀

**Widget Tree**
```
Scaffold
└─ state가 'success':
   └─ SuccessScreen(package)
   else:
   └─ Column
      ├─ AppBar
      ├─ HintText()
      ├─ PackageGrid(2x2)
      ├─ PaymentMethodList()
      └─ StickyPayButton()
```

**주요 인터랙션**:
- 패키지 탭 → `pick` 상태 업데이트
- 결제 수단 라디오 선택
- "결제하기" 탭 → 1.1초 지연 → `walletProvider.credit(package.cash)` → 1.2초 성공 화면 → `returnTo == 'confirm'` 이면 `pop` + push `/confirm`, 아니면 `pop`

**데이터 바인딩**: `walletProvider.credit(amount)`. 실제 결제는 `paymentProvider.charge(method, package)` 후 onSuccess에서 walletProvider 업데이트.

**엣지 케이스**:
- 결제 실패 → 토스트 + CTA 활성화
- 중복 탭 (debounce) → `state == 'paying'`이면 무시

**접근성**:
- 패키지 카드 `Semantics(label: "60분 5회, 300,000 캐시, 40,000 보너스 포함, 260,000원")`
- "인기" 배지는 텍스트가 아니므로 `tooltip` 제공

**UX Specialist Notes**:
- "인기" 배지는 **p3 (300,000 캐시)에만** 부여. 이는 **중간 앵커링** 전략 — 가장 큰 패키지(p4)가 비싸 보이도록 유도.
- `**+10K 보너스**`를 선택 시 `goldSoft` (밝은 금색)로, 비선택 시 `success` (녹색)로 변화시키는 색상 변화는 **"선택 후 축하"** 심리.
- 결제 성공 화면이 **전체 화면 전환**인 이유: 모달/토스트로 처리하면 "정말 됐나?" 불안감이 남음. 전체 화면이 의례적 마무리.
- 1.2초 자동 복귀는 의도적. 사용자가 "확인 버튼을 눌러야 하는 피로"에서 자유로워짐. 단, `returnTo`가 있을 때 자동 복귀. 일반 진입은 `pop`.

---

### 3.7 S07 — 예약 관리 (`SBookings`)

**목표**: 사용자의 **예약 상태 일람**. 예정 건은 입장 가능, 완료 건은 후기·환불 유도.

**As-Is**: `features/booking/booking_list_screen.dart` (또는 통합 screen)

**To-Be**:
- 탭 루트 화면 (탭바 노출)
- "예약·내역" 페이지 타이틀
- 세그먼트 컨트롤 (예정 / 완료) — white + ink 활성 반전
- 예약 카드 리스트
  - 아바타 + 이름 + 채널 배지 (화상/음성)
  - 날짜·시간
  - 우측: 60분 + 가격
  - 액션 버튼 row
    - 예정: [취소 outline 1f] [대기실 입장 primary 2f]
    - 완료 + 후기 있음: "후기 작성 완료 ✓" 중앙
    - 완료 + 후기 없음: [후기 작성 gold 1f]

**Widget Tree**
```
TabRootShell
└─ Column
   ├─ Header("예약·내역")
   ├─ SegmentControl(['예정', '완료'])
   └─ Expanded(ListView(BookingCard))
```

**주요 인터랙션**:
- 취소 → `bookingsProvider.cancel(id)` + 토스트
- 대기실 입장 → `activeSessionProvider.set(b)` + push `/waiting`
- 후기 작성 → `activeSessionProvider.set(b)` + push `/review`

**데이터 바인딩**:
- `bookingsProvider.upcoming` / `completed` 필터
- 최초 진입 시 seed 2건 자동 주입 (데모용, 프로덕션 제거)

**엣지 케이스**:
- 예정 0건 → "🪷 예정된 상담이 없습니다" empty
- 완료 0건 → "🪷 완료된 상담이 없습니다" empty

**접근성**:
- 세그먼트 컨트롤 `Semantics(selected: ...)` 명시
- 날짜·시간 `"2026년 4월 19일 20시"` 형태로 읽어줌

**UX Specialist Notes**:
- **완료 건의 후기 작성 유도**는 "보상" 중심: "후기 작성 완료 ✓"은 무보상, 미작성은 gold 버튼으로 시선을 끌어 리워드 인센티브 제공.
- 예정 건 "취소" 버튼을 outline(ink3)으로 약하게 표시: **실수로 누르지 않게**. "대기실 입장"은 강한 ink primary로 시각 비중 2:1.
- 완료 건에서 **환불 요청** 버튼은 의도적으로 숨김. 환불은 "더보기 > 환불 요청" 깊은 경로로 접근하게 — 남용 방지 + 합리적 유도.

---

### 3.8 S08 — 대기실 (`SWaiting`)

**목표**: 사용자가 **"실제 상담이 시작되기 직전"**을 인지하고 마이크·카메라를 점검하게 유도.

**As-Is**: `features/consultation/consultation_preflight_screen.dart` (※ 실제 파일명은 `preflight`)

**To-Be**:
- **다크 반전** (ink 배경 + hanji 텍스트)
- AppBar ("대기실" + ‹)
- 셀프 프리뷰 영역 (3/4 aspect-ratio)
  - 카메라 켬: radial-gradient 갈색톤 + 사람 실루엣 SVG (opacity 0.4)
  - 카메라 끔: "📷 카메라 꺼짐" 중앙
  - 좌상단 "나" 라벨
  - 좌하단: 마이크 레벨 미터 (6개 막대, 100ms 업데이트, gold)
  - 우상단: 네트워크 상태 "네트워크 우수" + pulse dot
- 컨트롤 row (3개 원형 52px)
  - 🎙/🔇 마이크 토글
  - 🎥/📷 카메라 토글
  - ⚙ 설정
- **카운트다운 카드**
  - "입장까지" 11px opacity 0.6
  - 숫자 Noto Serif 40/700 gold (`00:08` → `00:00` → "지금")
  - 상담사 프로필 행 (36px 아바타 + 이름/시간)
- 입장 버튼
  - 활성 (cd==0 && mic && cam): gold "상담실 입장"
  - 대기 중: `rgba(255,255,255,0.08)` "{cd}초 후 입장 가능"
  - 마이크/카메라 꺼짐: "마이크/카메라 필요"

**Widget Tree**
```
Scaffold(backgroundColor: ink)
└─ Column
   ├─ ZeomStatusBar(dark: true)
   ├─ ZeomAppBar(dark: true, title: "대기실", onBack: ...)
   └─ Padding(20)
      └─ Column
         ├─ SelfPreview(cam, mic, micLevel)
         ├─ ControlRow(onMic, onCam, onSettings)
         ├─ CountdownCard(cd, booking)
         └─ EnterButton(canEnter)
```

**주요 인터랙션**:
- `Timer.periodic(1s)` 카운트다운 (8 → 0)
- `Timer.periodic(140ms)` 마이크 레벨 랜덤 (실제는 `audio_session` 또는 Sendbird SDK 이벤트)
- 마이크/카메라 토글 → Sendbird Calls `localVideo` / `localAudio` 실제 제어
- 입장 버튼 → `consultationProvider.startSession(booking)` → push `/room`

**데이터 바인딩**:
- `activeSessionProvider.current` 읽기
- `mediaProvider` (mic level, camera state, network quality)
- `sendbirdClient.networkQuality` stream

**엣지 케이스**:
- `activeSession == null` → "세션 없음 + 예약으로" 안내
- 네트워크 불량 → 우측 상단 배지 색상 전환 (success → warning → error)
- 입장 후 카메라 권한 거부 → 실제 상담실에서 대응 (여기는 UI만)

**접근성**:
- 셀프 프리뷰 영역 `excludeSemantics`
- 마이크 레벨 미터는 시각적이므로 `Semantics(value: "${level}%")` 제공
- 카운트다운 숫자 `liveRegion: true`로 스크린리더 자동 알림

**UX Specialist Notes**:
- **왜 카운트다운이 8초?** 너무 짧으면(3초) 긴장, 너무 길면(30초) 지루함. 프로토타입이 8초로 결정한 것은 사용자가 **"한번 호흡하고 들어가기"** 가능한 시간.
- **마이크 레벨 미터는 의도적으로 fake**. 실제 마이크 레벨을 연결하면 레이아웃·권한 복잡도 증가. 프로토타입은 UX 기대감 조성이 목적.
- **네트워크 상태를 "우수/보통/불량" 3단계로 추상화**해야 함. 실제 Mbps 숫자 노출 금지 — 사용자는 숫자를 해석 못 함.
- 카운트다운 끝났을 때 **"지금" 한글 표기**는 세련됨 포인트. "00:00"보다 "지금"이 인간적.

---

### 3.9 S09 — 상담실 (`SRoom`)

**목표**: **몰입 + 신뢰 + 완벽한 타이머**. 60분이 끝나는 순간까지 사용자 스트레스 제로.

**As-Is**: `features/consultation/consultation_room_screen.dart`

**To-Be**:
- **풀스크린 다크 테마** (배경 #050505, 영상 위 ambient radial)
- 상단바 (`rgba(0,0,0,0.55)` + blur 10px)
  - 좌: 28px 아바타 + 이름
  - 우: 타이머 `MM:SS` Noto Serif 18/700 — **3단계 색 전환 (정상 gold / 10분 이하 주황 / 1분 이하 연빨강)**
- **Progress bar** (2px) — 타이머와 동일 색
- **메인 비디오 영역** (flex: 1)
  - 화상 채널: radial-gradient 갈색 톤 + 상담사 실루엣 SVG
    - PIP (우하단 100×133): 셀프 뷰
    - 카메라 off 시 "꺼짐" 텍스트
  - 음성 채널: 중앙에 160×160 금색 원 + darkRed 그라디언트 + 아바타 이니셜 — `mcbreathe` 3s 애니메이션
- **채팅 오버레이** (chat 토글 시)
  - 전체 영상 위 `rgba(20,20,20,0.92)` + blur 20px
  - 헤더 "메시지" + ✕ 닫기
  - 말풍선 (상담사 좌 / 사용자 우)
  - 입력창 + 전송 gold 버튼
- **하단 컨트롤** (flex, `rgba(0,0,0,0.4)`)
  - 🎙/🔇 / 🎥/📷 / 🔊 / 💬 원형 52px
  - 종료 버튼: darkRed 그라디언트 pill + "☎ 종료" + 그림자

**Widget Tree**
```
Scaffold(backgroundColor: #050505)
└─ Column
   ├─ ZeomStatusBar(dark: true)
   ├─ RoomTopBar(counselor, timer)
   ├─ TimerProgressBar(percent, color)
   ├─ Expanded(
   │    child: Stack(
   │      children: [
   │        VideoArea(channel),
   │        if (chatOpen) ChatOverlay()
   │      ]
   │    )
   │ )
   └─ BottomControls(mic, cam, chat, onEnd)
```

**주요 인터랙션**:
- `Timer.periodic(1s)` elapsed 증가 → 남은 시간 계산
- 타이머 색상 전환 로직:
  - `remaining <= 60` → urgent (#e06a6a)
  - `remaining <= 600 && > 60` → near (#d9a64a)
  - else → gold (#C9A227)
- 마이크/카메라 Sendbird `localAudio`/`localVideo` 제어
- 종료 버튼 → 1초 로딩 → `consultationProvider.endSession()` → `bookingsProvider.markCompleted(id)` → push `/complete`
- 채팅 전송 → Sendbird Channel message (프로토타입은 로컬 echo)

**데이터 바인딩**:
- `activeSessionProvider` (상담사·시간·채널)
- `sendbirdCallProvider` (localAudio, localVideo, remoteAudio, remoteVideo, chatChannel)
- `sessionTimerProvider` — elapsed 초 단위 stream

**엣지 케이스**:
- 네트워크 끊김 → 재연결 시도 + 상단 배지 "재연결 중…"
- 60분 초과 → 자동 종료 (서버 기준) + 토스트 "상담이 종료되었습니다"
- 상담사 일방 종료 → 화면 전환 + 이유 팝업

**접근성**:
- 타이머 `Semantics(value: "${mm}:${ss}", liveRegion: true)`
- 종료 버튼 `Semantics(label: "통화 종료", hint: "종료하면 다시 연결할 수 없습니다")`
- 채팅 말풍선 스크린리더 순서 보장

**UX Specialist Notes**:
- **타이머 위치(우상단)**는 **사용자 시선이 자연스럽게 가는 영역**입니다. 하단에 두면 컨트롤에 가려 집중력 분산.
- **색상 3단계 전환**은 사용자의 **심리적 준비**를 돕습니다. 10분 남은 시점에 자연스럽게 "마무리 모드"로 전환, 1분 남으면 "핵심만" 모드.
- **채팅 오버레이를 영상 위에 덮기로 결정한 이유**: 사이드 패널은 영상을 축소시켜 몰입 하락. 덮기 방식은 일시적이고 복귀가 쉬움.
- **음성 상담의 아바타 breathe 애니메이션**은 사용자가 "연결 유지되고 있음"을 시각적으로 확인. 정적 이미지면 "끊겼나?" 불안.
- **종료 버튼은 pill 모양 + 그림자**로 다른 원형 컨트롤과 명확히 구분. 실수 터치 최소화.

---

### 3.10 S10 — 상담 완료 (`SComplete`)

**목표**: 사용자의 **정리/의례**. 60분을 마무리하는 감정적 착지. 그리고 후기 작성 유도.

**As-Is**: `features/consultation/consultation_complete_screen.dart` (또는 신규)

**To-Be**:
- 한지 배경
- 중앙 상단 연꽃 🪷 원형 아이콘 (84×84, gold 그라디언트)
- 타이틀 "상담이 끝났어요" Noto Serif 26/700
- 서브 "{상담사.name}님과 60분의 이야기가 마무리되었습니다.\n오늘의 마음에도 작은 쉼이 되었기를." Pretendard 14/400 `ink3` LH 1.6 (의례적 문구)
- 상담 요약 카드 (white + borderSoft)
  - 아바타 + 이름 + "{날짜} {시간} · 60분 · {채널}"
  - "완료" gold 배지
- CTA 2개
  - **gold**: "후기 작성하고 1,000캐시 받기"
  - **outline**: "홈으로"

**Widget Tree**
```
Scaffold(backgroundColor: hanji)
└─ Column
   ├─ Header(Lotus icon + title + subcopy)
   ├─ SessionSummaryCard()
   ├─ GoldButton("후기 작성하고 1,000캐시 받기")
   └─ OutlineButton("홈으로")
```

**주요 인터랙션**:
- 후기 버튼 → push `/review` (activeSession 유지)
- 홈 버튼 → `tab reset home` + `activeSession clear`
- 뒤로 스와이프 차단 (`WillPopScope`) — 실수로 상담실로 돌아가지 않게

**데이터 바인딩**: `activeSessionProvider.current` 읽기만.

**엣지 케이스**:
- 세션 데이터 유실 → 홈 즉시 이동
- 후기 작성 완료 후 재진입 → "후기 작성 완료" 상태로 변형 (선택사항)

**접근성**:
- 서브 카피를 `Semantics(label: ...)`로 전체 낭독
- 연꽃 아이콘은 `excludeSemantics`

**UX Specialist Notes**:
- "오늘의 마음에도 작은 쉼이 되었기를" — **이 문구 자체가 서비스의 가치 제안**입니다. 문구 수정 시 반드시 브랜드 팀 리뷰.
- **1,000캐시 리워드 명시**는 핵심 전환 유도. "후기 작성해주세요" vs "후기 작성하고 1,000캐시 받기"는 전환율 차이 극명.
- 뒤로가기 차단은 **사용자 심리**: 상담실로 돌아가고 싶다는 착각(아직 끝 안 남) 방지.

---

### 3.11 S11 — 후기 작성 (`SReview`)

**목표**: **구조화된 피드백** (별점 + 태그 + 자유 텍스트). 작성 부담 최소화.

**As-Is**: `features/consultation/review_screen.dart` (또는 신규)

**To-Be**:
- AppBar ("후기 작성" + ‹)
- 상단 세션 요약 행 (44px 아바타 + 이름 + 날짜)
- 별점 카드 (white + borderSoft + 24px padding)
  - "상담은 어떠셨나요?" 13/600
  - 5개 별 ★ 36px (hover 효과 있음 — mobile에선 tap만 유효)
  - 별점 라벨 ("별점을 선택해주세요" / "아쉬웠어요" / "보통이에요" / "괜찮아요" / "좋았어요" / "완벽했어요")
- 태그 카드 (복수 선택 칩)
  - "어떤 점이 좋았나요?"
  - 6개 tag: 차분해요 / 현실적이에요 / 깊이 있어요 / 공감 잘해요 / 명쾌해요 / 따뜻해요
- 텍스트 카드 (선택)
  - "자세한 후기 (선택)"
  - textarea 5 rows + "{length}/500"
- 하단 sticky CTA
  - 별점 없음: "별점을 선택해주세요" (disabled)
  - 있음: "후기 등록 · +1,000캐시" (primary)
- 완료 화면 (제출 후 1.5초)
  - 🪷 + "고맙습니다" + "후기 감사 캐시 +1,000 적립"

**Widget Tree**
```
Scaffold(backgroundColor: hanji)
├─ AppBar
├─ SessionSummaryRow()
├─ SingleChildScrollView + Column
│   ├─ RatingCard(value, hover, onChange)
│   ├─ TagsCard(selected, onToggle)
│   └─ TextReviewCard(value, onChange)
└─ bottomSheet: SubmitButton()
```

**주요 인터랙션**:
- 별점 탭 → 라벨 자동 변경
- 태그 칩 다중 선택
- 텍스트 입력 시 카운터 실시간
- 제출 → `reviewsProvider.submit({bookingId, rating, tags, text})` + `bookingsProvider.markReviewed(id)` + `walletProvider.credit(1000)` → 1.5초 성공 화면 → `pop` to bookings tab

**데이터 바인딩**:
- `activeSessionProvider` 읽기
- `reviewsProvider.submit()` → 서버 POST
- 성공 시 `bookings.hasReview = true` 로컬 업데이트

**엣지 케이스**:
- 네트워크 실패 → 로컬 캐싱 + "오프라인 저장됨, 나중에 전송" 토스트
- 중복 제출 (같은 예약) → 서버 409 처리 + 토스트 "이미 작성된 후기입니다"

**접근성**:
- 별점 `Semantics(value: "${r}점")` + 라벨 동기화
- 태그 칩 `Semantics(selected: tags.contains(t))`
- 텍스트 영역 `hint: "500자 이내"`

**UX Specialist Notes**:
- **별점 라벨 (완벽했어요 등)의 표현**은 중요. "5점" 같은 숫자 라벨은 사용자 망설임 증가. 감성 표현은 **내가 어떤 상태로 이 점수를 주는지** 검증 역할.
- **태그를 복수 선택**으로 하는 이유: 사용자가 후기를 "종합" 평가하기 쉽게. 단일 선택은 피로.
- **자유 텍스트는 선택**이어야 함. 의무 시 완료율 30% 이하로 하락.
- **1,000캐시는 즉시 반영**. "나중에 지급" 형태는 신뢰 하락. 약속된 리워드는 즉시.

---

### 3.12 S12 — 오늘의 운세 (`SFortune`)

**목표**: **감정 아이스브레이커**. 상담 진입 전 가벼운 체험. 결과에 따라 상담 유도.

**As-Is**: `features/fortune/fortune_screen.dart` (또는 신규)

**To-Be**:
- AppBar ("오늘의 운세" + ‹)
- 중앙 정렬 타이틀 "세 장의 카드를 뒤집어주세요" Noto Serif 22/700
- 부제 "마음을 가다듬고 천천히 한 장씩 선택합니다" 12 `ink3`
- 3개 카드 (100×150px, 3D perspective flip 애니메이션 0.8s)
  - 앞면 (덮임): ink 그라디언트 + 2px gold 테두리 + 40×40 radial gradient 원 (gold→darkRed opacity 0.7)
  - 뒷면 (뒤집힘): white + 2px gold 테두리 + 방향 한자 `동(東)`·`남(南)`·`서(西)` Noto Serif 28/700 darkRed + 부제 "오늘의 흐름/주의할 점/행운의 방향"
- **3장 모두 뒤집히면** 해석 패널 fade-up (mcfade 0.5s)
  - 핵심 시구 "인연은 서두르지 않고, 때를 기다리면 스스로 다가옵니다." Noto Serif 18/700 중앙 LH 1.5
  - 3개 해석 섹션 (dashed divider 위)
    - 오늘의 흐름 / 주의할 점 / 행운의 방향
  - CTA "더 자세히 상담받기" gold

**Widget Tree**
```
Scaffold
├─ AppBar
├─ Header(title, subcopy)
├─ CardsRow([FortuneCard x3])
└─ AnimatedCrossFade(
     firstChild: SizedBox.shrink(),
     secondChild: InterpretationPanel(),
     crossFadeState: allFlipped ? end : start
   )
```

**주요 인터랙션**:
- 덮인 카드 탭 → `Transform(rotateY: π)` 0.8s → 뒤집힘 상태
- 이미 뒤집힌 카드 탭 비활성
- 3장 모두 뒤집힘 → 해석 패널 mcfade 등장
- "더 자세히 상담받기" → tab `counselors` reset

**데이터 바인딩**: `fortuneProvider.today` (캐릭터 인터프리테이션). 서버 or 클라이언트 생성.

**엣지 케이스**:
- 카드 플립 중 재탭 (debounce)
- 화면 이탈 후 재진입 → 플립 상태 초기화

**접근성**:
- 카드 `Semantics(button: true, label: "카드 ${i}, 뒤집으려면 두 번 탭")`
- 해석 패널 `Semantics(liveRegion: true, label: "${시구}")`

**UX Specialist Notes**:
- **3D 플립 애니메이션**은 Flutter `AnimatedBuilder` + `Matrix4.rotationY(pi * value)` 조합. `Transform` + `Stack` (앞면·뒷면)에서 `Visibility` 또는 `TransformBox`.
- **카드 3장 구조**는 **"과거·현재·미래" 타로 3카드 스프레드**의 변형. 이 구조 변경 금지 (신점 맥락에서 각별한 의미).
- 시구(quote)는 매일 무작위가 아닌 **운세 카테고리별 템플릿 풀**에서 선택. 사용자가 한 달간 같은 시구를 2번 이상 보지 않도록 로컬 로그.
- CTA "더 자세히 상담받기"는 **운세를 맛보기로, 상담으로 전환**하는 핵심 퍼널. 이 CTA의 탭률을 분석 항목으로.

---

### 3.13 S13 — 사주 보기 (`SSaju`)

**목표**: **"내 사주가 궁금하다"** 단계의 사용자에게 체계적인 사주팔자 + 오행 + 년운 제공.

**As-Is**: `features/fortune/saju_chart_screen.dart` (※ 실제 파일명은 `saju_chart`)

**To-Be**:
- **입력 단계** (submitted=false)
  - AppBar + 타이틀 "나의 생년월일을 입력해주세요" + 서브 "양력 기준, 태어난 시각을 함께 넣으면 더 정확합니다"
  - white 카드 (16px padding, 14px 라운드)
    - 생년월일 (`<input type="date">`)
    - 태어난 시각 (`<input type="time">`)
    - 성별 (F/M 2-col 버튼 토글)
  - CTA "사주 풀어보기" primary
  - 하단 법적 고지 "입력 정보는 암호화 저장되며, 외부 공유되지 않습니다" 10 `ink4`
- **결과 단계** (submitted=true)
  - AppBar (‹ → 입력으로 복귀)
  - 타이틀 "갑목(甲木)의 기운" Noto Serif 20/700 + 서브 "1995년 3월 14일 · 묘시(卯時) · 여"
  - **사주팔자 카드** (ink 배경, 20px padding, 16 라운드)
    - 상단 "四柱八字" letter-spacing 2 goldSoft 센터
    - 4-col 그리드: 年·月·日·時 기둥 (각: `rgba(201,162,39,0.08)` 배경 + `1px rgba(201,162,39,0.15)` 테두리 + 8 라운드)
      - 기둥명 Noto Serif 10 goldSoft
      - 천간 Noto Serif 22/700 gold (예: 乙)
      - 지지 Noto Serif 18/500 hanji (예: 亥)
  - **오행 분포 카드** (white)
    - 5행 (木·火·土·金·水) 각각 한자 심볼 + 가로 막대(20% per 1 count) + 수치
    - 각 오행 색상: 木=성공녹, 火=#c85a3a, 土=#a57e3a, 金=#888, 水=#3a6ac8
    - 하단 해석 "木이 강하고 金이 약합니다..."
  - **올해의 흐름 카드**
    - 上半期 / 下半期 / 특히 6-7월 — 기간 gold 좌측 + 해석 텍스트
  - CTA "전문 상담사에게 해석 듣기" gold

**Widget Tree**
```
state.submitted
  ? SajuResultScreen(date, time, gender)
  : SajuInputScreen(state, onSubmit)

SajuResultScreen
├─ AppBar
├─ Header("갑목의 기운", ...)
├─ SajuPillarCard(4 pillars)
├─ FiveElementsCard(distribution)
├─ YearFlowCard(halves)
└─ GoldButton("전문 상담사에게 해석 듣기")
```

**주요 인터랙션**:
- 입력 validation: 날짜·시간 필수
- 제출 → `sajuProvider.calculate({date, time, gender})` (서버 또는 클라이언트 로직)
- 뒤로가기 시 입력 상태 유지

**데이터 바인딩**:
- `sajuInputProvider` (date, time, gender)
- `sajuResultProvider.family(input)` — 캐시 가능
- 실제 사주 계산은 서버 API (`POST /api/saju/calculate`)

**엣지 케이스**:
- 미래 날짜 입력 → validation
- 1900 이전 → 지원 범위 고지
- 서버 오류 → 오프라인 근사치 제공 또는 재시도

**접근성**:
- 한자 `Semantics(label: "갑목")` (음독 제공)
- 오행 막대 `Semantics(value: "${k}, ${v}개")`
- 결과 전체 `SemanticsSortKey` 로 읽기 순서 제어

**UX Specialist Notes**:
- 한자 렌더링은 **Noto Serif KR이 필수**. Pretendard는 한자 일부 누락. 한자 항목은 반드시 `style: TextStyle(fontFamily: 'Noto Serif KR')`.
- 사주는 문화적으로 **"권위 있게 보여야" 신뢰**. 다크 카드 + 금색 테두리 조합은 "족자"의 시각적 은유.
- **성별은 F/M 2개만** — non-binary 옵션은 사주 산정 로직 상 현재 지원 불가 (한계 명시). 향후 확장 시 논의.
- 결과 CTA "전문 상담사에게 해석 듣기"는 **사주 결과를 "상품 리드"로 전환**. 이 전환율이 사주 기능의 ROI.

---

### 3.14 S14 — 지갑 (`SWallet`)

**목표**: 사용자의 **캐시 잔액 · 거래 내역 · 환불 입구**.

**As-Is**: `features/wallet/wallet_screen.dart`

**To-Be**:
- 탭 루트 화면
- "지갑" 페이지 타이틀
- **지갑 히어로** (ink 배경 + 만다라 SVG + gold 금액)
  - "보유 캐시" 라벨
  - 금액 Noto Serif 34/700 gold tabular-nums + "캐시" 14/500
  - 2 버튼 row: "충전" gold / "환불 요청" `rgba(255,255,255,0.12)`
- 내역 섹션
  - 날짜 그룹별 묶음 (오늘 / 어제 / 특정 날짜)
  - 각 아이템 white 카드 (마지막 아이템 제외 1px borderSoft divider)
    - 좌측: 30×30 원형 (`goldBg` in / `hanjiDeep` out) + "＋" or "－"
    - 설명 텍스트 13/500
    - 우측: 금액 Noto Serif 13/700 (`success` green 입금 / `ink` 출금) tabular-nums, "+" 부호 입금만

**Widget Tree**
```
TabRootShell
└─ SingleChildScrollView + Column
   ├─ Header("지갑")
   ├─ WalletHeroCard()
   └─ TransactionsSection(groupedByDate)
```

**주요 인터랙션**:
- 충전 → push `/cash`
- 환불 요청 → push `/refund`
- 거래 아이템 탭 → 상세 팝업 (영수증, 취소 옵션)

**데이터 바인딩**:
- `walletProvider` (잔액)
- `transactionsProvider` (그룹화된 내역, 페이지네이션)

**엣지 케이스**:
- 거래 0건 → 🪷 empty "아직 거래 내역이 없어요"
- 잔액 0원 → 히어로 금액 `ink4` 색으로 톤다운 + "지금 충전해보세요" CTA 강조

**접근성**:
- 히어로 전체 `Semantics(label: "보유 캐시 45,000원")`
- 입금/출금 `Semantics(label: "+1,000원 입금, 후기 감사 캐시")`

**UX Specialist Notes**:
- 지갑 히어로는 **홈의 지갑 카드와 동일 시각 구조**. 반복을 통한 기억 강화.
- 거래 내역의 **"그룹 by 날짜"**는 필수 패턴. 한국 사용자는 "오늘", "어제" 같은 상대 시간에 더 익숙.
- **환불 요청 버튼을 히어로 우측에 배치**하는 것은 의도적 — 환불이 숨겨져 있으면 신뢰 하락. 가시적인 위치.

---

### 3.15 S15 — 더보기 (`SMore`)

**목표**: **2차 메뉴 + 프로필**. 자주 안 쓰는 설정·약관·분쟁·로그아웃.

**As-Is**: `features/more/more_screen.dart`

**To-Be**:
- 탭 루트 화면
- "더보기" 페이지 타이틀
- **프로필 카드** (white)
  - 52×52 원형 (`linear-gradient(135deg, lotus, darkRed)` + hanji 이니셜)
  - 이름 + 전화번호 + 배지 "단골" (gold bg) + "상담 12회 완료" 보조
  - "편집" outline 버튼
- **그룹 메뉴 리스트** (3개 그룹)
  - 상담 활동: 상담 이력 / 환불 요청 / 분쟁 신고
  - 설정: 공지사항 / FAQ / 이용약관 / 개인정보 처리방침
  - 계정: 알림·보안 설정 / 로그아웃
  - 각 아이템: gold 아이콘 (글리프 `🗂 ↩ ! ◆ ? § ◈ ⚙ ↗`) + 라벨 + 우측 `›`
- 하단 버전 표기 "천지연꽃신당 v1.0.0 (1042)" 10 `ink4`

**Widget Tree**
```
TabRootShell
└─ ListView
   ├─ ProfileCard()
   ├─ MenuGroup("상담 활동", [...])
   ├─ MenuGroup("설정", [...])
   ├─ MenuGroup("계정", [...])
   └─ VersionFooter()
```

**주요 인터랙션**:
- 환불 요청 → push `/refund`
- 분쟁 신고 → push `/dispute`
- 나머지: 각 정적 페이지 push (약관 WebView 등)
- 로그아웃 → 확인 다이얼로그 → `authProvider.signOut()` + `pushReplacement /login`

**데이터 바인딩**: `userProvider` (이름, 전화, 상담 횟수).

**엣지 케이스**:
- 단골 기준 (10회+) 미달 시 "단골" 배지 숨김
- 프로필 사진 있으면 이니셜 대신 사진

**접근성**:
- 프로필 카드 전체 `Semantics(button: true, label: "윤서연, 010-xxxx-5678, 단골, 상담 12회 완료, 편집하려면 탭")`
- 메뉴 아이템 `›` 아이콘은 `excludeSemantics` (의미 없음)

**UX Specialist Notes**:
- 글리프 아이콘(`↩ !`)은 가독성 낮음 — **Flutter 이식 시 실제 아이콘으로 교체**:
  - 🗂 → `Icons.folder_outlined`
  - ↩ → `Icons.undo`
  - ! → `Icons.priority_high`
  - ◆ → `Icons.campaign_outlined`
  - ? → `Icons.help_outline`
  - § → `Icons.article_outlined`
  - ◈ → `Icons.shield_outlined`
  - ⚙ → `Icons.settings`
  - ↗ → `Icons.logout`
- 분쟁·환불은 **"상담 활동" 그룹 내부**에 배치. 잘 안 보이는 위치가 아니라 사용자가 필요할 때 발견 가능한 수준.
- 버전 표기를 **탭 바깥 하단에 배치**하는 이유: 디버깅·CS 요청 시 사용자가 읽어주기 쉬운 위치. 필수.

---

### 3.16 S16 — 환불 요청 (`SRefund`)

**목표**: **정당한 환불 접수**. 환불 정책 먼저, 대상 선택, 사유 선택, 상세.

**As-Is**: `features/refund/refund_request_screen.dart` (신청 플로우) + `refund_list_screen.dart` (이력 리스트 — 별도 존재, 더보기 > 상담 활동에서 진입)

**To-Be**:
- AppBar ("환불 요청" + ‹)
- **정책 안내 박스** (gold 8% tint bg + 1px gold 20% 테두리)
  - "환불 정책 ·상담 24시간 전: 100% 환불 / 1시간 전: 50% / 이후: 서비스 이슈에 한해 부분 환불 검토"
- "어떤 상담 건인가요?" 섹션
  - 완료된 예약 리스트 (40px 아바타 + 이름 + 날짜·시간·가격)
  - 선택: ink 반전
- "환불 사유" 섹션
  - 라디오 5개: 상담사 일방 종료 / 연결 품질 문제 / 중복 결제 / 단순 변심 / 기타
  - 하단 자유 textarea
- CTA "환불 요청 접수" primary (대상+사유 선택 필수)
- 완료 화면 (제출 후)
  - 80×80 goldBg 원 + ✉ 글리프
  - "접수되었습니다" + "3영업일 이내 검토 결과를\n푸시 알림으로 보내드려요."
  - "확인" 버튼 → tab reset `more`

**Widget Tree**
```
if (done) → RefundSuccessScreen()
else → Scaffold
├─ AppBar
└─ SingleChildScrollView + Column
   ├─ PolicyInfoBox()
   ├─ BookingTargetSection(bookings, selected, onSelect)
   ├─ ReasonSection(reason, onSelect)
   ├─ DetailTextarea()
   └─ SubmitButton()
```

**주요 인터랙션**:
- 대상 선택 (single radio)
- 사유 선택 (single radio)
- 상세 내용 (optional)
- 제출 → `refundsProvider.submit({bookingId, reason, detail})` → 완료 화면

**데이터 바인딩**:
- `bookingsProvider.completed.refundable` — 환불 가능 건만 필터
- `refundsProvider.submit()` → 서버 POST

**엣지 케이스**:
- 환불 가능 건 0 → "환불 가능한 상담이 없습니다"
- 중복 요청 (같은 예약) → 409 + "이미 환불 요청된 건입니다"

**접근성**:
- 정책 박스 전체 낭독 (`Semantics(label: ...)`)
- 라디오 `Semantics(selected: ..., label: ...)`

**UX Specialist Notes**:
- **정책 박스를 맨 상단에 배치**하는 이유: 사용자가 **"내 건이 환불 대상인지"** 먼저 확인하게. 정책이 뒤에 있으면 기대와 결과 불일치로 불만 발생.
- **"단순 변심"을 사유에 포함**하는 것은 중요. 없으면 사용자가 다른 사유로 거짓 표기. 단순 변심은 1시간 전 규칙 적용됨을 명시.
- 3영업일 응답은 **SLA**. 이 기간 내 답변 실패 시 자동 승인 같은 fallback 정책 필요 (백엔드).

---

### 3.17 S17 — 분쟁 신고 (`SDispute`)

**목표**: 사용자의 **심각한 문제 제기**. 환불보다 무거운 액션. 신고 유형 명확, 접수 신속.

**As-Is**: `features/dispute/dispute_create_screen.dart` (신고 작성) + `dispute_list_screen.dart` + `dispute_detail_screen.dart` (프로토타입엔 없지만 앱에는 이력/상세 뷰가 이미 존재 — 함께 디자인 일관성 유지 필요)

**To-Be**:
- AppBar ("분쟁 신고" + ‹)
- **경고 안내 박스** (`#fdecec` bg + darkRed 20% 테두리 + darkRed 텍스트)
  - "부당한 경험을 하셨다면 주저 없이 신고해주세요. 접수된 모든 사안은 내부 정책에 따라 엄정 검토됩니다."
- 신고 유형 grid (2-col, 6개)
  - 상담 내용 문제 / 부적절한 발언 / 상담사 노쇼 / 환불 미이행 / 개인정보 침해 / 기타
  - 선택: darkRed bg + hanji 텍스트
- "대상 상담" 텍스트 입력 (예약 번호 또는 상담사 이름)
- "상세 내용" textarea (6 rows)
- "📎 증빙 자료 첨부 (선택)" outline + dashed border
- CTA "신고 접수" **danger** (darkRed) 버튼
- 완료 화면
  - 80×80 `#fdecec` 원 + "!" 글리프
  - "신고가 접수되었습니다" + "담당 팀이 검토 후 72시간 이내\n답변 드립니다."
  - "확인" 버튼 → tab reset `more`

**Widget Tree**
```
if (done) → DisputeSuccessScreen()
else → Scaffold
├─ AppBar
└─ SingleChildScrollView + Column
   ├─ WarningBox()
   ├─ CategoryGrid(6, selected, onSelect)
   ├─ TargetInput()
   ├─ DescriptionTextarea()
   ├─ AttachmentButton()
   └─ DangerSubmitButton()
```

**주요 인터랙션**:
- 카테고리 단일 선택
- 대상·상세 내용 필수 입력
- 제출 → `disputesProvider.submit(...)` → 완료 화면

**데이터 바인딩**:
- `disputesProvider.submit({category, target, description, attachments})` → 서버
- 향후 확장: 파일 업로드 (MultiPart)

**엣지 케이스**:
- 첨부 파일 크기 제한 (10MB)
- 이미지만 허용 or 영상도 허용? — 정책 결정

**접근성**:
- 경고 박스 `Semantics(liveRegion: true)` — 진입 시 자동 낭독
- danger 버튼 `Semantics(label: "신고 접수, 제출 후 취소 불가")`

**UX Specialist Notes**:
- **경고 박스의 톤은 "당신을 보호합니다"** 유지. "신고를 신중히 하세요" 같은 **신고자 책임 전가 톤 금지**.
- danger 버튼은 **"되돌릴 수 없음"을 시각으로 명시**. darkRed + 충분한 여백. 탭 실수 방지.
- 72시간 응답 SLA는 법적 수준. 이 시간 내 답변 없으면 CS 에스컬레이션 자동화 필요.
- 첨부 자료 옵션은 있지만, **대부분 텍스트만으로 충분**하도록 descriptor textarea를 6 rows로 넓게. 첨부가 필수처럼 느껴지면 접수율 하락.

---

## 4. Phase별 개발 로드맵

### Phase 0 — 기반 (1주차)

**목표**: 공통 토큰·위젯·폰트 셋업

- [P0] 2.1 Theme 토큰 보강 (`AppColors` 확장)
- [P0] 2.2 폰트 셋업 (Noto Serif KR 확인 + Pretendard Variable 로컬 번들)
- [P0] 2.3 공통 primitive 위젯 11개 구현 (`zeom_avatar`, `zeom_chip`, `zeom_button`, `zeom_app_bar`, `zeom_tab_bar`, `zeom_lotus_mandala`, `zeom_hero_card`, `zeom_countdown`, `zeom_star_rating`, `zeom_presence_dot`, `zeom_status_bar`)
- [P0] 2.6 애니메이션 공통화 (mcbreathe/mcspin/mcfade)
- [P1] 2.7 스크린샷 레퍼런스 저장 & PR 템플릿 업데이트

**산출물**: 공통 위젯 위젯북(widgetbook) 1개 페이지 — 모든 primitive 시연.
**검증**: `verify-frontend-ui` 스킬 통과.

---

### Phase 1 — Browse 플로우 (2주차)

**목표**: 사용자 탐색 경로의 시각 완성

- S02 홈 (`home_screen.dart`)
- S03 상담사 목록 (`counselor_list_screen.dart`)
- S04 상담사 상세 (`counselor_detail_screen.dart`)

**의존성**: Phase 0 위젯. `counselorsProvider` 확장.

**산출물**: 3 screens + 1 carousel widget + 1 date strip widget + 1 time slot grid.
**위젯 테스트**: 각 스크린 Golden test 1개씩.

---

### Phase 2 — Conversion 플로우 (3주차)

**목표**: 예약·결제 퍼널 완성

- S05 예약 확인 (`booking_create_screen.dart`)
- S06 캐시 충전 (`wallet/cash_buy_screen.dart` 통합 권장, `credit/credit_buy_screen.dart` 중복 정리)

**의존성**: `pendingBookingProvider`, `walletProvider`, `paymentProvider` (기존 유지).

**산출물**: 2 screens + InsufficientCashBanner + PackageCard + PaymentMethodTile.

**검증**: `verify-payment-wallet` 스킬 통과.

---

### Phase 3 — Session 플로우 (4-5주차)

**목표**: 대기실·상담실·완료·후기 — 핵심 몰입 경험

- S08 대기실 (`consultation_preflight_screen.dart`)
- S09 상담실 (`consultation_room_screen.dart`) — **가장 복잡**
- S10 상담 완료 (`consultation_complete_screen.dart`)
- S11 후기 작성 (`consultation/review_screen.dart`)

**의존성**: Sendbird Calls SDK 연동 부분 (기존 `services/sendbird/` 유지). `activeSessionProvider` 확장.

**산출물**: 4 screens + VideoArea widget + ChatOverlay widget + Timer widget + RatingInput widget + TagsChipCloud widget.

**검증**: `verify-sendbird-videocall` 스킬 통과.

---

### Phase 4 — Account 플로우 (6주차)

**목표**: 예약·지갑·더보기·환불·신고 전체

- S07 예약 관리 (`booking/booking_list_screen.dart` + `consultation/consultation_history_screen.dart` 역할 분담 감사 필요 — 예정/완료 통합 여부 결정)
- S14 지갑 (`wallet/wallet_screen.dart`)
- S15 더보기 (`more/more_screen.dart`)
- S16 환불 요청 (`refund/refund_request_screen.dart` + `refund_list_screen.dart`)
- S17 분쟁 신고 (`dispute/dispute_create_screen.dart` + `dispute_list_screen.dart` + `dispute_detail_screen.dart`)

**의존성**: `bookingsProvider`, `transactionsProvider`, `refundsProvider`, `disputesProvider`.

**산출물**: 5 screens + SegmentControl widget + MenuGroupList widget + PolicyInfoBox widget.

---

### Phase 5 — Entertainment 플로우 (7주차)

**목표**: 운세·사주 서브 기능

- S12 오늘의 운세 (`fortune/fortune_screen.dart`) — **카드 플립 애니메이션**
- S13 사주 보기 (`fortune/saju_chart_screen.dart`) — **사주팔자·오행·년운**

**의존성**: `fortuneProvider`, `sajuProvider`. 서버 API `/api/fortune/today`, `/api/saju/calculate`.

**산출물**: 2 screens + FlipCard widget + SajuPillarCard + FiveElementsBars.

**검증**: `verify-fortune` 스킬 통과.

---

### Phase 6 — Onboarding (8주차)

**목표**: 로그인 시각 완성

- S01 로그인 (`login_screen.dart`)

**의존성**: `authProvider`, 소셜 OAuth 3종 (기존 유지).

**산출물**: 1 screen + SocialLoginButton + BrandOrb widget + LotusMandala 전체변형.

**검증**: `verify-auth-system` 스킬 통과.

---

### Phase 7 — QA & 출시 준비 (9주차)

**목표**: 품질 보증, 접근성 감사, 성능 측정

- Golden tests 17개 (각 주요 화면)
- Integration tests (핵심 플로우 4개: 로그인→홈, 상담 예약, 세션 진행, 후기 작성)
- 접근성 감사 (VoiceOver + TalkBack 실기기 테스트)
- 성능: 첫 렌더 60fps, 스크롤 16ms 이하 측정
- Dynamic Type 테스트 (0.85~1.3 배율)
- 저전력 디바이스 테스트 (iPhone SE 1st gen, 저가 Android)

**검증**: `verify-implementation` 통합 검증 스킬 실행.

**산출물**: 출시 가능한 v2.0.0 (프로토타입 시각 일치 100%).

---

## 5. 기술 스택 매핑 (JSX → Flutter)

프로토타입 JSX의 핵심 패턴을 Flutter로 변환하는 참조표.

| JSX 패턴 | Flutter 대응 | 비고 |
|---------|------------|------|
| `position: absolute` | `Positioned` in `Stack` | `Stack`의 fit 지정 필수 |
| `position: sticky bottom` | `Scaffold.bottomSheet` or `Stack + Positioned(bottom: 0)` | safe area `SafeArea` 활용 |
| `display: flex; gap: 10` | `Row/Column` + `SizedBox(width/height: 10)` 또는 `spacing` | Flutter 3.27+ `spacing` 파라미터 |
| `grid-template-columns: repeat(4, 1fr)` | `GridView.count(crossAxisCount: 4)` | 또는 `Wrap` + 계산된 width |
| `aspect-ratio: 3/4` | `AspectRatio(aspectRatio: 3/4)` | |
| `overflow-x: auto; scrollbar-width: none` | `SingleChildScrollView(scrollDirection: horizontal) + ScrollConfiguration(behavior: NoScrollbar)` | |
| `backdrop-filter: blur(20px)` | `BackdropFilter(filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20))` | |
| `linear-gradient(135deg, a, b)` | `LinearGradient(begin, end, colors: [a, b])` | 135도 = `Alignment.topLeft → bottomRight` |
| `radial-gradient(circle, a, b)` | `RadialGradient(center, colors: [a, b])` | |
| `border-radius: 50%` (circle) | `BorderRadius.circular(size / 2)` + 정사각 크기 | |
| `@keyframes mcbreathe` | `AnimationController + Tween` | `vsync` 필수, `repeat` |
| `@keyframes mcspin` | `RotationTransition` + 무한 `AnimationController` | |
| `@keyframes mcfade` | `SlideTransition + FadeTransition` | |
| `transform: rotateY(180deg)` (카드 플립) | `Transform(transform: Matrix4.identity()..setEntry(3,2,0.001)..rotateY(pi))` | perspective 설정 중요 |
| `input type="date"` | `showDatePicker(context: ..., initialDate: ...)` | iOS 스타일은 `CupertinoDatePicker` |
| `input type="time"` | `showTimePicker(...)` | |
| `textarea` | `TextField(maxLines: 5, minLines: 5)` | counter는 별도 ValueListenableBuilder |
| `accent-color: ink` (radio/checkbox) | `ThemeData.checkboxTheme: CheckboxThemeData(fillColor: WidgetStateProperty.resolveWith(...))` + 동일하게 `radioTheme: RadioThemeData(...)` (※ Flutter 3.16+에서 `toggleableActiveColor` deprecated) | |
| `localStorage.setItem(...)` | `SharedPreferences` | async 주의 |
| `window.mWallet = 45000` | `walletProvider = StateNotifierProvider(...)` | Riverpod 상태 |
| `setTimeout(() => ..., 900)` | `Future.delayed(Duration(milliseconds: 900), () => ...)` | mounted 체크 필수 |
| SVG inline | `flutter_svg` 패키지 또는 `CustomPainter` | 만다라는 `CustomPainter` 권장 |
| `box-shadow: 0 8px 24px rgba(...)` | `BoxShadow(offset: Offset(0, 8), blurRadius: 24, color: ...)` | |
| `box-shadow: inset ...` | `DecoratedBox` + 트릭 필요 (Flutter 네이티브 미지원) | 일반적으로 불필요 |
| `font-variant-numeric: tabular-nums` | `TextStyle(fontFeatures: [FontFeature.tabularFigures()])` | 적용 누락 주의 |
| `text-decoration: line-through` | `TextStyle(decoration: TextDecoration.lineThrough)` | |
| `::-webkit-scrollbar display: none` | `ScrollConfiguration(behavior: NoScrollbarBehavior())` | 커스텀 behavior |
| `event.preventDefault() + stopPropagation()` | `GestureDetector(behavior: HitTestBehavior.opaque)` | |
| `useEffect(() => ..., [])` | `StatefulWidget.initState` 또는 `FutureBuilder` | cleanup은 `dispose` |
| `useState` | `useState` (flutter_hooks) 또는 `StatefulWidget` | 권장: Riverpod `useState` |
| `useCallback` | `final _fn = useCallback(() => ...)` (flutter_hooks) | 일반 Flutter에선 불필요 |
| `React.memo` | `const Widget()` 또는 `RepaintBoundary` | |

---

## 6. 품질 보증 전략

### 6.1 위젯 테스트

각 공통 primitive 위젯에 대해 rendering + interaction 테스트:

```
test/widgets/
├─ zeom_button_test.dart     (variant×size×disabled matrix)
├─ zeom_avatar_test.dart     (size×online matrix)
├─ zeom_chip_test.dart        (active state)
├─ zeom_countdown_test.dart   (color transition 3 states)
└─ ...
```

### 6.2 Golden Tests

17개 화면 각각의 고정 시나리오 골든 이미지:

```
test/goldens/
├─ S01_login.png
├─ S02_home.png
├─ S02_home_empty_wallet.png
├─ S04_counselor_detail_with_slot.png
├─ S08_waiting_countdown_0.png
├─ S08_waiting_countdown_8.png
├─ S09_room_timer_normal.png
├─ S09_room_timer_near.png
├─ S09_room_timer_urgent.png
└─ ... (기타 각 상태별)
```

**실행**: `flutter test --update-goldens` 후 git diff 리뷰.

### 6.3 Integration Tests

핵심 사용자 여정 4개:

1. `test/integration/flow_login_to_home.dart` — 로그인 → 홈 랜딩
2. `test/integration/flow_book_consultation.dart` — 상담사 선택 → 예약 → 결제 → 예약 리스트 진입
3. `test/integration/flow_session.dart` — 예약 → 대기실 → 상담실 (1초 가속) → 완료 → 후기
4. `test/integration/flow_refund.dart` — 완료 건 → 환불 요청 → 접수 완료

### 6.4 접근성 감사

- **VoiceOver (iOS)**: 각 화면을 눈 감고 네비게이션 가능한가?
- **TalkBack (Android)**: 동일
- **Focus order**: 탭 순서가 논리적인가? (`SemanticsSortKey`)
- **Color contrast**: 모든 텍스트 WCAG AA (4.5:1) 통과 — gold on hanji는 큰 글자만
- **Touch target**: 모든 인터랙티브 요소 44×44 dp 이상
- **Dynamic Type**: iOS "글자 크기 2단계 키움" 시 레이아웃 유지

### 6.5 성능 측정

- **DevTools Performance tab**: 첫 렌더 60fps
- **Lighthouse on Web** (웹 변형 있으면): LCP < 2.5s, TTI < 3.5s
- **Memory**: 상담실 체류 10분 시 메모리 leak 없음
- **Battery**: 음성 상담 30분 시 배터리 감소율 < 15% (기종별 상이)

### 6.6 타겟 디바이스 매트릭스

| 디바이스 | 목적 | 우선순위 |
|---------|------|--------|
| iPhone 14 Pro | Standard 기준 | P0 |
| iPhone SE 3rd gen | Compact 기준, 저성능 | P0 |
| iPhone 15 Plus | Comfort 기준 | P1 |
| Pixel 7 | Android Standard | P0 |
| Samsung Galaxy A54 | Android 저가 기준 | P1 |
| iPad mini (세로) | 440dp 경계 | P2 |

---

## 7. 위험 관리 및 대응

### 7.1 기술적 위험

| 위험 | 영향도 | 대응 |
|------|-------|-----|
| Sendbird SDK의 local preview UI와 프로토타입 디자인 충돌 | High | 프리뷰는 Sendbird 위젯 사용, 주변 UI만 오버레이. 테마 오버라이드 불가 시 프로토타입 스펙 일부 타협. |
| Noto Serif KR 로딩 지연 (CDN 불안정) | Medium | 로컬 번들 우선, CDN fallback. 폰트 미로드 시 시스템 serif fallback. |
| `Transform rotateY` 카드 플립 60fps 미달 (저사양) | Medium | `willChange` 대신 Flutter는 `RepaintBoundary`. 실패 시 간단한 crossFade 폴백. |
| `SharedPreferences` 비동기 로딩으로 초기 화면 flash | Low | `FutureBuilder`로 스플래시 유지 + `AnimatedSwitcher` 전환 |

### 7.2 제품·UX 위험

| 위험 | 영향도 | 대응 |
|------|-------|-----|
| 17화면 전면 개편 후 기존 사용자 혼란 | High | **점진적 롤아웃**: Phase별 Feature Flag로 A/B 테스트. 이슈 발생 시 즉시 롤백. |
| "단순 변심" 환불 사유로 남용 | Medium | 1시간 전 규칙 명시 + 사유 통계 모니터링. 특정 사용자 3회 이상 시 경고. |
| 사주 결과에 대한 책임 이슈 (법적) | High | 결과 화면 하단에 **"참고용 서비스" 고지** 필수 추가. 법무 검토. |
| 상담실 채팅 로그 보존 기간 명시 누락 | Medium | 약관에 명시 + 상담실 진입 시 첫 1회 안내 팝업 |

### 7.3 디자인 일관성 위험

| 위험 | 영향도 | 대응 |
|------|-------|-----|
| 페이즈별 구현에서 토큰 일관성 drift | High | `verify-frontend-ui` 스킬을 매 PR 자동 실행. 하드코딩 hex 감지 시 CI 실패. |
| Phase 5-6 순서 때문에 로그인·사주 화면만 "새 디자인", 나머지 "구 디자인" 혼재 | Medium | 출시를 Phase 7까지 연기. **부분 출시 금지**. |
| 기존 Flutter 스크린 코드 일부를 복사·재활용 시 구 패턴 유입 | Medium | PR 템플릿에 "프로토타입 스크린샷 대조" 의무 항목 |

---

## 8. 완성 정의 (Definition of Done)

각 화면이 "완성"으로 분류되려면 다음을 모두 통과:

### 시각 일치
- [ ] 프로토타입 스크린샷과 Flutter 스크린샷을 1x 확대에서 픽셀 오차 ±2px 이내
- [ ] 팔레트 토큰 100% `AppColors.*`만 사용 (hex 하드코딩 0건)
- [ ] Noto Serif / Pretendard 폰트 적용 일관
- [ ] 모든 숫자에 `tabular-nums` 적용

### 기능 일치
- [ ] 프로토타입의 모든 인터랙션 재현 (탭·토글·스크롤·플립 등)
- [ ] 네비게이션 경로 일치
- [ ] 상태 전환 타이밍 일치 (로딩 900ms, 성공 1.2s, 애니메이션 duration)

### 테스트
- [ ] Golden test 통과 (각 화면별 + 주요 상태 변형)
- [ ] 위젯 테스트 80%+ 커버리지
- [ ] Integration test (화면이 속한 플로우 1개 이상)

### 접근성
- [ ] 모든 인터랙티브 요소에 `Semantics` 레이블
- [ ] WCAG AA 색상 대비 통과
- [ ] VoiceOver/TalkBack 수동 감사 통과
- [ ] Touch target 44dp 이상
- [ ] Reduce Motion 환경에서 애니메이션 비활성

### 성능
- [ ] 첫 렌더 60fps (저성능 기기 50fps 이상)
- [ ] 스크롤 프레임 16ms 이하
- [ ] 메모리 누수 없음
- [ ] 번들 크기 증가 < 200KB per screen

### 문서
- [ ] PR에 프로토타입 vs Flutter 스크린샷 대조 이미지 첨부
- [ ] `MOBILE_DESIGN.md`에 새 컴포넌트 등재
- [ ] 신규 공통 위젯은 위젯북에 샘플 추가

### 코드 품질
- [ ] `flutter analyze` 0 warning
- [ ] `dart format` 통과
- [ ] 컴포넌트 재사용 (중복 코드 없음)
- [ ] 이모지는 🪷 · ✓ · ✉ · ! 4종 이내

---

## 9. 향후 확장 (Post-Launch)

v2.0 출시 후 로드맵 (참고용):

### 9.1 다크 모드 확장

현재는 대기실·상담실만 다크. v2.1에서 전체 앱 다크 모드 지원:
- `hanji` → `ink` 반전
- `ink` → `hanji` 반전
- 카드 테두리 색상 재정의 (`rgba(255,255,255,0.08)` 등)
- 금색은 유지 (다크에서 더 강렬)
- 대기실·상담실은 현재 유지 (이미 다크이므로)

### 9.2 온보딩 개선

로그인 후 첫 진입 시 3-화면 온보딩:
1. 서비스 소개 (연꽃 모티프)
2. 환불·60분 정책 안내
3. 첫 운세 무료 체험 유도

### 9.3 알림 센터

별도 스크린:
- 푸시 알림 히스토리
- 카테고리 필터 (예약·결제·후기·공지)
- 읽음 처리

### 9.4 상담사 팔로우·즐겨찾기

상담사 상세의 ♡ 버튼 활성화:
- 즐겨찾기 목록 (더보기 > 즐겨찾기)
- 좋아하는 상담사 "지금 가능" 알림

### 9.5 커뮤니티 (장기)

같은 고민 사용자 익명 커뮤니티:
- 카테고리별 게시판
- 모더레이션 필수

### 9.6 Widget 외부 연동 (iOS/Android Home Widget)

- 홈 스크린 위젯으로 "다가오는 예약" + "오늘의 운세" 표시
- 탭 시 앱 해당 화면으로 이동

### 9.7 Apple Watch 동반 앱 (장기)

- 세션 시작 알림
- 세션 중 남은 시간 표시
- 진동 알림 (10분 남음)

---

## 부록 A — 화면별 우선순위 매트릭스

| Phase | 주차 | 화면 | 영향도 | 구현 복잡도 | Phase 의존 |
|-------|------|------|-------|-----------|----------|
| 0 | 1 | 공통 위젯 11개 | ⭐⭐⭐⭐⭐ | ⭐⭐ | 없음 |
| 1 | 2 | S02 홈 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | 0 |
| 1 | 2 | S03 상담사 목록 | ⭐⭐⭐⭐ | ⭐⭐ | 0 |
| 1 | 2 | S04 상담사 상세 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 0 |
| 2 | 3 | S05 예약 확인 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | 0, 1 |
| 2 | 3 | S06 캐시 충전 | ⭐⭐⭐⭐ | ⭐⭐⭐ | 0 |
| 3 | 4-5 | S08 대기실 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 0, 2 |
| 3 | 4-5 | S09 상담실 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 0, 3 (대기실) |
| 3 | 5 | S10 상담 완료 | ⭐⭐⭐ | ⭐⭐ | 0, 3 (상담실) |
| 3 | 5 | S11 후기 작성 | ⭐⭐⭐⭐ | ⭐⭐⭐ | 0, 3 (완료) |
| 4 | 6 | S07 예약 관리 | ⭐⭐⭐⭐ | ⭐⭐⭐ | 0, 2 |
| 4 | 6 | S14 지갑 | ⭐⭐⭐⭐ | ⭐⭐ | 0 |
| 4 | 6 | S15 더보기 | ⭐⭐⭐ | ⭐⭐ | 0 |
| 4 | 6 | S16 환불 요청 | ⭐⭐⭐ | ⭐⭐⭐ | 0, 4 (지갑) |
| 4 | 6 | S17 분쟁 신고 | ⭐⭐⭐ | ⭐⭐⭐ | 0, 4 (더보기) |
| 5 | 7 | S12 오늘의 운세 | ⭐⭐⭐ | ⭐⭐⭐⭐ (플립) | 0 |
| 5 | 7 | S13 사주 보기 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ (팔자) | 0 |
| 6 | 8 | S01 로그인 | ⭐⭐⭐⭐⭐ | ⭐⭐ | 0 |
| 7 | 9 | QA & 출시 준비 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 0-6 모두 |

---

## 부록 B — PR 템플릿 (매 화면 구현 시)

```markdown
## 변경 내용
- feature/{name}_screen.dart 재작성

## 대상 화면
S0x — {화면명}

## 프로토타입 대조
[이미지 첨부: prototype.png | flutter.png]

## 주요 컴포넌트
- {NewWidget1}: ...
- {NewWidget2}: ...

## 인터랙션 체크리스트
- [ ] 탭 / 스크롤 / 토글 일치
- [ ] 로딩 상태 / 성공 상태 / 에러 상태
- [ ] 애니메이션 타이밍

## 테스트
- [ ] Golden test 추가
- [ ] 위젯 테스트 추가
- [ ] Integration test 업데이트 (해당 시)

## 접근성
- [ ] Semantics 레이블
- [ ] Touch target 44dp
- [ ] Reduce Motion 대응

## 관련 검증 스킬
- [ ] verify-frontend-ui
- [ ] verify-{feature-specific}

## 스크린샷 (필수)
[Before | After | Prototype]
```

---

**끝.** 이 계획은 `MOBILE_DESIGN.md` 디자인 시스템과 한 쌍으로 운영됩니다. 디자인 시스템 변경 시 본 문서의 영향받는 화면 섹션을 동반 갱신하세요. 새 화면 추가 시 § 3의 동일 템플릿을 사용합니다.
