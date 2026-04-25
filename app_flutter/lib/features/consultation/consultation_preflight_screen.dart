import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../shared/providers/active_session_provider.dart';
import '../../shared/providers/bookings_provider.dart';
import '../../shared/theme.dart';
import '../../shared/typography.dart';
import '../../shared/widgets/zeom_app_bar.dart';
import '../../shared/widgets/zeom_avatar.dart';
import '../../shared/widgets/zeom_button.dart';
import '../../shared/widgets/zeom_countdown.dart';
import '../../shared/widgets/zeom_presence_dot.dart';
import '../../shared/widgets/zeom_status_bar.dart';

/// S08 — 대기실 (Waiting Room).
///
/// Dark-inverted preflight screen per MOBILE_DESIGN_PLAN.md § 3.8. Reads
/// [activeSessionProvider] for the active booking and exposes:
/// * 3/4 self-preview with mock mic level meter, "나" label, and network badge
/// * three 52px circular controls (mic / cam / settings)
/// * countdown card (8 → 0 → "지금") with counselor profile row
/// * enter button with guarded states (permissions + countdown gate)
///
/// Timer lifecycle: both the 1s countdown timer and the 140ms mic-level
/// timer are owned by the widget state and cancelled in [dispose].
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
  static const int _countdownSeconds = 8;

  int _cd = _countdownSeconds;
  bool _micOn = true;
  bool _camOn = true;
  int _micLevel = 3;

  Timer? _cdTimer;
  Timer? _micTimer;
  final math.Random _rng = math.Random();

  @override
  void initState() {
    super.initState();
    _startCountdown();
    _startMicMeter();
  }

  void _startCountdown() {
    _cdTimer?.cancel();
    _cdTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) return;
      if (_cd <= 0) {
        timer.cancel();
        return;
      }
      setState(() {
        _cd -= 1;
        if (_cd <= 0) {
          _cd = 0;
          timer.cancel();
        }
      });
    });
  }

  void _startMicMeter() {
    _micTimer?.cancel();
    _micTimer = Timer.periodic(const Duration(milliseconds: 140), (_) {
      if (!mounted) return;
      setState(() {
        // When muted, meter still ticks but near floor for visual feedback.
        _micLevel = _micOn ? _rng.nextInt(11) : _rng.nextInt(3);
      });
    });
  }

  @override
  void dispose() {
    _cdTimer?.cancel();
    _micTimer?.cancel();
    super.dispose();
  }

  void _openSettingsSheet() {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: const Color(0xFF1A1410),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (sheetCtx) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 36,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 12),
                  decoration: BoxDecoration(
                    color: AppColors.hanji.withOpacity(0.25),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                _SheetItem(
                  icon: Icons.refresh,
                  label: '다시 연결',
                  onTap: () => Navigator.of(sheetCtx).maybePop(),
                ),
                _SheetItem(
                  icon: Icons.mic_none,
                  label: '마이크 테스트',
                  onTap: () => Navigator.of(sheetCtx).maybePop(),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final session = ref.watch(activeSessionProvider);

    return ZeomStatusBar.wrap(
      dark: true,
      child: Scaffold(
        backgroundColor: AppColors.inkBlack,
        body: SafeArea(
          child: Column(
            children: [
              const ZeomAppBar(
                title: '대기실',
                dark: true,
                transparentBg: false,
                elevate: false,
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: session == null
                      ? _EmptySession()
                      : _WaitingBody(
                          booking: session.booking,
                          cd: _cd,
                          micOn: _micOn,
                          camOn: _camOn,
                          micLevel: _micLevel,
                          onToggleMic: () =>
                              setState(() => _micOn = !_micOn),
                          onToggleCam: () =>
                              setState(() => _camOn = !_camOn),
                          onSettings: _openSettingsSheet,
                          onEnter: () {
                            // Navigate to the consultation room. Router
                            // path is `/consultation/:bookingId` (no
                            // `/room` suffix — see core/router.dart).
                            context.go(
                                '/consultation/${session.booking.id}');
                          },
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Empty-state (no active session)
// ---------------------------------------------------------------------------

class _EmptySession extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Text(
            '세션 정보가 없어요',
            style: ZeomType.body.copyWith(color: AppColors.hanji),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          _DarkOutlineButton(
            label: '예약으로',
            onPressed: () => context.go('/bookings'),
          ),
        ],
      ),
    );
  }
}

/// Dark-variant outline button — hanji text on rgba(255,255,255,0.12)
/// background. Thin wrapper around [ZeomButton.ghost] with a tint.
class _DarkOutlineButton extends StatelessWidget {
  const _DarkOutlineButton({
    required this.label,
    required this.onPressed,
  });

  final String label;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onPressed,
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        decoration: BoxDecoration(
          color: const Color.fromRGBO(255, 255, 255, 0.12),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Text(
          label,
          style: ZeomType.bodyLg.copyWith(
            color: AppColors.hanji,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Main body
// ---------------------------------------------------------------------------

class _WaitingBody extends StatelessWidget {
  const _WaitingBody({
    required this.booking,
    required this.cd,
    required this.micOn,
    required this.camOn,
    required this.micLevel,
    required this.onToggleMic,
    required this.onToggleCam,
    required this.onSettings,
    required this.onEnter,
  });

  final Booking booking;
  final int cd;
  final bool micOn;
  final bool camOn;
  final int micLevel;
  final VoidCallback onToggleMic;
  final VoidCallback onToggleCam;
  final VoidCallback onSettings;
  final VoidCallback onEnter;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _SelfPreview(camOn: camOn, micLevel: micLevel),
          const SizedBox(height: 14),
          _ControlRow(
            micOn: micOn,
            camOn: camOn,
            onToggleMic: onToggleMic,
            onToggleCam: onToggleCam,
            onSettings: onSettings,
          ),
          const SizedBox(height: 20),
          _CountdownCard(booking: booking, cd: cd),
          const SizedBox(height: 16),
          _EnterButton(
            cd: cd,
            micOn: micOn,
            camOn: camOn,
            onPressed: onEnter,
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// SelfPreview
// ---------------------------------------------------------------------------

class _SelfPreview extends StatelessWidget {
  const _SelfPreview({required this.camOn, required this.micLevel});

  final bool camOn;
  final int micLevel;

  @override
  Widget build(BuildContext context) {
    return AspectRatio(
      aspectRatio: 3 / 4,
      child: ExcludeSemantics(
        child: ClipRRect(
          borderRadius: BorderRadius.circular(14),
          child: Container(
            decoration: const BoxDecoration(
              gradient: RadialGradient(
                center: Alignment.center,
                radius: 0.9,
                colors: [Color(0xFF3A2A1A), AppColors.inkBlack],
              ),
            ),
            child: Stack(
              children: [
                // Silhouette or "camera off" text
                Positioned.fill(
                  child: Center(
                    child: camOn
                        ? Icon(
                            Icons.person,
                            size: 100,
                            color: AppColors.hanji.withOpacity(0.35),
                          )
                        : Text(
                            '📷 카메라 꺼짐',
                            style: ZeomType.body.copyWith(
                              color: AppColors.hanji.withOpacity(0.6),
                            ),
                          ),
                  ),
                ),

                // Top-left "나" pill
                Positioned(
                  top: 12,
                  left: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: const Color.fromRGBO(255, 255, 255, 0.15),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      '나',
                      style: ZeomType.tag.copyWith(
                        color: AppColors.hanji,
                        fontSize: 10.5,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),

                // Top-right network badge
                Positioned(
                  top: 12,
                  right: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color.fromRGBO(45, 80, 22, 0.3),
                      border: Border.all(
                        color: const Color.fromRGBO(45, 80, 22, 0.5),
                        width: 1,
                      ),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const ZeomPresenceDot(
                          color: AppColors.jadeSuccess,
                          pulse: true,
                          size: 6,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          '네트워크 우수',
                          style: ZeomType.tag.copyWith(
                            color: AppColors.networkGoodFg,
                            fontSize: 9,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                // Bottom-left mic meter
                Positioned(
                  bottom: 12,
                  left: 12,
                  child: _MicMeter(level: micLevel),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Six-bar mic-level meter. Base heights ramp 4/6/8/10/12/14 px; each bar
/// beyond `activeBarsCount` drops to opacity 0.25. Accessibility: meter is
/// decorative but reports the coarse percentage.
class _MicMeter extends StatelessWidget {
  const _MicMeter({required this.level});

  /// 0..10.
  final int level;

  static const List<double> _baseHeights = [4, 6, 8, 10, 12, 14];

  @override
  Widget build(BuildContext context) {
    // Level 0..10 → 0..6 active bars.
    final int active = (level.clamp(0, 10) * 6 / 10).round();
    final int percent = (level.clamp(0, 10) * 10);

    return Semantics(
      label: '마이크 레벨',
      value: '$percent%',
      child: Row(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          for (int i = 0; i < _baseHeights.length; i++) ...[
            AnimatedContainer(
              duration: const Duration(milliseconds: 120),
              width: 3,
              height: _baseHeights[i],
              decoration: BoxDecoration(
                color: AppColors.gold
                    .withOpacity(i < active ? 1.0 : 0.25),
                borderRadius: BorderRadius.circular(1.5),
              ),
            ),
            if (i != _baseHeights.length - 1) const SizedBox(width: 4),
          ],
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// ControlRow
// ---------------------------------------------------------------------------

class _ControlRow extends StatelessWidget {
  const _ControlRow({
    required this.micOn,
    required this.camOn,
    required this.onToggleMic,
    required this.onToggleCam,
    required this.onSettings,
  });

  final bool micOn;
  final bool camOn;
  final VoidCallback onToggleMic;
  final VoidCallback onToggleCam;
  final VoidCallback onSettings;

  static const Color _defaultBg = Color.fromRGBO(255, 255, 255, 0.08);

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        _CircleControl(
          icon: micOn ? Icons.mic : Icons.mic_off,
          bg: micOn ? _defaultBg : AppColors.darkRed,
          onTap: onToggleMic,
          semanticsLabel: micOn ? '마이크 끄기' : '마이크 켜기',
        ),
        const SizedBox(width: 16),
        _CircleControl(
          icon: camOn ? Icons.videocam : Icons.videocam_off,
          bg: camOn ? _defaultBg : AppColors.darkRed,
          onTap: onToggleCam,
          semanticsLabel: camOn ? '카메라 끄기' : '카메라 켜기',
        ),
        const SizedBox(width: 16),
        _CircleControl(
          icon: Icons.settings,
          bg: _defaultBg,
          onTap: onSettings,
          semanticsLabel: '설정',
        ),
      ],
    );
  }
}

class _CircleControl extends StatelessWidget {
  const _CircleControl({
    required this.icon,
    required this.bg,
    required this.onTap,
    required this.semanticsLabel,
  });

  final IconData icon;
  final Color bg;
  final VoidCallback onTap;
  final String semanticsLabel;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: semanticsLabel,
      child: Material(
        color: bg,
        shape: const CircleBorder(),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          customBorder: const CircleBorder(),
          child: SizedBox(
            width: 52,
            height: 52,
            child: Center(
              child: Icon(icon, color: AppColors.hanji, size: 22),
            ),
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// CountdownCard
// ---------------------------------------------------------------------------

class _CountdownCard extends StatelessWidget {
  const _CountdownCard({required this.booking, required this.cd});

  final Booking booking;
  final int cd;

  static const int _total = 8;

  String _formatTime(DateTime when) {
    final h = when.hour.toString().padLeft(2, '0');
    final m = when.minute.toString().padLeft(2, '0');
    return '$h:$m';
  }

  String _channelLabel(BookingChannel c) {
    switch (c) {
      case BookingChannel.video:
        return '화상';
      case BookingChannel.voice:
        return '음성';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color.fromRGBO(255, 255, 255, 0.06),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Text(
            '입장까지'.toUpperCase(),
            style: ZeomType.micro.copyWith(
              color: AppColors.hanji.withOpacity(0.6),
              letterSpacing: 1.0,
            ),
          ),
          const SizedBox(height: 4),
          // ZeomCountdown internally respects reduce-motion (see T4 report).
          Semantics(
            liveRegion: true,
            child: SizedBox(
              width: double.infinity,
              child: ZeomCountdown(
                totalSeconds: _total,
                remainingSeconds: cd,
                fontSize: 40,
                showZeroAsNow: true,
                showProgressBar: true,
                urgentAt: const Duration(seconds: 3),
                nearAt: const Duration(seconds: 6),
              ),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              ZeomAvatar(
                initials: booking.counselorInitials,
                size: 36,
              ),
              const SizedBox(width: 10),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    booking.counselorName,
                    style: ZeomType.cardTitle.copyWith(
                      color: AppColors.hanji,
                    ),
                  ),
                  Text(
                    '${_formatTime(booking.when)} 시작 · '
                    '${_channelLabel(booking.channel)}',
                    style: ZeomType.meta.copyWith(
                      color: AppColors.hanji.withOpacity(0.6),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// EnterButton
// ---------------------------------------------------------------------------

class _EnterButton extends StatelessWidget {
  const _EnterButton({
    required this.cd,
    required this.micOn,
    required this.camOn,
    required this.onPressed,
  });

  final int cd;
  final bool micOn;
  final bool camOn;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    final bool canEnter = cd == 0 && micOn && camOn;

    late final String label;
    late final Color bg;
    late final Color fg;
    late final FontWeight weight;

    if (!micOn || !camOn) {
      label = '${!micOn ? '마이크' : '카메라'} 필요';
      bg = const Color.fromRGBO(255, 255, 255, 0.08);
      fg = AppColors.hanji;
      weight = FontWeight.w600;
    } else if (cd > 0) {
      label = '$cd초 후 입장 가능';
      bg = const Color.fromRGBO(255, 255, 255, 0.08);
      fg = AppColors.hanji;
      weight = FontWeight.w600;
    } else {
      label = '상담실 입장';
      bg = AppColors.gold;
      fg = AppColors.inkBlack;
      weight = FontWeight.w700;
    }

    return Semantics(
      button: true,
      enabled: canEnter,
      label: label,
      child: GestureDetector(
        onTap: canEnter ? onPressed : null,
        behavior: HitTestBehavior.opaque,
        child: Container(
          width: double.infinity,
          height: 54,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: bg,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            label,
            style: ZeomType.bodyLg.copyWith(
              color: fg,
              fontWeight: weight,
            ),
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Bottom sheet item
// ---------------------------------------------------------------------------

class _SheetItem extends StatelessWidget {
  const _SheetItem({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        child: Row(
          children: [
            Icon(icon, color: AppColors.hanji, size: 22),
            const SizedBox(width: 12),
            Text(
              label,
              style: ZeomType.bodyLg.copyWith(color: AppColors.hanji),
            ),
          ],
        ),
      ),
    );
  }
}
