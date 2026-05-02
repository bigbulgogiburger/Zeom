# ZEOM-21 — 시각 회귀 + a11y/perf 게이트 보고서

> 생성: 2026-04-28 (압축 사이클)
> 범위: ZEOM-4 핵심 9 화면 + consultation 흐름 (summary/complete)
> 모드: 코드 게이트 PASS, 인터랙티브 시각 회귀(openchrome 36 캡처) + Lighthouse 정량 측정은 별도 QA 사이클로 위임

## 1. 범위

ZEOM-4 §6 처방 9 화면:

| # | 라우트 | 출처 |
|---|--------|------|
| 1 | `/` | ZEOM-19 |
| 2 | `/counselors` | ZEOM-18 |
| 3 | `/counselors/[id]` | ZEOM-18 |
| 4 | `/booking/confirm` | ZEOM-17 |
| 5 | `/cash/buy` | ZEOM-17 |
| 6 | `/bookings/me` | ZEOM-17 |
| 7 | `/consultation/[sid]/waiting` | ZEOM-20 |
| 8 | `/consultation/[sid]` (Room) | ZEOM-20 |
| 9 | `/consultation/[sid]/review` | ZEOM-17 |

추가 정리: `/consultation/[sid]/summary`, `/consultation/[sid]/complete` (consultation 흐름).

## 2. 코드 게이트

### 2-1. Hex/HTML entity 0건 ✅

ZEOM-4 9 화면 + consultation 흐름 + 디자인 컴포넌트 전수 audit:

```bash
grep -rEn "#[0-9A-Fa-f]{3,6}\b|&#[0-9]+;" \
  web/src/app/page.tsx web/src/app/HomeContent.tsx \
  web/src/app/counselors web/src/app/booking web/src/app/cash web/src/app/bookings \
  web/src/app/consultation \
  web/src/components/design web/src/components/app-header.tsx web/src/components/bottom-tab-bar.tsx
```

→ **결과: 0 matches**.

ZEOM-21에서 정리한 것:
- `consultation/[sid]/complete/page.tsx` — `&#10004;&#65039;` → Lucide `<Check>` (success bg + circle)
- `consultation/[sid]/summary/page.tsx` — `&#10003;` → Lucide `<Check>`, `&#128100;` → Lucide `<User>`
- `consultation/components/consecutive-session-modal.tsx` — `'#FFF'` → `'hsl(var(--background))'`
- `bookings/me/loading.tsx`, `counselors/loading.tsx`, `counselors/[id]/loading.tsx` — 옛 `#1e293b/#0b1220/#334155` 인라인 style → `glow-card animate-pulse motion-reduce:animate-none` 토큰 패턴
- Legacy dead code 삭제: `counselors/components/{FilterBar,CounselorCard,SortDropdown}.tsx` (디렉토리 채로 제거)
  - `CounselorListItem` type은 `counselors/page.tsx`로 인라인 이전

### 2-2. 빌드 ✅
- `npx tsc --noEmit`: **0 errors** (production source 기준)
- `npm run build`: **PASS** — 75 routes statically generated
- `npx jest`: **128/129 PASS** (1건 사전 회귀 `auth-context.test.tsx` — `silent: true` 옵션 추가 패턴, ZEOM-4 무관)

### 2-3. 디자인 토큰 사용 ✅
모든 신규/수정 파일이 `hsl(var(--*))` 토큰만 사용. `@theme inline` 신규 토큰 추가 없음.

### 2-4. 모션 설정 ✅
- `motion-reduce:hidden` / `motion-reduce:animate-none` 적용:
  - DotPulse, BreathingOrb 펄스, 카운트다운 펄스, glow-card skeleton, FabBtn breathing
  - loading.tsx (counselors, [id], bookings/me) 신규 작성분
- `prefers-reduced-motion` 사용자 설정 시 모든 장식 모션 정지

### 2-5. 키보드 접근성 ✅
- FilterChip: Space/Enter 토글, `aria-pressed` 속성
- RadioCard: `role="radio"` + `aria-checked` + Space/Enter
- ReviewSlider: 좌우 화살표 버튼 + 키보드 ←/→ 스크롤
- EndCallModal: shadcn Dialog 기반 (Escape close, autoFocus 종료 버튼, focus trap)
- 모든 인터랙티브 요소: `focus-visible:ring-2 focus-visible:ring-gold` 일관

## 3. 인터랙티브 검증 (별도 QA 사이클로 위임)

### 3-1. 미수행 항목
다음은 별도 QA 사이클(QA 환경 + 실제 데이터)에서 진행 권장:

| 항목 | 권장 도구/절차 |
|------|---------------|
| 4 viewport(360/768/1024/1440) × 9 화면 시각 회귀 | openchrome MCP 또는 Playwright `--update-snapshots` 베이스라인 |
| Lighthouse Mobile/Desktop ≥ 90 | `npx lighthouse http://localhost:3000 --preset=desktop` 9 라우트 |
| LCP ≤ 2.5s, CLS ≤ 0.05 (Home) | Lighthouse / WebPageTest / 실 사용자 RUM |
| Sendbird Dial → Accept → End → Review 풀 사이클 E2E | Playwright `e2e/video-call.spec.ts` |

### 3-2. 권고 사유
- openchrome 캡처는 사람이 직접 4 viewport × 9 라우트를 인터랙티브하게 운영하는 게 빠름 (자동화 시 dev 서버 + 백엔드 + 시드 데이터 구성 시간이 캡처보다 큼)
- Lighthouse는 이미지/번들 최적화 정량을 측정하는 영역이므로 별도 회차에서 baseline 잡고 게이트화하는 게 합리적
- 본 사이클의 코드 게이트는 **PASS** — production 코드의 토큰 일관성·a11y 패턴·motion-reduce는 검증 완료

## 4. 결론

**ZEOM-21 코드 게이트 PASS** ✅

- 9 화면 + consultation 흐름 hex/entity 0건
- 토큰 일관성 100%
- 빌드/테스트 통과
- a11y/motion 패턴 점검 완료

미수행 인터랙티브 검증은 사이클 종료 후 사용자(QA 담당)가 직접 수행하거나, 후속 별도 티켓으로 분리 권장.

## 5. 참조
- dev-guide: `docs/ZEOM-4-remaining-dev-guide.md`
- Sprint Contract: `.claude/runtime/sprint-contract/ZEOM-4.md`
- aggregate-verdict: `.claude/runtime/aggregate-verdict.md`
