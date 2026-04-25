import 'package:flutter/material.dart';

import '../theme.dart';

/// MOBILE_DESIGN.md § 4.10 Presence Dot — `Dot` component.
///
/// Tiny circular status indicator, optionally pulsing via an 1800ms
/// ease-in-out scale/opacity cycle. Honors [MediaQuery.disableAnimations]
/// so the controller is skipped when motion is reduced.
class ZeomPresenceDot extends StatefulWidget {
  /// Dot diameter. Defaults to 7 (inline `LIVE` pairing per spec).
  final double size;

  /// Fill color. Defaults to jade success (success alias).
  final Color color;

  /// When true, animate the `mcbreathe` pulse (1.8s infinite reverse).
  final bool pulse;

  /// Optional border color (drawn 2px) — used when overlaid on an avatar
  /// to prevent visual collision against the gradient background.
  final Color? borderColor;

  const ZeomPresenceDot({
    super.key,
    this.size = 7,
    this.color = AppColors.jadeSuccess,
    this.pulse = false,
    this.borderColor,
  });

  /// LIVE variant. Callers compose the "LIVE" label separately — this
  /// factory only ships the pulsing green dot (§ 4.10 LIVE 인디케이터).
  const ZeomPresenceDot.live({
    super.key,
    this.size = 8,
    this.borderColor,
  })  : color = AppColors.jadeSuccess,
        pulse = true;

  @override
  State<ZeomPresenceDot> createState() => _ZeomPresenceDotState();
}

class _ZeomPresenceDotState extends State<ZeomPresenceDot>
    with SingleTickerProviderStateMixin {
  AnimationController? _controller;
  Animation<double>? _scale;
  Animation<double>? _opacity;

  @override
  void initState() {
    super.initState();
    // Controller creation is deferred to didChangeDependencies so we can
    // consult MediaQuery.disableAnimations.
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final bool disable = MediaQuery.of(context).disableAnimations;
    final bool shouldAnimate = widget.pulse && !disable;

    if (shouldAnimate && _controller == null) {
      _controller = AnimationController(
        vsync: this,
        duration: const Duration(milliseconds: 1800),
      );
      final curve = CurvedAnimation(
        parent: _controller!,
        curve: Curves.easeInOut,
      );
      _scale = Tween<double>(begin: 1.0, end: 1.08).animate(curve);
      _opacity = Tween<double>(begin: 0.85, end: 1.0).animate(curve);
      _controller!.repeat(reverse: true);
    } else if (!shouldAnimate && _controller != null) {
      _controller?.dispose();
      _controller = null;
      _scale = null;
      _opacity = null;
    }
  }

  @override
  void didUpdateWidget(covariant ZeomPresenceDot oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.pulse != widget.pulse) {
      // Re-evaluate controller state against current MediaQuery.
      didChangeDependencies();
    }
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final BoxDecoration decoration = BoxDecoration(
      color: widget.color,
      shape: BoxShape.circle,
      border: widget.borderColor != null
          ? Border.all(color: widget.borderColor!, width: 2)
          : null,
    );

    final Widget dot = Container(
      width: widget.size,
      height: widget.size,
      decoration: decoration,
    );

    if (_controller == null) {
      return dot;
    }

    return AnimatedBuilder(
      animation: _controller!,
      builder: (context, child) {
        return Opacity(
          opacity: _opacity!.value,
          child: Transform.scale(
            scale: _scale!.value,
            child: child,
          ),
        );
      },
      child: dot,
    );
  }
}
