import 'package:flutter_naver_login/flutter_naver_login.dart';

class NaverLoginService {
  /// Attempts Naver login via the Naver SDK.
  /// Returns the OAuth access token string from Naver.
  Future<String> login() async {
    final result = await FlutterNaverLogin.logIn();

    if (result.status == NaverLoginStatus.error) {
      throw Exception('네이버 로그인 실패: ${result.errorMessage}');
    }

    final tokenResult = await FlutterNaverLogin.currentAccessToken;
    return tokenResult.accessToken;
  }

  /// Logout from Naver SDK (local only).
  Future<void> logout() async {
    try {
      await FlutterNaverLogin.logOut();
    } catch (_) {
      // Ignore logout errors
    }
  }
}
