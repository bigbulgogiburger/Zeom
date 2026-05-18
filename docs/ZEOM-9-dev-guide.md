# [ZEOM-9] Phase 7 — QA & 회귀 검증 (Lighthouse / A11y / 시각 / i18n)

> 생성일: 2026-05-17
> 스택: Next.js 15.1.6 · React 19 · Tailwind v4 · Playwright · next-intl
> 페르소나: React Expert (App Router + 토큰 시스템 + QA 자동화)
> 모드: `--subtasks` deep dive (ZEOM-33 측정 · ZEOM-34 게이트)
> 부모 에픽: ZEOM-1 (71 Page Pixel-Perfect Migration v2)
> 의존: ZEOM-2 ~ ZEOM-8 모두 main 머지 완료 (08c6ca0 시점)

## 1. 요구사항 요약

### 비즈니스 목표
71 페이지 마이그레이션 (ZEOM-2~8) 완료 후 **최종 QA 라운드**. 에픽 ZEOM-1 close 직전의 품질 게이트로, Lighthouse·A11y·시각 회귀·i18n·reduced-motion·4 뷰포트를 객관 지표로 측정하고, 프로젝트 전체 DoD (§11.3) 12개 항목을 통과시킨다. **발견된 회귀 이슈는 우선순위에 따라 (a) 본 브랜치에서 즉시 수정 (small fix) 또는 (b) 별도 `ZEOM-N hotfix Task` 등록** 으로 분기한다.

### 인수조건 (부모 통합 — 프로젝트 전체 DoD §11.3)

- [ ] **71 페이지 모두** WEB_DESIGN.md §6 처방 일치 (시각 회귀 비교 완료)
- [ ] **Lighthouse Perf/A11y/Best/SEO ≥ 90** (P0 9페이지 — 홈, login, counselors, counselors/[id], cash/buy, bookings/me, dashboard, room, review)
- [ ] CLS ≤ 0.05, LCP ≤ 2.5s (4G 시뮬, P0 9페이지)
- [ ] keyboard nav (Tab/Enter/Esc/Space) 통과 — 핵심 7 페이지 + chrome
- [ ] screen reader (VoiceOver) 통과 — 핵심 5 페이지
- [ ] **`tsc --noEmit` 0 error** + `npm test` 14 spec PASS + `npm run build` 76 routes 빌드
- [ ] Playwright 핵심 여정 스모크 (13 spec) — auth/wallet/video-call/payment/admin/counselor 등 PASS
- [ ] **4 뷰포트** 375/768/1280/1920 — 71 페이지 깨짐 0
- [ ] reduced-motion 정적 표시 — BreathingOrb / MicLevelMeter / stagger / glow / scroll-fade 검증
- [ ] **ko/en locale** 양쪽 동작 — `cookies.NEXT_LOCALE` 토글, fallback OK
- [ ] **hex 잔재 0건** (api/og + brand-kakao/naver 토큰 예외) — `web/src/{app,components}` 범위
- [ ] **@theme inline 등록 누락 0** — `:root` 변수 ↔ `@theme inline` 일치
- [ ] **`verify-frontend-ui` PASS**

### 제약사항

- **본 워크플로의 책임 경계**: 측정·검증·소형 회귀 수정. 큰 기능 회귀 (예: 통화 SDK 깨짐, 결제 흐름 단절)는 hotfix Task 분기.
- **개발 서버 + backend (docker) 필수**: A11y/시각 회귀 측정은 실제 렌더링 결과 기준. `npm run dev` + `docker compose up backend` 로 띄운 환경에서 측정.
- **E2E 전용 계정**: `e2e-test@zeom.com` / `TestPass123!` — 인증 필요 경로 측정 시 사용 (memory: reference_e2e_test_account).
- **자동 vs 수동**: Lighthouse·axe·snapshot 은 자동, NVDA screen reader 는 Windows 부재로 macOS VoiceOver 만 수행 (이슈 description 의 NVDA 요구는 best-effort — 미수행 시 limitation 명시).
- **시간 박스**: ZEOM-33 2일 / ZEOM-34 1일. 71 페이지 전수 측정이 시간 초과 시, 우선순위 (P0 P0+1) 순으로 cut.

