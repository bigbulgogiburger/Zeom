import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import 'api_client.dart';

/// Top-level background message handler (must be a top-level function).
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  debugPrint('[Push] Background message: ${message.messageId}');
}

/// Push notification service with Firebase Cloud Messaging integration.
/// Handles foreground/background messages, local notification display,
/// token management, and deep-link routing on notification tap.
///
/// Firebase must be configured (google-services.json / GoogleService-Info.plist)
/// for push notifications to work. If not configured, the app continues normally.
class PushNotificationService {
  final ApiClient _apiClient;
  bool _initialized = false;

  static final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  /// Global navigator key for deep-link routing from notification taps.
  static final GlobalKey<NavigatorState> navigatorKey =
      GlobalKey<NavigatorState>();

  /// Stream controller for notification tap payloads, consumed by the router.
  static final StreamController<Map<String, dynamic>>
      _notificationTapController =
      StreamController<Map<String, dynamic>>.broadcast();

  /// Stream of notification tap payloads for router consumption.
  static Stream<Map<String, dynamic>> get onNotificationTap =>
      _notificationTapController.stream;

  PushNotificationService(this._apiClient);

  bool get isInitialized => _initialized;

  /// Initialize push notifications conditionally.
  /// Returns true if Firebase was successfully initialized, false otherwise.
  Future<bool> initialize() async {
    if (_initialized) return true;

    try {
      await Firebase.initializeApp();
      debugPrint('[Push] Firebase initialized successfully');
    } catch (e) {
      debugPrint(
          '[Push] Firebase not configured, skipping push notification setup: $e');
      return false;
    }

    try {
      await _setupLocalNotifications();
      await _setupMessaging();
      _initialized = true;
      debugPrint('[Push] Push notification service initialized successfully');
      return true;
    } catch (e) {
      debugPrint('[Push] Failed to initialize push notifications: $e');
      return false;
    }
  }

