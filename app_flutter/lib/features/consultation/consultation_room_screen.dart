import 'dart:async';
import 'dart:ui' show ImageFilter;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../shared/animations/zeom_animations.dart';
import '../../shared/providers/active_session_provider.dart';
import '../../shared/providers/bookings_provider.dart';
import '../../shared/theme.dart';
import '../../shared/typography.dart';
import '../../shared/widgets/zeom_avatar.dart';
import '../../shared/widgets/zeom_countdown.dart';
import '../../shared/widgets/zeom_status_bar.dart';

/// S09 — 상담실 (`SRoom`).
///
/// MOBILE_DESIGN_PLAN.md §3.9, MOBILE_DESIGN.md §4.14.
///
/// View layer only: full-screen dark immersive room with a 3-state timer,
/// top bar + progress bar, video/voice stage, chat overlay, and
/// end-call flow. Landscape is allowed while on this screen.
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

class _ConsultationRoomScreenState
    extends ConsumerState<ConsultationRoomScreen>
    with SingleTickerProviderStateMixin {
  static const int _totalSeconds = 3600; // 60분

  Timer? _timer;
  int _elapsed = 0;

  bool _micOn = true;
  bool _camOn = true;
  bool _remoteCamOn = false; // counselor silhouette until real stream wired
  bool _speakerOn = true;
  bool _chatOpen = false;

  late final AnimationController _breatheController;
  final List<_ChatMessage> _messages = <_ChatMessage>[
    _ChatMessage(
      fromSelf: false,
      text: '반갑습니다. 편히 말씀 나눠요.',
      time: '20:00',
    ),
    _ChatMessage(
      fromSelf: false,
      text: '오늘 어떤 이야기로 시작해 볼까요?',
      time: '20:01',
    ),
    _ChatMessage(
      fromSelf: true,
      text: '요즘 마음이 자주 흔들려서요...',
      time: '20:02',
    ),
  ];
  final TextEditingController _inputController = TextEditingController();

  int get _remaining =>
      (_totalSeconds - _elapsed).clamp(0, _totalSeconds);

  @override
  void initState() {
    super.initState();
    _breatheController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 3000),
    )..repeat(reverse: true);

    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      setState(() {
        _elapsed += 1;
      });
      if (_remaining <= 0) {
        _handleEnd();
      }
    });

    // Allow landscape while on this screen.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      SystemChrome.setPreferredOrientations(const <DeviceOrientation>[
        DeviceOrientation.portraitUp,
        DeviceOrientation.landscapeLeft,
        DeviceOrientation.landscapeRight,
      ]);
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _breatheController.dispose();
    _inputController.dispose();
    // Reset to portrait-only on exit.
    SystemChrome.setPreferredOrientations(const <DeviceOrientation>[
      DeviceOrientation.portraitUp,
    ]);
    super.dispose();
  }

  Future<void> _handleEnd() async {
    _timer?.cancel();
    _timer = null;
    final session = ref.read(activeSessionProvider);
    if (session != null) {
      ref.read(bookingsProvider.notifier).markCompleted(session.booking.id);
    }
    if (!mounted) return;
    final int bookingId = widget.bookingId;
    // Route is `/consultation/:bookingId/complete` (router.dart:150).
    context.go('/consultation/$bookingId/complete');
  }

  void _sendMessage() {
    final text = _inputController.text.trim();
    if (text.isEmpty) return;
    final now = TimeOfDay.now();
    final stamp =
        '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}';
    setState(() {
      _messages.add(_ChatMessage(fromSelf: true, text: text, time: stamp));
      _inputController.clear();
    });
  }

  Color _timerColor(int remaining) {
    if (remaining <= 60) return const Color(0xFFE06A6A);
    if (remaining <= 600) return const Color(0xFFD9A64A);
    return AppColors.gold;
  }

  @override
  Widget build(BuildContext context) {
    final session = ref.watch(activeSessionProvider);

    if (session == null) {
      return _buildNullSessionScreen(context);
    }

    final booking = session.booking;
    final BookingChannel channel = booking.channel;
    final String name = booking.counselorName;
    final String initials = booking.counselorInitials;

    final topPadding = MediaQuery.of(context).padding.top;
    final bottomPadding = MediaQuery.of(context).padding.bottom;

    return ZeomStatusBar.wrap(
      dark: true,
      child: Scaffold(
        backgroundColor: const Color(0xFF050505),
        body: Stack(
          children: [
            Column(
              children: [
                _TopBar(
                  topSafePadding: topPadding,
                  name: name,
                  initials: initials,
                  remaining: _remaining,
                ),
                _TimerProgressBar(
                  remaining: _remaining,
                  total: _totalSeconds,
                  color: _timerColor(_remaining),
                ),
                Expanded(
                  child: _VideoArea(
                    channel: channel,
                    camOn: _camOn,
                    remoteCamOn: _remoteCamOn,
                    selfCamOn: _camOn,
                    name: name,
                    initials: initials,
                    breatheController: _breatheController,
                    subtitle: _formatSessionSubtitle(booking),
                  ),
                ),
                _BottomControls(
                  bottomSafePadding: bottomPadding,
                  micOn: _micOn,
                  camOn: _camOn,
                  speakerOn: _speakerOn,
                  onToggleMic: () => setState(() => _micOn = !_micOn),
                  onToggleCam: () => setState(() => _camOn = !_camOn),
                  onToggleSpeaker:
                      () => setState(() => _speakerOn = !_speakerOn),
                  onOpenChat: () => setState(() => _chatOpen = true),
                  onEnd: _handleEnd,
                ),
              ],
            ),
            if (_chatOpen)
              _ChatOverlay(
                messages: _messages,
                inputController: _inputController,
                onClose: () => setState(() => _chatOpen = false),
                onSend: _sendMessage,
              ),
          ],
        ),
      ),
    );
  }

  String _formatSessionSubtitle(Booking b) {
    final hh = b.when.hour.toString().padLeft(2, '0');
    final mm = b.when.minute.toString().padLeft(2, '0');
    final mode = b.channel == BookingChannel.video ? '화상 상담' : '음성 상담';
    return '오늘 $hh:$mm · ${b.durationMinutes}분 $mode';
  }

  Widget _buildNullSessionScreen(BuildContext context) {
    return ZeomStatusBar.wrap(
      dark: true,
      child: Scaffold(
        backgroundColor: const Color(0xFF050505),
        body: SafeArea(
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  '세션을 찾을 수 없어요',
                  style: ZeomType.subTitle.copyWith(color: AppColors.hanji),
                ),
                const SizedBox(height: 16),
                TextButton(
                  onPressed: () {
                    if (Navigator.of(context).canPop()) {
                      context.pop();
                    } else {
                      context.go('/home');
                    }
                  },
                  child: Text(
                    '돌아가기',
                    style: ZeomType.bodyLg.copyWith(color: AppColors.gold),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// =================================================================
// Top bar
// =================================================================

class _TopBar extends StatelessWidget {
  const _TopBar({
    required this.topSafePadding,
    required this.name,
    required this.initials,
    required this.remaining,
  });

  final double topSafePadding;
  final String name;
  final String initials;
  final int remaining;

  @override
  Widget build(BuildContext context) {
    return ClipRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: Container(
          padding: EdgeInsets.fromLTRB(16, topSafePadding + 8, 16, 12),
          color: const Color.fromRGBO(0, 0, 0, 0.55),
          child: Row(
            children: [
              ZeomAvatar(
                initials: initials,
                size: 28,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: ZeomType.bodySm.copyWith(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppColors.hanji,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '상담 중',
                      style: ZeomType.micro.copyWith(
                        fontSize: 10,
                        fontWeight: FontWeight.w500,
                        color: AppColors.hanji.withOpacity(0.6),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Semantics(
                liveRegion: true,
                value: _accessibleTime(remaining),
                child: ZeomCountdown(
                  totalSeconds: 3600,
                  remainingSeconds: remaining,
                  fontSize: 18,
                  showProgressBar: false,
                  urgentAt: const Duration(seconds: 60),
                  nearAt: const Duration(seconds: 600),
                  showZeroAsNow: false,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _accessibleTime(int remaining) {
    final safe = remaining < 0 ? 0 : remaining;
    final mm = (safe ~/ 60).toString().padLeft(2, '0');
    final ss = (safe % 60).toString().padLeft(2, '0');
    return '$mm:$ss';
  }
}

// =================================================================
// Timer progress bar (2px)
// =================================================================

class _TimerProgressBar extends StatelessWidget {
  const _TimerProgressBar({
    required this.remaining,
    required this.total,
    required this.color,
  });

  final int remaining;
  final int total;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final ratio =
        total <= 0 ? 0.0 : (remaining / total).clamp(0.0, 1.0);
    return SizedBox(
      height: 2,
      width: double.infinity,
      child: Stack(
        children: [
          Container(color: color.withOpacity(0.12)),
          AnimatedFractionallySizedBox(
            duration: const Duration(seconds: 1),
            curve: Curves.linear,
            alignment: Alignment.centerLeft,
            widthFactor: ratio,
            heightFactor: 1,
            child: Container(color: color),
          ),
        ],
      ),
    );
  }
}

// =================================================================
// Video / voice area
// =================================================================

class _VideoArea extends StatelessWidget {
  const _VideoArea({
    required this.channel,
    required this.camOn,
    required this.remoteCamOn,
    required this.selfCamOn,
    required this.name,
    required this.initials,
    required this.breatheController,
    required this.subtitle,
  });

  final BookingChannel channel;
  final bool camOn;
  final bool remoteCamOn;
  final bool selfCamOn;
  final String name;
  final String initials;
  final AnimationController breatheController;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    if (channel == BookingChannel.video) {
      return _buildVideoStage();
    }
    return _buildVoiceStage();
  }

  Widget _buildVideoStage() {
    return Stack(
      fit: StackFit.expand,
      children: [
        // Ambient radial gradient — warm amber falling into ink.
        Container(
          decoration: const BoxDecoration(
            gradient: RadialGradient(
              center: Alignment.center,
              radius: 0.9,
              colors: <Color>[
                Color(0xFF3A2A1A),
                Color(0xFF050505),
              ],
            ),
          ),
        ),
        // Remote silhouette or "camera off" placeholder.
        Center(
          child: remoteCamOn
              ? const Icon(
                  Icons.person,
                  size: 160,
                  color: Color(0x33FFFFFF),
                )
              : Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.videocam_off,
                      size: 60,
                      color: AppColors.hanji.withOpacity(0.4),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      '상대 카메라 꺼짐',
                      style: ZeomType.meta.copyWith(
                        fontSize: 12,
                        color: AppColors.hanji.withOpacity(0.6),
                      ),
                    ),
                  ],
                ),
        ),
        // Self PIP (bottom-right).
        Positioned(
          right: 16,
          bottom: 16,
          child: Container(
            width: 100,
            height: 133,
            decoration: BoxDecoration(
              color: const Color.fromRGBO(0, 0, 0, 0.6),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: const Color.fromRGBO(255, 255, 255, 0.1),
                width: 1,
              ),
            ),
            alignment: Alignment.center,
            child: selfCamOn
                ? Icon(
                    Icons.person,
                    size: 40,
                    color: AppColors.hanji.withOpacity(0.5),
                  )
                : Text(
                    '꺼짐',
                    style: ZeomType.micro.copyWith(
                      fontSize: 10,
                      color: AppColors.hanji.withOpacity(0.5),
                    ),
                  ),
          ),
        ),
      ],
    );
  }

  Widget _buildVoiceStage() {
    final reduceMotion = ZeomAnimations.isReduceMotion;
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        mainAxisSize: MainAxisSize.min,
        children: [
          // 160x160 circular avatar with darkRed → gold radial and breathe.
          AnimatedBuilder(
            animation: breatheController,
            builder: (context, child) {
              final reduce = reduceMotion(context);
              final t = reduce ? 0.0 : breatheController.value;
              final scale = 1.0 + (t * 0.06);
              return Transform.scale(scale: scale, child: child);
            },
            child: Container(
              width: 160,
              height: 160,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  center: Alignment.center,
                  radius: 0.85,
                  colors: <Color>[
                    AppColors.gold.withOpacity(0.7),
                    AppColors.darkRed.withOpacity(0.7),
                  ],
                ),
              ),
              alignment: Alignment.center,
              child: ZeomAvatar(
                initials: initials,
                size: 88,
                textColor: AppColors.hanji,
              ),
            ),
          ),
          const SizedBox(height: 24),
          Text(
            '$name님과 연결됨',
            style: ZeomType.bodyLg.copyWith(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: AppColors.hanji.withOpacity(0.7),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            subtitle,
            style: ZeomType.micro.copyWith(
              fontSize: 11,
              fontWeight: FontWeight.w400,
              color: AppColors.hanji.withOpacity(0.5),
            ),
          ),
        ],
      ),
    );
  }
}

// =================================================================
// Bottom controls
// =================================================================

class _BottomControls extends StatelessWidget {
  const _BottomControls({
    required this.bottomSafePadding,
    required this.micOn,
    required this.camOn,
    required this.speakerOn,
    required this.onToggleMic,
    required this.onToggleCam,
    required this.onToggleSpeaker,
    required this.onOpenChat,
    required this.onEnd,
  });

  final double bottomSafePadding;
  final bool micOn;
  final bool camOn;
  final bool speakerOn;
  final VoidCallback onToggleMic;
  final VoidCallback onToggleCam;
  final VoidCallback onToggleSpeaker;
  final VoidCallback onOpenChat;
  final VoidCallback onEnd;

  @override
  Widget build(BuildContext context) {
    return ClipRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: Container(
          padding: EdgeInsets.fromLTRB(
            16,
            14,
            16,
            bottomSafePadding + 14,
          ),
          color: const Color.fromRGBO(0, 0, 0, 0.4),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _CircleButton(
                icon: micOn ? Icons.mic : Icons.mic_off,
                off: !micOn,
                onTap: onToggleMic,
                semanticsLabel: micOn ? '마이크 음소거' : '마이크 켜기',
              ),
              const SizedBox(width: 12),
              _CircleButton(
                icon: camOn ? Icons.videocam : Icons.videocam_off,
                off: !camOn,
                onTap: onToggleCam,
                semanticsLabel: camOn ? '카메라 끄기' : '카메라 켜기',
              ),
              const SizedBox(width: 12),
              _CircleButton(
                icon: speakerOn ? Icons.volume_up : Icons.volume_off,
                off: false,
                onTap: onToggleSpeaker,
                semanticsLabel: speakerOn ? '스피커 끄기' : '스피커 켜기',
              ),
              const SizedBox(width: 12),
              _CircleButton(
                icon: Icons.chat_bubble_outline,
                off: false,
                onTap: onOpenChat,
                semanticsLabel: '채팅 열기',
              ),
              const SizedBox(width: 20),
              _EndCallButton(onTap: onEnd),
            ],
          ),
        ),
      ),
    );
  }
}

class _CircleButton extends StatelessWidget {
  const _CircleButton({
    required this.icon,
    required this.off,
    required this.onTap,
    required this.semanticsLabel,
  });

  final IconData icon;
  final bool off;
  final VoidCallback onTap;
  final String semanticsLabel;

  @override
  Widget build(BuildContext context) {
    final Color bg = off
        ? AppColors.darkRed.withOpacity(0.5)
        : const Color.fromRGBO(255, 255, 255, 0.1);
    return Semantics(
      button: true,
      label: semanticsLabel,
      child: GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.opaque,
        child: Container(
          width: 52,
          height: 52,
          decoration: BoxDecoration(
            color: bg,
            shape: BoxShape.circle,
          ),
          alignment: Alignment.center,
          child: Icon(icon, size: 20, color: AppColors.hanji),
        ),
      ),
    );
  }
}

