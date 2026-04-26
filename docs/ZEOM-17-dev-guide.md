# [ZEOM-17] [P2-1] 가벼운 4페이지 — bookings/me, review, cash/buy, booking/confirm(신규)

> 생성일: 2026-04-26
> 스택: Next.js 15 + React 19 + Tailwind v4 (App Router, shadcn/ui)
> 페르소나: React Expert (Hooks, Server Components, 렌더링 최적화)
> 부모 에픽: ZEOM-4

## 1. 요구사항 요약

### 비즈니스 목표
WEB_DESIGN.md §6 처방을 1:1 적용하여 사용자 핵심 여정의 가장 가벼운 4페이지를 픽셀-퍼펙트로 마이그레이션. Phase 1 P0 프리미티브(Stars, Portrait, WalletChip, Seg, Dot)의 첫 실전 사용처.

### 인수조건 (페이지 단위 DoD)
- [ ] WEB_DESIGN.md §6 처방 일치 (수동 검증 + 시각 회귀 스크린샷 첨부)
- [ ] tabular-nums 누락 없음 (잔액/금액/카운트)
- [ ] hover/active/focus/disabled 모든 상태 동작
- [ ] keyboard nav (Tab/Enter/Esc/Space)
- [ ] mobile 375/768 깨짐 없음
- [ ] reduced-motion 정적 표시
- [ ] empty/loading/error 상태 모두 디자인됨

### 제약사항
- **Coexistence Lock**: 한 세션에서 두 디자인 혼재 금지 — 본 PR에서 4페이지 모두 신규 디자인으로 일괄 전환
- Phase 1 P0 5개 프리미티브 머지 완료(`dae5c74`)에서 진행
- `/booking/confirm` 신규 라우트는 백엔드 영향 없음 (사전 검토 완료)

## 2. 영향 범위 분석

### 수정 대상 파일

| 파일 | 변경 유형 | 설명 |
|------|----------|------|
| `web/src/app/bookings/me/page.tsx` (798줄) | 재작성 | Card→BookingCard, Badge→Seg, EmptyState 활용 |
| `web/src/app/consultation/[sessionId]/review/page.tsx` (141줄) | 재작성 | StarRating + TagToggle (이미 존재) 통합, 6 tags + 500자 textarea + 🪷 success |
| `web/src/app/cash/buy/page.tsx` (317줄) | 재작성 | 4 패키지 + RadioCard(신규) + sticky 주문 요약 + SuccessState(신규) + WalletChip |
| `web/src/app/booking/confirm/page.tsx` | **신규 생성** | ProgressSteps current=2, 잔액 부족 분기, 약관 체크박스 |
| `web/src/components/design/booking-card.tsx` | **신규 생성** | upcoming/completed/canceled variant, 액션 슬롯 |
| `web/src/components/design/radio-card.tsx` | **신규 생성** | 결제수단 라디오 카드 (4종) |
| `web/src/components/design/success-state.tsx` | **신규 생성** | 80px 원 + 체크/🪷 + 메시지 + dots, 1.4~1.6초 후 콜백 |

### 연관 파일 (읽기 전용)

| 파일 | 참조 이유 |
|------|----------|
| `web/src/components/design/{stars,portrait,wallet-chip,seg,dot}.tsx` | Phase 1 P0 — 그대로 사용 |
| `web/src/components/design/{star-rating,tag-toggle,progress-steps,empty-state}.tsx` | 이미 구현됨 — 재사용 |
| `web/src/app/globals.css` | 토큰 (gold/dancheong/surface) 사용 |
| `WEB_DESIGN.md` §6.4–§6.6, §6.9 | 처방 원본 |

### DB 변경
없음. `/booking/confirm`은 클라이언트-only 확인 단계 라우트.

### 외부 연동
없음. 캐시 충전은 PortOne 결제 mock 유지.

## 3. 구현 계획

### Phase A: 신규 컴포넌트 3종 (순서: 의존성 → 사용처)
**목표**: 페이지 마이그레이션이 의존하는 신규 컴포넌트를 먼저 만든다.

1. `web/src/components/design/booking-card.tsx` — props: `{portrait, name, channel, status: 'upcoming'|'completed'|'canceled', meta, actions: ReactNode}`
2. `web/src/components/design/radio-card.tsx` — props: `{value, label, description?, selected, onSelect}`
3. `web/src/components/design/success-state.tsx` — props: `{icon: 'check'|'lotus', title, subtitle?, autoNavigateMs?, onComplete?}`

**검증**: 각 컴포넌트 단순 import + 임시 storybook 페이지 또는 jest snapshot. `npm run build` 통과.

### Phase B: `/booking/confirm` 신규 라우트
**목표**: §6.4 처방 1:1 구현.

1. `web/src/app/booking/confirm/page.tsx` 신규 — max-w-720 center, ProgressSteps(current=2), 예약 정보 카드(Portrait+meta 2×2), 결제 카드(WalletChip + 잔액 부족 분기), 약관 체크박스, Footer 듀얼 버튼
2. 잔액 부족 시 `/cash/buy?return=confirm`으로 라우팅
3. Loading 상태 dots → 900ms → toast + `/bookings/me` 이동

