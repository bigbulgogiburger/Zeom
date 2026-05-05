# ZEOM-6 Phase 4 — Group E + F + G 통합 dev-guide

> **범위**: ZEOM-26 (분쟁/환불 4P) + ZEOM-27 (세션 부속 7P) + ZEOM-28 (대시보드 1P) = 12 페이지
> **브랜치**: `feature/ZEOM-6-phase4-efg`
> **모드**: 자율 (사용자가 "묻지 말고 진행" 명시)
> **목표**: ZEOM-21 baseline (hex/entity/emoji 0건) 유지 + 각 이슈 AC 충족

---

## 0. 자율 결정 (PR 코멘트에 명시 예정)

### A. `/dashboard` URL 충돌 해결
- **현재**: `/dashboard`는 admin 운영 대시보드(`RequireAdmin`), `app-header.tsx`에서 일반 nav 링크로 노출 → 일반 유저가 클릭하면 RequireAdmin 차단
- **결정**: `/dashboard`를 사용자 대시보드(ZEOM-28 §4.7)로 교체. 기존 admin 운영 대시보드는 `/admin/dashboard`로 이동
- **변경 영향**: `web/src/app/admin/login/page.tsx` redirect path → `/admin/dashboard`. `app-header.tsx` 링크는 그대로 (의미가 사용자 dashboard로 정합화됨)
- **이유**: ZEOM-28 description에 명시적으로 `/dashboard` URL 지정. admin은 admin 네임스페이스에 있어야 일관

### B. `/sessions` vs ZEOM-27 "활성 세션"
- **현재**: `/sessions`는 auth 디바이스 세션(로그인 세션 관리)
- **결정**: 그대로 유지. ZEOM-27 #48 "활성 세션 (관점 미정)"은 의미 모호 → **`/consultations?status=active` filter**로 충족 (별도 페이지 추가 X)
- **이유**: 디바이스 세션 페이지는 보안 기능이라 의미가 다름. 새 페이지를 추가하면 정보 구조 혼동

### C. `sessions/[id]/chat` vs `consultation/chat/[sid]` 통합 결정
- **현재**: 두 페이지 모두 채팅. `sessions/[id]/chat`은 bookingId 기반 + ChatRoom 컴포넌트, `consultation/chat/[sid]`는 sessionId 기반 + inline polling
- **결정**: **분리 유지**. ID 체계가 다른 entity (booking vs consultation session) + 사용 컴포넌트도 다름. 통합 시 양방향 매핑 비용이 크고 회귀 위험. PR 코멘트에 결정 근거 명시
- **단**: `sessions/[id]/chat` 진입 시 immersive chrome 가드 일관성만 보장 (현재 OK)

### D. `/consultation/[sid]/complete` 80px gold 원 + 🪷 처방
- **충돌**: ZEOM-27 §4.6 처방 = "🪷 emoji" / ZEOM-21 baseline = emoji 0
- **결정**: emoji 0 baseline 우선. 🪷 자리에 **단청 SVG dot pattern** (8개 작은 dot + 중앙 큰 dot, gold) 사용. 화면 의미(완료/축복) 유지
- **이유**: baseline 무결성이 회귀 차단의 핵심. 디자인 처방은 token + SVG로 충실히 재현 가능

### E. `consultations` `💬` emoji + `preflight` `✅❌⏳🟢🟡🔴`
- 모두 lucide-react icon으로 교체 (MessageCircle / CheckCircle / XCircle / Loader2 / Wifi / WifiOff)

---

## 1. 작업 항목

### Group E (ZEOM-26) — 4 페이지