class _EndCallButton extends StatelessWidget {
  const _EndCallButton({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: '통화 종료',
      hint: '종료하면 다시 연결할 수 없습니다',
      child: GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.opaque,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: <Color>[
                AppColors.darkRed,
                Color(0xFF6B0000),
              ],
            ),
            borderRadius: BorderRadius.circular(999),
            boxShadow: <BoxShadow>[
              BoxShadow(
                color: AppColors.darkRed.withOpacity(0.4),
                blurRadius: 16,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.call_end, color: Colors.white, size: 20),
              const SizedBox(width: 6),
              Text(
                '종료',
                style: ZeomType.bodyLg.copyWith(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: AppColors.hanji,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// =================================================================
// Chat overlay
// =================================================================

class _ChatOverlay extends StatelessWidget {
  const _ChatOverlay({
    required this.messages,
    required this.inputController,
    required this.onClose,
    required this.onSend,
  });

  final List<_ChatMessage> messages;
  final TextEditingController inputController;
  final VoidCallback onClose;
  final VoidCallback onSend;

  @override
  Widget build(BuildContext context) {
    return Positioned.fill(
      child: ClipRect(
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
          child: Container(
            decoration: BoxDecoration(
              color: const Color(0xDD141414),
              border: Border.all(
                color: const Color.fromRGBO(255, 255, 255, 0.1),
                width: 1,
              ),
            ),
            child: SafeArea(
              child: Column(
                children: [
                  // Header
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 14, 8, 14),
                    child: Row(
                      children: [
                        Text(
                          '메시지',
                          style: ZeomType.section.copyWith(
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                            color: AppColors.hanji,
                          ),
                        ),
                        const Spacer(),
                        IconButton(
                          onPressed: onClose,
                          icon: const Icon(
                            Icons.close,
                            color: AppColors.hanji,
                            size: 22,
                          ),
                          tooltip: '닫기',
                        ),
                      ],
                    ),
                  ),
                  const Divider(
                    height: 0.5,
                    thickness: 0.5,
                    color: Color.fromRGBO(255, 255, 255, 0.1),
                  ),
                  // Messages list
                  Expanded(
                    child: ListView.separated(
                      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
                      itemCount: messages.length,
                      separatorBuilder: (_, __) =>
                          const SizedBox(height: 10),
                      itemBuilder: (context, index) {
                        final m = messages[index];
                        return _ChatBubble(message: m);
                      },
                    ),
                  ),
                  // Input bar
                  _ChatInputBar(
                    controller: inputController,
                    onSend: onSend,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _ChatBubble extends StatelessWidget {
  const _ChatBubble({required this.message});

  final _ChatMessage message;

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final maxBubbleWidth = screenWidth * 0.72;

    final isSelf = message.fromSelf;

    final bubble = Container(
      constraints: BoxConstraints(maxWidth: maxBubbleWidth),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: isSelf
            ? const Color.fromRGBO(201, 162, 39, 0.22)
            : const Color.fromRGBO(255, 255, 255, 0.08),
        borderRadius: BorderRadius.only(
          topLeft: const Radius.circular(14),
          topRight: const Radius.circular(14),
          bottomLeft: Radius.circular(isSelf ? 14 : 4),
          bottomRight: Radius.circular(isSelf ? 4 : 14),
        ),
      ),
      child: Text(
        message.text,
        style: ZeomType.body.copyWith(
          fontSize: 13,
          color: AppColors.hanji,
          height: 1.5,
        ),
      ),
    );

    final timestamp = Padding(
      padding: const EdgeInsets.only(top: 4),
      child: Text(
        message.time,
        style: ZeomType.micro.copyWith(
          fontSize: 9,
          color: AppColors.hanji.withOpacity(0.4),
        ),
      ),
    );

    return Column(
      crossAxisAlignment:
          isSelf ? CrossAxisAlignment.end : CrossAxisAlignment.start,
      children: [bubble, timestamp],
    );
  }
}

class _ChatInputBar extends StatelessWidget {
  const _ChatInputBar({
    required this.controller,
    required this.onSend,
  });

  final TextEditingController controller;
  final VoidCallback onSend;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(10),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: controller,
              style: ZeomType.body.copyWith(
                fontSize: 13,
                color: AppColors.hanji,
              ),
              cursorColor: AppColors.gold,
              minLines: 1,
              maxLines: 4,
              textInputAction: TextInputAction.send,
              onSubmitted: (_) => onSend(),
              decoration: InputDecoration(
                isDense: true,
                hintText: '메시지 입력',
                hintStyle: ZeomType.body.copyWith(
                  fontSize: 13,
                  color: AppColors.hanji.withOpacity(0.5),
                ),
                filled: true,
                fillColor:
                    const Color.fromRGBO(255, 255, 255, 0.06),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 10,
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(22),
                  borderSide: BorderSide.none,
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(22),
                  borderSide: BorderSide.none,
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(22),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          Semantics(
            button: true,
            label: '메시지 전송',
            child: GestureDetector(
              onTap: onSend,
              behavior: HitTestBehavior.opaque,
              child: Container(
                width: 40,
                height: 40,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.gold,
                ),
                alignment: Alignment.center,
                child: const Icon(
                  Icons.send,
                  size: 18,
                  color: AppColors.ink,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// =================================================================
// Data — chat message
// =================================================================

class _ChatMessage {
  final bool fromSelf;
  final String text;
  final String time;

  _ChatMessage({
    required this.fromSelf,
    required this.text,
    required this.time,
  });
}
