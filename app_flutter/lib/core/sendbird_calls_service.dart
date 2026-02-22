import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Sendbird Calls service - bridges to native iOS/Android SDKs via MethodChannel.
///
/// Native SDKs required:
///   - iOS: SendBirdCalls (via CocoaPods: pod 'SendBirdCalls', '~> 1.10')
///   - Android: com.sendbird.sdk:sendbird-calls:1.10.+ (via Gradle)
///
/// For development/testing, set [useFake] to true to skip native SDK calls.
class SendbirdCallsService {
  static const _channel = MethodChannel('com.cheonjiyeon/sendbird_calls');

  final bool useFake;
  bool _initialized = false;
  bool _authenticated = false;
  String? _currentCallId;

  // Callbacks
  void Function()? onConnected;
  void Function()? onEnded;
  void Function(String error)? onError;

  SendbirdCallsService({this.useFake = true});

  Future<void> init(String appId) async {
    if (useFake) {
      _initialized = true;
      return;
    }
    try {
      await _channel.invokeMethod('init', {'appId': appId});
      _initialized = true;

      // Listen for call events from native
      _channel.setMethodCallHandler(_handleNativeEvent);
    } catch (e) {
      throw SendbirdCallsException('SDK 초기화 실패: $e');
    }
  }

  Future<void> authenticate(String userId, String accessToken) async {
    if (!_initialized) throw SendbirdCallsException('SDK가 초기화되지 않았습니다');
    if (useFake) {
      _authenticated = true;
      return;
    }
    try {
      await _channel.invokeMethod('authenticate', {
        'userId': userId,
        'accessToken': accessToken,
      });
      _authenticated = true;
    } catch (e) {
      throw SendbirdCallsException('인증 실패: $e');
    }
  }

  Future<String> dial(String calleeId, {bool audioEnabled = true, bool videoEnabled = true}) async {
    if (!_authenticated) throw SendbirdCallsException('인증이 필요합니다');
    if (useFake) {
      _currentCallId = 'fake_call_${DateTime.now().millisecondsSinceEpoch}';
      // Simulate connection after short delay
      Future.delayed(const Duration(milliseconds: 500), () {
        onConnected?.call();
      });
      return _currentCallId!;
    }
    try {
      final callId = await _channel.invokeMethod<String>('dial', {
        'calleeId': calleeId,
        'audioEnabled': audioEnabled,
        'videoEnabled': videoEnabled,
      });
      _currentCallId = callId;
      return callId!;
    } catch (e) {
      throw SendbirdCallsException('통화 연결 실패: $e');
    }
  }

  Future<void> endCall() async {
    if (_currentCallId == null) return;
    if (useFake) {
      _currentCallId = null;
      return;
    }
    try {
      await _channel.invokeMethod('endCall', {'callId': _currentCallId});
      _currentCallId = null;
    } catch (e) {
      _currentCallId = null;
    }
  }

  Future<void> muteMicrophone() async {
    if (useFake || _currentCallId == null) return;
    await _channel.invokeMethod('muteMicrophone', {'callId': _currentCallId});
  }

  Future<void> unmuteMicrophone() async {
    if (useFake || _currentCallId == null) return;
    await _channel.invokeMethod('unmuteMicrophone', {'callId': _currentCallId});
  }

  Future<void> stopVideo() async {
    if (useFake || _currentCallId == null) return;
    await _channel.invokeMethod('stopVideo', {'callId': _currentCallId});
  }

  Future<void> startVideo() async {
    if (useFake || _currentCallId == null) return;
    await _channel.invokeMethod('startVideo', {'callId': _currentCallId});
  }

  /// Returns the platform view ID for embedding native video views.
  /// Use with AndroidView/UiKitView for actual video rendering.
  int? get localViewId => useFake ? null : 1;
  int? get remoteViewId => useFake ? null : 2;

  bool get isInCall => _currentCallId != null;

  Future<dynamic> _handleNativeEvent(MethodCall call) async {
    switch (call.method) {
      case 'onConnected':
        onConnected?.call();
      case 'onEnded':
        _currentCallId = null;
        onEnded?.call();
      case 'onError':
        final error = call.arguments as String? ?? '알 수 없는 오류';
        onError?.call(error);
    }
  }

  /// Builds a platform-specific widget for the local video view.
  /// Returns null if in fake mode.
  Widget? buildLocalVideoView() {
    if (useFake) return null;
    const viewType = 'sendbird-local-video';
    if (Platform.isIOS) {
      return const UiKitView(
        viewType: viewType,
        creationParamsCodec: StandardMessageCodec(),
      );
    } else if (Platform.isAndroid) {
      return const AndroidView(
        viewType: viewType,
        creationParamsCodec: StandardMessageCodec(),
      );
    }
    return null;
  }

  /// Builds a platform-specific widget for the remote video view.
  /// Returns null if in fake mode.
  Widget? buildRemoteVideoView() {
    if (useFake) return null;
    const viewType = 'sendbird-remote-video';
    if (Platform.isIOS) {
      return const UiKitView(
        viewType: viewType,
        creationParamsCodec: StandardMessageCodec(),
      );
    } else if (Platform.isAndroid) {
      return const AndroidView(
        viewType: viewType,
        creationParamsCodec: StandardMessageCodec(),
      );
    }
    return null;
  }

  void dispose() {
    if (!useFake) {
      endCall();
    }
    _currentCallId = null;
    onConnected = null;
    onEnded = null;
    onError = null;
  }
}

class SendbirdCallsException implements Exception {
  final String message;
  SendbirdCallsException(this.message);

  @override
  String toString() => message;
}
