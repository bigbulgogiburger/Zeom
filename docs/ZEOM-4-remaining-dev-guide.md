# [ZEOM-4] 나머지 하위 작업 통합 개발 가이드 (ZEOM-18 / 19 / 20 / 21)

> 생성일: 2026-04-27
> 스택: Next.js 15 + React 19 + Tailwind v4 (web), Spring Boot 3.5 백엔드는 변경 없음
> 페르소나: **Full Stack Master Engineer** — 디자인 명세(WEB_DESIGN.md §6) 픽셀 충실도, 디자인 토큰·접근성·성능 예산을 한 사이클에서 검증하는 시니어. ZEOM-17(P2-1)에서 검증된 BookingCard / RadioCard / SuccessState / glow-card 패턴을 확장하여 기존 도메인 컴포넌트를 “재사용 우선”으로 정렬한다.
> 선행: ZEOM-17 ✅ 완료, ZEOM-2 / ZEOM-3 ✅ Phase 0–1 토큰·프리미티브 적용 완료

---

## 0. 메타: 왜 이 가이드는 "통합" 형태인가

ZEOM-4는 “WEB_DESIGN.md §6 처방대로 9 화면을 픽셀 단위로 마이그레이션” 한다는 단일 목표를 갖는 에픽이다. ZEOM-17에서 4 화면(P2-1)이 이미 끝났고, 남은 4 서브태스크는 다음과 같이 직교한다.

| 서브태스크 | 범위 | 화면 수 | 위험 등급 |
|-----------|------|--------|----------|
| ZEOM-18 | P1-1 카운셀러 발견 동선 | 2 (목록·상세) | 낮음 — 이미 80% 정렬 |
| ZEOM-19 | P1-2 Home 랜딩 | 1 | 중 — Hero LCP·CLS 예산 |
| ZEOM-20 | P3-1 상담 풀스크린 | 2 (Waiting·Room) | **높음** — 레이아웃 그룹 분리 필요 |
| ZEOM-21 | P4 시각 회귀·접근성·성능 게이트 | 9 화면 전체 | 검증 단계 |

**병렬화 판단**: ZEOM-18·19·20은 **파일이 거의 겹치지 않는다**(상세 §5 충돌 매트릭스). ZEOM-21은 마지막 검증 단계이므로 18~20 머지 후 단독 진행. 따라서 18·19·20을 **3-way 병렬 Agent Team**으로 진행하는 안과, 단일 세션 순차 진행 안 모두 가능하다. 본 가이드는 **순차(권장) + 병렬(옵션)** 둘 다 정의한다.

---

## 1. 요구사항 요약

### 비즈니스 목표
- WEB_DESIGN.md §6.1, §6.2/§6.3, §6.7/§6.8을 처방대로 구현하여 **천지연꽃신당 디자인 시스템의 일관성 100%** 달성.
- 9 화면 전체에서 디자인 토큰(`hsl(var(--*))`)·`font-heading`(Gowun Batang)·glow-card·gold-grad 버튼·고정 레이아웃 그리드 사용을 강제.
- 접근성(WCAG AA), 성능 예산(LCP ≤ 2.5s, CLS ≤ 0.05, Lighthouse ≥ 90)을 ZEOM-21에서 게이트로 측정.

### 인수조건 (서브태스크별 합치본)

**ZEOM-18 — P1-1 카운셀러 동선**
- [ ] `/counselors` 헤더·검색 SearchBar·필터 칩(specialty/availability/level/sort)·infinite scroll·스켈레톤이 §6.2 처방과 일치
- [ ] 카드는 portrait + 이름·specialty·level chip + ⭐ rating + price + “예약하기” gold-grad 버튼
- [ ] `/counselors/[id]` 상세는 좌(Portrait XL + 핵심 정보) / 우(soft sticky 예약 카드) 2-col 레이아웃, 모바일 1-col
- [ ] reviews 섹션은 평균·분포 + 카드 리스트 (BookingCard 재사용 X — Review 별도 카드)
- [ ] 비로그인 클릭 시 `/login?redirect=...` 라우팅 보존

