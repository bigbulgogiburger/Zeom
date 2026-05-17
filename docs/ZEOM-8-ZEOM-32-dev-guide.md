# [ZEOM-32] P6-2 — 어드민 14페이지 dense migration

> 부모: [ZEOM-8](./ZEOM-8-dev-guide.md)
> 선행: [ZEOM-31](./ZEOM-8-ZEOM-31-dev-guide.md) (layout + AdminTableShell + CHART_COLORS 머지 완료)
> 슬라이스: P6-2 (14 페이지 변환)
> 생성일: 2026-05-17

## 0. Touched Files (ADR-070)

```
[수정]
  web/src/app/admin/login/page.tsx                        # public route — RequireAdmin 가드 외부
  web/src/app/admin/dashboard/page.tsx                    # KPI 4 + 차트 4 + 최근 이벤트
  web/src/app/admin/analytics/page.tsx                    # 차트 그리드 + DateRange
  web/src/app/admin/audit/page.tsx                        # 풀폭 audit log
  web/src/app/admin/counselor-applications/page.tsx       # 신청 + 모달 + 승인/반려
  web/src/app/admin/coupons/page.tsx                      # CRUD + 발급 dialog
  web/src/app/admin/disputes/page.tsx                     # 분쟁 큐
  web/src/app/admin/disputes/[id]/page.tsx                # 분쟁 상세
  web/src/app/admin/refunds/page.tsx                      # 환불 큐
  web/src/app/admin/reviews/page.tsx                      # 후기 모더레이션
  web/src/app/admin/settlements/page.tsx                  # 정산 큐 + bulk
  web/src/app/admin/timeline/page.tsx                     # 시스템 이벤트
  web/src/app/admin/users/page.tsx                        # 사용자 검색·리스트
  web/src/app/admin/users/[id]/page.tsx                   # 사용자 상세 + 액션
```

`disjoint` 보장 — ZEOM-31 touched 파일과 겹침 0. ZEOM-31 의 `AdminTableShell`/`CHART_COLORS`/`useBulkSelection`/`admin-charts` 만 *import*.

## 1. 페이지별 변환 매트릭스

| # | URL | Before | After (변환 포인트) |
|---|-----|--------|---------------------|
| 61 | `/admin/login` | 일반 로그인 카드 | "관리자" 뱃지 + 2FA prompt placeholder + 토큰 색 |
| 62 | `/admin/dashboard` | 활성 세션/통계/정산 (기존) | KPI 4 stat + LineChart 활성세션 + BarChart 정산 + PieChart 분쟁 사유 + 최근 이벤트 list (admin-charts wrapper 사용) |
| 63 | `/admin/analytics` | (가벼움) | 4~6 차트 그리드 + DateRangePicker (기본 30일) + tabular 합계 row |
| 64 | `/admin/audit` | 풀폭 테이블 | AdminTableShell + 검색·이벤트 타입·기간 필터 + tabular timestamp |
| 65 | `/admin/counselor-applications` | 카드 리스트 | AdminTableShell + 상세 modal (scaleIn) + 승인/반려 ghost |
| 66 | `/admin/coupons` | CRUD form | AdminTableShell (코드 목록) + 발급 dialog |
| 67 | `/admin/disputes` | 큐 카드 | AdminTableShell + bulk selection + 상태 badge |
| 68 | `/admin/disputes/[id]` | 상세 | 타임라인 + thread + 액션 버튼 ghost |
| 69 | `/admin/refunds` | 환불 큐 | AdminTableShell + bulk |
| 70 | `/admin/reviews` | 모더레이션 | AdminTableShell + 승인/숨김 ghost |
| 71 | `/admin/settlements` | 정산 큐 | AdminTableShell + bulk + tabular 금액 |
| 72 | `/admin/timeline` | 이벤트 | AdminTableShell or feed + 필터 |
| 73 | `/admin/users` | 검색 + 리스트 | AdminTableShell + 검색 + role badge |
| 74 | `/admin/users/[id]` | 상세 + 액션 | 카드 grid + 액션 (정지/복구/포인트) ghost dialog |

## 2. 변환 공통 처방 (부록 C.2)

- Container: `p-4 md:p-6` (layout main 이 이미 적용)
- 카드 padding `p-4` 고정
- 색상: gold 는 KPI 핵심 수치/active nav 만 — 나머지는 상태 색 (`success`/`warning`/`danger`/`muted`)
- 숫자: `tabular-nums` (Tailwind 유틸) — KPI/금액/날짜
- 차트: `<LineChartCard data={...} colorIndex={0} />` 등 wrapper 만 사용 — Recharts 직접 import 금지
- 테이블: `<AdminTableShell columns={...} rows={...} selectable={true} />` — 14페이지 중 13개가 table 중심
- modal/dialog: shadcn `<Dialog>` 베이스 + `data-state=open:animate-scaleIn` + 자동 포커스 트랩

## 3. 각 페이지 핵심 변경

### 61. `/admin/login`
- 기존 로그인 카드에 `<Badge variant="outline">관리자</Badge>` 추가
- 2FA 코드 input placeholder 추가 (label "OTP (선택)"), backend 미연동이면 disabled
- gold 강도 -2단계 — submit 버튼만 gold

