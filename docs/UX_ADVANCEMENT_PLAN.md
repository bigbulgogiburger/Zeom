# 천지연꽃신당 UX/UI 고도화 계획서

> 작성일: 2026-03-22
> 현재 점수: ~83/100 (Phase 1-2 + TOP5 수정 후)
> 목표 점수: 90+/100 (Agency-Grade)

---

## 1. 현재 상태 요약

### 완료된 작업 (Phase 1-2)
- globals.css: Organic Warmth 팔레트 + Pretendard/Geist 폰트
- layout.tsx: Skip-to-content, Geist CDN, Pretendard CDN
- HomeContent.tsx: Bento/Spotlight/Stagger 레이아웃
- login/signup: 솔리드 서페이스 카드, Eye 아이콘, 세그먼트 컨트롤
- ui.tsx: Card 3-variant, StatusBadge 한글, ActionButton variant
- app-header.tsx: Tailwind 유틸리티 전환, Lucide Menu
- bottom-tab-bar.tsx: Dot 인디케이터, bounce 애니메이션

### 미완료: 35+ 페이지가 구 디자인 시스템

| 상태 | 파일 수 | 특징 |
|------|---------|------|
| **하드코딩 hex** | 21개 | `#C9A227`, `#0f0d0a` 직접 사용 |
| **구 var(--color-xxx) 토큰** | 14개 | 삭제된 CSS 변수 참조 (런타임 무시됨) |
| **이모지 사용** | 8개 | UI에 직접 이모지 렌더링 |
| **신규 hsl() 토큰** | 6개 | Phase 1-2에서 이미 전환됨 |

---

## 2. 디자인 시스템 통일 (필수)

### 2.1 토큰 마이그레이션 매트릭스

모든 파일에서 아래 매핑으로 일괄 교체 필요:

```
구 토큰/하드코딩                    →  신규 토큰
────────────────────────────────────────────────────
#C9A227                            →  hsl(var(--gold))
#D4A843                            →  hsl(var(--gold-soft))
#b08d1f                            →  hsl(var(--gold))/0.85
#0f0d0a                            →  hsl(var(--background))
#1a1612                            →  hsl(var(--surface))
#a49484                            →  hsl(var(--text-secondary))
#f9f5ed                            →  hsl(var(--text-primary))
#8B0000                            →  hsl(var(--dancheong))
var(--color-bg-primary)            →  hsl(var(--background))
var(--color-bg-secondary)          →  hsl(var(--surface))
var(--color-bg-card)               →  hsl(var(--surface))
var(--color-bg-card-hover)         →  hsl(var(--surface-hover))
var(--color-text-on-dark)          →  hsl(var(--text-primary))
var(--color-text-on-card)          →  hsl(var(--text-primary))
var(--color-text-muted-dark)       →  hsl(var(--text-secondary))
var(--color-text-muted-card)       →  hsl(var(--text-secondary))
var(--color-gold)                  →  hsl(var(--gold))
var(--color-gold-hover)            →  hsl(var(--gold))/0.85
var(--color-accent-primary)        →  hsl(var(--dancheong))
var(--color-border-dark)           →  hsl(var(--border-subtle))
var(--color-border-card)           →  hsl(var(--border-subtle))
var(--color-success)               →  hsl(var(--success))
var(--color-warning)               →  hsl(var(--warning))
var(--color-danger)                →  hsl(var(--dancheong))
rgba(201,162,39,0.1)               →  hsl(var(--gold)/0.1)
rgba(201,162,39,0.15)              →  hsl(var(--gold)/0.15)
```

### 2.2 이모지 → Lucide 아이콘 교체

| 페이지 | 현재 이모지 | 교체 아이콘 |
|--------|-----------|------------|
| cash/buy | 💳🟡🔵🟢🏦💰 | `CreditCard`, `Coins`, `Building2`, `Banknote` |
| onboarding | ✨🃏🔮🌙❤️💰🚀🏠 | `Sparkles`, `Layers`, `Eye`, `Moon`, `Heart`, `Coins`, `Rocket`, `Home` |
| sessions | 🖥️📱 | `Monitor`, `Smartphone` |
| disputes | ⚖️ | `Scale` |
| refunds | 🔄 | `RotateCcw` |
| fortune | 점수 이모지 | `Star`, `TrendingUp`, `Heart`, `Briefcase` |

### 2.3 파일별 작업 목록

**Priority A: 사용자 트래픽 높은 페이지 (즉시)**

