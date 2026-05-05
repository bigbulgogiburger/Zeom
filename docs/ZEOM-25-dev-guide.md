# [ZEOM-25] [P4-D] Group D 사용자 보조 16페이지 — 개발 가이드

> 생성일: 2026-05-05
> 스택: Next.js 15 + React 19 + Tailwind v4 + shadcn/ui
> 페르소나: React Expert
> 부모: ZEOM-6 → ZEOM-1
> Stacked on: feature/ZEOM-24 (bfc29df)
> 활용: ZEOM-24 신규(.prose, .stagger-grid, AnchorNav, Accordion)

## 1. 요구사항 요약

### 비즈니스 목표
사용자 보조 16 페이지(mypage 4 / wallet+credits 4 / fortune+saju 2 / 액션소셜 4 / 알림 2)를 §4.4 처방으로 통일. ZEOM-21 baseline(hex/entity 0건) 적용 + tabular-nums(60px serif gold 잔액) + reduced-motion 가드.

### 인수조건
- [ ] 16 페이지 §4.4 처방 일치
- [ ] tabular (지갑 잔액 60px serif gold, 모든 금액)
- [ ] mypage 좌측 nav (모바일 drawer)
- [ ] my-saju 단청 SVG reduced-motion 정적
- [ ] referral 코드 복사 (Clipboard API + 토스트) — **이미 구현됨**
- [ ] notification-preferences 토글 그리드 keyboard nav
- [ ] verify-fortune PASS
- [ ] verify-payment-wallet PASS
- [ ] verify-notification-system PASS

### 제약사항
- hex 0 / entity 0 / emoji 0 / inline-style 0 baseline 유지
- 폰트: Pretendard + Gowun Batang (`var(--font-heading)`)
- 토큰: `hsl(var(--xxx))` 또는 단축 클래스(`text-gold`, `bg-surface-2`)
- Korean text: `word-break: keep-all` (globals body 상속)

## 2. 영향 범위

### 수정 16 + 신규 1-2

| 파일 | 라인 (기존) | 위반 (현재) | 변경 |
|------|------|---------|------|
| **D.1 Mypage** | | | |
| /mypage | 242 | hex 26 / entity 2 | 좌측 240px sticky nav + Hero(avatar 80 + name + stats card 3) |
| /mypage/edit | 142 | hex 2 | 폼 카드 max-600 + Section divider |
| /mypage/password | 141 | hex 3 | 폼 + PasswordStrengthMeter (ZEOM-23) |
| /mypage/delete | 90 | hex 1 | Danger 카드 (`--destructive` alert + 약관 + Button variant=destructive) |
| **D.2 Wallet/Credits** | | | |
| /wallet | 462 | hex 33 / emoji 2 | Hero(잔액 60px serif tabular gold + WalletChip) + 듀얼 CTA + 거래내역 |
| /credits | 148 | emoji 1 | wallet 패턴 |
| /credits/buy | 300 | hex 1 / emoji 2 | Cash buy 패키지 그리드 재사용 |
| /credits/history | 121 | clean | 풀폭 테이블 + Seg 필터 + 페이지네이션 |
| **D.3 Fortune/Saju** | | | |
| /fortune | 879 | hex 94 / entity 106 / emoji 12 / style 5 | Hero(오늘 + 운세 1줄) + 4분면 그리드(총운/연애/재물/건강), tabular |
| /my-saju | 320 | entity 28 / style 4 | 사주 팔자판 + 단청 동심원 SVG (motion-reduce 정적) |
| **D.4 Action/Social** | | | |
| /favorites | 177 | emoji 6 | Counselor 카드 그리드 + EmptyState |
| /recommend | 439 | hex 6 / emoji 5 | Hero + 3 추천 카드 |
| /referral | 273 | clean | gold border 코드 카드 + 복사 (이미 ✓) + 보너스 안내 |
| /share | 91 | hex 1 / style 1 | OG 미리보기 + 공유 채널 그리드 |
| **D.5 Notifications** | | | |
| /notifications | 308 | emoji 1 | 리스트 + 읽지 않음 좌측 gold dot |
| /notification-preferences | 178 | style 2 | 카테고리×채널(이메일/푸시/SMS) 토글 그리드 + keyboard nav |

### 신규 컴포넌트 (필요 시)
- `web/src/components/design/sidebar-nav.tsx` — mypage 좌측 nav (AnchorNav와 다른 routing 기반, 모바일 drawer/select)
- `web/src/components/design/dancheong-svg.tsx` — my-saju 단청 동심원 인라인 SVG (motion-reduce 가드)

### 연관 (수정 안 함)
- `web/src/lib/hooks/use-toast.ts` — 토스트 (referral)
- `web/src/components/design/{empty-state, password-strength-meter, anchor-nav, wallet-chip}` 등 barrel
- `web/src/app/cash/buy/` — credits/buy 패턴 참조

## 3. 구현 계획 (5 Cluster Phase)

각 cluster 완료 후 harness-review + cluster commit.

### Phase 1 — D.1 Mypage 4 (60–90분)
1. 신규 SidebarNav 컴포넌트 (mypage 4 페이지 공통 nav, 라우팅 기반)
2. /mypage Hero(avatar+name+stats 카드 3) + 좌측 SidebarNav
3. /mypage/edit, /mypage/password (PasswordStrengthMeter 적용), /mypage/delete (Danger 패턴)
4. hex/entity → 토큰. inline 색상 제거.

