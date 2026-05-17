# Flutter Testing

> **Sub affinity**: app_flutter 전용
> 참조 시점: Flutter widget / integration / unit 테스트 작성·수정·실행

## 실행

```bash
flutter test                                 # widget + unit
flutter test test/<file>_test.dart           # 단일
flutter test integration_test/               # 통합 (디바이스/시뮬레이터 필요)
flutter analyze                              # 정적 분석 (analysis_options.yaml)
```

## 패턴

### Widget 테스트

```dart
testWidgets('Counselor card shows name', (tester) async {
  await tester.pumpWidget(
    ProviderScope(child: MaterialApp(home: CounselorCard(...))),
  );
  expect(find.text('상담사 이름'), findsOneWidget);
});
```

### Riverpod 오버라이드

```dart
ProviderScope(
  overrides: [
    apiClientProvider.overrideWithValue(MockApiClient()),
    authProvider.overrideWith((ref) => MockAuthNotifier()),
  ],
  child: ...,
)
```

### GoRouter 테스트

```dart
final router = GoRouter(routes: [...]);
await tester.pumpWidget(MaterialApp.router(routerConfig: router));
router.go('/counselor/1');
await tester.pumpAndSettle();
```

## 통합 테스트 (`integration_test/`)

- 실제 디바이스/시뮬레이터 필요
- `IntegrationTestWidgetsFlutterBinding` 사용
- 백엔드는 fake 또는 docker MySQL — 실 PortOne/Sendbird 호출 X

## 함정

- ❌ `flutter build` 만으로 검증 종료 → ✅ `flutter run` 으로 실제 실행 (라우팅·인증 가드·통화 검증)
- ❌ Riverpod provider 의 상태가 테스트 간 누수 → ✅ `ProviderScope` 를 각 테스트마다 새로 / `overrides:` 명시
- ❌ `setState` 후 `tester.pump()` 만 호출 → 비동기 안 끝남. ✅ `tester.pumpAndSettle()` (단 타임아웃 주의)
- ❌ secure storage 모킹 누락 → 테스트에서 native 접근 시 fail. ✅ `MethodChannel` mock 또는 wrapper provider 오버라이드
- ❌ 실 Firebase/Kakao SDK 호출 → 테스트 격리 깨짐. ✅ services 를 인터페이스로 추상화 후 오버라이드

## 관련 reference

- `architecture.md` — feature 모듈 패턴 + Riverpod decision tree
- `coding-style.md` — Dart 컨벤션 + null safety
- `../../../.claude/docs/reference/sendbird-guide.md` — 통화 클라이언트 (3 sub 공통 userId 규약)
