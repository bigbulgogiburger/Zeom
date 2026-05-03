# [ZEOM-23] [P3-2] 3.b 인증 7페이지 — login/signup/forgot/reset/verify/onboarding/auth-callback (4일)

> 생성일: 2026-05-03
> 스택: Next.js 15 (App Router) + React 19 + TypeScript + Tailwind v4
> 페르소나: React Expert (Server/Client Component 분리, 인증 보안, 토큰화)
> 부모: ZEOM-5 [Phase 3] 글로벌 chrome & 인증 7페이지
> 형제: ZEOM-22 (완료 — `bd61620`, Logo + chrome 정렬)

## 1. 요구사항 요약

### 비즈니스 목표
ZEOM-22 chrome 정렬 위에 인증 진입점 7페이지를 새 디자인 시스템으로 통일. Coexistence #1 (chrome 통일)과 페이지 본문 통일을 묶어 사용자가 "신구 페이지 혼재"를 인지하지 못하게 함.

### 인수조건 (ZEOM-23 본문)
- [ ] 7페이지 모두 §6 처방 + 공통 처방 (max 420 / 카드 패딩 32 / Logo)
- [ ] 비밀번호 강도 미터 reduced-motion 분기
- [ ] verify-email 재발송 카운트다운 tabular (Timer)
- [ ] keyboard nav (Tab → submit, Enter submit, Esc close modal)
- [ ] 4 viewport (모바일 카드 width auto)
- [ ] auth-callback OAuth 콜백 실제 동작 (Sendbird/소셜 토큰 회귀 없음)
- [ ] verify-auth-system 스킬 PASS
- [ ] hex 0

### 제약사항 / 주의사항
- **OAuth 회귀 0**: `/auth/callback`은 토큰 교환 + `refreshMe()` + `/counselors` redirect 로직 있음. **로직 0 line 변경** 보장 — 시각만 정렬 (배경/spinner 토큰화).
- **Social brand hex 유지**: `social-login-buttons.tsx`의 Kakao(`#FEE500`) / Naver(`#03C75A`)는 공식 브랜드 색. 컨테이너 톤만 정렬, **브랜드 hex 유지**. → 본 작업의 hex 0 audit에서 해당 2건은 명시 예외. ZEOM-23 dev-guide에 기록 (Out of Scope 아닌 의도적 예외).
- **signup `TERMS_DETAIL` 약관 텍스트** 변경 금지 (법적 문서)
- **Suspense 패턴 보존**: `reset-password`, `verify-email`은 `useSearchParams` 사용 → Suspense wrapper 유지
- **회귀 위험 주변에 코드 수정 금지**: token validation, `apiFetch`, `refreshMe` 호출 시퀀스, 라우팅 destination — 모두 보존
- **백엔드/Flutter 0 line**

## 2. 영향 범위 분석

### 수정 대상 파일

| 파일 | 변경 유형 | 줄수 | hex 시작 | Risk |
|------|----------|------|---------|------|
| `web/src/components/design/auth-card.tsx` | **신규** | ~50 | 0 | Low |
| `web/src/components/design/password-strength-meter.tsx` | **신규** | ~70 | 0 | Low |
| `web/src/components/design/index.ts` | 수정 | +2 export | 0 | Low |
| `web/src/components/social-login-buttons.tsx` | 수정 | 99 | 2 (Kakao/Naver brand — 의도적 유지) | Low |
| `web/src/app/login/page.tsx` | 수정 | 165 | 13 → 0 | Medium |
| `web/src/app/signup/page.tsx` | 수정 (큰 변경) | 600 | 42 → 0 | **High** (자체 ProgressBar → ProgressSteps 교체) |
| `web/src/app/forgot-password/page.tsx` | 수정 | 117 | 0 → 0 | Low (chrome만) |
| `web/src/app/reset-password/page.tsx` | 수정 | 178 | 0 → 0 | Medium (강도 미터 신규) |
| `web/src/app/verify-email/page.tsx` | 수정 | 104 | 0 → 0 | Low (Timer 추가) |
| `web/src/app/onboarding/page.tsx` | 수정 | 228 | 0 → 0 | Medium (ProgressSteps 통합) |
| `web/src/app/auth/callback/page.tsx` | 수정 (시각만) | 77 | 0 → 0 | **High** (로직 0 line 변경 보장) |

총 신규 2 + 수정 9 = **11 파일**.

