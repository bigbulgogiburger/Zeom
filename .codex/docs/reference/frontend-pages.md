# Frontend Pages Reference

> 참조 시점: 페이지 추가/수정, 라우팅, layout group 작업, 컴포넌트 인벤토리 확인 시
> 마지막 큰 변경: ZEOM-4 sweep (P1·P2·P3 9 화면 마이그레이션 + immersive layout 분리)

## 기술 스택

- Next.js 15 (App Router) · React 19 · TypeScript
- Tailwind CSS v4 (`@import "tailwindcss"` + `@theme inline`)
- shadcn/ui (base) + design barrel `@/components/design` (도메인 컴포넌트)
- next-intl (i18n, ko/en)
- lucide-react (아이콘) — emoji/HTML entity 사용 금지
- Jest 14 spec / Playwright 13 spec

## Layout Groups

루트 layout (`app/layout.tsx`)은 항상 `AppHeader` + `BottomTabBar` (chrome) 마운트. **immersive 라우트는 layout group으로 분리하지 않고 `AppHeader/BottomTabBar`의 `usePathname` 가드로 처리**한다 — root layout을 흔들지 않는 안전한 패턴.

```
app/
  layout.tsx                               (root chrome mount)
  consultation/[sessionId]/
    layout.tsx                             (pass-through wrapper, immersive 의도 명시)
    waiting/page.tsx                       ← chrome 가드에 의해 self-hide
    page.tsx                  (Room)       ← chrome 가드에 의해 self-hide
    review/
      layout.tsx                           (pass-through, chrome 유지 의도 명시)
      page.tsx                             ← chrome 마운트
```

### Immersive 가드 로직 (AppHeader / BottomTabBar)
```ts
const seg = (pathname ?? '').split('/');
const isImmersive = seg[1] === 'consultation' && !!seg[2] && seg[3] !== 'review';
if (isImmersive) return null; // 단, 모든 hook 호출 *후*에 early return
```

핵심: **rules-of-hooks를 위해 모든 hook이 호출된 후에 early return**. 추가 layout group 도입은 root layout의 chrome 책임 분리를 강제해서 다른 페이지 회귀 가능성이 큼 — 본 패턴이 더 안전.

## Page Map

### Public
| Route | 설명 | 출처 |
|-------|------|------|
| `/` | Home — Hero + 추천 상담사 + Category 6 + 후기 슬라이더 | ZEOM-19 |
| `/fortune` | 운세 (3탭: 오늘/띠별/궁합) | (구) |
| `/counselors` | 상담사 목록 — sticky SearchBar + FilterChip + 4-col 그리드 + skeleton | ZEOM-18 |
| `/counselors/[id]` | 상담사 상세 — 좌 본문 + 우 sticky 예약 / 모바일 fixed bottom CTA | ZEOM-18 |
| `/login`, `/signup` | 인증 (3-스텝 위자드) | (구) |
| `/blog`, `/blog/[category]/[slug]` | 블로그 | (구) |
| `/terms`, `/privacy`, `/faq` | 정적 페이지 | (구) |

### Authenticated
| Route | 설명 | 출처 |
|-------|------|------|
| `/bookings/me` | 예약 내역 — Seg 3탭 + BookingCard | ZEOM-17 |
| `/booking/confirm` | 예약 확인 — ProgressSteps + GlowCard + 잔액 가드 + 약관 | ZEOM-17 |
| `/cash/buy` | 캐시 충전 — 패키지 4 RadioCard + 결제수단 4 + sticky 주문 요약 + SuccessState | ZEOM-17 |
| `/wallet` | 지갑 (잔액 + 거래 내역 + 필터) | (구) |
| `/credits/*` | 상담권 (잔액/구매/이력) | (구) |
| `/sessions/*` | 상담 세션 (채팅) | (구) |
| `/mypage/*` | 마이페이지 (프로필 허브 + 수정/비밀번호/탈퇴) | (구) |
| `/notifications` | 알림 (읽음/안읽음 + 유형 아이콘) | (구) |
| `/favorites` | 즐겨찾기 | (구) |
| `/my-saju` | 사주 정보 | (구) |

### Consultation 흐름 (immersive)
| Route | 설명 | 출처 |
|-------|------|------|
| `/consultation/[sid]/waiting` | 대기실 — BreathingOrb + Portrait + Timer + 먼저 입장 FabBtn | ZEOM-20 |
| `/consultation/[sid]` | Room — full-bleed remote video + self PIP + MicLevelMeter + ChatPanel slide-over + EndCallModal | ZEOM-20 |
| `/consultation/[sid]/review` | 후기 — StarRating + TagToggle + 500자 textarea + SuccessState | ZEOM-17 |
| `/consultation/[sid]/summary` | 상담 요약 (chrome 유지) | (구, ZEOM-21에서 entity 정리) |
| `/consultation/[sid]/complete` | 종료 화면 (chrome 유지) | (구, ZEOM-21에서 entity 정리) |