| 파일 | 작업 | 예상 난이도 |
|------|------|------------|
| `fortune/page.tsx` | hex → token, 이모지 → 아이콘, 카드 서페이스 전환, 탭 UI 세그먼트 컨트롤 | High (500+ lines) |
| `counselors/page.tsx` | hex/var → token, 검색바 스타일, 스켈레톤 업데이트 | Medium |
| `counselors/CounselorCard.tsx` | hex/var → token, 카드 서페이스, 즐겨찾기 애니메이션 | Low |
| `wallet/page.tsx` | hex/var → token, 잔액 카드 그라디언트, 필터 세그먼트 | Medium |
| `mypage/page.tsx` | var → token, 카드 서페이스, 프로필 헤더 추가 | Low |

**Priority B: 전환/유입 관련 (1주 내)**

| 파일 | 작업 |
|------|------|
| `onboarding/page.tsx` | 이모지 → 아이콘, 스텝 UI 개선, 카드 서페이스 |
| `referral/page.tsx` | token 전환, 공유 카드 시각적 개선 |
| `forgot-password/page.tsx` | token 전환, 로그인과 스타일 통일 |
| `reset-password/page.tsx` | token 전환, 비밀번호 강도 미터 |
| `verify-email/page.tsx` | token 전환, 체크마크 애니메이션 |
| `auth/callback/page.tsx` | token 전환, 로딩 스피너 개선 |

**Priority C: 내부 기능 페이지 (2주 내)**

| 파일 | 작업 |
|------|------|
| `bookings/me/page.tsx` | token 전환, 상태별 탭 필터 |
| `sessions/page.tsx` | token 전환, 이모지 → 아이콘 |
| `consultations/page.tsx` | token 전환, 세션 타임라인 뷰 |
| `credits/page.tsx`, `buy/page.tsx`, `history/page.tsx` | token 전환, 구매 UI 개선 |
| `cash/buy/page.tsx` | token 전환, 이모지 → 아이콘, 결제수단 카드 |
| `disputes/page.tsx` | token 전환, 이모지 → 아이콘 |
| `refunds/page.tsx`, `new/page.tsx` | token 전환, 이모지 → 아이콘 |
| `notifications/page.tsx` | token 전환 |

**Priority D: 포털/어드민 (3주 내)**

| 파일 | 작업 |
|------|------|
| `counselor/layout.tsx` | hex → token, 사이드바 다크 서페이스 |
| `counselor/*.tsx` (9페이지) | token 전환, 통계 카드 개선 |
| `dashboard/page.tsx` | token 전환, KPI 카드 개선 |
| `admin/*.tsx` (7페이지) | token 전환, 데이터 테이블 개선 |
| `admin/login/page.tsx` | token 전환, 로그인과 스타일 통일 |

**Priority E: 공유 컴포넌트**

| 파일 | 작업 |
|------|------|
| `fortune-card.tsx` | hex → token, 이모지 → 아이콘 |
| `empty-state.tsx` | hex → token (ui.tsx EmptyState와 중복 여부 확인) |
| `share-card.tsx` | hex → token |
| `counselor-auth.tsx` | var → token |
| `social-login-buttons.tsx` | 스타일 통일 확인 |
| `credit-widget.tsx` | 스타일 통일 확인 |
| `wallet-widget.tsx` | 스타일 통일 확인 |

---

## 3. UX 고도화 기회

### 3.1 전환율 개선 (Conversion)

#### 3.1.1 상담사 카드 신뢰 요소 강화
**현재**: 이름 + 전문 분야 + 소개 + "프로필 보기" 버튼
**개선**:
- [ ] 프로필 이미지 또는 이니셜 아바타 (배경 그라디언트 개인화)
- [ ] 평균 평점 + 리뷰 수 인라인 표시 (별 + "4.8 (127)")
- [ ] "지금 상담 가능" 실시간 상태 표시 (green dot + pulse)
- [ ] 최근 후기 한 줄 미리보기
- [ ] 가격/분당 요금 표시
- [ ] 빠른 예약 버튼 (카드에서 바로)

#### 3.1.2 첫 방문자 온보딩 개선
**현재**: 4-스텝 온보딩 (이모지 기반)
**개선**:
- [ ] 풀스크린 카드 슬라이더 (swipe 가능)
- [ ] 각 스텝에 일러스트 또는 Lottie 애니메이션
- [ ] 스킵 버튼 위치를 우상단으로 (더 접근하기 쉽게)
- [ ] 마지막 스텝에서 무료 운세 → 회원가입 유도 CTA
- [ ] 진행률 표시 (프로그레스 바)

