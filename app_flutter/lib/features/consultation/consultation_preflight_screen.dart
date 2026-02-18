import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import '../../core/api_client.dart';
import '../../shared/theme.dart';

final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());

class ConsultationPreflightScreen extends ConsumerStatefulWidget {
  final int bookingId;

  const ConsultationPreflightScreen({
    super.key,
    required this.bookingId,
  });

  @override
  ConsumerState<ConsultationPreflightScreen> createState() =>
      _ConsultationPreflightScreenState();
}

class _ConsultationPreflightScreenState
    extends ConsumerState<ConsultationPreflightScreen> {
  bool _cameraGranted = false;
  bool _micGranted = false;
  bool _networkOk = false;
  bool _isChecking = true;
  bool _isStarting = false;
  String? _error;
  String? _counselorName;

  @override
  void initState() {
    super.initState();
    _runChecks();
  }

  Future<void> _runChecks() async {
    setState(() {
      _isChecking = true;
      _error = null;
    });

    try {
      // Check permissions
      final cameraStatus = await Permission.camera.request();
      final micStatus = await Permission.microphone.request();

      // Check network
      final connectivityResult = await Connectivity().checkConnectivity();
      final hasNetwork = connectivityResult.any(
        (r) => r == ConnectivityResult.wifi || r == ConnectivityResult.mobile,
      );

      // Fetch booking info
      try {
        final apiClient = ref.read(apiClientProvider);
        final response = await apiClient.getBookingDetail(widget.bookingId);
        final data = response.data as Map<String, dynamic>;
        _counselorName = data['counselorName'] as String?;
      } catch (_) {
        // Non-critical, continue without counselor name
      }

      if (mounted) {
        setState(() {
          _cameraGranted = cameraStatus.isGranted;
          _micGranted = micStatus.isGranted;
          _networkOk = hasNetwork;
          _isChecking = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isChecking = false;
          _error = '점검 중 오류가 발생했습니다: $e';
        });
      }
    }
  }

  bool get _allChecksPass => _cameraGranted && _micGranted && _networkOk;

  Future<void> _startConsultation() async {
    if (!_allChecksPass) return;

    setState(() {
      _isStarting = true;
      _error = null;
    });

    try {
      // Start the session via API
      final apiClient = ref.read(apiClientProvider);
      await apiClient.startSession(widget.bookingId);

      if (mounted) {
        context.push('/consultation/${widget.bookingId}');
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isStarting = false;
          _error = '상담 시작 실패: $e';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('상담 준비'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (_counselorName != null) ...[
              Center(
                child: Column(
                  children: [
                    Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        color: AppColors.lotusPink.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(40),
                      ),
                      child: const Icon(
                        Icons.person,
                        size: 40,
                        color: AppColors.lotusPink,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      _counselorName!,
                      style: Theme.of(context).textTheme.headlineSmall,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),
            ],

            Text(
              '상담 전 점검',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 20),

            if (_isChecking)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(40),
                  child: CircularProgressIndicator(),
                ),
              )
            else ...[
              _CheckItem(
                icon: Icons.camera_alt,
                label: '카메라 권한',
                isOk: _cameraGranted,
                failText: '카메라 권한이 필요합니다',
              ),
              const SizedBox(height: 12),
              _CheckItem(
                icon: Icons.mic,
                label: '마이크 권한',
                isOk: _micGranted,
                failText: '마이크 권한이 필요합니다',
              ),
              const SizedBox(height: 12),
              _CheckItem(
                icon: Icons.wifi,
                label: '네트워크 연결',
                isOk: _networkOk,
                failText: '인터넷 연결을 확인해주세요',
              ),

              if (!_allChecksPass) ...[
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: _runChecks,
                    icon: const Icon(Icons.refresh),
                    label: const Text('다시 점검하기'),
                  ),
                ),
                const SizedBox(height: 8),
                if (!_cameraGranted || !_micGranted)
                  SizedBox(
                    width: double.infinity,
                    child: TextButton(
                      onPressed: () => openAppSettings(),
                      child: const Text('앱 설정 열기'),
                    ),
                  ),
              ],
            ],

            if (_error != null) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.error.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.error_outline, color: AppColors.error, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _error!,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AppColors.error,
                            ),
                      ),
                    ),
                  ],
                ),
              ),
            ],

            const Spacer(),

            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton(
                onPressed: _allChecksPass && !_isStarting ? _startConsultation : null,
                child: _isStarting
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : const Text('상담 시작'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CheckItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isOk;
  final String failText;

  const _CheckItem({
    required this.icon,
    required this.label,
    required this.isOk,
    required this.failText,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isOk ? AppColors.success : AppColors.error,
          width: 1.5,
        ),
      ),
      child: Row(
        children: [
          Icon(
            icon,
            color: isOk ? AppColors.success : AppColors.error,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                ),
                if (!isOk)
                  Text(
                    failText,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.error,
                        ),
                  ),
              ],
            ),
          ),
          Icon(
            isOk ? Icons.check_circle : Icons.cancel,
            color: isOk ? AppColors.success : AppColors.error,
          ),
        ],
      ),
    );
  }
}
