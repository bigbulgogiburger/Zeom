import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/api_client.dart';
import 'core/push_notification_service.dart';
import 'core/router.dart';
import 'services/kakao_login_service.dart';
import 'shared/theme.dart';

/// Global push notification service instance.
late final PushNotificationService pushService;

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Kakao SDK
  KakaoLoginService.initialize();

  // Initialize push notifications conditionally (requires Firebase config)
  final apiClient = ApiClient();
  pushService = PushNotificationService(apiClient);
  await pushService.initialize();

  runApp(
    const ProviderScope(
      child: MyApp(),
    ),
  );
}

class MyApp extends ConsumerStatefulWidget {
  const MyApp({super.key});

  @override
  ConsumerState<MyApp> createState() => _MyAppState();
}

class _MyAppState extends ConsumerState<MyApp> {
  StreamSubscription<Map<String, dynamic>>? _notificationSub;

  @override
  void initState() {
    super.initState();
    _listenNotificationTaps();
  }

  @override
  void dispose() {
    _notificationSub?.cancel();
    super.dispose();
  }

  void _listenNotificationTaps() {
    _notificationSub =
        PushNotificationService.onNotificationTap.listen((data) {
      final route = PushNotificationService.resolveRoute(data);
      if (route != null) {
        final router = ref.read(routerProvider);
        router.go(route);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: '천지연꽃신당',
      theme: AppTheme.theme,
      routerConfig: router,
      debugShowCheckedModeBanner: false,
    );
  }
}