**ZEOM-19 — P1-2 Home**
- [ ] Hero: `<h1 font-heading>` + balanced subtitle + “지금 상담받기” CTA, 배경 radial-gold/lotus
- [ ] 추천 상담사 4명 (Portrait s + 이름 + price)
- [ ] “오늘의 운세” / “고민이 있으신가요?” 카테고리 그리드(글래스 카드)
- [ ] 후기 슬라이더(좌우 스와이프, 모바일은 가로 스크롤)
- [ ] LCP ≤ 2.5s (Hero 이미지 priority + preload), CLS ≤ 0.05

**ZEOM-20 — P3-1 풀스크린 (Waiting + Room)**
- [ ] `web/src/app/consultation/[sessionId]/layout.tsx`를 신규 생성하여 **GlobalHeader/Footer 제거된 immersive 레이아웃 그룹** 구성 (review는 chrome 유지 → review는 별도 layout 또는 page-level full bleed 처리)
- [ ] Waiting: BreathingOrb + Timer countdown + “먼저 입장하기” FabBtn + counselor portrait
- [ ] Room: video grid(상담사 큰화면 + 본인 PIP) + MicLevelMeter + ChatPanel(우측 슬라이드) + 종료 컨펌 모달
- [ ] Sendbird 연동 코드는 **수정 없음**(상담 흐름 보존), DOM/스타일 레이어만 교체
- [ ] 종료 시 `/consultation/[sessionId]/review`로 자동 push (기존 동작 유지)

**ZEOM-21 — P4 시각 회귀 + 게이트**
- [ ] Lighthouse(Mobile/Desktop) ≥ 90 across Performance·Accessibility·Best Practices·SEO
- [ ] openchrome MCP로 4 viewport(360, 768, 1024, 1440) 9 화면 visual 회귀 캡처
- [ ] 키보드 내비게이션 가능(focus ring gold), `prefers-reduced-motion` 모든 애니메이션 비활성
- [ ] hex 하드코딩 0건(`grep -E "#[0-9A-Fa-f]{3,6}" web/src/app web/src/components/design`)
- [ ] aggregate-verdict.md PASS

### 제약사항
- **백엔드 변경 절대 금지**. Counselor / Reservation / ConsultationSession API는 그대로 사용.
- **Sendbird 흐름 변경 금지** — DOM 마운트 위치만 교체. `useSendbirdCalls` 훅 시그니처 보존.
- **Coexistence Lock**: 페이지 마이그레이션 중에도 기존 라우트가 항상 동작해야 함(중간 머지 시점에 빈 화면 금지).
- 서버 컴포넌트 vs 클라이언트 컴포넌트 분리: 데이터 페칭은 서버에서, 인터랙션은 `'use client'`로 분리.

---

## 2. 영향 범위 분석

### 2-1. 수정 / 신규 파일 (서브태스크별)

#### ZEOM-18 (P1-1 카운셀러)
| 파일 | 변경 유형 | 핵심 변경 |
|------|----------|----------|
| `web/src/app/counselors/page.tsx` | 수정 | SearchBar·FilterChips·infinite scroll skeleton 정렬, 카드 외형 §6.2 일치 |
| `web/src/app/counselors/[id]/page.tsx` | 수정 | 2-col 레이아웃, sticky 예약 카드, reviews 섹션 |
| `web/src/components/design/counselor-card.tsx` | 신규 또는 보강 | 카드 컴포넌트로 추출하여 재사용 (Home에서도 사용) |
| `web/src/components/design/filter-chip.tsx` | 신규 | 토글형 필터 칩 (radio/multi 둘 다 지원) |
| `web/src/components/design/index.ts` | 수정 | export 추가 |
| `web/src/__tests__/counselors.test.tsx` | 수정 | 새 카드 셀렉터 반영 |

#### ZEOM-19 (Home)
| 파일 | 변경 유형 | 핵심 변경 |
|------|----------|----------|
| `web/src/app/page.tsx` | 수정 | Hero / 추천 상담사 / 카테고리 / 후기 4 섹션 재구성 |
| `web/src/components/design/hero.tsx` | 신규 | radial-gold 배경 + 카피 + CTA |
| `web/src/components/design/category-grid.tsx` | 신규 | 4–6칸 글래스 카드 그리드 |
| `web/src/components/design/review-slider.tsx` | 신규 | scroll-snap-x mandatory 모바일 슬라이더 |
| `web/src/components/design/index.ts` | 수정 | export |
| `web/src/__tests__/home.test.tsx` | 신규 또는 수정 | LCP·CLS 외 핵심 텍스트만 검증 |

