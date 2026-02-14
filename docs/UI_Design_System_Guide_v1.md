# UI Design System Guide v1 (Zeom)

## 1) 목적
운영/사용자 화면의 일관된 경험을 위해 공통 컴포넌트와 스타일 규칙을 정의한다.

## 2) 공통 컴포넌트
위치: `web/src/components/ui.tsx`

- `Card`: 기본 컨테이너 카드
- `PageTitle`: 페이지 타이틀
- `StatusBadge`: 상태값 시각화 배지
- `StatCard`: 대시보드 수치 카드
- `EmptyState`: 빈 상태 안내
- `InlineError`: 에러 메시지
- `InlineSuccess`: 성공 메시지
- `ActionButton`: 로딩/비활성/접근성 포함 버튼

## 3) 기본 규칙
- 페이지 루트 여백: `padding: 24`
- 기본 섹션 간격: `gap: 12`
- 카드 라운드: `12px`
- 버튼 최소 높이: `40px` (폼 제출은 `42px` 권장)
- 입력 패딩: 좌우 `10px`

## 4) 상태 색상 규칙
- 성공 계열: `PAID`, `OPEN`, `BOOKED`, `AUTH_LOGIN`, `AUTH_SIGNUP`, `AUTH_ADMIN_LOGIN`
- 대기 계열: `PENDING`
- 실패/종료 계열: `FAILED`, `CANCELED`, `PAYMENT_FAILED`, `PAYMENT_CANCELED`, `CLOSED`, `AUTH_LOGIN_FAIL`, `AUTH_REFRESH_REUSE_DETECTED`

## 5) 접근성 규칙
- input은 `label + htmlFor` 필수
- 로그인/회원가입 필드 `required` 및 `autocomplete` 지정
- 에러는 `role=alert`, 성공은 `role=status`
- 처리중 버튼은 `aria-busy=true`

## 6) API 액션 UX 규칙
- 비동기 시작 시: `loading=true`, 기존 에러/성공 메시지 초기화
- 성공 시: `InlineSuccess` 표시
- 실패 시: `InlineError` 표시
- 액션 버튼은 `ActionButton` 사용

## 7) 페이지 적용 우선순위
1. Admin: Dashboard / Audit / Timeline
2. User: Counselors / Bookings / Sessions
3. Auth: Login / Signup / Admin Login
4. Home

## 8) 금지 항목
- 페이지별 임의 색상/간격 하드코딩 남발 금지
- 동일 의미 상태를 다른 색으로 표현 금지
- 로딩 없는 제출 버튼 금지