## 2. 영향 범위 분석

### 슬라이스 DAG (ADR-070)

```
┌─────────────────────────────────────────────────────────────────────┐
│  Phase 1 (ZEOM-33)  측정 라운드 — 2일                                  │
│    ├─ Lighthouse 9 P0 (스크립트 + JSON 저장)                          │
│    ├─ Playwright snapshot 71페이지 baseline                          │
│    ├─ A11y axe-core (자동) + VoiceOver (수동 핵심 5)                   │
│    ├─ Reduced-motion 검증 (CSS query)                                │
│    └─ 4 viewport 검증 (375/768/1280/1920)                            │
│    ↓ 산출물: docs/qa/lighthouse/*.json · web/e2e-screenshots/        │
│              docs/qa/ZEOM-9-qa-report.md (P7-1 섹션)                 │
│                                                                     │
│  Phase 2 (ZEOM-34)  게이트 + 정합성 — 1일                              │
│    ├─ i18n ko/en 검증 (locale 토글 스모크)                            │
│    ├─ hex/theme audit (grep + diff)                                  │
│    ├─ verify-frontend-ui 스킬 호출                                    │
│    ├─ 통합 빌드 (tsc + jest + build)                                  │
│    └─ 미해결 이슈 → ZEOM-N hotfix Task 등록 / 작은 회귀 즉시 수정         │
│    ↓ 산출물: docs/qa/ZEOM-9-qa-report.md (P7-2 + 종합 섹션)           │
│                                                                     │
│  Phase 3 (parent)  통합 verdict + 커밋                                │
└─────────────────────────────────────────────────────────────────────┘
```

- **disjoint touched-files**: ZEOM-33 → `docs/qa/lighthouse/*` · `web/e2e-screenshots/*` · `docs/qa/ZEOM-9-qa-report.md` (P7-1 섹션). ZEOM-34 → `docs/qa/ZEOM-9-qa-report.md` (P7-2/종합 섹션 append) + 발견 회귀 수정 시 `web/src/**`.
- **순서 의존**: ZEOM-34 의 종합 게이트는 ZEOM-33 측정 데이터 의존. 한 브랜치 (`feature/ZEOM-9`) 내 commit 단위 분리.

### 슬라이스 dev-guide

| Slice | 파일 | 책임 | 산출 |
|-------|------|------|------|
| ZEOM-33 | `docs/ZEOM-9-ZEOM-33-dev-guide.md` | Lighthouse + Visual + A11y + reduced-motion + 4VP 측정 | JSON/PNG/리포트 §A·B·C·D·E |
| ZEOM-34 | `docs/ZEOM-9-ZEOM-34-dev-guide.md` | i18n + audit + verify skill + 종합 DoD 게이트 + hotfix 분기 | 리포트 §F·G·H + DoD 표 |

### Cross-cutting 결정 (양 slice 공통)

1. **QA 산출물 위치**: 모든 측정 결과는 `docs/qa/` 하위. `lighthouse/*.json` (raw), `snapshots-diff/*.md` (Before/After 메모), `ZEOM-9-qa-report.md` (사람이 읽는 종합 리포트). PR에 첨부.
2. **회귀 수정 컷오프**: "단일 파일 / ≤ 20줄 / 즉시 검증 가능"만 본 브랜치에서 수정. 그 외는 `ZEOM-9-qa-report.md` "미해결 이슈" 섹션에 ZEOM-N hotfix 후보로 기록 후 Jira create.
3. **4 뷰포트 우선순위**: 375 (mobile) → 1280 (desktop) → 768 (tablet) → 1920 (ultrawide) 순서로 측정. 1920은 layout shift 부재만 spot check.
4. **i18n 측정 범위**: `messages/en.json` 의 key coverage 가 ko 대비 < 30% 면 fallback 동작만 검증 (en 카피 부재가 정상 경로). 30% 이상이면 핵심 페이지 (홈, login, counselors) en locale 스모크.
5. **NVDA 미수행 명시**: 이슈 description 의 NVDA + VoiceOver 요구 중 VoiceOver 만 수행. NVDA 는 Windows 환경 부재로 limitation 으로 리포트에 명시 + 후속 Task 후보.