### 62. `/admin/dashboard`
- 기존 활성 세션/통계 코드 유지하되 admin-charts wrapper 로 차트 4개 추가
- `StatCard` 4종 → `tabular-nums` 적용된 KPI 카드로 교체 (활성 세션 / 오늘 매출 / 신규 가입 / 분쟁 건수)
- 차트 4: LineChart(시간별 세션) · BarChart(일별 정산) · PieChart(분쟁 사유) · LineChart(매출 추세)
- 최근 이벤트 list — timeline 페이지의 축약 버전 5건

### 63. `/admin/analytics`
- DateRangePicker (shadcn calendar 응용) → 기본 30일
- 차트 그리드 3x2 또는 2x3 (responsive)
- 합계 row: tabular-nums + 토큰 색

### 64. `/admin/audit`
- AdminTableShell (sticky/zebra)
- 필터: 사용자 검색 / 이벤트 타입 / 기간
- 컬럼: timestamp(tabular) / user / action / resource / ip
- 페이지네이션 — shadcn `<Pagination>`

### 65. `/admin/counselor-applications`
- AdminTableShell + 행 클릭 → 상세 modal (`<Dialog>` scaleIn)
- 모달: 신청 정보 + 승인/반려 ghost 버튼
- 반려 시 사유 textarea

### 66. `/admin/coupons`
- 상단 "발급" 버튼 → Dialog (코드/할인율/만료/배포 대상)
- 표: 코드 / 할인 / 발급 수 / 사용 수 / 만료 / 상태 badge

### 67. `/admin/disputes` & 68. `[id]`
- 큐: AdminTableShell + bulk (일괄 검토 처리) + status badge
- 상세: 타임라인 (lucide:Activity) + thread list + 액션 ghost (해결/환불승인/반려)

### 69. `/admin/refunds`
- 큐 형태 — disputes 유사 + bulk
- 컬럼: 환불 번호 / 사용자 / 금액(tabular) / 사유 / 요청일 / 상태

### 70. `/admin/reviews`
- 후기 카드 list or table — 행마다 미리보기 + 승인/숨김 ghost
- 키워드 필터

### 71. `/admin/settlements`
- AdminTableShell + bulk + 일괄 송금 ghost 액션
- 금액 컬럼 tabular-nums + gold (KPI 핵심)
- 기존 코드의 forceEndSession 같은 무관 로직 분리

### 72. `/admin/timeline`
- 시스템 이벤트 (audit 와 구분 — system-level)
- 시간 tabular + 이벤트 타입 badge + 필터

### 73. `/admin/users`
- 검색 input (이메일/이름) + role badge (USER/COUNSELOR/ADMIN)
- AdminTableShell + 행 클릭 → `/admin/users/[id]`

### 74. `/admin/users/[id]`
- 카드 grid: 기본 정보 / 인증 / 결제 / 활동 / 액션
- 액션 dialog: 정지 (사유) / 복구 / 포인트 조정 (금액 + 사유)

## 4. AC 매핑 (ZEOM-32 description)

- [ ] 14페이지 §4.9 + 부록 C.2 일치 → 각 변환표대로
- [ ] Recharts 모든 차트 토큰 색 → `admin-charts` wrapper 만 사용
- [ ] 테이블 bulk selection keyboard (Shift+Click 범위) → `useBulkSelection`
- [ ] tabular 모든 숫자 → `tabular-nums` class
- [ ] modal dialog scaleIn + Esc close + 포커스 트랩 → shadcn `<Dialog>` baseline
- [ ] mobile 가로 스크롤 가능 → AdminTableShell wrapper `overflow-x-auto`
- [ ] verify-admin-auth PASS → layout 가드 + 14페이지 RequireAdmin 중복 제거
- [ ] 4 뷰포트 — admin desktop 우선, mobile 깨짐 없음

## 5. 검증

```bash
cd web
npx tsc --noEmit
npm test
npm run build
rg -nE '#[0-9A-Fa-f]{3,6}\b|&#[0-9]+;' web/src/app/admin   # 0건
rg -nE '[📞👤⚠️★☆🛡️🔒]' web/src/app/admin                 # 0건
```

`Skill('verify-admin-auth')` → 14 admin endpoint 가드 회귀 0건.
`Skill('verify-frontend-ui')` → admin 범위 토큰 baseline + Korean text rules PASS.

## 6. 위험 및 대응

| 위험 | 대응 |
|------|------|
| 14페이지 동시 수정 시 일관성 누락 | AdminTableShell + admin-charts wrapper 강제 → page level 차이 최소화 |
| RequireAdmin 제거 중 보호 누락 | `Skill('verify-admin-auth')` 로 회귀 0 확인 |
| Recharts data 형태 페이지마다 차이 | wrapper component 가 `data: Array<{label, value}>` 단일 형태만 받게 강제 |
| KPI 데이터 source 부재 (백엔드 미구현) | mock data + TODO comment — 백엔드 API 가 없으면 zero state placeholder |
| 모달 포커스 트랩 미작동 | shadcn `<Dialog>` 의 Radix 기본 포커스 트랩 활용 (수정 0) |
| 모바일 테이블 가로 스크롤 시 헤더 안 따라옴 | AdminTableShell sticky header + wrapper overflow 패턴 검증 |

## 7. Out of Scope

- 전역 검색 input 실제 기능 (placeholder만)
- 2FA 백엔드 연동 (UI placeholder만)
- 신규 admin API 엔드포인트 (UI는 기존 데이터로 동작)
- 정산 자동화 / 일괄 송금 처리 로직 (UI ghost 액션만)
