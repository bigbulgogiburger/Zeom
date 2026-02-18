import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/api_client.dart';
import '../../core/sendbird_calls_service.dart';
import '../../shared/theme.dart';

final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());

class ConsultationRoomScreen extends ConsumerStatefulWidget {
  final int bookingId;

  const ConsultationRoomScreen({
    super.key,
    required this.bookingId,
  });

  @override
  ConsumerState<ConsultationRoomScreen> createState() =>
      _ConsultationRoomScreenState();
}

class _ConsultationRoomScreenState extends ConsumerState<ConsultationRoomScreen> {
  Timer? _timer;
  int _elapsedSeconds = 0;
  int _totalDurationSeconds = 3600; // default 60 min
  bool _isMuted = false;
  bool _isVideoOff = false;
  bool _isConnecting = true;
  bool _isEnding = false;
  String? _error;
  String _counselorName = '상담사';
  int? _sessionId;

  late final SendbirdCallsService _callsService;

  @override
  void initState() {
    super.initState();
    _callsService = SendbirdCallsService(useFake: true); // Use fake for dev
    _initializeCall();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _callsService.dispose();
    super.dispose();
  }

  Future<void> _initializeCall() async {
    try {
      final apiClient = ref.read(apiClientProvider);

      // Get session token from backend
      final tokenResponse = await apiClient.getSessionToken(widget.bookingId);
      final tokenData = tokenResponse.data as Map<String, dynamic>;

      final sendbirdAppId = tokenData['sendbirdAppId'] as String;
      final sendbirdToken = tokenData['sendbirdToken'] as String;
      final sendbirdUserId = tokenData['sendbirdUserId'] as String;
      final calleeId = tokenData['calleeId'] as String;
      final calleeName = tokenData['calleeName'] as String?;
      final durationMinutes = tokenData['durationMinutes'] as int? ?? 60;

      if (calleeName != null) _counselorName = calleeName;
      _totalDurationSeconds = durationMinutes * 60;

      // Get session ID for ending later
      try {
        final sessionResponse = await apiClient.getSession(widget.bookingId);
        final sessionData = sessionResponse.data as Map<String, dynamic>;
        _sessionId = sessionData['id'] as int?;
      } catch (_) {}

      // Initialize Sendbird Calls
      await _callsService.init(sendbirdAppId);
      await _callsService.authenticate(sendbirdUserId, sendbirdToken);

      _callsService.onConnected = () {
        if (mounted) setState(() => _isConnecting = false);
      };
      _callsService.onEnded = () {
        if (!_isEnding && mounted) _endCall('NORMAL');
      };
      _callsService.onError = (error) {
        if (mounted) setState(() => _error = error);
      };

      // Dial the counselor
      await _callsService.dial(calleeId);

      if (mounted) {
        setState(() => _isConnecting = false);
        _startTimer();
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isConnecting = false;
          _error = '통화 연결 실패: $e';
        });
      }
    }
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_elapsedSeconds >= _totalDurationSeconds) {
        timer.cancel();
        _endCall('TIMEOUT');
        return;
      }
      if (mounted) {
        setState(() => _elapsedSeconds++);
      }
    });
  }

  Future<void> _endCall(String reason) async {
    if (_isEnding) return;
    setState(() => _isEnding = true);
    _timer?.cancel();

    await _callsService.endCall();

    try {
      final apiClient = ref.read(apiClientProvider);
      if (_sessionId != null) {
        await apiClient.endSession(_sessionId!, reason);
      }
    } catch (_) {}

    if (mounted) {
      context.pushReplacement(
        '/consultation/${widget.bookingId}/complete',
        extra: {'sessionId': _sessionId},
      );
    }
  }

  void _toggleMute() {
    if (_isMuted) {
      _callsService.unmuteMicrophone();
    } else {
      _callsService.muteMicrophone();
    }
    setState(() => _isMuted = !_isMuted);
  }

  void _toggleVideo() {
    if (_isVideoOff) {
      _callsService.startVideo();
    } else {
      _callsService.stopVideo();
    }
    setState(() => _isVideoOff = !_isVideoOff);
  }

  String _formatTime(int seconds) {
    final minutes = seconds ~/ 60;
    final secs = seconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')}';
  }

  int get _remainingSeconds =>
      (_totalDurationSeconds - _elapsedSeconds).clamp(0, _totalDurationSeconds);

  void _showEndConfirmation() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('상담 종료'),
        content: const Text('상담을 종료하시겠습니까?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('취소'),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              _endCall('NORMAL');
            },
            child: const Text('종료'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Error state
    if (_error != null) {
      return Scaffold(
        backgroundColor: Colors.black,
        body: SafeArea(
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, color: AppColors.hanji, size: 64),
                const SizedBox(height: 16),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 32),
                  child: Text(
                    _error!,
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: AppColors.hanji, fontSize: 16),
                  ),
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () => context.pop(),
                  child: const Text('돌아가기'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    // Connecting state
    if (_isConnecting) {
      return Scaffold(
        backgroundColor: Colors.black,
        body: SafeArea(
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(AppColors.hanji),
                ),
                const SizedBox(height: 24),
                Text(
                  '$_counselorName 상담사와 연결 중...',
                  style: Theme.of(context)
                      .textTheme
                      .bodyLarge
                      ?.copyWith(color: AppColors.hanji),
                ),
              ],
            ),
          ),
        ),
      );
    }

    // Active call
    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Stack(
          children: [
            // Video area placeholder (replaced by native views when SDK is active)
            Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 120,
                    height: 120,
                    decoration: BoxDecoration(
                      color: AppColors.lotusPink.withOpacity(0.3),
                      borderRadius: BorderRadius.circular(60),
                    ),
                    child: Icon(
                      _isVideoOff ? Icons.videocam_off : Icons.videocam,
                      size: 60,
                      color: AppColors.hanji,
                    ),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    _counselorName,
                    style: Theme.of(context)
                        .textTheme
                        .headlineMedium
                        ?.copyWith(color: AppColors.hanji),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '영상 상담 진행중',
                    style: Theme.of(context)
                        .textTheme
                        .bodyLarge
                        ?.copyWith(color: AppColors.hanji.withOpacity(0.7)),
                  ),
                ],
              ),
            ),

            // Top bar with timer
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.black.withOpacity(0.7),
                      Colors.transparent,
                    ],
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back, color: AppColors.hanji),
                      onPressed: _showEndConfirmation,
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 8),
                      decoration: BoxDecoration(
                        color: _remainingSeconds < 300
                            ? AppColors.darkRed
                            : AppColors.inkBlack.withOpacity(0.6),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.access_time,
                              size: 18, color: AppColors.hanji),
                          const SizedBox(width: 8),
                          Text(
                            _formatTime(_remainingSeconds),
                            style: Theme.of(context)
                                .textTheme
                                .bodyLarge
                                ?.copyWith(
                                  color: AppColors.hanji,
                                  fontWeight: FontWeight.w600,
                                ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 48),
                  ],
                ),
              ),
            ),

            // Bottom controls
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.bottomCenter,
                    end: Alignment.topCenter,
                    colors: [
                      Colors.black.withOpacity(0.7),
                      Colors.transparent,
                    ],
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    _ControlButton(
                      icon: _isMuted ? Icons.mic_off : Icons.mic,
                      label: _isMuted ? '음소거 해제' : '음소거',
                      onTap: _toggleMute,
                    ),
                    _ControlButton(
                      icon: _isVideoOff ? Icons.videocam_off : Icons.videocam,
                      label: _isVideoOff ? '비디오 켜기' : '비디오 끄기',
                      onTap: _toggleVideo,
                    ),
                    _ControlButton(
                      icon: Icons.call_end,
                      label: '종료',
                      backgroundColor: AppColors.darkRed,
                      onTap: _showEndConfirmation,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ControlButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Color? backgroundColor;

  const _ControlButton({
    required this.icon,
    required this.label,
    required this.onTap,
    this.backgroundColor,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Material(
          color: backgroundColor ?? AppColors.inkBlack.withOpacity(0.8),
          borderRadius: BorderRadius.circular(30),
          child: InkWell(
            onTap: onTap,
            borderRadius: BorderRadius.circular(30),
            child: Container(
              width: 60,
              height: 60,
              alignment: Alignment.center,
              child: Icon(
                icon,
                color: AppColors.hanji,
                size: 28,
              ),
            ),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: AppColors.hanji,
              ),
        ),
      ],
    );
  }
}