### DB / 외부 연동 변경
없음. 검증 라운드 only.

### 의존성 변경
- `@axe-core/playwright` (devDep 후보) — 자동 a11y 측정 시. 없으면 axe-core 직접 import 또는 `npm dlx`로 1회성 실행.
- 기존 `@playwright/test ^1.55.0` 으로 visual snapshot 충분 (`toHaveScreenshot` API).

## 3. 구현 계획

### Phase 1: ZEOM-33 — 측정 라운드 (2일)
**목표**: Lighthouse 9 P0 + Playwright snapshot 71페이지 baseline + A11y(axe+VO) + reduced-motion + 4VP. 결과 데이터 `docs/qa/` 에 저장.

상세: `docs/ZEOM-9-ZEOM-33-dev-guide.md`

**검증**: `docs/qa/lighthouse/*.json` 9개 존재 + `web/e2e-screenshots/` 71 페이지 PNG + `docs/qa/ZEOM-9-qa-report.md` P7-1 섹션 작성.

### Phase 2: ZEOM-34 — i18n + 종합 게이트 (1일)
**목표**: i18n ko/en 스모크 + hex/theme audit 0 + verify-frontend-ui PASS + tsc/jest/build/playwright PASS + 발견 회귀 분기.

상세: `docs/ZEOM-9-ZEOM-34-dev-guide.md`

**검증**: `docs/qa/ZEOM-9-qa-report.md` 종합 DoD 표 12개 항목 모두 ✅ 또는 ⚠️ + hotfix Task 목록 명시.

### Phase 3: 통합 verdict + 커밋
1. `cd web && npx tsc --noEmit` — 0 error
2. `cd web && npm test` — 14 spec PASS (메모리: ~129 tests)
3. `cd web && npm run build` — 76 routes 빌드 성공
4. `Skill('verify-frontend-ui')` → PASS 확인
5. `Skill('verify-e2e-tests')` → PASS 확인
6. 미해결 hotfix Task 목록을 Jira create 또는 description 에 명시
7. ZEOM-33, ZEOM-34 댓글로 결과 링크 + 부모 ZEOM-9 댓글로 종합 verdict 게시

## 4. 기술 상세

### 핵심 판단

- **Playwright snapshot baseline 전략**: `web/e2e-screenshots/` 가 비어있다 → 본 라운드가 **baseline 최초 생성**. 따라서 "회귀" 라기보다 "현재 상태 기록 + 사람의 눈 검토" 가 된다. 이를 솔직하게 리포트에 명시. 후속 PR 부터 `toHaveScreenshot` diff 활성화.
- **Lighthouse 측정 환경**: localhost:3000 (next dev) + backend localhost:8080 (docker) 환경. **production build (`npm run build && npm start`) 가 측정 신뢰도 더 높음** — 따라서 P0 측정은 production 모드로 한다. Lighthouse mobile preset (4G 시뮬, CPU 4x slowdown) 사용.
- **A11y 자동 검사 도구 선정**: `@axe-core/playwright` 추가 vs `axe-core` CDN 주입. 본 라운드 한정으로 `@axe-core/playwright` devDep 추가 권장 (재사용성).
- **reduced-motion 검증 자동화**: `page.emulateMedia({ reducedMotion: 'reduce' })` + Playwright 로 핵심 애니메이션 컴포넌트 (BreathingOrb, MicLevelMeter, stagger, glow) 가 정적인지 확인. 71페이지 전수는 PNG diff 로 — `prefers-reduced-motion: reduce` 매체에서 1초 후 추가 paint 없으면 PASS.
- **4 뷰포트 검증**: Playwright `viewport` 옵션 변경 후 동일 페이지 PNG 4개. Overflow 발생 시 (`document.documentElement.scrollWidth > document.documentElement.clientWidth` mobile=375에서 false 권장) PNG 메모.
- **i18n fallback**: `messages/en.json` 의 key set 이 ko 대비 적으면 `next-intl` 의 `useTranslations()` 미스시 폴백 동작 (한국어 그대로 출력 OR throw) 확인. 본 프로젝트는 fallback OK 라고 이슈에 명시.

