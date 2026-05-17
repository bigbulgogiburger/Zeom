# [ZEOM-7] 상담사 포털 Group H — 개발 가이드

> 생성일: 2026-05-17
> 스택: Next.js 15 / React 19 / Tailwind v4
> 페르소나: React Expert
> 모드: `--subtasks` deep dive (`ZEOM-29`, `ZEOM-30`)

## 1. 요구사항 요약

### 비즈니스 목표
상담사 포털 10페이지를 부록 C.1 Counselor Tone Recipe에 맞춰 운영형 화면으로 정리한다. 사용자용 화면보다 더 촘촘하고 반복 업무에 맞는 밀도, 상태 확인성, 키보드 접근성을 우선한다.

### 인수조건
- [ ] `/counselor` 포함 10페이지가 §4.8 + 부록 C.1 처방을 따른다.
- [ ] sidebar nav는 URL active 동기화, Tab 순서, 모바일 drawer 닫힘 동작을 보장한다.
- [ ] 표는 sticky header, zebra row, 압축 row height를 갖는다.
- [ ] 정산/평점/카운트는 `tabular-nums`로 표시한다.
- [ ] 차트/모션은 `motion-reduce:*` 또는 정적 렌더링으로 reduced-motion을 존중한다.
- [ ] `/counselor/room`, `/counselor/consultation/[sessionId]`는 상담사 측 fullscreen/room UX로 검증한다.
- [ ] hex / HTML entity / emoji audit 0건을 유지한다.

### 제약사항 / 주의사항
- 색상은 `hsl(var(--xxx))` 또는 Tailwind 토큰만 사용한다.
- counselor 포털은 사용자 페이지의 marketing/hero 스타일을 피하고 업무형 dense UI로 유지한다.
- root layout의 chrome 책임은 건드리지 않는다.
- 외부 SDK 주입이나 backend provider 변경은 이 이슈 범위가 아니다.

## 2. 영향 범위 분석

### 수정 대상 파일

| 파일 | 변경 유형 | 설명 |
|------|----------|------|
| `web/src/app/counselor/layout.tsx` | 수정 | 240px sidebar, icon nav, mobile Sheet trigger entity 제거, 상태 badge 토큰화 |
| `web/src/components/ui.tsx` | 수정 | counselor dense variants 또는 공통 카드 padding 제어 API 추가 |
| `web/src/app/counselor/page.tsx` | 수정 | dashboard KPI 4종, 오늘 상담, 최근 후기/정산 요약 dense layout |
| `web/src/app/counselor/bookings/page.tsx` | 수정 | 월/주 Seg, sticky zebra table, tabular counts |
| `web/src/app/counselor/customers/page.tsx` | 수정 | 검색/정렬/메모 힌트, sticky zebra table |
| `web/src/app/counselor/profile/page.tsx` | 수정 | 별점 emoji 제거, dense form, tabular stats |
| `web/src/app/counselor/records/page.tsx` | 수정 | 메모 검색, dense record stream, tabular duration |
| `web/src/app/counselor/reviews/page.tsx` | 수정 | 별점 문자열 제거, 분포 차트 정적/토큰, 답변 UX |
| `web/src/app/counselor/room/page.tsx` | 수정 | emoji/entity 제거, fullscreen room tone, icon controls |
| `web/src/app/counselor/schedule/page.tsx` | 수정 | 주간 그리드/토글형 슬롯 추가, keyboard labels, 토큰 success |
| `web/src/app/counselor/settlement/page.tsx` | 수정 | 60px gold serif tabular 출금 가능 금액, 계좌 form 토큰 오류 수정, sticky zebra table |
| `web/src/app/counselor/consultation/[sessionId]/page.tsx` | 수정 | hex/emoji/entity 제거, customer disconnect banner 토큰화, fullscreen room 정합성 |

### 연관 파일

| 파일 | 참조 이유 |
|------|----------|
| `.codex/docs/reference/design-system.md` | 토큰, typography, motion 규칙 |
| `.codex/docs/reference/frontend-pages.md` | immersive/chrome 가드 및 page map |
| `docs/ZEOM-6-phase4-efg-dev-guide.md` | room/consultation fullscreen 선행 결정 |

### DB 변경
없음.

## 3. 구현 계획

### Phase 1: Counselor Layout + Dense Primitive
**목표**: ZEOM-29 slice 완료. counselor 포털이 240px sidebar, 16px card density, 토큰 상태 색상으로 동작한다.