#### 3.1.3 운세 → 유료 전환 퍼널
**현재**: 운세 결과 하단에 상담사 CTA 배너
**개선**:
- [ ] 운세 점수가 낮은 카테고리에 "전문 상담 추천" 인라인 카드
- [ ] "이 운세를 전문가에게 더 자세히 물어보세요" 컨텍스트 CTA
- [ ] 운세 공유 시 추천 코드 포함 (바이럴 루프)
- [ ] 일간 운세 푸시 알림 → 앱 재방문 유도

#### 3.1.4 결제 UX 개선
**현재**: 캐시 충전 + 상담권 구매 별도
**개선**:
- [ ] 결제 수단별 아이콘 카드 (카카오페이, 네이버페이, 카드)
- [ ] 충전 금액 프리셋 버튼 (1만/3만/5만/10만) + 직접입력
- [ ] 충전 시 보너스 표시 ("5만원 충전 → 2,500원 보너스")
- [ ] 결제 완료 confetti 애니메이션
- [ ] 지갑 잔액 부족 시 인라인 충전 모달

### 3.2 리텐션 개선 (Retention)

#### 3.2.1 마이페이지 프로필 허브
**현재**: 단순 정보 나열 (InfoRow)
**개선**:
- [ ] 프로필 헤더: 아바타 (이니셜) + 이름 + 등급 배지 + 가입일
- [ ] 사주 정보 시각화: 오행 밸런스 미니 차트
- [ ] 활동 요약 카드: "이번 달 상담 2회 | 다음 예약 3/25"
- [ ] 즐겨찾기 상담사 퀵 액세스 (가로 스크롤 아바타)
- [ ] 메뉴 그룹화: 계정 / 상담 / 설정 섹션 분리

#### 3.2.2 예약 내역 타임라인 뷰
**현재**: 카드 리스트
**개선**:
- [ ] 날짜별 그룹핑 (오늘 / 이번 주 / 지난 달)
- [ ] 진행 중 예약을 상단 고정 (sticky card)
- [ ] 상담 시작까지 카운트다운 타이머
- [ ] 상담사 아바타 + 빠른 메시지 버튼
- [ ] 상태별 탭 필터 (전체/예정/완료/취소)

#### 3.2.3 알림 센터 개선
**현재**: 기본 리스트
**개선**:
- [ ] 읽음/안읽음 시각적 구분 (left border color)
- [ ] 알림 유형별 아이콘 (예약, 결제, 시스템)
- [ ] 스와이프로 삭제 (모바일)
- [ ] "모두 읽음" 버튼
- [ ] 알림 설정 바로가기

### 3.3 탐색 경험 개선 (Discovery)

#### 3.3.1 상담사 검색/필터 UX
**현재**: 텍스트 검색 + 칩 필터 + 정렬 드롭다운
**개선**:
- [ ] 검색바에 돋보기 아이콘 + 클리어 버튼
- [ ] 필터 칩에 선택 개수 배지
- [ ] 가격 범위 슬라이더 필터
- [ ] "추천순" 기본 정렬에 ML 기반 추천 (향후)
- [ ] 최근 검색어 저장 (localStorage)
- [ ] 검색 결과 없을 때 추천 상담사 표시

#### 3.3.2 상담사 상세 페이지 강화
**현재**: 기본 프로필 + 예약 슬롯
**개선**:
- [ ] Hero 섹션: 대형 프로필 + 평점 + 리뷰 수 + 상담 건수
- [ ] 전문 분야 태그 (배지)
- [ ] 주간 캘린더 뷰 (시간대 선택)
- [ ] 리뷰 탭 (별점 분포 차트 + 최신 리뷰)
- [ ] 유사 상담사 추천 (하단)
- [ ] 모바일 하단 고정 CTA 바 ("예약하기 | ₩30,000/30분")

#### 3.3.3 블로그/콘텐츠 영역
**현재**: 기본 구조만 존재
**개선**:
- [ ] Hero 카드 (최신 글) + 나머지 2열 그리드
- [ ] 카테고리 필터 칩
- [ ] 읽기 시간 표시
- [ ] 관련 상담사 연결 (글 하단)
- [ ] SEO 최적화된 메타데이터

### 3.4 상담 세션 UX 개선