### 위험 요소

| 위험 | 영향도 | 대응 |
|------|--------|-----|
| Lighthouse 점수 < 90 (특히 Performance) | 높음 | 발견 시 즉시 작은 fix (이미지 lazy, font preload) 시도. 안 되면 hotfix Task. |
| Playwright 71페이지 snapshot 메모리/타임아웃 | 중간 | `--workers=1` 유지, `test.describe.serial`, page 단위로 분할 실행 |
| 인증 필요 경로 측정 실패 (10+ 페이지) | 중간 | e2e-test@zeom.com 계정 + Playwright `storageState` 재사용 패턴 |
| 71페이지 시간 초과 | 중간 | P0 우선 → P1 (인증 필요) → 정책/콘텐츠 (terms/privacy) 순. 1920 viewport 는 spot check |
| hex 잔재 발견 (brand 토큰 외) | 낮음 | 위치별 즉시 수정 — 단일 토큰 치환 |
| en locale en.json 누락 키 | 낮음 | fallback 정상 동작이면 PASS — 신규 카피 추가는 본 라운드 범위 외 |
| VoiceOver 수동 검증 시간 | 중간 | 핵심 5 페이지 (홈/login/counselors/[id]/cash/buy)만 수행. 결과는 텍스트 메모 |

### 외부 연동 / 환경
- Sendbird Calls SDK (consultation/room) — 측정 환경에서 fake provider 사용. 실제 통화 측정은 본 라운드 범위 외.
- PortOne (cash/buy) — public test key 로 결제 UI 까지만 측정. 실제 결제 X.

## 5. 병렬 작업 가이드 (생략)

> ZEOM-33 → ZEOM-34 **순서 의존**이므로 병렬 작업 부적합. 한 명의 QA 라운드로 진행 가정.

---

## 부록 A. QA 산출물 디렉토리 구조

```
docs/qa/
├── ZEOM-9-qa-report.md              # 사람이 읽는 종합 (DoD 표 포함)
├── lighthouse/                      # P7-1
│   ├── home.json
│   ├── login.json
│   ├── counselors.json
│   ├── counselors-id.json
│   ├── cash-buy.json
│   ├── bookings-me.json
│   ├── dashboard.json
│   ├── room.json
│   └── review.json
├── axe/                             # P7-1 자동 a11y
│   └── 71-pages-summary.json
└── i18n/                            # P7-2
    └── ko-en-coverage.md

web/e2e-screenshots/                 # Playwright snapshot baseline
├── home-375.png
├── home-768.png
├── home-1280.png
├── home-1920.png
└── … (71 × 4 = 284장)
```

## 부록 B. AC ↔ Slice 매핑 (12 DoD 항목)

| # | DoD 항목 | 담당 slice |
|---|----------|-----------|
| 1 | 71 페이지 §6 처방 일치 | ZEOM-33 (시각 회귀) |
| 2 | Lighthouse ≥ 90 (P0 9페이지) | ZEOM-33 |
| 3 | CLS ≤ 0.05, LCP ≤ 2.5s | ZEOM-33 |
| 4 | keyboard nav + screen reader | ZEOM-33 |
| 5 | tsc + jest + build | ZEOM-34 (게이트) |
| 6 | Playwright 핵심 여정 스모크 | ZEOM-34 |
| 7 | 4 뷰포트 | ZEOM-33 |
| 8 | reduced-motion | ZEOM-33 |
| 9 | ko/en locale | ZEOM-34 |
| 10 | hex 잔재 0 | ZEOM-34 (audit) |
| 11 | @theme inline 누락 0 | ZEOM-34 (audit) |
| 12 | verify-frontend-ui PASS | ZEOM-34 |