### 연관 파일 (읽기 전용)
| 파일 | 참조 이유 |
|------|----------|
| `web/src/components/auth-context.tsx` | `useAuth` API 보존 — import만 |
| `web/src/components/api.ts`, `auth-client.ts` | `apiFetch`/`API_BASE`/`getDeviceId` — 호출만 |
| `web/src/components/design/{logo,progress-steps,timer,success-state}.tsx` | ZEOM-22/17/19 산출물 — import |
| `.claude/docs/reference/design-system.md` | Anti-slop, motion-reduce |
| `.claude/skills/verify-auth-system/SKILL.md` | 회귀 검증 스킬 |

### DB 변경
**없음.** UI 전용.

## 3. 구현 계획

### Phase 1: Foundation — AuthCard + PasswordStrengthMeter + social 컨테이너
**목표**: 7페이지가 공유할 wrapper 컴포넌트 + 강도 미터 신규.

1. `web/src/components/design/auth-card.tsx` 신규
   - Server Component 호환 (`'use client'` 불필요)
   - Props: `children: ReactNode`, `withLogo?: boolean = true`, `className?: string`
   - 마크업:
     ```tsx
     <main className="grid place-items-center min-h-[calc(100dvh-68px)] p-6 bg-[hsl(var(--background))]"
           style={{ backgroundImage: 'radial-gradient(ellipse at center, hsl(var(--gold)/0.04) 0%, transparent 70%)' }}>
       <div className={cn('w-full max-w-[420px]', className)}>
         <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border-subtle))] rounded-2xl p-8 sm:p-10">
           {withLogo && <div className="mb-6 flex justify-center"><Logo size="md" /></div>}
           {children}
         </div>
       </div>
     </main>
     ```
   - `min-h-[calc(100dvh-68px)]` — 헤더 68px 보정 (ZEOM-22 정렬값)
2. `web/src/components/design/password-strength-meter.tsx` 신규
   - `'use client'` 필요 (input value props)
   - Props: `password: string`, `className?: string`
   - 강도 산정: 길이(8/12/16) + 문자 종류(소문자/대문자/숫자/특수) + 반복 문자 감점
   - 시각: 4개 segment bar
     - 0–1: dancheong (`hsl(var(--dancheong))`) — 약함
     - 2: warning (`hsl(var(--warning))`) — 보통
     - 3: gold-soft — 강함
     - 4: gold — 매우 강함
   - 텍스트 라벨: "약함" / "보통" / "강함" / "매우 강함" — `aria-live="polite"`
   - **motion-reduce**: bar 트랜지션은 `motion-reduce:transition-none`
3. `web/src/components/design/index.ts` — `AuthCard`, `PasswordStrengthMeter` export 추가
4. `web/src/components/social-login-buttons.tsx` 수정
   - Kakao/Naver 버튼 inline `style` 제거하고 `className`으로 이전:
     - Kakao: `bg-[#FEE500] text-[#191919]` (브랜드 hex 유지 — 명시 예외)
     - Naver: `bg-[#03C75A] text-white` (브랜드 hex 유지)
   - 컨테이너 (`<div className="mt-6">` 등): `--gold/0.15` 디바이더는 이미 토큰 ✅
   - 에러 메시지 컨테이너 톤 정렬

**검증**: 
- `npx tsc --noEmit` 통과
- AuthCard import test (page rendering 가능)
- 강도 미터 4 단계 토큰 확인
- social-login: 변경 후 Kakao/Naver hex 2건만 남고 그 외 토큰화 — `grep -E "#[0-9A-Fa-f]" web/src/components/social-login-buttons.tsx` = 2건

### Phase 2: 단순 페이지 마이그레이션 (login, forgot-password, verify-email, auth/callback)
**목표**: 4페이지에 AuthCard + Logo 적용. login의 13 hex 정리. verify-email에 Timer 카운트다운.

1. `/login` (165줄, 13 hex)
   - `<main>` + `<div className="w-full max-w-[420px]">` + 카드 → `<AuthCard>`로 교체
   - 기존 로직 (form, useAuth, refreshMe, redirect) 보존
   - `ActionButton` (legacy `components/ui`) → shadcn `<Button variant="gold-grad" size="lg" className="w-full">`로 교체
   - hex 13건 → 모두 토큰
   - 기존 `<h1>` "ㅁㅁㅁ" 제목은 Logo 아래 부제목으로 격하 (Logo가 brand 마크 역할)