#### 3.4.1 대기실 (Waiting Room)
**현재**: 기본 대기 화면
**개선**:
- [ ] 상담사 프로필 카드 + "곧 연결됩니다" 메시지
- [ ] 남은 시간 카운트다운 (원형 프로그레스)
- [ ] 카메라/마이크 사전 테스트 UI
- [ ] 네트워크 품질 표시
- [ ] 상담 팁 카루셀 (대기 중 읽을 콘텐츠)

#### 3.4.2 상담 완료 후
**현재**: 기본 완료 화면
**개선**:
- [ ] 세션 요약 카드 (시간, 상담사, 주제)
- [ ] 별점 리뷰 인라인 UI (별도 페이지 이동 없이)
- [ ] "다음 상담 예약" CTA
- [ ] 운세 재확인 링크
- [ ] 소셜 공유 (경험 공유)

### 3.5 모바일 네이티브 경험

#### 3.5.1 터치 인터랙션
- [ ] 카드 스와이프 (예약 내역, 알림)
- [ ] Pull-to-refresh 패턴
- [ ] 하단 시트 (Bottom Sheet) 필터/정렬
- [ ] 햅틱 피드백 (버튼 클릭 시 navigator.vibrate)

#### 3.5.2 PWA 지원
- [ ] manifest.json 추가 (홈 화면 추가)
- [ ] 오프라인 fallback 페이지
- [ ] 앱 아이콘 + 스플래시 스크린

---

## 4. 비주얼 고도화

### 4.1 일러스트레이션 시스템

현재 한자 텍스트(蓮, 月, 星)를 사용하는 곳에 커스텀 SVG 일러스트 도입:

| 용도 | 현재 | 개선 |
|------|------|------|
| 상담사 아바타 | 한자 텍스트 | 이니셜 + 배경 그라디언트 (개인별 고유 색상) |
| 가치 제안 아이콘 | 한자 (蓮, 鎖, 談) | 미니멀 라인 아이콘 (SVG) |
| 운세 카테고리 | 이모지 | 커스텀 아이콘 세트 (오행 기반) |
| 빈 상태 | Package/Search 아이콘 | 전용 일러스트 (찻잔, 연꽃 등) |
| 온보딩 | 이모지 | Lottie 또는 SVG 애니메이션 |

### 4.2 모션 시스템 확장

| 패턴 | 현재 | 추가 |
|------|------|------|
| 페이지 진입 | fade-up | staggered cascade (자식 요소 순차 등장) |
| 숫자 변화 | countUp | odometer 스타일 (자릿수별 롤링) |
| 탭 전환 | 즉시 교체 | crossfade (opacity 0→1, 0.25s) |
| 카드 추가/삭제 | 즉시 렌더 | slide + fade (리스트 애니메이션) |
| 토스트 알림 | 기본 표시 | slide-up + auto-dismiss 프로그레스 바 |
| 모달 | 즉시 표시 | scale(0.95→1) + backdrop fade |
| 별점 선택 | 클릭 즉시 | scale bounce + 색상 fill 애니메이션 |

### 4.3 다크/라이트 모드

현재 다크만 지원. 라이트 모드 추가 시 고려사항:

```css
/* 라이트 모드 팔레트 */
.light {
  --background: 40 30% 97%;      /* #FAF7F2 warm white */
  --foreground: 30 20% 15%;      /* #2D2520 warm black */
  --surface: 40 20% 94%;         /* #F2EDE6 */
  --border-subtle: 35 15% 88%;   /* #E5DDD2 */
  --gold: 43 70% 40%;            /* 약간 어두운 골드 for contrast */
}
```

- 토글: 헤더 우상단 Sun/Moon 아이콘
- 시스템 설정 자동 감지 (`prefers-color-scheme`)
- 전환 애니메이션: 0.3s crossfade

---

## 5. 성능 최적화

### 5.1 렌더링 성능

| 이슈 | 현재 | 개선 |
|------|------|------|
| Trust metrics 섹션 | `backdrop-blur-xl` 스크롤 콘텐츠 | 고정 배경 또는 blur 제거 |
| 폰트 로딩 | CDN link (render-blocking 가능) | `preload` + `font-display: swap` |
| 이미지 | 없음 (텍스트 위주) | 프로필 이미지 추가 시 `next/image` + lazy |
| 번들 | lucide-react 전체 | tree-shaking 확인 (named import만) |

### 5.2 UX 성능 (체감 속도)