#### ZEOM-20 (Waiting + Room)
| 파일 | 변경 유형 | 핵심 변경 |
|------|----------|----------|
| `web/src/app/consultation/[sessionId]/layout.tsx` | **신규** | header/footer 제거 immersive 레이아웃 (review 페이지는 별도 처리) |
| `web/src/app/consultation/[sessionId]/waiting/page.tsx` | 수정 | BreathingOrb·Timer·FabBtn·portrait 정렬 |
| `web/src/app/consultation/[sessionId]/page.tsx` (Room) | 수정 | grid + MicLevelMeter + ChatPanel slide 정렬, 종료 모달 |
| `web/src/app/consultation/[sessionId]/review/layout.tsx` | **신규** | chrome(헤더/푸터) 복귀를 위해 review 단독 layout (또는 review page에 명시 wrapper) |
| `web/src/components/design/end-call-modal.tsx` | 신규 | 종료 confirm UI |
| 기존 `breathing-orb.tsx`, `timer.tsx`, `mic-level-meter.tsx`, `fab-btn.tsx`, `chat-panel.tsx` | 변경 없음 또는 minimal | 기능 검증·prop 정합성 점검 |

#### ZEOM-21 (게이트)
| 파일 | 변경 유형 | 핵심 변경 |
|------|----------|----------|
| `.claude/runtime/visual-baseline/*.png` | 신규 | 4 viewport × 9 화면 = 36 캡처 |
| `docs/ZEOM-21-visual-report.md` | 신규 | Lighthouse 결과 + 시각 회귀 diff 보고서 |
| (코드 수정은 게이트 발견 결함 한정) | 수정 | a11y/perf 보강만 |

### 2-2. 연관 파일 (수정 안 하지만 이해 필수)
| 파일 | 참조 이유 |
|------|----------|
| `web/src/app/globals.css` (@theme inline) | 신규 컴포넌트가 토큰 외 색을 도입 안 하는지 확인 |
| `web/src/components/design/glow-card.tsx`, `progress-steps.tsx`, `wallet-chip.tsx`, `portrait.tsx`, `radio-card.tsx`, `success-state.tsx`, `booking-card.tsx` | 재사용 후보 |
| `web/src/hooks/useSendbirdCalls.ts` (또는 동등 훅) | Room에서 시그니처 보존 확인 |
| `web/src/components/route-guard.tsx` (`RequireLogin`) | 상담 진입 가드 유지 |
| `docs/WEB_DESIGN.md` §6.1–6.9 | 픽셀 처방 ground truth |

### 2-3. DB 변경
**없음.** 백엔드 API/스키마는 그대로 사용한다.

---

## 3. 구현 계획 (순차, 권장 경로)

> 각 서브태스크는 “Phase A 컴포넌트 → Phase B 페이지 → Phase C 테스트·검증” 3단 구조. 매 서브태스크 종료 시 `/harness-review` 실행 → PASS 후 다음으로 이동.

### ZEOM-18 — Phase A: 공용 카드·칩 추출
1. `counselor-card.tsx` 신규: props `{counselor, variant: 'list'|'compact', onClick}`. compact는 Home용(이름+price+rating).
2. `filter-chip.tsx` 신규: `selected`, `onToggle`, `count?`, 단일·다중 모드 둘 다 지원. 키보드 토글(Space).
3. `index.ts` export.
**검증**: storybook 없이 페이지에서 렌더 확인, `npx tsc --noEmit` 통과.

### ZEOM-18 — Phase B: 목록·상세 페이지 정렬
1. `counselors/page.tsx`: 기존 페치/정렬 훅 보존, 마크업만 §6.2로 재배치. `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5`. SearchBar는 sticky top-[var(--header-h)].
2. 빈/스켈레톤 상태: `glow-card animate-pulse` 6개 placeholder.
3. `counselors/[id]/page.tsx`: `lg:grid-cols-[1fr_360px] gap-8`, 우 카드 `lg:sticky lg:top-[88px]`. 모바일 1-col, 예약 CTA는 화면 하단 fixed bar로.
4. reviews 섹션은 평균 별점 + 분포 그래프(div bar) + 카드 리스트.
**검증**: `/counselors`에서 카드 16개 렌더, hover/focus ring gold, `/counselors/1` 상세 sticky 동작.

