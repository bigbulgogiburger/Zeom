import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiClient {
  static const String baseUrl = String.fromEnvironment(
    'API_BASE',
    defaultValue: 'http://localhost:8080',
  );

  late final Dio _dio;
  final FlutterSecureStorage _storage;

  ApiClient({FlutterSecureStorage? storage})
      : _storage = storage ?? const FlutterSecureStorage() {
    _dio = Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 10),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    // Request interceptor to add JWT token
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.read(key: 'access_token');
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (error, handler) async {
          // Handle 401 Unauthorized - try to refresh token
          if (error.response?.statusCode == 401) {
            final refreshed = await _refreshToken();
            if (refreshed) {
              // Retry the original request
              final opts = error.requestOptions;
              final token = await _storage.read(key: 'access_token');
              opts.headers['Authorization'] = 'Bearer $token';
              try {
                final response = await _dio.fetch(opts);
                return handler.resolve(response);
              } catch (e) {
                return handler.next(error);
              }
            }
          }
          return handler.next(error);
        },
      ),
    );
  }

  Dio get dio => _dio;

  Future<bool> _refreshToken() async {
    try {
      final refreshToken = await _storage.read(key: 'refresh_token');
      if (refreshToken == null) return false;

      final response = await _dio.post(
        '/api/v1/auth/refresh',
        data: {'refreshToken': refreshToken},
      );

      if (response.statusCode == 200) {
        final data = response.data as Map<String, dynamic>;
        await _storage.write(key: 'access_token', value: data['accessToken']);
        await _storage.write(key: 'refresh_token', value: data['refreshToken']);
        return true;
      }
      return false;
    } catch (e) {
      // Clear tokens if refresh fails
      await _storage.delete(key: 'access_token');
      await _storage.delete(key: 'refresh_token');
      return false;
    }
  }

  Future<void> clearTokens() async {
    await _storage.delete(key: 'access_token');
    await _storage.delete(key: 'refresh_token');
  }

  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    await _storage.write(key: 'access_token', value: accessToken);
    await _storage.write(key: 'refresh_token', value: refreshToken);
  }

  Future<String?> getAccessToken() async {
    return await _storage.read(key: 'access_token');
  }

  // ==================== Counselor APIs ====================
  Future<Response> getCounselors() async {
    return await _dio.get('/api/v1/counselors');
  }

  Future<Response> getCounselorDetail(int counselorId) async {
    return await _dio.get('/api/v1/counselors/$counselorId');
  }

  Future<Response> getCounselorReviews(int counselorId) async {
    return await _dio.get('/api/v1/counselors/$counselorId/reviews');
  }

  // ==================== Booking APIs ====================
  Future<Response> createBooking({
    required int counselorId,
    required String slotStart,
    required String channel,
  }) async {
    return await _dio.post('/api/v1/bookings', data: {
      'counselorId': counselorId,
      'slotStart': slotStart,
      'channel': channel,
    });
  }

  Future<Response> getMyBookings() async {
    return await _dio.get('/api/v1/bookings/me');
  }

  Future<Response> getBookingDetail(int bookingId) async {
    return await _dio.get('/api/v1/bookings/$bookingId');
  }

  // ==================== Wallet APIs ====================
  Future<Response> getWallet() async {
    return await _dio.get('/api/v1/wallet');
  }

  Future<Response> getWalletTransactions() async {
    return await _dio.get('/api/v1/wallet/transactions');
  }

  Future<Response> getCashProducts() async {
    return await _dio.get('/api/v1/products/cash');
  }

  Future<Response> buyCash({
    required int productId,
    required int quantity,
  }) async {
    return await _dio.post('/api/v1/wallet/buy-cash', data: {
      'productId': productId,
      'quantity': quantity,
    });
  }

  // ==================== Consultation APIs ====================
  Future<Response> getConsultationRoom(int bookingId) async {
    return await _dio.get('/api/v1/consultations/$bookingId');
  }

  Future<Response> getConsultationHistory() async {
    return await _dio.get('/api/v1/consultations/history');
  }

  Future<Response> submitReview({
    required int bookingId,
    required int rating,
    required String comment,
  }) async {
    return await _dio.post('/api/v1/consultations/$bookingId/review', data: {
      'rating': rating,
      'comment': comment,
    });
  }

  // ==================== Refund APIs ====================
  Future<Response> getMyRefunds() async {
    return await _dio.get('/api/v1/refunds/me');
  }

  Future<Response> requestRefund({
    required int bookingId,
    required String reason,
  }) async {
    return await _dio.post('/api/v1/refunds', data: {
      'bookingId': bookingId,
      'reason': reason,
    });
  }

  Future<Response> getRefundPolicy() async {
    return await _dio.get('/api/v1/refunds/policy');
  }

  // ==================== Session APIs ====================
  Future<Response> startSession(int reservationId) async {
    return await _dio.post('/api/v1/sessions/$reservationId/start');
  }

  Future<Response> endSession(int sessionId, String endReason) async {
    return await _dio.post('/api/v1/sessions/$sessionId/end', data: {
      'endReason': endReason,
    });
  }

  Future<Response> getSession(int reservationId) async {
    return await _dio.get('/api/v1/sessions/$reservationId');
  }

  Future<Response> getSessionToken(int reservationId) async {
    return await _dio.post('/api/v1/sessions/$reservationId/token');
  }

  // ==================== Settlement APIs ====================
  Future<Response> getSettlementBySession(int sessionId) async {
    return await _dio.get('/api/v1/settlements/session/$sessionId');
  }

  Future<Response> getMySettlements() async {
    return await _dio.get('/api/v1/settlements/my');
  }
}
