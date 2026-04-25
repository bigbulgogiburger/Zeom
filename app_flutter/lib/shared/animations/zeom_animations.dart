import 'package:flutter/material.dart';

/// Shared animation presets for 천지연꽃신당 mobile.
///
/// Translates the CSS keyframes `mcbreathe` / `mcspin` / `mcfade` from
/// MOBILE_DESIGN.md §4.12 into Flutter-friendly [Animation]/[Duration]
/// primitives. All helpers are pure — they do not own an
/// [AnimationController]; pass one in from a [TickerProvider].
class ZeomAnimations {
  ZeomAnimations._();

  /// `mcbreathe` — 1.8s pulse. Used on presence dots, waiting-room timer
  /// when <= 60s remaining, and audio-call avatar.
  static const Duration breatheDuration = Duration(milliseconds: 1800);

  /// `mcspin` — 0.8s linear infinite. Used for button loaders.
  static const Duration spinDuration = Duration(milliseconds: 800);

  /// `mcfade` short variant — 0.25s ease-out. Toasts, inline reveals.
  static const Duration fadeDuration = Duration(milliseconds: 250);

  /// `mcfade` long variant — 0.5s ease-out. Page/section mount-ins.
  static const Duration slideFadeDuration = Duration(milliseconds: 500);

  // ---------------------------------------------------------------
  // mcbreathe: scale 1.0 ↔ 1.08, opacity 0.85 ↔ 1.0
  // ---------------------------------------------------------------

  /// Scale tween for the `mcbreathe` keyframe.
  static Animation<double> breatheScale(AnimationController c) =>
      Tween<double>(begin: 1.0, end: 1.08).animate(
        CurvedAnimation(parent: c, curve: Curves.easeInOut),
      );

  /// Opacity tween for the `mcbreathe` keyframe.
  static Animation<double> breatheOpacity(AnimationController c) =>
      Tween<double>(begin: 0.85, end: 1.0).animate(
        CurvedAnimation(parent: c, curve: Curves.easeInOut),
      );

  // ---------------------------------------------------------------
  // mcfade: opacity 0→1 + translateY(8→0)
  // ---------------------------------------------------------------

  /// Fractional-offset translate for the `mcfade` keyframe. Paired with
  /// [SlideTransition]; `0.04` ≈ 8px for a typical 200px child.
  static Animation<Offset> fadeSlideOffset(AnimationController c) =>
      Tween<Offset>(begin: const Offset(0, 0.04), end: Offset.zero).animate(
        CurvedAnimation(parent: c, curve: Curves.easeOut),
      );

  /// Opacity tween for the `mcfade` keyframe.
  static Animation<double> fadeOpacity(AnimationController c) =>
      Tween<double>(begin: 0.0, end: 1.0).animate(
        CurvedAnimation(parent: c, curve: Curves.easeOut),
      );

  // ---------------------------------------------------------------
  // Reduce-motion helpers
  // ---------------------------------------------------------------

  /// Collapse [d] to [Duration.zero] when the user has requested reduced
  /// motion (iOS `Reduce Motion`, Android `Remove animations`). Per
  /// MOBILE_DESIGN.md §accessibility rules, `mcbreathe`/`mcfade` must
  /// respect this setting.
  static Duration respectReduceMotion(BuildContext context, Duration d) {
    final disable = MediaQuery.maybeOf(context)?.disableAnimations ?? false;
    return disable ? Duration.zero : d;
  }

  /// Whether the current [MediaQuery] requests reduced motion.
  static bool isReduceMotion(BuildContext context) =>
      MediaQuery.maybeOf(context)?.disableAnimations ?? false;
}

// =================================================================
// ZeomFadeSlideIn — convenience widget
// =================================================================

/// Mount-in wrapper that applies the `mcfade` transition (opacity 0→1,
/// translateY 8→0) once, on first build.
///
/// Respects [MediaQueryData.disableAnimations]: when reduced motion is
/// on, the child is shown instantly without animation.
///
/// ```dart
/// ZeomFadeSlideIn(
///   delay: Duration(milliseconds: 120),
///   child: Text('오늘의 운세'),
/// )
/// ```
class ZeomFadeSlideIn extends StatefulWidget {
  const ZeomFadeSlideIn({
    required this.child,
    this.delay = Duration.zero,
    this.duration,
    super.key,
  });

  /// Subject widget to fade/slide in.
  final Widget child;

  /// Optional pre-animation delay.
  final Duration delay;

  /// Override duration. Defaults to [ZeomAnimations.slideFadeDuration].
  final Duration? duration;

  @override
  State<ZeomFadeSlideIn> createState() => _ZeomFadeSlideInState();
}

class _ZeomFadeSlideInState extends State<ZeomFadeSlideIn>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _opacity;
  late final Animation<Offset> _offset;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: widget.duration ?? ZeomAnimations.slideFadeDuration,
    );
    _opacity = ZeomAnimations.fadeOpacity(_controller);
    _offset = ZeomAnimations.fadeSlideOffset(_controller);

    // Defer animation start until after first frame so we can read
    // MediaQuery safely; otherwise snap to final state when reduce-motion
    // is requested.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      if (ZeomAnimations.isReduceMotion(context)) {
        _controller.value = 1.0;
        return;
      }
      if (widget.delay == Duration.zero) {
        _controller.forward();
      } else {
        Future<void>.delayed(widget.delay, () {
          if (mounted) _controller.forward();
        });
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _opacity,
      child: SlideTransition(position: _offset, child: widget.child),
    );
  }
}
