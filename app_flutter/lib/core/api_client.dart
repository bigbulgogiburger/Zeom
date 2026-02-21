import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:uuid/uuid.dart';

final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());

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

  Future<String> _getDeviceId() async {
    String? deviceId = await _storage.read(key: 'device_id');
    if (deviceId == null) {
      deviceId = const Uuid().v4();
      await _storage.write(key: 'device_id', value: deviceId);
    }
    return deviceId;
  }

  String _getDeviceName() {
    return '${Platform.operatingSystem} ${Platform.operatingSystemVersion}';
  }

  Future<bool> _refreshToken() async {
    try {
      final refreshToken = await _storage.read(key: 'refresh_token');
      if (refreshToken == null) return false;

      final deviceId = await _getDeviceId();
      final deviceName = _getDeviceName();

      final response = await _dio.post(
        '/api/v1/auth/refresh',
        data: {
          'refreshToken': refreshToken,
          'deviceId': deviceId,
          'deviceName': deviceName,
        },
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

  Future<String?> getRefreshToken() async {
    return await _storage.read(key: 'refresh_token');
  }

  // ==================== Auth APIs ====================
  Future<Response> getMe() async {
    return await _dio.get('/api/v1/auth/me');
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
    required List<int> slotIds,
    required String consultationType,
  }) async {
    return await _dio.post('/api/v1/bookings', data: {
      'counselorId': counselorId,
      'slotIds': slotIds,
      'consultationType': consultationType,
    });
  }

  Future<Response> getMyBookings() async {
    return await _dio.get('/api/v1/bookings/me');
  }

  Future<Response> getBookingDetail(int bookingId) async {
    return await _dio.get('/api/v1/bookings/$bookingId');
  }

  Future<Response> cancelBooking(int bookingId, {String? reason}) async {
    return await _dio.post(
      '/api/v1/bookings/$bookingId/cancel',
      data: reason != null ? {'reason': reason} : null,
    );
  }

  Future<Response> rescheduleBooking(int bookingId, {required List<int> newSlotIds}) async {
    return await _dio.put(
      '/api/v1/bookings/$bookingId/reschedule',
      data: {'newSlotIds': newSlotIds},
    );
  }

  Future<Response> retryPayment(int bookingId) async {
    return await _dio.put('/api/v1/bookings/$bookingId/retry-payment');
  }

  Future<Response> getCounselorSlots(int counselorId) async {
    return await _dio.get('/api/v1/counselors/$counselorId');
  }

  // ==================== Wallet APIs ====================
  Future<Response> getWallet() async {
    return await _dio.get('/api/v1/wallet');
  }

  Future<Response> getWalletTransactions({
    int page = 0,
    int size = 20,
    String? type,
    String? from,
    String? to,
  }) async {
    final params = <String, dynamic>{
      'page': page,
      'size': size,
    };
    if (type != null) params['type'] = type;
    if (from != null) params['from'] = from;
    if (to != null) params['to'] = to;
    return await _dio.get('/api/v1/wallet/transactions', queryParameters: params);
  }

  Future<Response> getCashProducts() async {
    return await _dio.get('/api/v1/products/cash');
  }

  Future<Response> buyCash({
    required int amount,
    String paymentMethod = 'TEST',
  }) async {
    return await _dio.post('/api/v1/cash/charge', data: {
      'amount': amount,
      'paymentMethod': paymentMethod,
    });
  }

  // ==================== Credit APIs ====================
  Future<Response> getCreditBalance() async {
    return await _dio.get('/api/v1/credits/my');
  }

  Future<Response> purchaseCredit(int productId) async {
    return await _dio.post('/api/v1/credits/purchase', data: {
      'productId': productId,
    });
  }

  Future<Response> getCreditHistory() async {
    return await _dio.get('/api/v1/credits/history');
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
