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
| `app_flutter/lib/features/dispute/dispute_list_screen.dart` | 분쟁 목록 |
| `app_flutter/lib/features/dispute/dispute_detail_screen.dart` | 분쟁 상세 |
| `app_flutter/lib/features/dispute/dispute_create_screen.dart` | 분쟁 생성 |
| `app_flutter/lib/features/fortune/fortune_screen.dart` | 운세 상세 (사주 기반 + 오행 차트) |
| `app_flutter/lib/features/fortune/saju_chart_screen.dart` | 사주 명식 화면 (4기둥 시각화) |
| `app_flutter/lib/features/auth/onboarding_screen.dart` | 온보딩 플로우 |
| `app_flutter/lib/core/push_notification_service.dart` | 푸시 알림 서비스 |
| `app_flutter/pubspec.yaml` | 의존성 정의 |
| `app_flutter/ios/Runner/SendbirdCallsPlugin.swift` | iOS Sendbird Calls native plugin |
| `app_flutter/ios/Runner/SendbirdVideoViewFactory.swift` | iOS PlatformView for video rendering |
| `app_flutter/ios/Runner/AppDelegate.swift` | iOS plugin/PlatformView registration |
| `app_flutter/ios/Podfile` | iOS native dependencies (SendBirdCalls pod) |
| `app_flutter/ios/Runner/Info.plist` | iOS permissions (camera, microphone) |
| `app_flutter/android/app/src/main/kotlin/com/cheonjiyeon/cheonjiyeon_app/SendbirdCallsPlugin.kt` | Android Sendbird Calls native plugin |
| `app_flutter/android/app/src/main/kotlin/com/cheonjiyeon/cheonjiyeon_app/SendbirdVideoViewFactory.kt` | Android PlatformView for video rendering |
| `app_flutter/android/app/src/main/kotlin/com/cheonjiyeon/cheonjiyeon_app/MainActivity.kt` | Android plugin registration |
| `app_flutter/android/app/build.gradle` | Android dependencies (Sendbird SDK) |
| `app_flutter/android/app/src/main/AndroidManifest.xml` | Android permissions (camera, audio, bluetooth) |
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

### Step 8: Flutter ↔ Backend API 응답 필드명 동기화

**도구:** Grep

크레딧 잔액 필드 — Backend는 `totalUnits/usedUnits/remainingUnits` 반환:
```bash
grep -n "remainingUnits\|remaining\|usedUnits\|used\|balance.*credits\|credits.*balance" app_flutter/lib/features/wallet/wallet_screen.dart app_flutter/lib/features/credit/credit_buy_screen.dart
```

상품 분(minutes) 필드 — Backend는 `minutes` 반환:
```bash
grep -n "durationMinutes\|minutes" app_flutter/lib/features/wallet/cash_buy_screen.dart app_flutter/lib/features/credit/credit_buy_screen.dart
```

**PASS:** `remainingUnits`를 우선 사용하고 fallback(`remaining`, `remainingCredits`) 존재, `minutes`를 우선 사용하고 fallback(`durationMinutes`) 존재
**FAIL:** 이전 필드명(`remaining`, `balance`, `durationMinutes`)만 단독 사용
**수정:** Backend API 응답 필드(`remainingUnits`, `minutes`)를 우선 참조하고 호환성 fallback 추가

### Step 9: 네이티브 플랫폼 통합 검증

**도구:** Bash / Grep

1. **iOS Podfile에 SendBirdCalls 포함 확인**

```bash
grep -n "SendBirdCalls" app_flutter/ios/Podfile
```

**PASS:** SendBirdCalls pod이 Podfile에 존재
**FAIL:** iOS에서 Sendbird 통화 불가

2. **Android build.gradle에 Sendbird SDK 포함 확인**

```bash
grep -n "sendbird-calls" app_flutter/android/app/build.gradle
```

**PASS:** sendbird-calls 의존성 존재
**FAIL:** Android에서 Sendbird 통화 불가

3. **iOS 카메라/마이크 권한 확인**

```bash
grep -n "NSCameraUsageDescription\|NSMicrophoneUsageDescription" app_flutter/ios/Runner/Info.plist
```

**PASS:** 카메라, 마이크 Usage Description 모두 존재
**FAIL:** 권한 누락 시 앱 크래시 발생

4. **Android 권한 확인**

```bash
grep -n "CAMERA\|RECORD_AUDIO" app_flutter/android/app/src/main/AndroidManifest.xml
```

**PASS:** CAMERA, RECORD_AUDIO 권한 모두 존재
**FAIL:** 권한 누락 시 런타임 에러

### Step 10: UTC 시간 파싱 안전성 검증

**도구:** Grep

1. **DateTime.parse() 직접 사용 금지**: booking_list_screen.dart에서 API 응답의 날짜 문자열을 `DateTime.parse()` 대신 `_parseUtc()`로 파싱하는지 확인

```bash
grep -n "DateTime.parse" app_flutter/lib/features/booking/booking_list_screen.dart
```

**PASS:** `DateTime.parse` 직접 호출 없음 (모두 _parseUtc 사용)
**FAIL:** `DateTime.parse` 직접 호출 발견 — UTC→KST 변환 누락으로 시간 오류 발생

2. **null-safe 캐스팅**: API 응답 맵에서 `as String`, `as int` 하드 캐스팅 대신 null-safe 캐스팅 사용 확인

```bash
grep -n "as String;" app_flutter/lib/features/home/home_screen.dart | grep -v "as String?"
```

**PASS:** 하드 캐스팅 없음
**FAIL:** null이 올 수 있는 필드에 하드 캐스팅 사용 → 런타임 크래시

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
| API 필드명 동기화 | PASS/FAIL | 불일치 필드: ... |
| 네이티브 플랫폼 통합 | PASS/FAIL | 누락 의존성/권한: ... |
| UTC 시간 파싱 안전성 | PASS/FAIL | 위반 위치: ... |

## Exceptions

1. **Admin/Counselor 포털**: 웹 전용 관리자/상담사 포털 페이지 (`web/src/app/admin/`, `web/src/app/counselor/`)는 Flutter에 대응 화면이 없어도 정상 — 모바일에서 관리자 기능은 불필요
2. **웹 전용 SEO 페이지**: sitemap, robots 등 SEO 관련 페이지는 Flutter에 불필요
3. **Flutter 전용 네이티브 기능**: 카메라, 갤러리 등 네이티브 기능은 React에 대응 페이지가 없어도 정상
4. **Sendbird Calls SDK**: Flutter에서 `sendbird_calls` 패키지 사용, React에서 `sendbird-calls` npm 사용 — import 경로가 다른 것은 정상