- [ ] 스켈레톤 로딩 전 페이지 적용 (특히 counselors, bookings)
- [ ] Optimistic UI: 즐겨찾기 토글 즉시 반영 → 실패 시 롤백
- [ ] 검색 debounce 300ms → 200ms (현재 300ms)
- [ ] 페이지 전환 시 상단 프로그레스 바 (NProgress 스타일)

---

## 6. 접근성 (A11y) 강화

### 현재 잘 되어 있는 것
- Skip-to-content 링크
- `aria-label` on 아이콘 버튼
- `aria-busy` on 로딩 버튼
- `role="alert"` on 에러 메시지
- `prefers-reduced-motion` 대응
- `focus-visible` 포커스 링

### 추가 필요
- [ ] 모든 아이콘 버튼에 `aria-label` 검증 (특히 미전환 페이지)
- [ ] 상담사 카드에 `article` 시맨틱 래핑
- [ ] 폼 에러 시 `aria-describedby` 연결
- [ ] 모달에 포커스 트랩 (shadcn Dialog가 처리하지만 커스텀 모달 확인)
- [ ] 색상 대비 검증 (특히 text-muted on surface: 5.2:1 확인)
- [ ] 키보드 네비게이션: 캘린더, 탭, 필터 칩

---

## 7. 구현 우선순위 로드맵

### Sprint 1 (1주): 토큰 통일 + 핵심 페이지
```
Day 1-2: 토큰 일괄 마이그레이션 (grep + replace)
         → fortune, wallet, mypage, counselors, bookings
Day 3:   이모지 → 아이콘 교체 (cash, onboarding, sessions, disputes, refunds)
Day 4:   인증 페이지 스타일 통일 (forgot/reset/verify/callback)
Day 5:   공유 컴포넌트 전환 (fortune-card, share-card, empty-state)
         + 빌드 검증 + E2E 테스트
```

### Sprint 2 (1주): UX 개선 + 상담사 경험
```
Day 1:   상담사 카드 신뢰 요소 (평점, 상태, 가격)
Day 2:   상담사 상세 페이지 Hero + 캘린더 뷰
Day 3:   예약 내역 타임라인 + 상태 탭
Day 4:   마이페이지 프로필 허브
Day 5:   알림 센터 개선 + 테스트
```

### Sprint 3 (1주): 포털/어드민 + 모션
```
Day 1-2: 상담사 포털 9페이지 토큰 전환
Day 3:   어드민 7페이지 토큰 전환
Day 4:   모션 시스템 확장 (stagger, crossfade, list animation)
Day 5:   다크/라이트 모드 토글 (선택적)
         + 전체 회귀 테스트
```

### Sprint 4 (선택): 프리미엄 터치
```
- PWA manifest
- 일러스트레이션 시스템
- 결제 UX 개선 (confetti, 인라인 충전)
- 온보딩 리디자인 (카드 슬라이더)
- 성능 최적화 (preload, bundle 분석)
```

---

## 8. 측정 기준

### 디자인 품질 KPI

| 지표 | 현재 | Sprint 1 후 | Sprint 3 후 |
|------|------|------------|------------|
| 토큰 통일률 | 17% (6/35) | 85% | 100% |
| 이모지 사용 페이지 | 8개 | 0개 | 0개 |
| 디자인 점수 | ~83 | ~88 | ~92 |
| E2E 테스트 | 10/10 | 10/10 | 15/15 |

### UX KPI (추적 권장)

| 지표 | 측정 방법 |
|------|----------|
| 회원가입 전환율 | 홈 방문 → 회원가입 완료 |
| 운세→상담 전환 | 운세 조회 → 상담 예약 |
| 재방문율 | 7일 내 재방문 비율 |
| 세션 완료율 | 예약 → 상담 완료 비율 |
| 모바일 이탈률 | 모바일 bounce rate |

---

## 9. 기술 부채 정리

| 항목 | 설명 | 우선순위 |
|------|------|---------|
| `empty-state.tsx` vs `ui.tsx EmptyState` | 중복 컴포넌트 — 하나로 통합 | High |
| `counselor-auth.tsx` 구 토큰 | 삭제된 CSS 변수 참조 | High |
| `FortuneCard` vs `fortune/page.tsx` | 홈의 FortuneCard와 운세 페이지 코드 중복 | Medium |
| inline `style={{}}` 잔존 | bottom-tab-bar 등에 인라인 스타일 | Low |
| 미사용 CSS 클래스 | globals.css에서 삭제했으나 참조 잔존 확인 | Medium |
| 타입 안전성 | `any` 타입 사용 곳 정리 | Low |