### ZEOM-18 — Phase C: 테스트·시각 점검
1. `web/src/__tests__/counselors.test.tsx` 셀렉터 재정렬 — 기존 `토글:정렬변경` → 새 SearchBar/FilterChip 셀렉터.
2. openchrome MCP로 360/768/1024/1440 4 viewport 캡처 → 베이스라인 후보 1차본 저장.

### ZEOM-19 — Phase A: Hero·Category·ReviewSlider 컴포넌트
1. `hero.tsx`: `<section class="relative isolate overflow-hidden">` + radial-gold layer + h1 `font-heading text-4xl sm:text-5xl text-balance` + sub + CTA(`Button variant="gold-grad" size="lg"`). 배경 이미지 사용 시 `<Image priority sizes>`.
2. `category-grid.tsx`: 4–6 카테고리(연애/금전/취업/건강/가족/이별), glow-card hover lift.
3. `review-slider.tsx`: `flex overflow-x-auto snap-x snap-mandatory gap-4 pb-2`, 카드 `snap-start`. 데스크톱은 좌우 화살표 버튼(키보드 ←→ 지원).

### ZEOM-19 — Phase B: page.tsx 재구성
1. `app/page.tsx` server component: 추천 상담사·후기 데이터 fetch.
2. 섹션 순서: Hero → Recommended Counselors → Categories → Reviews → CTA Footer Banner.
3. 기존 import 정리, 미사용 컴포넌트 제거.
**검증**: Lighthouse Mobile preview LCP < 2.5s, CLS < 0.05.

### ZEOM-19 — Phase C: 테스트
1. `home.test.tsx`: h1 텍스트, CTA 링크 `/counselors`, 카테고리 6개 렌더 어설트.
2. openchrome 4 viewport 캡처.

### ZEOM-20 — Phase A: layout 그룹 분리 (가장 위험)
**핵심**: Next.js App Router에서 `consultation/[sessionId]/layout.tsx`를 신규 만들면 그 하위 라우트(`waiting`, `(room) page.tsx`, `review`)가 모두 그 레이아웃을 상속한다. `review`는 chrome(header/footer)이 필요하므로 다음 둘 중 하나를 선택:

**옵션 A (채택)**: `consultation/[sessionId]/layout.tsx`는 immersive(헤더/푸터 제거), `consultation/[sessionId]/review/layout.tsx`를 만들어 chrome을 다시 그리는 wrapper로 복원.

**옵션 B**: page-level full bleed (waiting, room이 자체적으로 fixed inset-0). layout 신규 X. — 단순하지만 GlobalHeader/Footer가 z-index/포커스 트랩과 충돌할 위험. → **선택하지 않음**.

1. `consultation/[sessionId]/layout.tsx`:
   ```tsx
   export default function Layout({ children }: { children: React.ReactNode }) {
     return <div className="min-h-dvh bg-background text-text-primary">{children}</div>;
   }
   ```
2. `consultation/[sessionId]/review/layout.tsx`: header·footer 다시 마운트(재사용 가능한 `<SiteChrome>` 컴포넌트가 있으면 사용, 없으면 root layout의 부분만 옮김 — **root layout 분기 변경 금지**).
3. `(파급 검증)` review 페이지 헤더 복귀, waiting/room은 헤더 사라짐 확인.

### ZEOM-20 — Phase B: Waiting 정렬
1. `waiting/page.tsx`: 마크업만 교체. 데이터/Sendbird 훅·이펙트 그대로.
2. 컴포넌트: `BreathingOrb size="xl"`, `Timer end={startAt}` countdown, `Portrait counselor size="lg"`, `FabBtn icon="phone" label="먼저 입장" onClick={enterRoom}`.
3. 모션: `motion-safe:animate-breath`, `motion-reduce:hidden` 처방 준수.

