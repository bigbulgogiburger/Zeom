import 'package:kakao_flutter_sdk_user/kakao_flutter_sdk_user.dart';

class KakaoLoginService {
  /// Initialize Kakao SDK. Call once in main() before runApp.
  static void initialize() {
    KakaoSdk.init(
      nativeAppKey: const String.fromEnvironment(
        'KAKAO_NATIVE_APP_KEY',
        defaultValue: 'YOUR_KAKAO_APP_KEY',
      ),
    );
  }

  /// Attempts Kakao login via KakaoTalk app first, falls back to web login.
  /// Returns the OAuth access token string from Kakao.
  Future<String> login() async {
    OAuthToken token;

    // Try KakaoTalk app login first
    if (await isKakaoTalkInstalled()) {
      try {
        token = await UserApi.instance.loginWithKakaoTalk();
      } catch (_) {
        // Fallback to web login if KakaoTalk login fails
        token = await UserApi.instance.loginWithKakaoAccount();
      }
    } else {
      token = await UserApi.instance.loginWithKakaoAccount();
    }

    return token.accessToken;
  }

  /// Logout from Kakao SDK (local only).
  Future<void> logout() async {
    try {
      await UserApi.instance.logout();
    } catch (_) {
      // Ignore logout errors
    }
  }
}
