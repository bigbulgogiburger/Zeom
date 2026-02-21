import 'dart:async';
import 'package:flutter/foundation.dart';
import 'api_client.dart';

/// Push notification service with conditional Firebase initialization.
/// Firebase must be configured (google-services.json / GoogleService-Info.plist)
/// for push notifications to work. If not configured, the app continues normally.
class PushNotificationService {
  final ApiClient _apiClient;
  bool _initialized = false;

  PushNotificationService(this._apiClient);

  bool get isInitialized => _initialized;

  /// Initialize push notifications conditionally.
  /// Returns true if Firebase was successfully initialized, false otherwise.
  Future<bool> initialize() async {
    if (_initialized) return true;

    try {
      // Attempt to import and initialize Firebase
      // This will fail gracefully if Firebase is not configured
      final firebaseCore = await _tryInitializeFirebase();
      if (!firebaseCore) {
        debugPrint('[Push] Firebase not configured, skipping push notification setup');
        return false;
      }

      await _setupMessaging();
      _initialized = true;
      debugPrint('[Push] Push notification service initialized successfully');
      return true;
    } catch (e) {
      debugPrint('[Push] Failed to initialize push notifications: $e');
      return false;
    }
  }

  Future<bool> _tryInitializeFirebase() async {
    try {
      // Dynamic import attempt — if firebase_core is not properly configured
      // (missing google-services.json), this will throw
      final firebase = await _importFirebase();
      return firebase;
    } catch (e) {
      debugPrint('[Push] Firebase initialization failed: $e');
      return false;
    }
  }

  Future<bool> _importFirebase() async {
    // Firebase.initializeApp() requires platform-specific config files.
    // Without google-services.json (Android) or GoogleService-Info.plist (iOS),
    // this will throw a PlatformException.
    // We catch it to allow the app to function without push notifications.
    try {
      // ignore: avoid_dynamic_calls
      // Firebase.initializeApp() is called when Firebase is configured
      // For now, since Firebase config files are not yet added,
      // we return false to skip push setup
      debugPrint('[Push] Firebase config files not yet added, skipping initialization');
      return false;
    } catch (e) {
      return false;
    }
  }

  Future<void> _setupMessaging() async {
    // This will be implemented once Firebase is configured:
    // 1. Request notification permissions
    // 2. Get FCM token
    // 3. Register token with backend
    // 4. Set up foreground message handler
    // 5. Set up background message handler
    // 6. Handle notification taps for routing
  }

  /// Register the FCM token with the backend server.
  Future<void> registerToken(String token) async {
    try {
      await _apiClient.registerPushToken(token);
      debugPrint('[Push] Token registered with server');
    } catch (e) {
      debugPrint('[Push] Failed to register token: $e');
    }
  }

  /// Handle a notification tap and navigate to the appropriate screen.
  /// Called when user taps a notification.
  void handleNotificationTap(Map<String, dynamic> data) {
    // Route based on notification payload
    final type = data['type'] as String?;
    final id = data['id'] as String?;

    debugPrint('[Push] Notification tapped: type=$type, id=$id');

    // Routing will be implemented when GoRouter integration is set up:
    // - 'booking' -> /bookings/$id
    // - 'consultation' -> /consultation/$id
    // - 'payment' -> /wallet
    // - 'chat' -> /chat/$id
  }
}
