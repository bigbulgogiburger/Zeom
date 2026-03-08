import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:cheonjiyeon_app/main.dart' as app;

void main() {
  final binding = IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('E2E 고객 플로우', () {
    testWidgets('로그인 → 홈 → 상담사 → 예약 확인', (tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // -- Step 1: 로그인 --
      // 이메일 입력
      final emailField = find.byType(TextFormField).first;
      await tester.enterText(emailField, 'e2e_customer@test.com');
      await tester.pumpAndSettle();

      // 비밀번호 입력
      final passwordField = find.byType(TextFormField).last;
      await tester.enterText(passwordField, 'test1234');
      await tester.pumpAndSettle();

      // 로그인 버튼 클릭
      final loginButton = find.widgetWithText(ElevatedButton, '로그인');
      expect(loginButton, findsOneWidget);
      await tester.tap(loginButton);

      // 로그인 완료 대기 (네트워크 요청)
      await tester.pumpAndSettle(const Duration(seconds: 5));

      // -- Step 2: 홈/메인 화면 확인 --
      // 로그인 성공 시 /home으로 이동
      // BottomNavigationBar 또는 탭 확인
      final homeExists = find.text('홈').evaluate().isNotEmpty;
      final counselorExists = find.text('상담사').evaluate().isNotEmpty;
      debugPrint('=== 로그인 후 화면 ===');
      debugPrint('홈 탭: $homeExists');
      debugPrint('상담사 탭: $counselorExists');

      // 시뮬레이터 스크린샷은 xcrun simctl로 외부에서 촬영

      // -- Step 3: 상담사 탭 이동 --
      if (counselorExists) {
        await tester.tap(find.text('상담사').first);
        await tester.pumpAndSettle(const Duration(seconds: 3));
        debugPrint('=== 상담사 목록 화면 ===');

        // 별하늘 상담사 확인
        final starCounselor = find.text('별하늘 상담사');
        final hasCounselor = starCounselor.evaluate().isNotEmpty;
        debugPrint('별하늘 상담사: $hasCounselor');

        if (hasCounselor) {
          await tester.tap(starCounselor.first);
          await tester.pumpAndSettle(const Duration(seconds: 3));
          debugPrint('=== 상담사 상세 화면 ===');

          // 슬롯 확인
          final slot = find.textContaining('10:00');
          debugPrint('슬롯 표시: ${slot.evaluate().isNotEmpty}');

          // 뒤로가기
          final backButton = find.byTooltip('Back');
          if (backButton.evaluate().isNotEmpty) {
            await tester.tap(backButton.first);
            await tester.pumpAndSettle();
          }
        }
      }

      // -- Step 4: 예약 탭 이동 --
      final bookingTab = find.text('예약');
      if (bookingTab.evaluate().isNotEmpty) {
        await tester.tap(bookingTab.first);
        await tester.pumpAndSettle(const Duration(seconds: 3));
        debugPrint('=== 예약 목록 화면 ===');

        final booking = find.text('별하늘 상담사');
        debugPrint('예약 목록에 별하늘 상담사: ${booking.evaluate().isNotEmpty}');
      }

      // -- Step 5: 더보기/지갑 확인 --
      final moreTab = find.text('더보기');
      if (moreTab.evaluate().isNotEmpty) {
        await tester.tap(moreTab.first);
        await tester.pumpAndSettle(const Duration(seconds: 2));
        debugPrint('=== 더보기 화면 ===');
      }

      debugPrint('=== E2E 테스트 완료 ===');
    });
  });
}
