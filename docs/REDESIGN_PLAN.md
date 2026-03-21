# 천지연꽃신당 프론트엔드 리디자인 계획서

> 작성일: 2026-03-21
> 대상: `web/src/` (Next.js 15 + React 19 + Tailwind CSS v4 + shadcn/ui)

---

## 1. 현재 디자인 진단

### 1.1 전반적 문제점

| 영역 | 현재 상태 | 문제 |
|------|-----------|------|
| **타이포그래피** | Noto Serif KR + Noto Sans KR | 범용 폰트, 프리미엄 느낌 부족. AI가 자주 고르는 폰트 |
| **색상** | 골드(#C9A227) 과다 사용, 크림 카드(#f9f5ed) + 다크 배경 혼재 | 카드/배경 간 명도 대비가 과격해 시각적 불일치 |
| **레이아웃** | 거의 모든 섹션이 중앙 정렬 + 3열 균등 그리드 | 단조롭고 AI 생성 느낌 |
| **컴포넌트** | 하드코딩된 색상값이 40곳 이상 | 디자인 토큰 미활용, 유지보수 어려움 |
| **모션** | `fadeUp` + `pulse` 2개만 사용 | 인터랙션 피드백 부족 |
| **카드** | 모든 카드가 동일한 크림색 + 골드 보더 | 정보 위계 구분 불가 |
| **폼** | 다크 입력란 + 골드 포커스링 일괄 적용 | 맥락에 맞지 않는 곳에도 동일 스타일 |

### 1.2 긍정적 요소 (유지할 것)

- `word-break: keep-all` 한국어 줄바꿈 처리
- `min-h-[100dvh]` iOS Safari 대응
- Grain texture overlay (미세한 질감)
- Glass morphism header (backdrop-blur)
- Bottom tab bar 모바일 네이티브 패턴
- `@media (prefers-reduced-motion)` 접근성 대응
- shadcn/ui 컴포넌트 기반 (유지, 커스텀만 강화)

---

## 2. 디자인 방향: "Organic Warmth" 바이브 아키타입

점술/상담 플랫폼의 특성상 **따뜻함, 신뢰감, 전통미**가 핵심입니다.

### 2.1 새 컬러 팔레트

```
배경 (Background)
├─ bg-deep:     hsl(24, 15%, 5%)     — #0f0d0b  (기존 유사, 미세 조정)
├─ bg-warm:     hsl(30, 12%, 9%)     — #191614  (세컨더리 배경)
└─ bg-surface:  hsl(32, 10%, 13%)    — #231f1b  (카드 배경 — 다크 톤으로 통일)

골드 (Primary Accent)
├─ gold:        hsl(43, 70%, 46%)    — #C9A227  (기존 유지)
├─ gold-soft:   hsl(43, 45%, 55%)    — #C4AD5C  (연한 골드, 서브 요소)
└─ gold-muted:  hsl(43, 20%, 25%)    — #4D4632  (비활성/배경 골드)

단청 (Accent — 절제해서 사용)
├─ dancheong:   hsl(350, 55%, 35%)   — #8B2D3A  (단청 레드, 위험/강조)
└─ lotus:       hsl(340, 40%, 50%)   — #B35C73  (연꽃 핑크, 부드러운 악센트)

텍스트
├─ text-primary:   hsl(35, 20%, 88%)  — #E8DFD2  (본문)
├─ text-secondary: hsl(30, 15%, 55%)  — #9A8B78  (보조)
└─ text-muted:     hsl(30, 10%, 40%)  — #70655A  (비활성)

보더 & 구분선
├─ border-subtle:  hsl(35, 15%, 18%)  — #352F28
└─ border-accent:  hsl(43, 50%, 30%)  — #6B5A23  (골드 보더)

상태
├─ success:  hsl(145, 40%, 35%)  — #357A50
├─ warning:  hsl(35, 70%, 45%)   — #C38A1A
└─ danger:   hsl(0, 50%, 35%)    — #8B3030
```

**핵심 변경**: 크림색 카드(#f9f5ed)를 **다크 서페이스(#231f1b)**로 교체. 전체적으로 다크 톤 통일.

### 2.2 새 타이포그래피

```
한국어 본문:  Pretendard (CDN → next/font/local 로 전환)
영문 디스플레이:  Geist (or Plus Jakarta Sans)
```

| 용도 | 사이즈 | Weight | Leading |
|------|--------|--------|---------|
| Hero 타이틀 | `clamp(2.5rem, 6vw, 4.5rem)` | 900 (Black) | `leading-tight` |
| 섹션 타이틀 | `clamp(1.75rem, 4vw, 2.5rem)` | 700 (Bold) | `leading-snug` |
| 카드 제목 | `text-lg` ~ `text-xl` | 700 | `leading-snug` |
| 본문 | `text-base` | 400 | `leading-relaxed` |
| 캡션/라벨 | `text-sm` | 500 | `leading-normal` |

### 2.3 카드 아키텍처

**기존**: 크림색 배경 + 골드 보더 (모든 카드 동일)

**변경**: 2단계 카드 시스템

```
Surface Card (일반)
─ bg: hsl(32, 10%, 13%)
─ border: 1px solid hsl(35, 15%, 18%)
─ rounded-2xl
─ hover: translateY(-2px) + shadow 확대

Glass Card (강조)
─ bg: rgba(35, 31, 27, 0.6)
─ backdrop-blur-xl
─ border: 1px solid hsl(43, 50%, 30%, 0.2)
─ shadow: inset 0 1px 0 rgba(255,255,255,0.05)
─ rounded-2xl
```

### 2.4 모션 시스템

| 트리거 | 애니메이션 | 속도 |
|--------|-----------|------|
| 스크롤 등장 | `fadeUp` (Y 20px → 0, opacity, blur) | 0.6s spring |
| 카드 호버 | `translateY(-3px)` + shadow 확대 | 0.3s |
| 버튼 호버 | `scale(1.02)` | 0.2s |
| 버튼 클릭 | `scale(0.97)` | 0.1s |
| 탭 전환 | `opacity` crossfade | 0.25s |
| 숫자 카운트업 | 기존 유지 | 2s ease-out |
| 페이지 전환 | 없음 (Next.js 기본) | — |

모든 애니메이션은 `@media (prefers-reduced-motion: reduce)` 래핑.

---

## 3. 페이지별 리디자인 상세

### 3.1 홈 / 랜딩 (`/`, `HomeContent.tsx`)

**현재**: 7개 섹션이 거의 동일한 중앙 정렬 + 3열 그리드
**목표**: 각 섹션마다 다른 레이아웃, 시각적 리듬감

| 섹션 | 현재 레이아웃 | 리디자인 | 세부 사항 |
|------|-------------|---------|----------|
| Hero | 중앙 텍스트 + 2버튼 | **Split Hero (60/40)** | 왼쪽: 타이틀+CTA, 오른쪽: 전통 문양/일러스트 영역. 라디얼 그라디언트 유지하되 비대칭 배치 |
| FortuneCard | 단독 섹션 | **Hero 하단 인라인 삽입** | Hero 아래 자연스럽게 연결, 별도 섹션 X |
| 가치 제안 | 3열 균등 그리드 | **Bento Grid (2fr 1fr 1fr)** | 첫 카드를 크게 (좌 2/3), 나머지 2개를 우측 1/3에 세로 배치 |
| 이용 절차 | 4열 균등 + 수평 라인 | **수직 타임라인** | 모바일 우선 디자인. 왼쪽 연결선 + 오른쪽 콘텐츠. 데스크탑은 지그재그 |
| 상담사 소개 | 3열 균등 카드 | **Spotlight (1대+2소)** | 첫 번째 카드를 크게 (절반 너비), 나머지를 우측 절반에 배치 |
| 신뢰 지표 | 4열 숫자 나열 | **수평 스트립 + 아이콘** | 다크 글래스 바에 가로 배치, 각 지표에 미니 아이콘 추가 |
| 후기 캐러셀 | 중앙 단일 카드 + 좌우 화살표 | **Masonry 3열** | 여러 후기를 동시에 보여주는 staggered 레이아웃 |
| CTA | 중앙 텍스트 + 버튼 | **풀블리드 다크** | 라디얼 그라디언트 강화, 버튼에 글로우 효과 |
| Footer | 3열 링크 | **2열 (로고+설명 | 링크 그룹)** | 좌측에 브랜드 스토리, 우측에 링크 |

### 3.2 로그인 (`/login/page.tsx`)

**현재**: 중앙 글래스 카드 (black/30 + blur). 기능적으로 완성.
**변경 사항**:

- [ ] 카드 배경을 `bg-surface`로 변경 (글래스 → 솔리드 서페이스)
- [ ] 좌측에 브랜드 일러스트 영역 추가 (데스크탑 only, Split 레이아웃)
- [ ] 입력 필드 스타일을 새 토큰으로 통일
- [ ] 소셜 로그인 버튼 간격/크기 개선
- [ ] "관리자 로그인" 링크를 더 subtle하게 (opacity 낮춤)
- [ ] 비밀번호 토글 버튼 아이콘으로 교체 (텍스트 → Eye/EyeOff 아이콘)

### 3.3 회원가입 (`/signup/page.tsx`)

**현재**: 3단계 스텝 위자드 + 글래스 카드. 사주 정보 입력 UI.
**변경 사항**:

- [ ] Progress indicator를 상단 바 형태로 변경 (원형 → 프로그레스 바)
- [ ] Step 2 (사주 정보) 셀렉트 박스를 커스텀 드롭다운으로 교체
- [ ] 생년월일 입력을 달력 피커 + 시간대 선택 통합 UI로
- [ ] 양력/음력 토글을 세그먼트 컨트롤 형태로
- [ ] 성별 선택을 카드 형태 버튼으로 (라디오 → 터치 친화적 카드)
- [ ] Step 3 약관 동의 아코디언 개선 (더 명확한 펼침/접힘 인디케이터)
- [ ] 전체 동의 체크박스를 상단 고정 sticky로

### 3.4 상담사 목록 (`/counselors/page.tsx`)

**현재**: 검색 + 필터칩 + 3열 카드 그리드. 기능적으로 잘 구현됨.
**변경 사항**:

- [ ] 검색바를 글래스 스타일 + 검색 아이콘 추가
- [ ] 필터칩을 수평 스크롤 (모바일) + 호버 효과 강화
- [ ] 카드를 Surface Card로 교체 (크림색 → 다크 서페이스)
- [ ] 카드 내 프로필 이미지 영역 확대 (현재 한자 아이콘 → 실제 아바타 대비)
- [ ] 온라인 상태 표시를 Green dot + pulse 애니메이션으로
- [ ] 즐겨찾기 하트에 클릭 시 scale bounce 추가
- [ ] 빈 결과 상태에 일러스트레이션 추가 (이모지 → SVG 일러스트)
- [ ] 스켈레톤 로딩에 shimmer 효과 개선

### 3.5 상담사 상세 (`/counselors/[id]/`)

**현재**: 동적 import, 기본 구조.
**변경 사항**:

- [ ] Hero 영역: 프로필 사진 + 이름 + 전문 분야를 풀 너비로
- [ ] 평점/리뷰 수를 시각적 별 + 숫자로 크게 표시
- [ ] 소개글 영역에 최대 3줄 + "더 보기" 토글
- [ ] 예약 가능 시간표를 캘린더 그리드로 (주간 뷰)
- [ ] 리뷰 섹션을 하단에 별도 탭으로 분리
- [ ] 하단 고정 CTA 바: "예약하기" 버튼 + 가격 표시
- [ ] 뒤로가기 버튼 추가

### 3.6 운세 (`/fortune/page.tsx`)

**현재**: 복잡한 3-탭 구조 (오늘의 운세 / 띠별 운세 / 궁합). 기능 풍부.
**변경 사항**:

- [ ] 탭 UI를 세그먼트 컨트롤 형태로 (둥근 배경 + 슬라이딩 인디케이터)
- [ ] 오행 밸런스 차트를 레이더 차트 → 수평 바 차트로 (가독성 향상)
- [ ] 점수 표시를 원형 프로그레스로 (기존 유지하되 애니메이션 개선)
- [ ] 카테고리별 운세를 아코디언 카드로 (펼치면 상세 설명)
- [ ] 럭키 아이템 (색상/숫자/방향)을 수평 스트립 카드로
- [ ] 상담사 CTA를 인라인 배너로 (페이지 중간에 자연스럽게)
- [ ] 띠별 운세에 동물 일러스트 추가
- [ ] 궁합 결과를 비주얼 매칭 카드로

### 3.7 마이페이지 (`/mypage/`)

**현재**: 기본 정보 나열 (InfoRow 컴포넌트). 최소한의 UI.
**변경 사항**:

- [ ] 프로필 헤더: 아바타 이니셜 + 이름 + 등급 배지
- [ ] 정보 테이블을 그룹별 카드로 분리 (계정 정보 / 사주 정보 / 설정)
- [ ] 수정/삭제 액션을 각 카드 우상단 아이콘 버튼으로
- [ ] 이메일 인증 배너 디자인 개선 (경고색 → 정보색)
- [ ] 메뉴 항목 추가: 알림 설정, 비밀번호 변경, 회원 탈퇴를 리스트로

### 3.8 지갑 (`/wallet/page.tsx`)

**현재**: 잔액 카드 + 필터 탭 + 거래 내역 리스트. 기능 완성도 높음.
**변경 사항**:

- [ ] 잔액 카드를 그라디언트 배경 카드로 (신용카드 스타일)
- [ ] 잔액과 상담권을 2열 병렬 배치 (현재 세로 스택)
- [ ] 필터 탭 스타일을 세그먼트 컨트롤로 통일
- [ ] 기간 선택을 드롭다운으로 변경 (많은 버튼 → 간결하게)
- [ ] 거래 내역 카드에 좌측 색상 바 추가 (충전=green, 사용=red, 환불=blue)
- [ ] 영수증 다운로드 아이콘 시각적 개선
- [ ] 합계 바에 시각적 강조 (배경색 + 좌우 패딩)

### 3.9 예약 내역 (`/bookings/me/page.tsx`)

**현재**: 예약 카드 리스트 + 상태 뱃지 + 취소 다이얼로그.
**변경 사항**:

- [ ] 상태별 탭 필터 추가 (전체/진행중/완료/취소)
- [ ] 예약 카드에 상담사 아바타 추가
- [ ] 시간 표시를 상대적 시간 포함 ("3시간 후", "어제")
- [ ] 빈 상태 일러스트 개선
- [ ] 취소 다이얼로그 UI 개선 (사유 선택을 카드형으로)
- [ ] 상담 입장 버튼에 카운트다운 타이머 추가

### 3.10 상담 세션 (`/consultation/`)

**현재**: 여러 하위 페이지 (대기실, 프리플라이트, 채팅, 완료, 리뷰, 요약).
**변경 사항**:

- [ ] 대기실에 상담사 정보 카드 + 남은 시간 카운트다운
- [ ] 프리플라이트 체크를 시각적 체크리스트 (카메라/마이크 권한)
- [ ] 채팅 UI를 메시징 앱 스타일로 (말풍선, 타임스탬프)
- [ ] 완료 화면에 세션 요약 + 리뷰 작성 유도
- [ ] 리뷰 폼에 별점 인터랙션 개선 (반별 지원, 터치 스와이프)

### 3.11 상담사 포털 (`/counselor/`)

**현재**: 사이드바 레이아웃 + 9개 메뉴 페이지.
**변경 사항**:

- [ ] 사이드바를 아이콘+텍스트 → 아이콘만 접이식으로
- [ ] 대시보드에 오늘 일정 타임라인 뷰 추가
- [ ] 통계 카드에 미니 차트 (스파크라인) 추가
- [ ] 프로필 편집을 인라인 편집으로 (별도 페이지 → 모달)
- [ ] 정산 페이지에 월별 수익 차트 추가

### 3.12 관리자 (`/admin/`, `/dashboard/`)

**현재**: 기본 데이터 테이블 + 통계 카드.
**변경 사항**:

- [ ] 대시보드에 핵심 KPI 4개를 대형 숫자 카드로
- [ ] 차트 라이브러리 도입 (recharts) - 주간/월간 트렌드
- [ ] 데이터 테이블에 정렬/필터 기능 + 행 호버 효과
- [ ] 사용자 상세 페이지에 활동 타임라인
- [ ] 쿠폰 관리에 유효기간 시각화
- [ ] 분쟁/환불 페이지에 상태 플로우 다이어그램

### 3.13 인증 관련 (`/forgot-password`, `/reset-password`, `/verify-email`, `/auth/callback`)

**현재**: 로그인과 유사한 글래스 카드 스타일.
**변경 사항**:

- [ ] 로그인과 동일한 Split 레이아웃 적용
- [ ] 이메일 발송 성공 화면에 체크마크 애니메이션
- [ ] 비밀번호 강도 미터 추가 (reset-password)
- [ ] 콜백 페이지 로딩 스피너 개선

### 3.14 정적 페이지 (`/terms`, `/privacy`, `/faq`)

**현재**: 아직 미확인 (가능한 기본 텍스트)
**변경 사항**:

- [ ] 일관된 문서 레이아웃 (max-w-3xl, 좌측 TOC)
- [ ] FAQ를 아코디언 UI로
- [ ] 약관/개인정보를 시각적으로 구분된 섹션으로

### 3.15 블로그 (`/blog/`)

**변경 사항**:

- [ ] 카드 그리드 (hero 카드 1 + 나머지 2열)
- [ ] 카테고리 필터 칩
- [ ] 읽기 시간 표시

### 3.16 기타 페이지

| 페이지 | 변경 사항 |
|--------|----------|
| `/onboarding` | 온보딩 플로우를 카드 슬라이더로, 스킵 가능 |
| `/referral` | 추천 코드를 카드형으로, 복사 버튼에 피드백 |
| `/share` | 공유 카드 시각적 개선 |
| `/favorites` | 즐겨찾기 목록을 상담사 카드와 동일 스타일로 |
| `/my-saju` | 사주 정보를 시각적 팔자 차트로 |
| `/recommend` | 추천 결과를 매칭 점수와 함께 |

---

## 4. 공통 컴포넌트 리디자인

### 4.1 AppHeader (`components/app-header.tsx`)

**현재**: sticky + backdrop-blur. 데스크탑 링크 나열 + 모바일 Sheet.
**변경 사항**:

- [ ] Floating Glass Pill 스타일로 변경 (상단에서 살짝 떨어진 형태)
- [ ] 스크롤 시 배경 불투명도 증가 (0.6 → 0.95)
- [ ] 로고를 텍스트 → 아이콘+텍스트로
- [ ] 네비게이션 링크 간격 넓힘 + 호버 시 밑줄 → 배경색 변경
- [ ] 모바일 햄버거를 아이콘 버튼으로 (&#9776; → Lucide Menu)
- [ ] Sheet에 사용자 정보를 상단에 크게 표시

### 4.2 BottomTabBar (`components/bottom-tab-bar.tsx`)

**현재**: 5탭 (홈/운세/상담사/내역/MY). 기능적.
**변경 사항**:

- [ ] 활성 탭에 dot 인디케이터 추가 (아이콘 위 작은 원)
- [ ] 탭 전환 시 아이콘 scale bounce (1 → 1.15 → 1)
- [ ] 홈 탭을 중앙 강조 버튼으로 (나머지보다 살짝 위)
- [ ] 탭 라벨 폰트를 Pretendard로

### 4.3 Card (`components/ui.tsx` → Card)

**현재**: 크림색 배경 + 골드 보더. 호버 시 translateY + 골드 shadow.
**변경 사항**:

```tsx
// Surface Card (기본)
bg-[#231f1b] border border-[#352F28] rounded-2xl
hover:border-[#6B5A23]/40 hover:-translate-y-0.5
transition-all duration-300

// Glass Card (강조)
bg-[rgba(35,31,27,0.6)] backdrop-blur-xl
border border-[#6B5A23]/20
shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]

// Elevated Card (CTA, 핵심 정보)
bg-gradient-to-br from-[#231f1b] to-[#191614]
border border-[#6B5A23]/30
shadow-[0_8px_32px_rgba(0,0,0,0.3)]
```

### 4.4 ActionButton

**현재**: 골드 그라디언트 + 라운드풀. 잘 작동.
**변경 사항**:

- [ ] 호버 시 `scale(1.02)` + shadow 확대
- [ ] 클릭 시 `scale(0.97)` + haptic-like 피드백
- [ ] 로딩 상태에 스피너 아이콘 추가 (텍스트만 → 스피너+텍스트)
- [ ] Ghost variant 추가 (보더만, 배경 투명)

### 4.5 FormField

**변경 사항**:

- [ ] 에러 메시지에 아이콘 추가 (X 마크)
- [ ] 포커스 시 라벨 색상 변경 (골드로)
- [ ] 필수 표시를 별표 → "필수" 텍스트 배지로

### 4.6 EmptyState

**변경 사항**:

- [ ] 이모지 → SVG 일러스트 (또는 Lucide 아이콘 대형)
- [ ] 부가 설명 최대 너비 줄이기 (가독성)
- [ ] 액션 버튼에 화살표 아이콘 추가

### 4.7 StatusBadge

**변경 사항**:

- [ ] 한글 라벨 매핑 추가 (PAID → "결제완료", BOOKED → "예약됨")
- [ ] 상태별 아이콘 추가 (체크, 시계, X 등)
- [ ] 크기 변형 추가 (sm, md)

### 4.8 Toast

**변경 사항**:

- [ ] 상단 우측 고정 → 하단 중앙 (모바일 친화)
- [ ] 타입별 색상 + 아이콘 (success=체크, error=X, info=i)
- [ ] 슬라이드인 애니메이션

---

## 5. 글로벌 CSS 리팩토링 (`globals.css`)

### 5.1 정리 대상

```
삭제:
- Legacy CSS Custom Properties 블록 (전부 @theme inline으로 마이그레이션)
- .app-header 관련 CSS 클래스 (Tailwind 유틸리티로 교체)
- .app-drawer 관련 CSS (shadcn Sheet로 교체 완료)
- .landing-grid-3, .landing-grid-4 (Tailwind grid로 교체)
- .footer-grid (Tailwind grid로 교체)
- .steps-line (레이아웃 변경으로 불필요)
- .btn-primary-lg, .btn-ghost (ActionButton 컴포넌트로 통일)
- .footer-link (Tailwind 유틸리티로)
- .landing-card (Card 컴포넌트로)

유지 + 개선:
- @theme inline 블록 (새 토큰 추가)
- @layer base (새 팔레트로 업데이트)
- Grain overlay
- Skeleton shimmer 애니메이션
- Reduced motion 미디어 쿼리
- Print styles
```

### 5.2 새 @theme inline

```css
@theme inline {
  /* 기존 shadcn 토큰 (새 팔레트로 업데이트) */
  --color-background: hsl(24 15% 5%);
  --color-foreground: hsl(35 20% 88%);
  --color-card: hsl(32 10% 13%);
  --color-card-foreground: hsl(35 20% 88%);
  --color-primary: hsl(43 70% 46%);
  --color-primary-foreground: hsl(24 15% 5%);
  --color-muted: hsl(30 10% 20%);
  --color-muted-foreground: hsl(30 15% 55%);
  --color-border: hsl(35 15% 18%);
  --color-destructive: hsl(0 50% 35%);

  /* 커스텀 시맨틱 토큰 */
  --color-surface: hsl(32 10% 13%);
  --color-surface-hover: hsl(32 10% 16%);
  --color-gold: hsl(43 70% 46%);
  --color-gold-soft: hsl(43 45% 55%);
  --color-gold-muted: hsl(43 20% 25%);
  --color-dancheong: hsl(350 55% 35%);
  --color-lotus: hsl(340 40% 50%);
  --color-success: hsl(145 40% 35%);
  --color-warning: hsl(35 70% 45%);

  /* 라디어스 */
  --radius-card: 1rem;
  --radius-button: 9999px;
  --radius-input: 0.75rem;
}
```

---

## 6. 구현 우선순위

### Phase 1: 기반 (1~2일)

| 순서 | 작업 | 파일 |
|------|------|------|
| 1-1 | Pretendard 폰트 교체 | `layout.tsx` |
| 1-2 | 새 컬러 팔레트 적용 | `globals.css` |
| 1-3 | Card 컴포넌트 리디자인 (다크 서페이스) | `components/ui.tsx` |
| 1-4 | Legacy CSS 정리 | `globals.css` |
| 1-5 | ActionButton/FormField 개선 | `components/ui.tsx` |

### Phase 2: 핵심 페이지 (2~3일)

| 순서 | 작업 | 파일 |
|------|------|------|
| 2-1 | 홈/랜딩 페이지 리디자인 | `HomeContent.tsx` |
| 2-2 | 로그인/회원가입 리디자인 | `login/page.tsx`, `signup/page.tsx` |
| 2-3 | 상담사 목록 리디자인 | `counselors/page.tsx`, `CounselorCard.tsx` |
| 2-4 | AppHeader 리디자인 | `components/app-header.tsx` |
| 2-5 | BottomTabBar 개선 | `components/bottom-tab-bar.tsx` |

### Phase 3: 기능 페이지 (2~3일)

| 순서 | 작업 | 파일 |
|------|------|------|
| 3-1 | 운세 페이지 리디자인 | `fortune/page.tsx` |
| 3-2 | 지갑 리디자인 | `wallet/page.tsx` |
| 3-3 | 마이페이지 리디자인 | `mypage/page.tsx` |
| 3-4 | 예약 내역 리디자인 | `bookings/me/page.tsx` |
| 3-5 | 상담 세션 페이지들 | `consultation/` |

### Phase 4: 포털/어드민 (1~2일)

| 순서 | 작업 | 파일 |
|------|------|------|
| 4-1 | 상담사 포털 리디자인 | `counselor/` |
| 4-2 | 관리자 대시보드 리디자인 | `admin/`, `dashboard/` |
| 4-3 | 정적 페이지 정리 | `terms/`, `privacy/`, `faq/` |

### Phase 5: 마무리 (1일)

| 순서 | 작업 |
|------|------|
| 5-1 | 나머지 페이지 스타일 통일 |
| 5-2 | 반응형 전수 검증 (320px ~ 1440px) |
| 5-3 | 접근성 검증 (color contrast, focus ring, aria) |
| 5-4 | 라이트하우스 성능 측정 |
| 5-5 | 테스트 수정 (UI 변경에 따른 셀렉터 업데이트) |

---

## 7. 기술적 제약 및 주의사항

### 유지해야 할 것
- shadcn/ui 컴포넌트 기반 (교체 아님, 커스터마이징)
- Tailwind CSS v4 (`@import "tailwindcss"` + `@theme inline`)
- Next.js App Router 구조
- 기존 API 클라이언트 (`api-client.ts`) 그대로
- i18n (`next-intl`) 번역 키 유지
- 기존 비즈니스 로직 (인증, 결제, 예약) 변경 없음

### 주의
- `framer-motion` 미설치 → CSS 애니메이션 + Tailwind `transition` 유지
- 기존 Jest/Playwright 테스트가 UI 셀렉터에 의존 → 각 Phase 후 테스트 수정 필요
- 폰트 변경 시 `next/font/google` → `next/font/local` (Pretendard는 로컬 호스팅 필요)
- 크림색 카드를 다크로 바꾸면 내부 텍스트 색상도 전부 변경 필요

---

## 8. 디자인 검증 체크리스트

각 Phase 완료 시 확인:

- [ ] 한국어 텍스트: `break-keep-all`, Pretendard, `leading-snug/tight`
- [ ] 인접 섹션이 서로 다른 레이아웃 사용
- [ ] CTA 버튼: `px-8 py-4` 최소, hover+active 상태
- [ ] 색상 대비: WCAG 2.1 AA (본문 4.5:1, 대형 텍스트 3:1)
- [ ] `@media (prefers-reduced-motion)` 래핑
- [ ] 모바일 레이아웃: `w-full px-4` (768px 이하)
- [ ] 금지 폰트 없음 (Noto Sans KR, Noto Serif KR, Inter)
- [ ] 이모지 미사용 (UI 내 → 아이콘/SVG로 교체)
- [ ] 순수 #000000 미사용 → 틴티드 다크
- [ ] 골드 그라디언트 텍스트 페이지당 최대 1곳