### Counselor Portal (`/counselor/`)
사이드바 레이아웃. 9개 메뉴: 대시보드, 상담, 스케줄, 프로필, 리뷰, 정산, 통계, 알림, 설정.

### Admin (`/admin/`, `/dashboard/`)
대시보드, 타임라인, 감사로그, 쿠폰, 사용자 관리.

## Shared Components

### Design barrel `@/components/design` — 도메인 컴포넌트
**최우선 import 대상.** 인벤토리는 `design-system.md` 참조.

### Layout chrome
| 파일 | 용도 |
|------|------|
| `components/app-header.tsx` | 글로벌 헤더 — `'use client'`, `usePathname` immersive 가드 |
| `components/bottom-tab-bar.tsx` | 모바일 하단 탭 — `'use client'`, dot 인디케이터, immersive 가드 |

### Provider · 인증
| 파일 | 용도 |
|------|------|
| `components/auth-context.tsx` | `AuthProvider` + `useAuth` (`me`, `loading`) |
| `components/route-guard.tsx` | `RequireLogin` / `RequireRole` |
| `components/session-expiry-guard.tsx` | 토큰 만료 감시 |

### API · 상태
| 파일 | 용도 |
|------|------|
| `components/api-client.ts` | `apiFetch`, 도메인별 wrapper (chargeCash, getWallet, ...) |
| `hooks/useWallet` | 지갑 잔액 조회 + refresh |

### 도메인 위젯 (legacy / 기능별)
| 파일 | 용도 |
|------|------|
| `components/fortune-card.tsx` | 홈페이지 운세 카드 (legacy) |
| `components/consultation-chat.tsx` | 채팅 UI |
| `components/review-form.tsx` | 리뷰 작성 폼 |
| `components/wallet-widget.tsx`, `credit-indicator.tsx`, `credit-widget.tsx` | 잔액·크레딧 위젯 |
| `components/notification-bell.tsx`, `call-notification.tsx` | 알림 트리거 |
| `components/recommended-counselors.tsx` | (구) 추천 상담사 — 신규 페이지는 `CounselorCard variant='compact'` 직접 사용 권장 |
| `components/share-card.tsx`, `social-login-buttons.tsx`, `language-switcher.tsx` | 부속 |

## 페이지 구현 레시피

### 1. 신규 페이지 추가
1. `app/<route>/page.tsx` 생성 — 가능한 한 Server Component (data fetch)
2. 인터랙션 영역은 `'use client'` Client Component로 분리 (예: `<RouteContent>`)
3. design barrel에서 컴포넌트 우선 import → 없으면 shadcn/ui → 없으면 직접 작성
4. 디자인 토큰만 사용 (hex 0)
5. `motion-reduce:*` + focus-visible 토큰 부착
6. (선택) `app/<route>/loading.tsx`로 skeleton — `glow-card animate-pulse motion-reduce:animate-none`

### 2. immersive 페이지 추가 (chrome 제거)
1. `consultation/[sessionId]/<new>/page.tsx` 생성
2. AppHeader/BottomTabBar의 `isImmersive` 가드가 segment 비교로 자동 적용 — 별도 작업 X
3. 만약 `/consultation/<other>` 형태(같은 세그가 아닌 경로) 추가 시 두 chrome 컴포넌트의 가드 로직을 갱신 필요

### 3. 잔액 가드가 있는 결제 흐름
- 잔액 부족 시 `URLSearchParams`로 컨텍스트(counselorId/date/time/channel/price) 보존하면서 `/cash/buy?return=confirm&need=<shortage>&...`로 이동
- `/cash/buy` 성공 후 `return === 'confirm'`이면 sp에서 `return`/`need` 제거하고 `/booking/confirm?<나머지>`로 복귀

## 함정

- ❌ legacy `components/recommended-counselors.tsx` 또는 옛 `components/ui.tsx`의 ActionButton 사용 → 토큰 매핑 어긋남. 신규 페이지는 design barrel + shadcn `<Button variant="gold-grad">`
- ❌ root layout 직접 수정해 immersive 모드 만들기 → 다른 페이지 회귀. 위 layout group + pathname 가드 패턴 사용
- ❌ Server Component에서 client hook 사용 → 컴파일 에러. data fetch는 server, 인터랙션은 client로 분리
- ❌ `loading.tsx`에 인라인 hex 스타일 → ZEOM-21 baseline 위반. `glow-card animate-pulse motion-reduce:animate-none` 패턴
- ❌ chrome 가드의 early return을 hook 호출 *전*에 두기 → rules-of-hooks 위반 → 모든 hook 다 호출한 후 early return

## 검증

```bash
cd web && npx tsc --noEmit
cd web && npx jest --testPathPatterns=<page>
cd web && npm run build
# 9 화면 hex/entity audit
grep -rEn "#[0-9A-Fa-f]{3,6}\b|&#[0-9]+;" \
  web/src/app/page.tsx web/src/app/HomeContent.tsx \
  web/src/app/counselors web/src/app/booking web/src/app/cash web/src/app/bookings \
  web/src/app/consultation
# 결과 0건이어야 함
```
