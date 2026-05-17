# Flutter Architecture

> 참조 시점: `app_flutter/` 작업 (feature 추가, 라우팅, API 호출, 상태 관리)

## 개요

Flutter 3.2+, **Riverpod** (상태) + **go_router** (라우팅) + **Dio** (HTTP). 백엔드 도메인과 1:1로 매핑되는 feature-first 구조. JWT는 `flutter_secure_storage`에 보관, 401 시 자동 refresh.

## 디렉토리 구조

```
app_flutter/lib/
├── main.dart                    # ProviderScope + MaterialApp.router
├── core/
│   ├── api_client.dart          # Dio 싱글톤 + interceptors
│   ├── router.dart              # GoRouter 설정 (auth redirect 포함)
│   └── push_notifications.dart  # FCM 핸들러
├── features/                    # 11개 feature 모듈
│   ├── auth/
│   ├── booking/
│   ├── consultation/
│   ├── counselor/
│   ├── credit/
│   ├── dispute/
│   ├── fortune/
│   ├── home/
│   ├── more/
│   ├── refund/
│   └── wallet/
├── services/                    # OAuth (Kakao 등)
└── shared/                      # 테마, 공용 위젯, 애니메이션, 글로벌 provider
```

## Feature 모듈 패턴

각 feature는 화면 단위 파일을 직접 둠 (DDD 강제 X). 예: `features/consultation/`
- `consultation_history_screen.dart` — 이력 리스트
- `consultation_preflight_screen.dart` — 입장 전 체크
- `consultation_room_screen.dart` — 통화 진행 중
- `consultation_complete_screen.dart` — 종료
- `review_screen.dart` — 종료 후 리뷰

## 레시피: 새 feature 추가

1. `features/<name>/` 디렉토리 생성
2. `<name>_screen.dart` (화면) + `<name>_provider.dart` (Riverpod AsyncNotifier) 작성
3. `core/router.dart` 에 GoRoute 추가 — 인증 필요하면 redirect 로직이 자동 처리
4. API 호출은 `core/api_client.dart`의 `apiClient` provider 주입 (Dio 인스턴스 + JWT 자동)

## 레시피: 인증된 API 호출

```dart
final result = await ref.read(apiClientProvider).post(
  '/api/v1/sessions/$reservationId/start',
);
// JWT는 InterceptorsWrapper.onRequest 에서 access_token 쿠키 → Authorization 헤더로 자동 주입
// 401 발생 시 onError 가 /api/v1/auth/refresh 호출 후 요청 재시도
```

## 레시피: 라우팅 + 인증 가드

`core/router.dart` 의 `redirect:` 콜백이 secure storage의 토큰 존재 여부로 판단.
- 토큰 없음 + 보호 라우트 → `/login`
- 토큰 있음 + `/login` 진입 → `/home`
- public 라우트 (`/login`, `/signup`) 는 redirect 제외 목록에 추가

## 의사결정 트리

| 상황 | 선택 |
|------|------|
| 단순 화면 상태 (위젯 내부) | `StatefulWidget` |
| 비동기 데이터 + 화면 간 공유 | Riverpod `AsyncNotifierProvider` |
| 글로벌 (auth, theme) | `shared/providers/` |
| 일회성 비동기 (버튼 클릭) | `ref.read()` + `try/catch` |

## 함정 / 안티패턴

- ❌ `http` 패키지 직접 사용 → ✅ `apiClientProvider` (Dio 인터셉터로 401 refresh + JWT가 자동)
- ❌ `SharedPreferences`에 JWT 저장 → ✅ `flutter_secure_storage` (iOS Keychain / Android Keystore)
- ❌ 화면에서 `Navigator.push` 직접 호출 → ✅ `context.go()` / `context.push()` (GoRouter)
- ❌ `setState` 로 비동기 결과 반영 → ✅ Riverpod `AsyncValue` (loading/error/data 분기)

## 검증 방법

- `cd app_flutter && flutter test` — Widget + unit
- 시뮬레이터/디바이스: `flutter run` (build만 X — 실제 실행으로 확인)
- 라우팅 가드는 secure storage를 비운 상태로 보호 라우트 접근 시 `/login` 전환 확인
