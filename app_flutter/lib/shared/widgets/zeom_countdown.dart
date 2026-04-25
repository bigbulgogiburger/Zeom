import 'package:flutter/material.dart';

import '../animations/zeom_animations.dart';
import '../theme.dart';
import '../typography.dart';

/// 3-state timer & countdown widget used on waiting-room and consultation
/// screens (MOBILE_DESIGN.md §4.14).
///
/// Parent owns the ticking clock (via provider / stream) and passes
/// [remainingSeconds] on each rebuild. This widget:
/// * formats MM:SS
/// * picks the colour for the current state (정상 / 임박 / 긴급)
/// * renders a 2-px progress bar below the number with a 1-second linear
///   transition
/// * pulses via `mcbreathe` when urgent (<= 60s)
/// * fires [onComplete] once when [remainingSeconds] crosses 0.
///
/// Reduce-motion (iOS `Reduce Motion`, Android `Remove animations`) is
/// respected: urgent pulse is disabled and progress bar transitions
/// collapse to zero duration.
class ZeomCountdown extends StatefulWidget {
  const ZeomCountdown({
    required this.totalSeconds,
    required this.remainingSeconds,
    this.showProgressBar = true,
    this.fontSize = 40,
    this.urgentAt = const Duration(seconds: 60),
    this.nearAt = const Duration(seconds: 600),
    this.showZeroAsNow = false,
    this.onComplete,
    super.key,
  });

  /// Total duration for progress-bar normalization.
  final int totalSeconds;

  /// Seconds remaining, controlled by parent.
  final int remainingSeconds;

  /// Render the 2-px progress bar below the number.
  final bool showProgressBar;

  /// Font size of the MM:SS digits. Default 40 (waiting-room heroDisplay).
  final double fontSize;

  /// Threshold for the urgent (red, pulsing) state. Default 60s.
  final Duration urgentAt;

  /// Threshold for the near (orange) state. Default 600s (10 min).
  final Duration nearAt;

  /// When true, render "지금" at 0 instead of "00:00" — used on waiting
  /// rooms whose 8-second countdown terminates into "시작합니다".
  final bool showZeroAsNow;

  /// Fired exactly once when [remainingSeconds] transitions from > 0 to <= 0.
  final VoidCallback? onComplete;

  @override
  State<ZeomCountdown> createState() => _ZeomCountdownState();
}

class _ZeomCountdownState extends State<ZeomCountdown>
    with SingleTickerProviderStateMixin {
  late final AnimationController _pulseController;
  late final Animation<double> _pulseScale;
  bool _completedFired = false;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: ZeomAnimations.breatheDuration,
    );
    _pulseScale = ZeomAnimations.breatheScale(_pulseController);

    if (_isUrgent(widget.remainingSeconds)) {
      _pulseController.repeat(reverse: true);
    }
  }

  @override
  void didUpdateWidget(covariant ZeomCountdown oldWidget) {
    super.didUpdateWidget(oldWidget);

    // Fire onComplete exactly once when we cross into 0.
    if (!_completedFired &&
        oldWidget.remainingSeconds > 0 &&
        widget.remainingSeconds <= 0) {
      _completedFired = true;
      // Defer so listeners can rebuild during the same frame safely.
      WidgetsBinding.instance.addPostFrameCallback((_) {
        widget.onComplete?.call();
      });
    }
    // Reset gate if the timer is restarted.
    if (oldWidget.remainingSeconds <= 0 && widget.remainingSeconds > 0) {
      _completedFired = false;
    }

    // Toggle pulse on/off based on urgency transitions.
    final shouldPulse = _isUrgent(widget.remainingSeconds) &&
        !ZeomAnimations.isReduceMotion(context);
    if (shouldPulse && !_pulseController.isAnimating) {
      _pulseController.repeat(reverse: true);
    } else if (!shouldPulse && _pulseController.isAnimating) {
      _pulseController.stop();
      _pulseController.value = 0.0;
    }
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  bool _isUrgent(int remaining) =>
      remaining > 0 && remaining <= widget.urgentAt.inSeconds;

  bool _isNear(int remaining) =>
      remaining > widget.urgentAt.inSeconds &&
      remaining <= widget.nearAt.inSeconds;

  Color _colorFor(int remaining) {
    if (_isUrgent(remaining)) {
      return const Color(0xFFE06A6A); // 긴급
    }
    if (_isNear(remaining)) {
      return const Color(0xFFD9A64A); // 임박
    }
    return AppColors.gold; // 정상
  }

  String _format(int remaining) {
    final safe = remaining < 0 ? 0 : remaining;
    if (safe == 0 && widget.showZeroAsNow) {
      return '지금';
    }
    final mm = (safe ~/ 60).toString().padLeft(2, '0');
    final ss = (safe % 60).toString().padLeft(2, '0');
    return '$mm:$ss';
  }

  @override
  Widget build(BuildContext context) {
    final remaining = widget.remainingSeconds;
    final color = _colorFor(remaining);
    final isUrgent = _isUrgent(remaining);
    final reduceMotion = ZeomAnimations.isReduceMotion(context);

    // Text style — prefer the canonical ZeomType.heroDisplay but allow
    // overrides when the consumer supplies a non-40 [fontSize] (e.g.
    // the in-room header uses 18).
    final baseStyle = widget.fontSize == 40
        ? ZeomType.heroDisplay.copyWith(color: color)
        : ZeomType.heroDisplay.copyWith(
            color: color,
            fontSize: widget.fontSize,
          );

    Widget digits = Text(
      _format(remaining),
      style: baseStyle,
    );

    if (isUrgent && !reduceMotion) {
      digits = AnimatedBuilder(
        animation: _pulseScale,
        builder: (context, child) {
          return Transform.scale(
            scale: _pulseScale.value,
            child: child,
          );
        },
        child: digits,
      );
    }

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Center(child: digits),
        if (widget.showProgressBar) ...[
          const SizedBox(height: 8),
          _ProgressBar(
            totalSeconds: widget.totalSeconds,
            remainingSeconds: remaining,
            color: color,
            reduceMotion: reduceMotion,
          ),
        ],
      ],
    );
  }
}

class _ProgressBar extends StatelessWidget {
  const _ProgressBar({
    required this.totalSeconds,
    required this.remainingSeconds,
    required this.color,
    required this.reduceMotion,
  });

  final int totalSeconds;
  final int remainingSeconds;
  final Color color;
  final bool reduceMotion;

  @override
  Widget build(BuildContext context) {
    final ratio = totalSeconds <= 0
        ? 0.0
        : (remainingSeconds / totalSeconds).clamp(0.0, 1.0);

    return LayoutBuilder(
      builder: (context, constraints) {
        final maxWidth = constraints.maxWidth.isFinite
            ? constraints.maxWidth
            : MediaQuery.of(context).size.width;
        final targetWidth = maxWidth * ratio;
        return SizedBox(
          height: 2,
          width: maxWidth,
          child: Stack(
            children: [
              // Track — subtle rail so zero-state still renders.
              Container(
                height: 2,
                decoration: BoxDecoration(
                  color: color.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(1),
                ),
              ),
              // Fill — AnimatedContainer 1s linear per spec.
              AnimatedContainer(
                duration: reduceMotion
                    ? Duration.zero
                    : const Duration(seconds: 1),
                curve: Curves.linear,
                height: 2,
                width: targetWidth,
                decoration: BoxDecoration(
                  color: color,
                  borderRadius: BorderRadius.circular(1),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
