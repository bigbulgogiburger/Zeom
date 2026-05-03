# [ZEOM-22] [P3-1] 3.a Chrome — app-header / bottom-tab-bar / app/layout / Logo (3일)

> 생성일: 2026-05-03
> 스택: Next.js 15 (App Router) + React 19 + Tailwind v4
> 페르소나: React Expert (Next.js 15 / Server Components / Tailwind v4 token system)
> 부모: ZEOM-5 [Phase 3] 글로벌 chrome & 인증 7페이지 (1주)
> 형제: ZEOM-23 [P3-2] 인증 7페이지

## 1. 요구사항 요약

### 비즈니스 목표
ZEOM-4 P1·P3 마이그레이션으로 9 화면이 새 디자인 시스템을 따르고 있다. 인증 7페이지(ZEOM-23) 진입 전에 **글로벌 chrome(상단 헤더 + 모바일 탭바 + 루트 layout)** 을 동일 톤으로 정렬해, 마이그레이션 진행 중에도 "같은 앱"이라는 인식이 유지되도록 한다 (Coexistence #1). Logo 컴포넌트는 인증 페이지 카드 위에 재사용된다 (ZEOM-23 의존).

### 인수조건 (ZEOM-22 본문)
- [ ] 71페이지에서 chrome 일관 (Coexistence #1 통일 우선)
- [ ] header backdrop blur Safari 폴백 동작 (`@supports not (backdrop-filter)`)
- [ ] keyboard nav (header skip-link 권장 — `layout.tsx`에 이미 존재 ✅)
- [ ] mobile bottom-tab-bar safe-area 정상
- [ ] 변경 파일 hex 0
- [ ] @theme inline 누락 0

### 제약사항 / 주의사항
- **Immersive 가드 패턴 보존**: `consultation/[sessionId]` 진입 시 chrome self-hide(`isImmersive` early return) 로직은 그대로. ZEOM-4 §6에서 검증된 패턴. → `frontend-pages.md` §Immersive 가드 로직
- **Hooks-after-guard 규칙**: 가드의 `if (isImmersive) return null`은 모든 hook 호출 후 — `app-header.tsx:30`, `bottom-tab-bar.tsx:41` 모두 준수 중. 본 작업에서 깨지 않게 한다.
- **Logo 위치**: `web/src/components/design/logo.tsx` (ZEOM-22) — design barrel `index.ts`에 등록. ZEOM-23이 인증 카드 위에서 import 한다.
- **Pretendard + Gowun Batang variable**: 이미 `layout.tsx`에서 `next/font/google` Gowun Batang + 외부 CDN Pretendard로 주입 중. 본 작업에서 추가 작업 없음 (DoD 확인만).
- **`themeColor: '#0f0d0a'`** (`layout.tsx:62`): Next.js `Viewport.themeColor`는 메타 태그 hex literal로만 허용 (CSS가 아님 → ZEOM-21 hex 0 baseline 스캔 범위 밖). 본 작업에서 손대지 않음 — `layout.tsx`의 다른 영역 수정 시에도 `themeColor`는 그대로 둔다.

## 2. 영향 범위 분석

### 수정 대상 파일

| 파일 | 변경 유형 | 설명 |
|------|----------|------|
| `web/src/components/design/logo.tsx` | **신규** | 32px gold orb + serif text-2xl "천지연꽃신당" — `size?: 'sm' \| 'md' \| 'lg'`, `withWordmark?: boolean` props |
| `web/src/components/design/index.ts` | 수정 | `Logo` export 추가 |
| `web/src/components/app-header.tsx` | 수정 | 텍스트 로고 → `<Logo />` 교체, nav-item hover bg `--gold/0.08` → **`--surface-2`**, `@supports` 폴백 백드롭, gap 12px 확인 |
| `web/src/components/bottom-tab-bar.tsx` | 수정 | `h-14` (56px) → **`h-16` (64px)**, dot 인디케이터 위치 미세 보정, 톤 정렬 (변경 없음 — `--background/0.92` 유지) |
| `web/src/app/layout.tsx` | 수정 | `pb-14` → `pb-16` (탭바 64px 동기화), 그 외 변경 없음 |

### 연관 파일 (읽기 전용)

| 파일 | 참조 이유 |
|------|----------|
| `web/src/app/globals.css` | `--surface-2`, `--border-subtle`, `--gold`, `--background` 토큰 확인 — 모두 등록 완료 ✅ |
| `web/src/components/wallet-widget.tsx`, `credit-widget.tsx`, `notification-bell.tsx` | header 우측 chip — 본 작업에서 직접 수정 안 함 (gap만 검증) |
| `.claude/docs/reference/design-system.md` | Anti-slop 규칙 (hex 0, Lucide only) |
| `.claude/docs/reference/frontend-pages.md` | Immersive 가드 패턴 보존 |

### DB 변경
**없음.** UI 전용 작업.

## 3. 구현 계획

### Phase 1: Logo 컴포넌트 신규 작성
**목표**: 재사용 가능한 brand mark 컴포넌트 — 헤더 + 인증 카드(ZEOM-23) 공용.

1. `web/src/components/design/logo.tsx` 신규
   - `'use client'` 불필요 (정적 마크업 — Server Component 호환)
   - Props: `size?: 'sm' | 'md' | 'lg' = 'md'`, `withWordmark?: boolean = true`, `className?: string`
   - Orb: `--gold`/`--gold-soft` 라디얼 그라데이션 + box-shadow `--shadow-gold`
     - sm: 24px, md: 32px (default), lg: 48px
   - Wordmark: `font-heading` (Gowun Batang) + `text-2xl/3xl` + `text-[hsl(var(--text-primary))]`
   - 접근성: orb는 `aria-hidden`, 전체에 `aria-label="천지연꽃신당"`
   - hex 0, motion-reduce 영향 없음 (정적)
2. `web/src/components/design/index.ts` — `export { default as Logo } from './logo';` 추가

**검증**: `npx tsc --noEmit` 통과, Lucide 미사용(브랜드 orb는 div/span만), `grep -E "#[0-9A-Fa-f]{3,6}\b" web/src/components/design/logo.tsx` 0건.

### Phase 2: app-header 정렬
**목표**: 텍스트 로고 → `<Logo />`, hover bg → `--surface-2`, Safari 폴백.

1. `web/src/components/app-header.tsx`
   - **import 추가**: `import { Logo } from '@/components/design';`
   - **로고 교체** (line 58-63):
     ```tsx
     <Link href="/" className="shrink-0 no-underline" aria-label="천지연꽃신당 홈">
       <Logo size="sm" />
     </Link>
     ```
     - 헤더 height 68px이므로 `size="sm"` (24px orb + text-xl/2xl) 또는 `size="md"` (32px) — 실측 후 결정. 시작은 sm.
   - **nav 호버 토큰 변경** (line 50, 52):
     ```diff
     - 'hover:bg-[hsl(var(--gold)/0.08)]'
     + 'hover:bg-[hsl(var(--surface-2))]'
     ```
     desktopNavLinkClass와 mobileNavLinkClass 동일 적용. (text 호버 색은 `--gold` 유지 — surface와 대비)
   - **`@supports` 폴백** (line 57): 헤더 element에 fallback 색 미리 깔기.
     - Tailwind v4의 `bg-[hsl(var(--background)/0.85)]` 위에 `@supports not` 분기를 inline `<style jsx>`로 넣지 말고, `globals.css`에 `.app-header-bg` 유틸 클래스 신설:
       ```css
       /* globals.css 보완 (필요 시) */
       .app-header-bg {
         background: hsl(var(--background) / 0.95); /* 폴백 — 더 불투명 */
       }
       @supports (backdrop-filter: blur(20px)) {
         .app-header-bg {
           background: hsl(var(--background) / 0.85);
           backdrop-filter: blur(20px);
         }
       }
       ```
       단, Tailwind v4의 `backdrop-blur-[20px]` 자체가 컴파일 시 `@supports` 의존이 아니므로 — 더 간단한 대안: header에 `bg-[hsl(var(--background)/0.95)]` (폴백) + `supports-[backdrop-filter]:bg-[hsl(var(--background)/0.85)]` + `backdrop-blur-[20px]` 조합으로 Tailwind variant만 사용. **이 방식 채택** (globals.css 추가 안 함).
     - 최종 className 예:
       ```
       sticky top-0 z-[100] h-[68px] flex items-center px-6
       bg-[hsl(var(--background)/0.95)]
       supports-[backdrop-filter]:bg-[hsl(var(--background)/0.85)]
       supports-[backdrop-filter]:backdrop-blur-[20px]
       border-b border-[hsl(var(--border-subtle))]
       ```
   - **right section gap 검증**: 현재 `gap-3` (= 12px) ✅ 유지 (ZEOM-22 요구치 일치).

**검증**: 
- `grep -E "#[0-9A-Fa-f]{3,6}\b" web/src/components/app-header.tsx` 0건
- 로컬 dev 서버에서 Chrome(blur 적용) + Safari(폴백 — `Develop > Disable Backdrop Filter` 또는 폴백용 분기) 시각 확인 권고
- keyboard Tab navigate — Logo Link → nav links → right widgets → mobile menu trigger 순서

### Phase 3: bottom-tab-bar 64px 정렬
**목표**: height 56→64, safe-area 보정.

1. `web/src/components/bottom-tab-bar.tsx` — line 50:
   ```diff
   - <div className="flex items-center justify-around h-14">
   + <div className="flex items-center justify-around h-16">
   ```
2. dot 인디케이터 보정: 현재 `gap-0.5 py-1.5` — 16px 증가에 맞춰 `gap-1 py-2`로 미세 조정 (시각 균형). icon size는 22 유지.

**검증**: 모바일 폭(375px) 시각 확인 — icon + label + dot 정렬, safe-area-inset-bottom 적용 (현재 inline style 유지).

### Phase 4: layout.tsx 동기화
**목표**: 탭바 height 변경에 따른 `main-content` padding 보정 + Pretendard/Gowun Batang variable 정렬 확인.

1. `web/src/app/layout.tsx` — line 118:
   ```diff
   - <div id="main-content" className="pb-14 md:pb-0">{children}</div>
   + <div id="main-content" className="pb-16 md:pb-0">{children}</div>
   ```
2. Pretendard + Gowun Batang 확인:
   - `<html lang={locale} className="font-pretendard">` (line 72) ✅
   - `<body className={`grain-overlay ${gowunBatang.variable}`}>` (line 95) ✅
   - 추가 작업 불필요.
3. body radial bg: `globals.css`의 `body { background: ... }` 처리 (line 181 근방 확인). ✅
4. `themeColor: '#0f0d0a'` (line 62): **건드리지 않는다** (위 §1 제약사항 참조).

**검증**: layout.tsx의 변경은 `pb-14 → pb-16` 한 줄. 이외 라인 손대지 않음. Hex 0 baseline은 유지(추가 hex 도입 없음).

### Phase 5: 통합 검증
**목표**: AC 6항 만족 확인.

1. **빌드/타입**: `cd web && npx tsc --noEmit && npm run build`
2. **Hex 0**: 
   ```bash
   grep -rEn "#[0-9A-Fa-f]{3,6}\b|&#[0-9]+;" \
     web/src/components/design/logo.tsx \
     web/src/components/design/index.ts \
     web/src/components/app-header.tsx \
     web/src/components/bottom-tab-bar.tsx \
     web/src/app/layout.tsx
   ```
   기대: layout.tsx의 `themeColor: '#0f0d0a'` 1건만 검출 (사전 존재, 본 작업 도입 아님 — 보고서에 명시).
3. **Jest**: `cd web && npm test` — 사전 baseline 대비 회귀 0.
4. **시각 워크스루** (Coexistence #1): dev server 띄우고 4 viewport(360/768/1024/1440)에서:
   - `/` (Home, ZEOM-19) — chrome 일관
   - `/counselors` (ZEOM-18) — chrome 일관
   - `/booking/confirm` (ZEOM-17) — chrome 일관
   - `/login` (legacy) — chrome 일관 (인증 페이지는 ZEOM-23에서 본문 마이그레이션 — 본 작업은 chrome만)
   - `/consultation/<sid>` — immersive 가드로 chrome hidden ✅
5. **Safari 폴백**: `supports-[backdrop-filter]:` variant가 Tailwind v4에서 `@supports (backdrop-filter: blur(20px))`로 컴파일됨을 빌드 산출물에서 확인 (선택).

**완료 시그널**: 모든 AC 6개 체크 + Phase 5의 grep 결과가 layout.tsx의 사전 1건뿐.

## 4. 기술 상세

### 핵심 로직
**Tailwind v4 `supports-[backdrop-filter]:` variant 활용** — `@supports` CSS 분기를 inline style이나 별도 CSS 파일 없이 className에 직접 표현. 이는 Tailwind v4의 새 기능으로, ZEOM-22의 "@supports not (backdrop-filter) 폴백" AC를 정확히 충족하면서도 hex 0 + 토큰 only 규칙을 깨지 않는다.

```tsx
// 폴백(불투명) → 지원 시 반투명 + blur
"bg-[hsl(var(--background)/0.95)]
 supports-[backdrop-filter]:bg-[hsl(var(--background)/0.85)]
 supports-[backdrop-filter]:backdrop-blur-[20px]"
```

### 위험 요소

| 위험 | 영향도 | 대응 방안 |
|------|--------|----------|
| nav hover bg 변경(`--gold/0.08` → `--surface-2`)으로 시각 회귀 | 낮음 | 4-viewport 워크스루에서 모든 nav-item hover 확인 — surface-2(`32 10% 16%`)는 다크 톤이라 헤더 배경(`24 15% 5%`)과 자연 대비 |
| Logo `size="sm"`가 헤더 height 68px와 visually 작게 보일 가능성 | 낮음 | dev에서 sm/md 토글 확인 후 결정. Sprint Contract에 "Logo size 결정 1라운드" 명시 |
| pb-14 → pb-16 전환 누락된 다른 사용처 | 매우 낮음 | grep 결과 `layout.tsx:118` 단일. 추가 누락 시 모바일 마지막 콘텐츠가 탭바에 가려짐 — Phase 5 시각 워크스루에서 발견 |
| Tailwind v4 `supports-[...]:` variant 미컴파일 | 낮음 | Tailwind v4.0+ 정식 지원 (currently `web/package.json`의 tailwindcss 버전 확인). 미지원 시 globals.css `@supports` fallback으로 전환 |

### 외부 연동
**없음.** UI 전용. API/Provider 영향 0.

## 5. 병렬 작업 가이드
**작성 생략.** 본 작업은 4개 파일 수정 + 1개 파일 신규 = 총 5개 파일이며, Phase 1(Logo)이 Phase 2(app-header import)의 선행 의존이고 Phase 3(bottom-tab) ↔ Phase 4(layout pb) 가 결합되어 있어 순차 진행이 빠르다. Agent Teams 코디네이션 오버헤드보다 단일 시퀀스가 효율적.

---

## 변경 파일 요약

```
신규: web/src/components/design/logo.tsx
수정: web/src/components/design/index.ts
수정: web/src/components/app-header.tsx
수정: web/src/components/bottom-tab-bar.tsx
수정: web/src/app/layout.tsx
```

총 5 파일.

## 다음 단계
- `/harness-plan ZEOM-22` — Sprint Contract (DoD/Verify Targets/Out of Scope) 보충
- 사용자 승인 게이트
- `/jira-execute ZEOM-22` Phase 1→5 순차
- `/harness-review` (Inner Loop, max 3 iter)
- `/jira-test` → `/harness-gate` → `/jira-commit` → `/jira-complete`