| # | 파일 | 작업 |
|---|------|------|
| 1 | `web/src/app/disputes/page.tsx` | 토큰 OK. 변경 없음 |
| 2 | `web/src/app/disputes/[id]/page.tsx` | **타임라인** (좌측 dot column) + **thread** (3 화자 색 분리: 사용자=text-primary, 상담사=jade, 관리자=gold) + **첨부 placeholder** 추가. 백엔드에 timeline API 없으면 `createdAt → IN_REVIEW (있다면) → resolvedAt` 의 status_history를 timeline으로 자동 생성 |
| 3 | `web/src/app/refunds/page.tsx` | 토큰 OK. 변경 없음 |
| 4 | `web/src/app/refunds/new/page.tsx` | **ProgressSteps 3단계** (정보 → 사유 → 확인) — Stepper UI 추가. step 1=예약 선택, step 2=사유 입력+예상금액, step 3=최종 확인 후 제출 |
| 5 | `web/src/app/disputes/loading.tsx`, `web/src/app/refunds/loading.tsx` | hex 하드코딩 → `.skeleton` + `SkeletonCard` 토큰 사용 |

### Group F (ZEOM-27) — 7 페이지

| # | 파일 | 작업 |
|---|------|------|
| 1 | `web/src/app/consultation/[sessionId]/preflight/page.tsx` | emoji 6개 → lucide icon 교체 (CheckCircle/XCircle/Loader2/Wifi/WifiOff/SignalLow). 권한 4종 체크는 mic/cam/network 3종 + browser support는 일반화된 fallback 메시지 |
| 2 | `web/src/app/consultation/[sessionId]/complete/page.tsx` | **80px gold 원 + 단청 SVG + 60s 자동 review 카운트다운** 추가. Check icon → 단청 SVG로 교체. `useEffect`로 60s 타이머 → router.push(review). reduced-motion 시 카운트다운 숫자만 변경 (애니메이션 정적) |
| 3 | `web/src/app/consultation/[sessionId]/summary/page.tsx` | **PDF 영수증 다운로드** 버튼 추가 (`window.print()` 또는 백엔드 API). 토큰 OK |
| 4 | `web/src/app/consultation/chat/[sessionId]/page.tsx` | fullscreen layout 사용 OK. 변경 없음 |
| 5 | `web/src/app/consultations/page.tsx` | `💬` emoji → MessageCircle lucide. **status filter** Seg 추가 (전체/진행중/완료) |
| 6 | `web/src/app/sessions/page.tsx` | 변경 없음 (디바이스 세션 페이지로 유지) |
| 7 | `web/src/app/sessions/[id]/chat/page.tsx` | 변경 없음. PR 코멘트로 분리 결정 명시 |
| 8 | `web/src/app/consultation/loading.tsx` (없음) | 필요시 skip — `consultation/[sessionId]/page.tsx`는 자체 로딩 처리 |
| 9 | `web/src/app/consultations/loading.tsx` | hex → 토큰 |
| 10 | `web/src/app/sessions/loading.tsx` | hex → 토큰 |

### Group G (ZEOM-28) — 1 페이지

| # | 파일 | 작업 |
|---|------|------|
| 1 | `web/src/app/dashboard/page.tsx` | **사용자 대시보드로 교체**. Hero 3분할(잔액 60px gold serif tabular / 예정상담 / 오늘운세) + 4 stat cards(누적 상담수/이번 달 사용 캐시/즐겨찾기 수/후기 수) + 추천 섹션 + 최근 활동 타임라인. RequireLogin |
| 2 | `web/src/app/admin/dashboard/page.tsx` | 신규 — 기존 admin 대시보드 코드를 이동. RequireAdmin |
| 3 | `web/src/app/admin/login/page.tsx` | redirect → `/admin/dashboard` |
| 4 | `web/src/app/dashboard/loading.tsx` | hex → 토큰 |

---

## 2. 공통 컴포넌트 추가

### `ProgressSteps` (ui.tsx에 추가)