  /// Set up flutter_local_notifications for foreground display.
  Future<void> _setupLocalNotifications() async {
    const androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');

    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: false,
      requestBadgePermission: false,
      requestSoundPermission: false,
    );

    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _localNotifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: _onLocalNotificationTap,
    );

    // Create Android notification channel
    const androidChannel = AndroidNotificationChannel(
      'cheonjiyeon_default',
      '천지연꽃신당 알림',
      description: '예약, 상담, 결제 관련 알림',
      importance: Importance.high,
    );

    await _localNotifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(androidChannel);
  }

  /// Configure Firebase Messaging handlers.
  Future<void> _setupMessaging() async {
    final messaging = FirebaseMessaging.instance;

    // Request notification permissions
    final settings = await messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );

    debugPrint(
        '[Push] Permission status: ${settings.authorizationStatus.name}');

    if (settings.authorizationStatus == AuthorizationStatus.denied) {
      debugPrint('[Push] Notifications permission denied by user');
      return;
    }

    // Get and register FCM token
    final token = await messaging.getToken();
    if (token != null) {
      debugPrint('[Push] FCM token obtained: ${token.substring(0, 10)}...');
      await _registerTokenWithServer(token);
    }

    // Listen for token refresh
    messaging.onTokenRefresh.listen(_onTokenRefresh);

    // Register background handler
    FirebaseMessaging.onBackgroundMessage(
        _firebaseMessagingBackgroundHandler);

    // Handle foreground messages
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // Handle notification taps when app is in background (not terminated)
    FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationOpen);

    // Check if app was opened from a terminated state via notification
    final initialMessage = await messaging.getInitialMessage();
    if (initialMessage != null) {
      debugPrint('[Push] App opened from terminated state via notification');
      _handleNotificationOpen(initialMessage);
    }

    // Set foreground notification presentation options (iOS)
    await messaging.setForegroundNotificationPresentationOptions(
      alert: true,
      badge: true,
      sound: true,
    );
  }

  /// Called when FCM token is refreshed.
  void _onTokenRefresh(String token) {
    debugPrint('[Push] Token refreshed: ${token.substring(0, 10)}...');
    _registerTokenWithServer(token);
  }

  /// Register the FCM token with the backend server.
  Future<void> _registerTokenWithServer(String token) async {
    try {
      await _apiClient.registerPushToken(token);
      debugPrint('[Push] Token registered with server');
    } catch (e) {
      debugPrint('[Push] Failed to register token: $e');
    }
  }

  /// Handle foreground messages by showing a local notification.
  void _handleForegroundMessage(RemoteMessage message) {
    debugPrint('[Push] Foreground message: ${message.messageId}');

    final notification = message.notification;
    if (notification == null) return;

    final android = notification.android;

    _localNotifications.show(
      message.hashCode,
      notification.title ?? '천지연꽃신당',
      notification.body ?? '',
      NotificationDetails(
        android: AndroidNotificationDetails(
          'cheonjiyeon_default',
          '천지연꽃신당 알림',
          channelDescription: '예약, 상담, 결제 관련 알림',
          importance: Importance.high,
          priority: Priority.high,
          icon: android?.smallIcon ?? '@mipmap/ic_launcher',
        ),
        iOS: const DarwinNotificationDetails(
          presentAlert: true,
          presentBadge: true,
          presentSound: true,
        ),
      ),
      payload: jsonEncode(message.data),
    );
  }

  /// Handle notification tap from background/terminated state (FCM).
  void _handleNotificationOpen(RemoteMessage message) {
    debugPrint('[Push] Notification opened: ${message.data}');
    _routeFromPayload(message.data);
  }

  /// Handle notification tap from local notification.
  static void _onLocalNotificationTap(NotificationResponse response) {
    debugPrint('[Push] Local notification tapped: ${response.payload}');
    if (response.payload == null) return;

    try {
      final data =
          jsonDecode(response.payload!) as Map<String, dynamic>;
      _notificationTapController.add(data);
    } catch (e) {
      debugPrint('[Push] Failed to parse notification payload: $e');
    }
  }

  /// Route to the appropriate screen based on notification payload.
  void _routeFromPayload(Map<String, dynamic> data) {
    _notificationTapController.add(data);
  }

  /// Resolve a notification payload to a GoRouter path.
  /// Returns null if no matching route is found.
  static String? resolveRoute(Map<String, dynamic> data) {
    final type = data['type'] as String?;
    final id = data['id'] as String?;
    final route = data['route'] as String?;

    // If an explicit route is provided, use it directly
    if (route != null && route.isNotEmpty) {
      return route;
    }

    // Map notification types to routes
    switch (type) {
      case 'booking':
      case 'booking_confirmed':
      case 'booking_cancelled':
        if (id != null) return '/booking/$id';
        return '/bookings';
      case 'consultation':
      case 'consultation_start':
        if (id != null) return '/consultation/$id';
        return '/consultation/history';
      case 'payment':
      case 'payment_completed':
      case 'cash_charged':
        return '/wallet';
      case 'review':
        if (id != null) return '/consultation/$id/review';
        return '/home';
      case 'refund':
      case 'refund_approved':
      case 'refund_rejected':
        return '/refund/list';
      case 'dispute':
        if (id != null) return '/dispute/$id';
        return '/dispute/list';
      case 'fortune':
        return '/fortune';
      default:
        return null;
    }
  }

  /// Re-register FCM token with server (e.g., after login).
  Future<void> reRegisterToken() async {
    if (!_initialized) return;

    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (token != null) {
        await _registerTokenWithServer(token);
      }
    } catch (e) {
      debugPrint('[Push] Failed to re-register token: $e');
    }
  }

  /// Delete the FCM token (e.g., on logout).
  Future<void> deleteToken() async {
    if (!_initialized) return;

    try {
      await FirebaseMessaging.instance.deleteToken();
      debugPrint('[Push] FCM token deleted');
    } catch (e) {
      debugPrint('[Push] Failed to delete FCM token: $e');
    }
  }

  /// Get the current unread notification badge count (iOS only).
  /// Returns 0 on Android.
  Future<int> getBadgeCount() async {
    if (!Platform.isIOS) return 0;
    // Badge count managed by iOS system via APNS
    return 0;
  }
}
