---
name: verify-flutter-app
description: Flutter 앱 품질 및 React-Flutter UX 동기화 검증. Flutter 코드 변경 후 사용.
---

## Purpose

1. Flutter ↔ React 화면 기능 동기화 (동일 기능이 양쪽 플랫폼에 존재) 검증
2. Flutter API 클라이언트와 백엔드 엔드포인트 매칭 검증
3. GoRouter 라우트 정의와 화면 파일 일관성 검증
4. Flutter 디자인 토큰과 React 디자인 토큰 일관성 검증
5. Riverpod Provider 사용 패턴 검증

## When to Run

- `app_flutter/lib/features/*/` 화면 파일 추가/변경 시
- `app_flutter/lib/core/api_client.dart` API 메서드 추가/변경 시
- `app_flutter/lib/core/router.dart` 라우트 추가/변경 시
- `app_flutter/lib/shared/theme.dart` 디자인 토큰 변경 시
- `web/src/app/` 페이지 변경 후 Flutter 동기화 필요 시

## Related Files

| File | Purpose |
|------|---------|
| `app_flutter/lib/core/api_client.dart` | Dio HTTP 클라이언트 (모든 API 호출) |
| `app_flutter/lib/core/auth_service.dart` | 인증 서비스 (JWT 토큰 관리) |
| `app_flutter/lib/core/router.dart` | GoRouter 라우트 정의 |
| `app_flutter/lib/core/sendbird_calls_service.dart` | Sendbird 통화 서비스 |
| `app_flutter/lib/shared/theme.dart` | 디자인 토큰 및 테마 정의 |
| `app_flutter/lib/features/home/home_screen.dart` | 홈 화면 |
| `app_flutter/lib/features/home/main_screen.dart` | 메인 탭 스캐폴드 |
| `app_flutter/lib/features/auth/login_screen.dart` | 로그인 화면 |
| `app_flutter/lib/features/auth/signup_screen.dart` | 회원가입 화면 |
| `app_flutter/lib/features/auth/auth_provider.dart` | 인증 상태 Riverpod Provider |
| `app_flutter/lib/features/counselor/counselor_list_screen.dart` | 상담사 목록 |
| `app_flutter/lib/features/counselor/counselor_detail_screen.dart` | 상담사 상세 |
| `app_flutter/lib/features/booking/booking_create_screen.dart` | 예약 생성 |
| `app_flutter/lib/features/booking/booking_list_screen.dart` | 예약 목록 |
| `app_flutter/lib/features/wallet/wallet_screen.dart` | 지갑 화면 |
| `app_flutter/lib/features/wallet/cash_buy_screen.dart` | 캐시 충전 |
| `app_flutter/lib/features/credit/credit_buy_screen.dart` | 상담권 구매 |
| `app_flutter/lib/features/consultation/consultation_complete_screen.dart` | 상담 완료 |
| `app_flutter/lib/features/consultation/consultation_history_screen.dart` | 상담 이력 |
| `app_flutter/lib/features/consultation/consultation_room_screen.dart` | 상담실 |
| `app_flutter/lib/features/consultation/consultation_preflight_screen.dart` | 상담 사전 체크 |
| `app_flutter/lib/features/consultation/review_screen.dart` | 리뷰 작성 |
| `app_flutter/lib/features/refund/refund_list_screen.dart` | 환불 목록 |
| `app_flutter/lib/features/refund/refund_request_screen.dart` | 환불 요청 |
| `app_flutter/lib/features/more/more_screen.dart` | 더보기/설정 |
| `app_flutter/pubspec.yaml` | 의존성 정의 |
| `web/src/components/api-client.ts` | React API 클라이언트 (매칭 비교용) |
| `web/src/app/globals.css` | React 디자인 토큰 (매칭 비교용) |

## Workflow

### Step 1: Flutter 빌드 검증

**도구:** Bash

```bash
cd app_flutter && dart analyze lib/ 2>&1 | tail -5
```

**PASS:** "No issues found!" 출력
**FAIL:** 분석 에러 또는 경고 존재
**수정:** 에러에 따라 코드 수정

### Step 2: API 클라이언트 ↔ 백엔드 엔드포인트 매칭

**도구:** Grep

Flutter API 호출 추출:
```bash
grep -n '/api/v1/' app_flutter/lib/core/api_client.dart
```

백엔드 엔드포인트 추출:
```bash
grep -rn '@GetMapping\|@PostMapping\|@PutMapping\|@DeleteMapping' backend/src/main/java/com/cheonjiyeon/api/ | grep -oP '"/api/v1/[^"]*"' | sort -u
```

**PASS:** Flutter에서 호출하는 모든 API 경로가 백엔드에 존재
**FAIL:** Flutter에서 호출하는 API 경로가 백엔드에 없음
**수정:** 불일치하는 경로 수정 또는 백엔드 엔드포인트 추가

