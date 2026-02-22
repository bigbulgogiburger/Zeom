import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../features/auth/auth_provider.dart';
import '../features/auth/login_screen.dart';
import '../features/auth/signup_screen.dart';
import '../features/home/main_screen.dart';
import '../features/counselor/counselor_detail_screen.dart';
import '../features/booking/booking_create_screen.dart';
import '../features/wallet/cash_buy_screen.dart';
import '../features/consultation/consultation_preflight_screen.dart';
import '../features/consultation/consultation_room_screen.dart';
import '../features/consultation/consultation_complete_screen.dart';
import '../features/consultation/consultation_history_screen.dart';
import '../features/consultation/review_screen.dart';
import '../features/credit/credit_buy_screen.dart';
import '../features/refund/refund_list_screen.dart';
import '../features/refund/refund_request_screen.dart';
import '../features/dispute/dispute_list_screen.dart';
import '../features/dispute/dispute_detail_screen.dart';
import '../features/dispute/dispute_create_screen.dart';
import '../features/fortune/fortune_screen.dart';
import '../features/fortune/saju_chart_screen.dart';
import '../features/auth/onboarding_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/login',
    redirect: (context, state) {
      final isAuthenticated = authState.isAuthenticated;
      final isLoginRoute = state.matchedLocation == '/login' ||
          state.matchedLocation == '/signup';

      // If not authenticated and trying to access protected route, redirect to login
      if (!isAuthenticated && !isLoginRoute) {
        return '/login';
      }

      // If authenticated and on login/signup, redirect to home
      if (isAuthenticated && isLoginRoute) {
        return '/home';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/signup',
        builder: (context, state) => const SignupScreen(),
      ),
      GoRoute(
        path: '/home',
        builder: (context, state) => const MainScreen(initialIndex: 0),
      ),
      GoRoute(
        path: '/counselors',
        builder: (context, state) => const MainScreen(initialIndex: 1),
      ),
      GoRoute(
        path: '/bookings',
        builder: (context, state) => const MainScreen(initialIndex: 2),
      ),
      GoRoute(
        path: '/wallet',
        builder: (context, state) => const MainScreen(initialIndex: 3),
      ),
      GoRoute(
        path: '/more',
        builder: (context, state) => const MainScreen(initialIndex: 4),
      ),
      // Counselor routes
      GoRoute(
        path: '/counselor/:id',
        builder: (context, state) {
          final id = int.parse(state.pathParameters['id']!);
          return CounselorDetailScreen(counselorId: id);
        },
      ),
      // Booking routes
      GoRoute(
        path: '/booking/create',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>?;
          final counselorId = extra?['counselorId'] as int;
          final slotStart = extra?['slotStart'] as String?;
          final slotIds = (extra?['slotIds'] as List<dynamic>?)
              ?.cast<int>();
          final counselorData =
              extra?['counselorData'] as Map<String, dynamic>?;
          return BookingCreateScreen(
            counselorId: counselorId,
            initialSlotStart: slotStart,
            initialSlotIds: slotIds,
            counselorData: counselorData,
          );
        },
      ),
      GoRoute(
        path: '/booking/:id',
        builder: (context, state) {
          final id = int.parse(state.pathParameters['id']!);
          return ConsultationRoomScreen(bookingId: id);
        },
      ),
      // Wallet routes
      GoRoute(
        path: '/wallet/cash-buy',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>?;
          final returnTo = extra?['returnTo'] as String?;
          return CashBuyScreen(returnTo: returnTo);
        },
      ),
      // Credit routes
      GoRoute(
        path: '/credits/buy',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>?;
          final needed = extra?['needed'] as int?;
          final returnTo = extra?['returnTo'] as String?;
          return CreditBuyScreen(needed: needed, returnTo: returnTo);
        },
      ),
      // Consultation routes
      GoRoute(
        path: '/consultation/history',
        builder: (context, state) => const ConsultationHistoryScreen(),
      ),
      GoRoute(
        path: '/consultation/:bookingId/preflight',
        builder: (context, state) {
          final bookingId = int.parse(state.pathParameters['bookingId']!);
          return ConsultationPreflightScreen(bookingId: bookingId);
        },
      ),
      GoRoute(
        path: '/consultation/:bookingId',
        builder: (context, state) {
          final bookingId = int.parse(state.pathParameters['bookingId']!);
          return ConsultationRoomScreen(bookingId: bookingId);
        },
      ),
      GoRoute(
        path: '/consultation/:bookingId/complete',
        builder: (context, state) {
          final bookingId = int.parse(state.pathParameters['bookingId']!);
          final extra = state.extra as Map<String, dynamic>?;
          final sessionId = extra?['sessionId'] as int?;
          return ConsultationCompleteScreen(
            bookingId: bookingId,
            sessionId: sessionId,
          );
        },
      ),
      GoRoute(
        path: '/consultation/:bookingId/review',
        builder: (context, state) {
          final bookingId = int.parse(state.pathParameters['bookingId']!);
          return ReviewScreen(bookingId: bookingId);
        },
      ),
      // Refund routes
      GoRoute(
        path: '/refund/list',
        builder: (context, state) => const RefundListScreen(),
      ),
      GoRoute(
        path: '/refund/request',
        builder: (context, state) => const RefundRequestScreen(),
      ),
      // Dispute routes
      GoRoute(
        path: '/dispute/list',
        builder: (context, state) => const DisputeListScreen(),
      ),
      GoRoute(
        path: '/dispute/create',
        builder: (context, state) => const DisputeCreateScreen(),
      ),
      GoRoute(
        path: '/dispute/:id',
        builder: (context, state) {
          final id = int.parse(state.pathParameters['id']!);
          return DisputeDetailScreen(disputeId: id);
        },
      ),
      // Fortune routes
      GoRoute(
        path: '/fortune',
        builder: (context, state) => const FortuneScreen(),
      ),
      GoRoute(
        path: '/my-saju',
        builder: (context, state) => const SajuChartScreen(),
      ),
      // Onboarding route
      GoRoute(
        path: '/onboarding',
        builder: (context, state) => const OnboardingScreen(),
      ),
    ],
    errorBuilder: (context, state) => Scaffold(
      appBar: AppBar(title: const Text('오류')),
      body: Center(
        child: Text('페이지를 찾을 수 없습니다: ${state.matchedLocation}'),
      ),
    ),
  );
});