2. `/forgot-password` (117줄, 0 hex)
   - 카드 → `<AuthCard>`
   - success state → 기존 인라인 → `<SuccessState>` (ZEOM-17)
3. `/verify-email` (104줄, 0 hex, Suspense)
   - 카드 → `<AuthCard>`
   - 재발송 카운트다운: `<Timer durationSec={60} />` (ZEOM-17 design barrel) — 0초가 되면 "재발송" 버튼 활성
   - success / expired 분기 유지
4. `/auth/callback` (77줄, 0 hex, **로직 0 변경**)
   - **로직 한 줄도 건드리지 않음**. `useEffect`, `searchParams`, `fetch`, `refreshMe`, `router.replace` 모두 그대로
   - 시각만: spinner 컨테이너에 `<AuthCard withLogo={true}>` wrap, "로그인 처리 중..." 텍스트는 그대로
   - 에러 분기도 동일 wrapper

**검증**: 
- 각 페이지 단독 빌드 성공
- hex audit: login 0, forgot/verify/callback 0
- auth/callback `git diff`로 로직 line 0 확인 — `git diff -U0 web/src/app/auth/callback/page.tsx` 결과가 시각/wrapper만

### Phase 3: signup 큰 마이그레이션
**목표**: 600줄 + 42 hex의 가장 큰 페이지 — 자체 `ProgressBar` → `ProgressSteps` 교체 + 토큰화.

1. `/signup` (600줄, 42 hex)
   - 자체 progress bar 컴포넌트 (현재 inline) → `<ProgressSteps steps={[{label:'정보'},{label:'약관'},{label:'완료'}]} current={step} />`
   - 카드 → `<AuthCard>`
   - 42 hex 모두 토큰화 (gold/dancheong/warning/text-secondary 등)
   - **로직 보존 절대**: birthHour/calendarType/isLeapMonth 등 사주 데이터 필드, 약관 expandable, API body
   - **TERMS_DETAIL 텍스트 한 글자도 변경 금지**
   - shadcn Button 등 일관 적용

**검증**: 
- 3-step 위자드 동작 (manual 1라운드 권장 — Sprint Contract Risk)
- API body shape diff 0 — `git diff` 결과에 사주 데이터 필드 보존 확인
- hex 0 (`grep -E "#[0-9A-Fa-f]" web/src/app/signup/page.tsx`)

### Phase 4: reset-password 강도 미터 + onboarding ProgressSteps
**목표**: 특수 패턴 2개.

1. `/reset-password` (178줄, 0 hex, Suspense)
   - 카드 → `<AuthCard>`
   - 비밀번호 input 아래 `<PasswordStrengthMeter password={pw} />` (P1에서 신규)
   - reduced-motion: meter bar transition은 `motion-reduce:transition-none` (P1에서 처리)
   - token validation 로직 보존
2. `/onboarding` (228줄, 0 hex, carousel 4-step)
   - 페이지 자체는 carousel이라 `<AuthCard>` 사용 안 함 (Hero 비슷한 풀폭)
   - `<ProgressSteps>` 추가 (4 step)
   - Logo는 상단 (Heading 위)
   - 카드 톤은 design system 일관 (`bg-surface-2 + border-subtle + radius-2xl`)
   - touch swipe + keyboard nav (← → / Enter) 보존
   - skip / next CTA 토큰화

**검증**: 
- reset-password 강도 4 단계 시각 확인
- onboarding 4 step navigation, swipe 동작 보존
- hex 0

### Phase 5: 통합 검증 + verify-auth-system
**목표**: AC 8 항 자동 검증 가능 부분 모두 PASS.

1. **빌드/타입**: `cd web && npx tsc --noEmit && npm run build`
2. **Hex audit** (변경 페이지):
   ```bash
   grep -rEn "#[0-9A-Fa-f]{3,6}\b|&#[0-9]+;" \
     web/src/app/login/page.tsx \
     web/src/app/signup/page.tsx \
     web/src/app/forgot-password/page.tsx \
     web/src/app/reset-password/page.tsx \
     web/src/app/verify-email/page.tsx \
     web/src/app/onboarding/page.tsx \
     web/src/app/auth/callback/page.tsx \
     web/src/components/design/auth-card.tsx \
     web/src/components/design/password-strength-meter.tsx \
     web/src/components/design/index.ts
   ```
   기대: 0건 (Kakao/Naver hex는 social-login-buttons.tsx — 별도 검증 시 2건 명시 예외)