### Step 3: GoRouter 라우트 ↔ 화면 파일 매칭

**도구:** Grep

라우트 정의 추출:
```bash
grep -n "path:" app_flutter/lib/core/router.dart
```

화면 파일 존재 확인:
```bash
ls app_flutter/lib/features/*/*.dart
```

**PASS:** 모든 라우트에 대응하는 화면 파일 존재, import 경로 일치
**FAIL:** 라우트가 존재하지 않는 화면을 참조하거나, 화면이 라우트에 등록되지 않음
**수정:** 누락된 라우트 추가 또는 화면 파일 생성

### Step 4: Flutter ↔ React 화면 기능 동기화

**도구:** Grep

Flutter 화면 목록 추출:
```bash
ls app_flutter/lib/features/*/ | grep '_screen.dart'
```

React 페이지 목록 추출:
```bash
find web/src/app -name 'page.tsx' -not -path '*/admin/*' -not -path '*/counselor/*' | sort
```

**PASS:** 핵심 사용자 플로우 (홈, 로그인, 상담사, 예약, 지갑, 상담, 리뷰, 환불)가 양쪽 플랫폼에 존재
**FAIL:** React에 있으나 Flutter에 없는 핵심 화면 (또는 그 반대)
**수정:** 누락된 화면 구현

### Step 5: 디자인 토큰 일관성

**도구:** Grep

Flutter 테마 색상:
```bash
grep -n 'Color(0x\|Color.fromRGBO\|primaryColor\|gold\|#' app_flutter/lib/shared/theme.dart
```

React 디자인 토큰:
```bash
grep -n '\-\-color-' web/src/app/globals.css | head -15
```

**PASS:** 핵심 색상 (primary/gold, background, card, text)이 양쪽 플랫폼에서 동일/유사
**FAIL:** 색상값이 크게 다름 (예: Flutter에서 blue인데 React에서 gold)
**수정:** 디자인 토큰 통일

### Step 6: Riverpod Provider 패턴 확인

**도구:** Grep

Provider 정의 확인:
```bash
grep -rn 'Provider\|StateNotifier\|FutureProvider\|StreamProvider' app_flutter/lib/features/ app_flutter/lib/core/ | grep -v '.dart:.*import' | head -20
```

ConsumerWidget/ConsumerStatefulWidget 사용 확인:
```bash
grep -rn 'ConsumerWidget\|ConsumerStatefulWidget\|ref.watch\|ref.read' app_flutter/lib/features/ | head -20
```

**PASS:** 모든 화면이 ConsumerWidget/ConsumerStatefulWidget 사용, Provider로 상태 관리
**FAIL:** StatefulWidget에서 직접 API 호출 (Provider 미사용)
**수정:** Provider 패턴으로 리팩토링

### Step 7: Flutter API 클라이언트 ↔ React API 클라이언트 메서드 매칭

**도구:** Grep

Flutter API 메서드:
```bash
grep -n 'Future<\|async' app_flutter/lib/core/api_client.dart | grep -v '//' | head -30
```

React API 메서드:
```bash
grep -n 'async\|export' web/src/components/api-client.ts | grep -v '//' | head -30
```

**PASS:** 핵심 API 메서드 (auth, counselor, booking, wallet, credit, consultation, review, refund)가 양쪽에 존재
**FAIL:** React에 있으나 Flutter에 없는 API 메서드 (또는 그 반대)
**수정:** 누락된 API 메서드 추가

## Output Format

| 검사 | 결과 | 상세 |
|------|------|------|
| Flutter 빌드 | PASS/FAIL | dart analyze 결과 |
| API 엔드포인트 매칭 | PASS/FAIL | 불일치 경로: ... |
| 라우트-화면 매칭 | PASS/FAIL | 누락 라우트: ... |
| Flutter-React 동기화 | PASS/FAIL | 누락 화면: ... |
| 디자인 토큰 일관성 | PASS/FAIL | 불일치 색상: ... |
| Riverpod 패턴 | PASS/FAIL | 패턴 위반: ... |
| API 클라이언트 매칭 | PASS/FAIL | 누락 메서드: ... |

## Exceptions

1. **Admin/Counselor 포털**: 웹 전용 관리자/상담사 포털 페이지 (`web/src/app/admin/`, `web/src/app/counselor/`)는 Flutter에 대응 화면이 없어도 정상 — 모바일에서 관리자 기능은 불필요
2. **웹 전용 SEO 페이지**: sitemap, robots 등 SEO 관련 페이지는 Flutter에 불필요
3. **Flutter 전용 네이티브 기능**: 카메라, 갤러리 등 네이티브 기능은 React에 대응 페이지가 없어도 정상
4. **Sendbird Calls SDK**: Flutter에서 `sendbird_calls` 패키지 사용, React에서 `sendbird-calls` npm 사용 — import 경로가 다른 것은 정상