### ZEOM-20 — Phase C: Room 정렬
1. `consultation/[sessionId]/page.tsx`: video container를 `grid grid-rows-[1fr_auto]`로 split — 메인 video full-bleed + 하단 컨트롤 바.
2. PIP self video는 `absolute right-4 top-4 w-[160px] aspect-video rounded-2xl border border-gold/30`.
3. `MicLevelMeter`는 self PIP 하단.
4. `ChatPanel`: 우측 slide-over `translate-x-full data-[open=true]:translate-x-0`.
5. `EndCallModal` 신규: confirm 후 `endSession()` → router.push(`/consultation/${sessionId}/review`).
**검증**: 시뮬레이션(fake provider) 모드에서 Dial→Accept→End→Review 풀 사이클.

### ZEOM-20 — Phase D: 테스트
1. 기존 consultation 통합 테스트가 있다면 셀렉터 갱신.
2. openchrome으로 시각 캡처(단, fake provider 없으면 코드/스토리북 기반 검증).

### ZEOM-21 — Phase A: 자동화 게이트 스크립트
1. `scripts/zeom-21-visual.mjs` (신규, 선택): openchrome MCP를 직접 부르지 않고 → 사람이 openchrome 세션에서 viewport별 캡처. 또는 Playwright `test:visual` 스펙으로 36장 캡처.
2. Lighthouse: `npx lighthouse http://localhost:3000 --preset=desktop --output=json` × 9 라우트, 결과를 `docs/ZEOM-21-visual-report.md`에 표로 정리.

### ZEOM-21 — Phase B: 결함 보강
1. 측정 결과 미달 항목 patch — focus ring 누락, alt text 누락, hex 잔존 등.
2. `grep -RInE "#[0-9A-Fa-f]{3,6}" web/src/app web/src/components/design` 결과 0 보장.
3. `prefers-reduced-motion` 매니페스토: orb·breath·dot pulse 모두 `motion-reduce:hidden` 또는 `motion-reduce:animate-none`.

### ZEOM-21 — Phase C: 보고서·종결
1. `docs/ZEOM-21-visual-report.md`에 LCP/CLS/Lighthouse 점수표·스크린샷 인덱스.
2. 모든 게이트 PASS 확인 → `/jira-complete`.

---

## 4. 기술 상세

### 4-1. 핵심 기술 판단

**(a) Layout 그룹 분리 — Next.js App Router의 layout 상속 메커니즘**
`consultation/[sessionId]/layout.tsx`를 신규로 추가하면 그 폴더 하위의 모든 page는 root layout → 새 layout 순으로 wrapping된다. root layout이 SiteChrome을 무조건 그리고 있다면 신규 layout은 chrome을 “해제”할 수 없다(겹쳐 그릴 수 있을 뿐). 따라서 root layout이 chrome을 그리는 책임을 가지고 있을 경우 **root layout을 (group) 라우팅으로 재구성하는 큰 변경**이 필요하다.

→ **점검 우선**: `web/src/app/layout.tsx`를 먼저 읽어 chrome 마운트 위치 확인. 만약 root에서 항상 그린다면 두 옵션:
  1. `app/(chrome)/...` group과 `app/(immersive)/consultation/[sessionId]/...` group으로 root 재편성 (큰 변경, 권장).
  2. `<body>`는 빈 wrapper만 두고, chrome은 `(chrome)/layout.tsx`로 이동.

이 결정은 ZEOM-20 Phase A 시작 시점에 root layout을 읽어 확정한다. (Sprint Contract에 “layout 결정” 산출물 추가)

**(b) Hero LCP**
LCP 후보는 Hero h1 또는 배경 이미지. 이미지를 쓴다면 `<Image priority placeholder="blur" />`. h1만 쓴다면 폰트 사전로딩 — `app/layout.tsx`에 `next/font/local`로 GowunBatang 등록 + `display: 'swap'`을 통한 FOUT 처방. ZEOM-2에서 이미 폰트가 잡혀 있다면 추가 작업 없음. 확인 필요.

**(c) Sendbird 비변경 보장**
훅·EventListener·useEffect 의존성 배열을 절대 수정하지 않는다. JSX 마운트 위치만 교체. 변경 범위는 `git diff`로 hook 파일 0 line 변경을 확인.

**(d) Coexistence Lock**
각 페이지 마이그레이션은 “마크업 교체 → 즉시 빌드 통과 → 머지” 단위로 작게 끊는다. 한 PR에 9 화면 묶으면 회귀 시 롤백 비용이 폭발한다. 서브태스크 단위 PR 4개 권장.

### 4-2. 위험 매트릭스