**검증**: 잔액 충분/부족 두 분기 모두 시각 확인. Tab/Enter 작동.

### Phase C: `/cash/buy` 재작성
**목표**: §6.5 처방 1:1.

1. 4 패키지 그리드 (p1~p4, p3=popular 뱃지) — 선택 시 gold border + gold 0.06 bg
2. `grid 1fr 320px gap-20` 좌(결제수단 RadioCard 4종 + 약관) / 우(sticky 주문 요약 + WalletChip + 결제 lg block)
3. Loading dots 1.4초 → SuccessState (`returnTo` 파라미터에 따라 `confirm` 또는 `home` 자동 복귀)

**검증**: 패키지 선택, 결제수단 선택, 결제 버튼 활성 조건. SuccessState 자동 복귀 동작.

### Phase D: `/consultation/[sessionId]/review` 재작성
**목표**: §6.9 처방 1:1.

1. max-w-600 center, 헤더(`✓ 상담 완료` 뱃지 + 36px serif name + 부연)
2. 별점 카드: StarRating 40px + hover 텍스트 5단 (`아쉬웠어요`~`완벽했어요`)
3. 태그 카드: TagToggle 6개(`차분해요/현실적이에요/깊이 있어요/공감 잘해요/명쾌해요/따뜻해요`)
4. textarea rows=5 + 500자 카운터 + 익명 처리 안내
5. Footer: 나중에 작성(secondary) + 후기 등록(primary lg flex-1, 별점 0이면 disabled)
6. 완료 상태: SuccessState(`lotus`, `고맙습니다`, `후기가 {name}님께 전달됩니다.`, autoNavigateMs=1600 → `/bookings/me`)

**검증**: 별점 미선택 시 등록 버튼 비활성. textarea 500자 제한.

### Phase E: `/bookings/me` 재작성
**목표**: §6.6 처방 1:1.

1. max-w-960, h1 `예약 관리` + 부연
2. Seg 3탭(예정 N / 완료 N / 취소 N) + 우측 ghost `+ 새 상담 예약`
3. 빈 상태: EmptyState (60px padding + 48px 🪷 opacity 0.3 + 메시지 + 예정 탭일 때만 primary `상담사 찾기`)
4. BookingCard 리스트 stagger:
   - upcoming: 취소(secondary sm) + 대기실 입장(primary sm) → `/consultation/[id]/waiting`
   - completed: 후기 작성(primary sm) → `/consultation/[id]/review` 또는 `후기 작성됨 ✓`
5. 취소 toast: `예약이 취소되었습니다 · 100% 환불 예정`

**검증**: 3탭 전환, 빈 상태, 취소 플로우, 후기 작성 분기.

### Phase F: 시각 회귀 + e2e 스크린샷
1. 4페이지 데스크톱(1280) + 모바일(375) 스크린샷 → `web/e2e-screenshots/ZEOM-17/`
2. Playwright 기존 spec이 있으면 selector 갱신
3. `npm run build` + `npm run lint` + `npm test` 통과

## 4. 기술 상세

### 핵심 로직
- **`/booking/confirm` 잔액 분기**: `walletBalance < price`일 때 orange-tinted 박스 + `/cash/buy?return=confirm` 링크. URL에 `pendingBookingId` 같은 클라이언트 상태(localStorage 또는 context) 보존.
- **SuccessState 자동 복귀**: `useEffect` + `setTimeout`으로 `autoNavigateMs` 후 `onComplete` 콜백. `prefers-reduced-motion`이면 dots 애니메이션 정적.
- **BookingCard variant 매핑**: status별로 액션 슬롯이 다르므로 `actions: ReactNode` props로 외부에서 주입 (단일 책임 유지).

### 위험 요소
| 위험 | 영향도 | 대응 |
|------|--------|------|
| `/bookings/me` 798줄에 결제 재시도 로직 포함 — 재작성 시 회귀 가능 | 중간 | 기존 핸들러 함수만 추출하여 신규 컴포넌트에 그대로 주입 |
| TagToggle/StarRating 기존 구현이 §6.9 처방과 다를 수 있음 | 낮음 | 차이가 있으면 본 PR에서 미세 수정. 다른 페이지에서 사용처 없으면 안전 |
| `/booking/confirm`에 들어올 컨텍스트(예약 정보) 전달 방식 미정 | 중간 | `URLSearchParams`로 `counselorId,date,time,channel` 전달. localStorage는 새로고침 안전성 위해 보조용 |
| Coexistence Lock — 4페이지 동시 전환 부담 | 중간 | Phase A→B→...→E 순서로 로컬에서 점진 검증, 마지막에 일괄 push |

### 외부 연동
없음. PortOne·Sendbird 호출 코드는 기존 그대로 유지.

## 5. 병렬 작업 가이드

페이지 4개가 컴포넌트 3종에 의존하므로 **순차** 진행이 안전. 단 Phase B/C/D/E는 서로 독립이므로 컴포넌트 완료 후 부분 병렬 가능. 다만 검증/리뷰 사이클 일관성을 위해 본 워크플로에서는 **Phase A → B → C → D → E → F 순차**로 진행.

---

**다음 단계**: `/jira-execute ZEOM-17`