### Phase 2 — D.2 Wallet/Credits 4 (75–90분)
1. /wallet Hero — 60px serif tabular gold 잔액 + WalletChip + 듀얼 CTA + 거래내역 테이블
2. /credits — wallet 동일 패턴
3. /credits/buy — Cash 페이지 패턴 활용 (이미 cash/buy 있음)
4. /credits/history — Seg 필터 + 풀폭 테이블 + 페이지네이션
5. emoji 제거(🎉🍜), hex 33+1+0+0 → 토큰

### Phase 3 — D.3 Fortune/Saju 2 (90–120분, 가장 큼)
1. /fortune 879L 전면 재작성:
   - Hero (오늘 날짜 + 운세 한 줄)
   - 4분면 그리드 (총운/연애/재물/건강)
   - 카테고리 emoji 12개 → Dot 색상 또는 lucide 아이콘
   - inline style → className/토큰
   - hex 94 / entity 106 → 토큰화
   - tabular for score
   - reduced-motion 가드 (transition-all duration-1000)
2. /my-saju 320L:
   - 사주 8자 PillarCell
   - **단청 동심원 SVG**: 신규 dancheong-svg.tsx 컴포넌트 (회전 animation + motion-reduce 정적)
   - entity 28 → 한자 직접 사용 (UTF-8) 또는 토큰
   - inline style → className

### Phase 4 — D.4 Action/Social 4 (60–90분)
1. /favorites — Counselor 카드 그리드(stagger-grid) + EmptyState. emoji 6개(전문분야 아이콘) → Dot 또는 텍스트 chip
2. /recommend — Hero(36px serif) + 3 추천 카드 stagger
3. /referral — 273L 이미 hex 0건. gold border 코드 카드 + 복사(기존 유지) + 보너스 안내. 컴포넌트 정렬만
4. /share — OG 미리보기 카드 + 공유 채널 버튼 그리드. inline-style 1건 → className

### Phase 5 — D.5 Notifications 2 (45–60분)
1. /notifications — 리스트 + 읽지 않음 좌측 gold Dot. emoji 1건 제거
2. /notification-preferences — 카테고리×채널 토글 그리드 (keyboard nav role=switch + arrow key 이동). inline-style 2건 제거. 커스텀 toggle → shadcn Switch 검토 (없으면 native + role=switch)

### Phase 6 — 통합 검증
- audit grep: hex 0 / entity 0 / emoji 0 / inline-style 0 (16 페이지)
- tsc 0 errors / next build 75+ routes
- jest baseline 유지
- harness-review final + verify-fortune + verify-payment-wallet + verify-notification-system

## 4. 기술 상세

### 핵심 결정
- **SidebarNav vs AnchorNav**: AnchorNav는 단일 페이지 anchor용. mypage 4 페이지는 라우트 기반 nav 필요 → SidebarNav 신규. props: `items: { href, label }[]`. usePathname으로 active 검증.
- **단청 SVG**: 인라인 `<svg>`, raster 금지. `<animateTransform attributeName="transform" type="rotate"/>` + CSS `@media (prefers-reduced-motion: reduce) { animateTransform { display: none } }` (또는 React state로 conditionally 렌더)
- **잔액 60px serif gold**: `font-heading text-[60px] leading-none text-gold tabular`. 통화 단위는 14px secondary.
- **Toggle**: shadcn Switch 미설치. native `<input type="checkbox" role="switch">` + 키보드 nav 자동. arrow key 그리드 nav는 별도 onKeyDown 구현.

### 위험 요소

| 위험 | 영향도 | 대응 |
|------|--------|------|
| /fortune 879L 전면 재작성 시 기능 회귀 | High | 점수 계산 로직 / API 호출은 그대로 두고 presentation만 교체. 기존 ScoreGauge SVG는 토큰화하여 유지 |
| 단청 SVG 모션이 prefers-reduced-motion에서 멈추지 않음 | Medium | CSS 미디어 쿼리 + JS state 이중 가드 |
| Mypage SidebarNav 모바일 drawer | Low | shadcn Sheet 활용 |
| 16 페이지 한 PR로 리뷰 부담 | Medium | 5 cluster 5 commit으로 분리. 머지는 단일 PR |
| ZEOM-24 head에 stacked → 머지 순서 의존 | Medium | ZEOM-24 머지 후 main으로 rebase 자동 가능 |

### 외부 연동
없음 (UI presentation만, 기존 API 유지).

## 5. 병렬 작업 가이드
순차 진행 권장. 같은 디자인 토큰/공통 컴포넌트(.prose, AnchorNav)를 다 cluster에서 사용하므로 cluster 간 의존 약함. 단 dev-guide 일관성 + harness-review 단위로 cluster별 commit 패턴이 더 안전.

## 6. DoD
- [ ] 16 페이지 §4.4 처방 일치
- [ ] hex/entity/emoji/inline-style 0건 (16 페이지)
- [ ] tabular 잔액 60px serif gold (wallet/credits)
- [ ] mypage SidebarNav (모바일 drawer)
- [ ] my-saju 단청 SVG + reduced-motion 가드
- [ ] referral Clipboard 유지 (이미 ✓)
- [ ] notification-preferences keyboard nav
- [ ] tsc 0 / build 성공 / jest baseline
- [ ] verify-fortune + verify-payment-wallet + verify-notification-system 모두 PASS
- [ ] harness-review aggregate PASS
- [ ] 5 cluster 5 commit + 1 squash 또는 sequential commits
