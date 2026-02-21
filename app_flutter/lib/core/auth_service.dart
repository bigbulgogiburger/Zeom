import 'package:dio/dio.dart';
import 'api_client.dart';

class AuthService {
  final ApiClient _apiClient;

  AuthService(this._apiClient);

  Future<Map<String, dynamic>> signup({
    required String email,
    required String password,
    required String name,
    String? phone,
    String? referralCode,
  }) async {
    try {
      final response = await _apiClient.dio.post(
        '/api/v1/auth/signup',
        data: {
          'email': email,
          'password': password,
          'name': name,
          if (phone != null) 'phone': phone,
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = response.data as Map<String, dynamic>;
        await _apiClient.saveTokens(
          accessToken: data['accessToken'],
          refreshToken: data['refreshToken'],
        );

        // Apply referral code after signup if provided
        if (referralCode != null && referralCode.isNotEmpty) {
          try {
            await _apiClient.dio.post('/api/v1/referral/apply', data: {
              'code': referralCode,
            });
          } catch (_) {
            // Referral apply failure should not block signup
          }
        }

        return data;
      }
      throw Exception('회원가입 실패');
    } on DioException catch (e) {
      if (e.response?.statusCode == 400) {
        final data = e.response?.data;
        throw Exception(data?['message'] ?? '잘못된 요청입니다');
      }
      throw Exception('회원가입 실패: ${e.message}');
    }
  }

  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _apiClient.dio.post(
        '/api/v1/auth/login',
        data: {
          'email': email,
          'password': password,
        },
      );

      if (response.statusCode == 200) {
        final data = response.data as Map<String, dynamic>;
        await _apiClient.saveTokens(
          accessToken: data['accessToken'],
          refreshToken: data['refreshToken'],
        );
        return data;
      }
      throw Exception('로그인 실패');
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        throw Exception('이메일 또는 비밀번호가 일치하지 않습니다');
      }
      throw Exception('로그인 실패: ${e.message}');
    }
  }

  Future<Map<String, dynamic>> oauthLogin({
    required String provider,
    required String code,
    required String redirectUri,
  }) async {
    try {
      final response = await _apiClient.dio.post(
        '/api/v1/auth/oauth/login',
        data: {
          'provider': provider,
          'code': code,
          'redirectUri': redirectUri,
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = response.data as Map<String, dynamic>;
        await _apiClient.saveTokens(
          accessToken: data['accessToken'],
          refreshToken: data['refreshToken'],
        );
        return data;
      }
      throw Exception('소셜 로그인 실패');
    } on DioException catch (e) {
      if (e.response?.statusCode == 400) {
        final data = e.response?.data;
        throw Exception(data?['message'] ?? '잘못된 요청입니다');
      }
      throw Exception('소셜 로그인 실패: ${e.message}');
    }
  }

  Future<void> logout() async {
    try {
      final refreshToken = await _apiClient.getRefreshToken();
      if (refreshToken != null) {
        await _apiClient.dio.post(
          '/api/v1/auth/logout',
          data: {'refreshToken': refreshToken},
        ).catchError((_) => Response(requestOptions: RequestOptions(), statusCode: 0));
      }
    } finally {
      await _apiClient.clearTokens();
    }
  }

  Future<bool> isAuthenticated() async {
    final token = await _apiClient.getAccessToken();
    return token != null;
  }

  Future<Map<String, dynamic>?> getCurrentUser() async {
    try {
      final response = await _apiClient.getMe();
      if (response.statusCode == 200) {
        return response.data as Map<String, dynamic>;
      }
      return null;
    } catch (e) {
      return null;
    }
  }
}
