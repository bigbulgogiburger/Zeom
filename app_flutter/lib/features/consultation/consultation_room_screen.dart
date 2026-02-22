import 'dart:async';
import 'dart:math';
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

class _ConsultationRoomScreenState extends ConsumerState<ConsultationRoomScreen>
    with SingleTickerProviderStateMixin {
  Timer? _timer;
  Timer? _retryTimer;
  int _elapsedSeconds = 0;
  int _totalDurationSeconds = 3600;
  bool _isMuted = false;
  bool _isVideoOff = false;
  bool _isConnecting = true;
  bool _isEnding = false;
  bool _isWaitingForCounselor = false;
  int _retryCount = 0;
  String? _error;
  String _counselorName = '상담사';
  int? _sessionId;

  // Cached token data for retry
  String? _calleeId;
  String? _sendbirdAppId;
  String? _sendbirdToken;
  String? _sendbirdUserId;

  late final SendbirdCallsService _callsService;
  late final AnimationController _pulseController;

  // Fortune waiting messages — rotated while waiting
  static const _waitingMessages = [
    '상담사님이 별자리를 읽고 계십니다...',
    '운명의 실이 연결되는 중...',
    '타로 카드를 셔플하고 있어요...',
    '수정 구슬을 닦는 중입니다...',
    '오늘의 운세를 준비하고 있어요...',
    '상담사님이 곧 도착합니다...',
    '영혼의 주파수를 맞추는 중...',
    '연꽃이 피어나는 중입니다...',
  ];

  @override
  void initState() {
    super.initState();
    _callsService = SendbirdCallsService(useFake: false);
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    )..repeat(reverse: true);
    _initializeCall();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _retryTimer?.cancel();
    _pulseController.dispose();
    _callsService.dispose();
    super.dispose();
  }

  Future<void> _initializeCall() async {
    try {
      final apiClient = ref.read(apiClientProvider);

      final tokenResponse = await apiClient.getSessionToken(widget.bookingId);
      final tokenData = tokenResponse.data as Map<String, dynamic>;

      _sendbirdAppId = tokenData['sendbirdAppId'] as String;
      _sendbirdToken = tokenData['sendbirdToken'] as String;
      _sendbirdUserId = tokenData['sendbirdUserId'] as String;
      _calleeId = tokenData['calleeId'] as String;
      final calleeName = tokenData['calleeName'] as String?;
      final durationMinutes = tokenData['durationMinutes'] as int? ?? 60;

      if (calleeName != null) _counselorName = calleeName;
      _totalDurationSeconds = durationMinutes * 60;

      try {
        final sessionResponse = await apiClient.getSession(widget.bookingId);
        final sessionData = sessionResponse.data as Map<String, dynamic>;
        _sessionId = sessionData['id'] as int?;
      } catch (_) {}

      await _callsService.init(_sendbirdAppId!);
      await _callsService.authenticate(_sendbirdUserId!, _sendbirdToken!);

      _callsService.onConnected = () {
        if (mounted) {
          setState(() {
            _isConnecting = false;
            _isWaitingForCounselor = false;
          });
          _retryTimer?.cancel();
        }
      };
      _callsService.onEnded = () {
        if (!_isEnding && mounted) _endCall('NORMAL');
      };
      _callsService.onError = (error) {
        if (mounted) setState(() => _error = error);
      };

      await _attemptDial();
    } catch (e) {
      final errorMsg = e.toString();
      if (_isCounselorNotReady(errorMsg)) {
        if (mounted) {
          setState(() {
            _isConnecting = false;
            _isWaitingForCounselor = true;
          });
          _startRetryTimer();
        }
      } else {
        if (mounted) {
          setState(() {
            _isConnecting = false;
            _error = '통화 연결 실패: $e';
          });
        }
      }
    }
  }

  bool _isCounselorNotReady(String error) {
    return error.contains('authenticated') ||
        error.contains('callee') ||
        error.contains('DIAL_ERROR');
  }

  Future<void> _attemptDial() async {
    if (_calleeId == null) return;
    try {
      await _callsService.dial(_calleeId!);
      if (mounted) {
        setState(() {
          _isConnecting = false;
          _isWaitingForCounselor = false;
        });
        _retryTimer?.cancel();
        _startTimer();
      }
    } catch (e) {
      final errorMsg = e.toString();
      if (_isCounselorNotReady(errorMsg)) {
        if (mounted && !_isWaitingForCounselor) {
          setState(() {
            _isConnecting = false;
            _isWaitingForCounselor = true;
          });
        }
        _startRetryTimer();
      } else {
        if (mounted) {
          setState(() {
            _isConnecting = false;
            _error = '통화 연결 실패: $e';
          });
        }
      }
    }
  }

  void _startRetryTimer() {
    _retryTimer?.cancel();
    _retryTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (_isWaitingForCounselor && mounted && _retryCount < 60) {
        _retryCount++;
        _attemptDial();
      } else if (_retryCount >= 60) {
        _retryTimer?.cancel();
        if (mounted) {
          setState(() {
            _isWaitingForCounselor = false;
            _error = '상담사가 오랜 시간 접속하지 않았습니다.\n잠시 후 다시 시도해 주세요.';
          });
        }
      }
    });
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
    _retryTimer?.cancel();

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
    if (_error != null) return _buildErrorScreen();
    if (_isConnecting) return _buildConnectingScreen();
    if (_isWaitingForCounselor) return _buildWaitingScreen();
    return _buildCallScreen();
  }

  // ── Error screen ──
  Widget _buildErrorScreen() {
    return Scaffold(
      backgroundColor: const Color(0xFF1A1210),
      body: SafeArea(
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, color: AppColors.gold, size: 64),
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
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.gold,
                  foregroundColor: AppColors.inkBlack,
                  padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: const Text('돌아가기', style: TextStyle(fontWeight: FontWeight.w600)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ── Connecting spinner ──
  Widget _buildConnectingScreen() {
    return Scaffold(
      backgroundColor: const Color(0xFF1A1210),
      body: SafeArea(
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(AppColors.gold),
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

  // ── Waiting for counselor — the fun screen ──
  Widget _buildWaitingScreen() {
    final message = _waitingMessages[_retryCount % _waitingMessages.length];

    return Scaffold(
      backgroundColor: const Color(0xFF1A1210),
      body: SafeArea(
        child: Stack(
          children: [
            // Subtle background pattern
            Positioned.fill(
              child: CustomPaint(
                painter: _StarFieldPainter(seed: widget.bookingId),
              ),
            ),

            // Main content
            Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Animated lotus/crystal ball icon
                    AnimatedBuilder(
                      animation: _pulseController,
                      builder: (context, child) {
                        final scale = 1.0 + (_pulseController.value * 0.15);
                        final glow = _pulseController.value * 0.6;
                        return Transform.scale(
                          scale: scale,
                          child: Container(
                            width: 120,
                            height: 120,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: RadialGradient(
                                colors: [
                                  AppColors.gold.withOpacity(0.3 + glow * 0.3),
                                  AppColors.lotusPink.withOpacity(0.1),
                                  Colors.transparent,
                                ],
                              ),
                            ),
                            child: const Center(
                              child: Text(
                                '\u{1F52E}', // Crystal ball emoji
                                style: TextStyle(fontSize: 56),
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                    const SizedBox(height: 40),

                    Text(
                      '상담사를 기다리는 중',
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                            color: AppColors.hanji,
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                    const SizedBox(height: 12),

                    // Rotating witty message
                    AnimatedSwitcher(
                      duration: const Duration(milliseconds: 600),
                      child: Text(
                        message,
                        key: ValueKey(message),
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                              color: AppColors.gold,
                              fontStyle: FontStyle.italic,
                            ),
                      ),
                    ),
                    const SizedBox(height: 32),

                    // Retry indicator
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(
                              AppColors.gold.withOpacity(0.6),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Text(
                          '자동으로 재연결 시도 중 ($_retryCount회)',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: AppColors.hanji.withOpacity(0.5),
                              ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 48),

                    // Counselor info card
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.05),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: AppColors.gold.withOpacity(0.15),
                        ),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 48,
                            height: 48,
                            decoration: BoxDecoration(
                              color: AppColors.lotusPink.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(24),
                            ),
                            child: const Icon(
                              Icons.person,
                              color: AppColors.lotusPink,
                              size: 28,
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '$_counselorName 상담사',
                                  style: Theme.of(context)
                                      .textTheme
                                      .titleMedium
                                      ?.copyWith(
                                        color: AppColors.hanji,
                                        fontWeight: FontWeight.w600,
                                      ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  '잠시만 기다려 주세요',
                                  style: Theme.of(context)
                                      .textTheme
                                      .bodySmall
                                      ?.copyWith(
                                        color: AppColors.hanji.withOpacity(0.5),
                                      ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Back button
            Positioned(
              top: 16,
              left: 16,
              child: IconButton(
                icon: const Icon(Icons.arrow_back, color: AppColors.hanji),
                onPressed: () {
                  _retryTimer?.cancel();
                  context.pop();
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Active call screen ──
  Widget _buildCallScreen() {
    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Stack(
          children: [
            // Remote video (full screen background)
            if (!_callsService.useFake)
              Positioned.fill(
                child: _callsService.buildRemoteVideoView() ??
                    Container(color: Colors.black),
              ),

            // Local video (PiP in top-right corner)
            if (!_callsService.useFake)
              Positioned(
                top: 80,
                right: 16,
                width: 120,
                height: 160,
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: _callsService.buildLocalVideoView() ??
                      Container(color: Colors.black54),
                ),
              ),

            // Fallback placeholder when in fake mode or video is off
            if (_callsService.useFake || _isVideoOff)
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

// ── Star field background painter ──
class _StarFieldPainter extends CustomPainter {
  final int seed;

  _StarFieldPainter({required this.seed});

  @override
  void paint(Canvas canvas, Size size) {
    final random = Random(seed);
    final paint = Paint();

    for (int i = 0; i < 40; i++) {
      final x = random.nextDouble() * size.width;
      final y = random.nextDouble() * size.height;
      final radius = random.nextDouble() * 1.5 + 0.5;
      final opacity = random.nextDouble() * 0.3 + 0.05;

      paint.color = AppColors.gold.withOpacity(opacity);
      canvas.drawCircle(Offset(x, y), radius, paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

// ── Control button widget ──
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