| 위험 | 영향도 | 대응 |
|------|--------|------|
| consultation layout 그룹 분리로 root layout이 흔들려 모든 페이지 회귀 | **높음** | Phase A 첫 단계에서 root layout 읽고 옵션 확정. 작은 PR로 격리. |
| Sendbird 훅 의존성 배열 변경으로 무한 재구독 | 높음 | 훅 파일 diff 0 라인 검증. fake provider 1 사이클 회귀. |
| Hero LCP 미달(이미지 무게) | 중간 | priority + AVIF + sizes. 이미지 미사용 시 토큰 그라데이션만으로 처리. |
| 시각 회귀 36장이 머지마다 늘어 노이즈 | 중간 | ZEOM-21 단계에서 한 번만 베이스라인 확정. 그 전엔 “스크린샷만 모은다”. |
| 테스트 셀렉터 깨짐 | 낮음 | 각 Phase C에서 jest 통과 확인. |

### 4-3. 외부 연동
**없음.** PortOne·Sendbird·OAuth provider 모두 변경 없음.

---

## 5. 병렬 작업 가이드 (옵션)

> 사용자가 빠른 배포를 원할 때만. 본 가이드는 “순차”를 기본으로 추천하나, 병렬 옵션을 선택지로 제시한다.

### 5-1. 충돌 매트릭스
| 파일 | ZEOM-18 | ZEOM-19 | ZEOM-20 |
|------|:-:|:-:|:-:|
| `app/page.tsx` | | ✅ | |
| `app/counselors/**` | ✅ | | |
| `app/consultation/[sessionId]/**` | | | ✅ |
| `components/design/counselor-card.tsx` | ✅(소유) | 사용만 | |
| `components/design/hero.tsx`, `category-grid.tsx`, `review-slider.tsx` | | ✅ | |
| `components/design/end-call-modal.tsx` | | | ✅ |
| `components/design/index.ts` | ✅ | ✅ | ✅ ← **충돌 지점** |

### 5-2. 충돌 해소 룰
- `index.ts`는 “Lead가 마지막에 한 번에 머지” 규칙. 각 teammate는 자기 export 라인만 추가하고 중간 충돌은 Lead가 rebase.
- `globals.css` `@theme inline` 신규 토큰 추가 금지 — 기존 토큰만 사용.

### 5-3. Agent Teams 구성
| 역할 | 담당 | subagent |
|------|------|---------|
| Counselor Lead | ZEOM-18 전 범위 | (메인) + zeom-component-reviewer 호출 |
| Home Lead | ZEOM-19 전 범위 | (메인) + zeom-component-reviewer |
| Immersive Lead | ZEOM-20 전 범위 | (메인) + zeom-component-reviewer |
| Gate Auditor | ZEOM-21 (병렬 마지막) | (메인) + verify-frontend-ui |

### 5-4. 의존성
```
ZEOM-18 ─┐
ZEOM-19 ─┼─→ 머지 → ZEOM-21 게이트
ZEOM-20 ─┘
```

---

## 6. Definition of Done (통합)

- [ ] 4 서브태스크의 인수조건 전부 충족
- [ ] hex 하드코딩 0건 (`web/src/app`, `web/src/components/design`)
- [ ] `npm run build` PASS, `npm test` PASS, `npx tsc --noEmit` PASS
- [ ] openchrome 4 viewport × 9 화면 캡처 완료, 회귀 diff 합의
- [ ] Lighthouse Mobile/Desktop ≥ 90 (4 핵심 지표)
- [ ] LCP ≤ 2.5s, CLS ≤ 0.05 (Home)
- [ ] `prefers-reduced-motion` 모션 비활성 검증
- [ ] aggregate-verdict.md PASS, gate-passed
- [ ] 서브태스크별 Jira 상태 완료

---

## 7. 다음 단계
1. (자동) `/harness-plan ZEOM-4`로 Sprint Contract 보충 — DoD·Verify Targets·Phase 매핑.
2. ZEOM-18부터 `/jira-start ZEOM-18 → /jira-execute ZEOM-18 → /harness-review → /jira-commit`.
3. ZEOM-19, ZEOM-20 동일 사이클.
4. 마지막에 ZEOM-21 게이트 → `/jira-complete ZEOM-4`.
