import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';
import '../../core/auth_service.dart';

// ApiClient provider
final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient();
});

// AuthService provider
final authServiceProvider = Provider<AuthService>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return AuthService(apiClient);
});

// Auth state model
class AuthState {
  final bool isAuthenticated;
  final bool isLoading;
  final Map<String, dynamic>? user;
  final String? error;

  AuthState({
    this.isAuthenticated = false,
    this.isLoading = false,
    this.user,
    this.error,
  });

  AuthState copyWith({
    bool? isAuthenticated,
    bool? isLoading,
    Map<String, dynamic>? user,
    String? error,
  }) {
    return AuthState(
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      isLoading: isLoading ?? this.isLoading,
      user: user ?? this.user,
      error: error,
    );
  }
}

// Auth state notifier
class AuthNotifier extends StateNotifier<AuthState> {
  final AuthService _authService;

  AuthNotifier(this._authService) : super(AuthState()) {
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    final isAuth = await _authService.isAuthenticated();
    if (isAuth) {
      final user = await _authService.getCurrentUser();
      state = state.copyWith(
        isAuthenticated: true,
        user: user,
      );
    }
  }

  Future<bool> login({
    required String email,
    required String password,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _authService.login(
        email: email,
        password: password,
      );
      state = state.copyWith(
        isAuthenticated: true,
        isLoading: false,
        user: response['user'],
      );
      return true;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString().replaceFirst('Exception: ', ''),
      );
      return false;
    }
  }

  Future<bool> signup({
    required String email,
    required String password,
    required String name,
    String? phone,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _authService.signup(
        email: email,
        password: password,
        name: name,
        phone: phone,
      );
      state = state.copyWith(
        isAuthenticated: true,
        isLoading: false,
        user: response['user'],
      );
      return true;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString().replaceFirst('Exception: ', ''),
      );
      return false;
    }
  }

  Future<void> logout() async {
    await _authService.logout();
    state = AuthState();
  }

  void clearError() {
    state = state.copyWith(error: null);
  }
}

// Auth state provider
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final authService = ref.watch(authServiceProvider);
  return AuthNotifier(authService);
});