1. `web/src/components/ui.tsx`에 `Card` padding variant 또는 `DenseCard`를 추가한다.
2. `web/src/app/counselor/layout.tsx`를 240px sidebar, icon nav, 40px nav item, 모바일 drawer로 정리한다.
3. entity `&#9776;`, `green-500`, `text-white` 등 baseline 위반/비토큰 색상을 제거한다.

**검증**: `rg` audit에서 counselor layout entity/hex/emoji 0건.

### Phase 2: Counselor 10페이지 Dense Migration
**목표**: ZEOM-30 slice 완료. 10페이지의 운영 정보 밀도, table, numeric, empty/loading 상태를 보강한다.

1. dashboard/bookings/customers/records/reviews/schedule/settlement/profile에 dense card와 table style을 적용한다.
2. 리뷰/프로필 별점 문자열을 lucide 기반 또는 기존 `Stars` 컴포넌트로 교체한다.
3. bookings/customers/settlement table에 sticky header + zebra row + tabular numeric을 적용한다.
4. reviews에 rating distribution bar를 토큰 기반 정적 차트로 추가한다.
5. schedule에 주간 그리드형 슬롯 overview를 추가하고 기존 slot add flow를 유지한다.

**검증**: `rg` audit에서 counselor app 범위 hex/entity/emoji 0건.

### Phase 3: Counselor Room Fullscreen 정합화
**목표**: `/counselor/room`, `/counselor/consultation/[sessionId]`가 고객 room의 fullscreen UX와 일관된다.

1. 전화/사용자/경고 emoji 및 HTML entity를 lucide icon으로 교체한다.
2. customer disconnect banner의 hex를 토큰으로 교체한다.
3. video placeholder와 control button을 icon + accessible label 중심으로 정리한다.
4. unmount cleanup에서 Sendbird listener/timer leak이 없는지 재확인한다.

**검증**: 타입체크 + room scoped audit.

### Phase 4: 통합 검증
1. `cd web && npx tsc --noEmit`
2. `cd web && npm test`
3. `cd web && npm run build`
4. counselor 범위 audit:
   `rg -n "#[0-9A-Fa-f]{3,6}\\b|&#[0-9]+;|[📞👤⚠️★☆]" web/src/app/counselor web/src/components/ui.tsx`

## 4. 기술 상세

### 핵심 판단
- 기존 10페이지가 이미 존재하므로 신규 라우트 생성보다 baseline 회귀 제거와 dense primitive 적용을 우선한다.
- `Card` 기본 padding을 전역 변경하면 기존 사용자 페이지 50화면 baseline이 흔들릴 수 있어, counselor 전용 dense variant를 둔다.
- 별점은 문자열 `★/☆` 대신 lucide 기반 `Stars` 또는 `Star` 아이콘을 사용한다.

### 위험 요소

| 위험 | 영향도 | 대응 방안 |
|------|--------|----------|
| 공통 `Card` 변경이 전체 앱에 전파 | 높음 | 기본값 유지, counselor에서만 `padding="dense"` 사용 |
| Sendbird room 변경 중 통화 라이프사이클 회귀 | 높음 | 렌더링/토큰/아이콘 변경에 한정, SDK call flow 유지 |
| shadcn table sticky header가 카드 overflow와 충돌 | 중간 | table wrapper에 `overflow-x-auto`, header `sticky top-0` 적용 |
| schedule API가 주간 토글 저장을 지원하지 않음 | 중간 | 기존 add/save flow 유지, 주간 grid는 현재/대기 슬롯 overview 중심으로 구현 |

## 5. 병렬 작업 가이드

### Agent Teams 구성

| 역할 | 담당 범위 | subagent 타입 |
|------|----------|---------------|
| ZEOM-29 layout slice | `web/src/app/counselor/layout.tsx`, `web/src/components/ui.tsx` | zeom-component-reviewer |
| ZEOM-30 pages slice | `web/src/app/counselor/**/page.tsx` | zeom-component-reviewer |

### 파일 충돌 방지
- `ZEOM-29`는 layout/primitive만 소유한다.
- `ZEOM-30`은 page files만 소유한다.
- room/consultation fullscreen 정합성은 page slice에서 처리하되, primitive API 변경이 필요하면 lead가 조정한다.