3. **Jest**: `npm test` — auth 관련 테스트 회귀 0
4. **verify-auth-system 스킬 실행**: 인증 시스템 무결성
5. **수동 QA 체크리스트** (jira-complete 단계에서 별도 회차):
   - 4 viewport (360/768/1024/1440) × 7 페이지 시각
   - keyboard Tab/Enter/Esc 동작
   - reduced-motion: 강도 미터 transition off
   - OAuth callback 실제 동작 (e2e-test 계정 또는 mock provider)
   - signup 3-step 위자드 진행 + API body shape

**완료 시그널**: AC 자동 검증 가능 항목 100% PASS, 수동 항목은 jira-complete 코멘트에 명시.

## 4. 기술 상세

### 핵심 로직
**AuthCard wrapper 패턴**으로 7페이지 중복(grid/min-h/max-w/카드) 제거. 페이지 컴포넌트는 form/state/effect만 담당. `<AuthCard>{form}</AuthCard>` 패턴.

**PasswordStrengthMeter는 `aria-live="polite"`** — 강도 변화 시 SR이 자동 어나운스. 시각은 4 segment bar로 진행률 표현, 텍스트 라벨로 의미 보강.

**signup의 ProgressBar 교체**는 가장 위험한 변경. 자체 컴포넌트의 inline state(steps array) 보존하면서 marker만 ProgressSteps로 위임. `current` prop으로 동기화.

### 위험 요소

| 위험 | 영향도 | 대응 |
|------|--------|------|
| signup ProgressBar 교체 시 step 진행 로직 깨짐 | **High** | git diff로 setStep / isStep 콜백 보존 확인. 위자드 manual 1라운드 |
| auth/callback 로직 변경 시 OAuth 회귀 | **High** | git diff로 useEffect/fetch/refreshMe 무수정 확인. wrapper만 추가 |
| 강도 미터 reduced-motion 누락 → CLS 또는 motion 위반 | Medium | `motion-reduce:transition-none` Tailwind variant + Lighthouse 검증 |
| Kakao/Naver brand hex 의도 외 audit 실패 | Low | dev-guide에 명시 예외 기록. Sprint Contract Out of Scope에 반영 |
| TERMS_DETAIL 텍스트 의도치 않은 수정 | **High** (법적) | git diff로 텍스트 무수정 확인. signup commit 시 별도 verification |
| Suspense boundary 누락 (reset/verify) | Medium | useSearchParams 사용 페이지는 Suspense wrapper 유지 — 빌드 에러로 즉시 발견 |

### 외부 연동
- **OAuth provider**: 현재 fake (mock token). 회귀 검증은 verify-auth-system 스킬 + manual flow.
- **Sendbird userId 동기화**: refreshMe → userId prefix `user_{id}` (memory: 메모리 항목). 본 작업 무관.
- **Backend/Flutter**: 0 line 변경 (강제).

## 5. 병렬 작업 가이드
**작성 생략.** 11 파일 중 P1(foundation) 다음 P2(4 단순 페이지)는 같은 컴포넌트 사용 + 같은 패턴 반복이라 순차가 빠르고 충돌 위험 낮음. P3(signup)은 단일 파일 큰 변경. Agent Teams 코디네이션 오버헤드보다 단일 시퀀스가 효율적.

---

## 변경 파일 요약

```
신규: web/src/components/design/auth-card.tsx
신규: web/src/components/design/password-strength-meter.tsx
수정: web/src/components/design/index.ts
수정: web/src/components/social-login-buttons.tsx
수정: web/src/app/login/page.tsx
수정: web/src/app/signup/page.tsx
수정: web/src/app/forgot-password/page.tsx
수정: web/src/app/reset-password/page.tsx
수정: web/src/app/verify-email/page.tsx
수정: web/src/app/onboarding/page.tsx
수정: web/src/app/auth/callback/page.tsx
```

총 11 파일 (신규 2 + 수정 9).

## 다음 단계
- `/harness-plan ZEOM-23` — Sprint Contract 보충
- `/jira-execute ZEOM-23` Phase 1→5 순차
- `/harness-review` (Inner Loop, max 3 iter)
- `/jira-test` → `/harness-gate` → `/jira-commit` → `/jira-complete`