```tsx
export function ProgressSteps({
  steps, current,
}: { steps: string[]; current: number }) {
  return (
    <ol className="flex items-center gap-3 mb-6" aria-label="단계 진행">
      {steps.map((label, i) => {
        const idx = i + 1;
        const active = idx === current;
        const done = idx < current;
        return (
          <li key={i} className="flex items-center gap-2">
            <span className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center font-heading font-bold text-sm border',
              done && 'bg-[hsl(var(--gold))] text-[hsl(var(--background))] border-[hsl(var(--gold))]',
              active && 'bg-[hsl(var(--gold)/0.15)] text-[hsl(var(--gold))] border-[hsl(var(--gold))]',
              !done && !active && 'bg-[hsl(var(--surface))] text-[hsl(var(--text-secondary))] border-[hsl(var(--border-subtle))]',
            )}>
              {done ? <Check className="size-4" /> : idx}
            </span>
            <span className={cn(
              'text-sm font-medium',
              active ? 'text-[hsl(var(--text-primary))]' : 'text-[hsl(var(--text-secondary))]',
            )}>
              {label}
            </span>
            {i < steps.length - 1 && (
              <span className="w-8 h-px bg-[hsl(var(--border-subtle))] mx-1" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
```

### `DancheongMandala` (consultation/complete 인라인)

```tsx
// 80px gold 원 + 8 dot + 중앙 dot SVG (단청 동심원)
<svg width="80" height="80" viewBox="0 0 80 80" aria-hidden>
  <circle cx="40" cy="40" r="38" fill="none" stroke="hsl(var(--gold))" strokeWidth="2" />
  <circle cx="40" cy="40" r="6" fill="hsl(var(--gold))" />
  {[0,45,90,135,180,225,270,315].map(deg => {
    const r = 26;
    const x = 40 + r * Math.cos(deg * Math.PI / 180);
    const y = 40 + r * Math.sin(deg * Math.PI / 180);
    return <circle key={deg} cx={x} cy={y} r="3" fill="hsl(var(--gold-soft))" />;
  })}
</svg>
```

---

## 3. AC 충족 매핑

### ZEOM-26 AC
- [x] §4.5 처방 일치 — disputes/[id] 타임라인+thread, refunds/new ProgressSteps
- [x] tabular (상태 카운트, 금액, 날짜) — 기존 OK + tabular-nums 추가 확인
- [x] 타임라인 reduced-motion — 정적 SVG, animation 없음
- [x] keyboard nav — Card 클릭 → role="button" tabIndex=0 추가
- [x] empty/loading/error — 모두 EmptyState/loading/InlineError 사용
- [x] mobile 타임라인 단일 컬럼 — `md:grid-cols-[40px_1fr]` 처리

### ZEOM-27 AC
- [x] 7 페이지 모두 §4.6 — 위 표 처리
- [x] preflight 권한 거부 시 명확한 안내 — 거부 시 brand-specific 가이드 추가
- [x] complete reduced-motion — 60s 카운트다운 텍스트만 변경, SVG 정적
- [x] summary 영수증 다운로드 — `window.print()` + print stylesheet
- [x] consultation/chat fullscreen — 기존 OK
- [x] sessions/[id]/chat 통합 결정 PR 코멘트 — 결정 C
- [ ] verify-sendbird-videocall 스킬 PASS — 마지막 단계

### ZEOM-28 AC
- [x] §4.7 — Hero 3분할, 4 stat, 추천, 활동 타임라인
- [x] Hero 3분할 mobile 단일 컬럼
- [x] stat cards 반응형 (4→2→1)
- [x] tabular 모든 숫자
- [x] empty 상태 (예정상담 없음, 활동 없음)
- [x] keyboard nav
- [x] reduced-motion

---

## 4. DoD

- [ ] hex/entity/emoji 0 (`grep -rEn '#[0-9A-Fa-f]{3,6}\b|&#[0-9]+;'` 0건)
- [ ] `cd web && npx tsc --noEmit` PASS
- [ ] `cd web && npm test` 회귀 0 (기존 spec 유지)
- [ ] `cd web && npm run build` 75+ routes (admin/dashboard 추가)
- [ ] verify-frontend-ui 스킬 PASS
- [ ] harness-review verdict PASS
