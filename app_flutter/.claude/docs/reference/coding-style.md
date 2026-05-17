# Flutter Coding Style

> **Sub affinity**: app_flutter 전용 (Flutter 3.2+ · Dart · Riverpod · go_router)
> 참조 시점: 신규 screen/provider/widget/service 작성, 기존 코드 수정 시 컨벤션 확인

## 언어/툴체인

- **Dart SDK** `>=3.2.0 <4.0.0` (sound null safety)
- Lint: `flutter_lints/flutter.yaml` (`analysis_options.yaml`) — 표준 Flutter recommended 셋
- 검증: `flutter analyze`
- 포맷: `dart format .` (IDE 자동 권장)

## 파일 구조

```
lib/
├── main.dart
├── core/                  싱글톤 서비스 (api_client, router, push, sendbird_calls)
├── features/<name>/       feature-first
│   ├── <name>_screen.dart
│   └── <name>_provider.dart
├── services/              OAuth wrapper (kakao_login_service, naver_login_service)
└── shared/                widgets · providers · theme
```

## Naming

| 종류 | 규칙 | 예시 |
|------|------|------|
| File | `snake_case.dart` | `auth_provider.dart`, `consultation_room_screen.dart` |
| Class | `PascalCase` | `AuthState`, `ConsultationRoomScreen` |
| Method/Field/Variable | `camelCase` | `isAuthenticated`, `loadWallet()` |
| Constant | `lowerCamelCase` (top-level) / `UPPER_SNAKE` (compile-time) | `defaultTimeout`, `MAX_RETRIES` |
| Private | leading `_` | `_loadData`, `_isLoading` |
| Screen | 접미사 `Screen` | `LoginScreen`, `BookingCreateScreen` |
| Provider | 접미사 `Provider` (변수) | `authProvider`, `apiClientProvider` |
| Widget (공용) | 접두사 `Zeom` | `ZeomButton`, `ZeomAppBar` |

## Widget 패턴

### StatelessWidget (단순 표시)

```dart
class ZeomChip extends StatelessWidget {
  const ZeomChip({super.key, required this.label, this.selected = false});

  final String label;
  final bool selected;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(...),
      child: Text(label),
    );
  }
}
```

### ConsumerWidget (Riverpod 단순)

```dart
class WalletBadge extends ConsumerWidget {
  const WalletBadge({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final wallet = ref.watch(walletProvider);
    return wallet.when(
      data: (w) => Text('${w.balance}원'),
      loading: () => const CircularProgressIndicator(),
      error: (e, _) => Text('오류: $e'),
    );
  }
}
```

### ConsumerStatefulWidget (상태 + Riverpod)

```dart
class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});
  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _emailCtl = TextEditingController();
  @override
  void dispose() { _emailCtl.dispose(); super.dispose(); }
  // ...
}
```

## Riverpod 패턴

### 불변 State + copyWith

```dart
class AuthState {
  final bool isAuthenticated;
  final bool isLoading;
  final Map<String, dynamic>? user;
  final String? error;

  AuthState({
    this.isAuthenticated = false,
    this.isLoading = false,
    this.user,
    this.error,
  });

  AuthState copyWith({
    bool? isAuthenticated,
    bool? isLoading,
    Map<String, dynamic>? user,
    String? error,
  }) => AuthState(
    isAuthenticated: isAuthenticated ?? this.isAuthenticated,
    isLoading: isLoading ?? this.isLoading,
    user: user ?? this.user,
    error: error,
  );
}
```

### Notifier (auth/wallet 같은 글로벌)

```dart
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref.read(authServiceProvider));
});

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier(this._service) : super(AuthState());
  final AuthService _service;

  Future<void> login(String email, String password) async {
    state = state.copyWith(isLoading: true);
    try {
      final user = await _service.login(email, password);
      state = state.copyWith(isAuthenticated: true, isLoading: false, user: user);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }
}
```

### 비동기 데이터 (AsyncValue)

```dart
final bookingsProvider = AsyncNotifierProvider<BookingsNotifier, List<Booking>>(...);

ref.watch(bookingsProvider).when(
  data: (list) => ListView(...),
  loading: () => CircularProgressIndicator(),
  error: (e, _) => Text('$e'),
);
```

## 라우팅 (go_router)

```dart
// 전환
context.go('/home');              // replace
context.push('/counselor/1');     // stack
context.pop();

// extra payload
context.push('/booking/create', extra: {'counselorId': 1});
final extra = state.extra as Map<String, dynamic>?;
```

`core/router.dart` 의 `redirect:` 가 secure storage 토큰으로 인증 가드 — 보호 라우트 직접 진입 시 `/login` 으로 강제.

## API 호출

```dart
final response = await ref.read(apiClientProvider).post(
  '/api/v1/sessions/$reservationId/start',
);
```

- `apiClientProvider` (Dio) 의 `InterceptorsWrapper` 가 JWT 자동 주입 + 401 시 `/api/v1/auth/refresh` 후 재시도
- `http` 패키지 직접 사용 금지

## Theme / 색

- 색은 `AppTheme.theme` (`shared/theme.dart`) 의 `ColorScheme` 토큰만
- 한국어 본문: Pretendard (현재 `GoogleFonts.notoSans()` 폴백, Pretendard Variable local bundle 예정 — pubspec.yaml 주석 참조)
- 헤딩: `ZeomType` (theme.dart) 의 스케일 사용

## Import 정렬

1. `dart:*`
2. `package:flutter/...`
3. `package:` (외부 — riverpod, go_router, dio, ...)
4. relative (`../`, `./`)

각 그룹 간 빈 줄 1.

## 금지

- ❌ `http` 패키지 직접 사용 → `apiClientProvider` (Dio)
- ❌ `SharedPreferences` 에 JWT → `flutter_secure_storage`
- ❌ `Navigator.push` 직접 → `context.go()` / `context.push()`
- ❌ `setState` 로 비동기 결과 반영 → `AsyncValue.when(data/loading/error)`
- ❌ `Sendbird userId` 에 prefix 누락 → `user_$userId` / `counselor_$counselorId`
- ❌ `print()` → `debugPrint()` 또는 logger
- ❌ 위젯 build 안에서 무거운 연산 / API 호출 → `initState` 또는 provider
- ❌ Global mutable singleton (`static var`) — Riverpod provider

## 관련 reference

- `architecture.md` — feature 모듈 + decision tree
- `testing.md` — widget/integration 테스트 패턴
- `../../../.claude/docs/reference/sendbird-guide.md` — 통화 (3 sub 공통 userId 규약)
