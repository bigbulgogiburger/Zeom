import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../theme.dart';
import 'zeom_presence_dot.dart';

/// MOBILE_DESIGN.md § 4.8 Avatar — `Av` component.
///
/// Circular avatar rendering initials over a 135° gradient. Sizes per spec:
/// 28 / 40 / 48 / 52 / 58 / 84. Supports an online presence dot (22% of
/// avatar size) at bottom-right with a 2px hanji border.
class ZeomAvatar extends StatelessWidget {
  /// Two-letter initials (e.g. "JS"). Centered over the gradient.
  final String initials;

  /// Avatar diameter in logical pixels. Font auto-scales as `size * 0.42`.
  final double size;

  /// Whether the online presence dot is shown at bottom-right.
  final bool online;

  /// Wires the presence dot to [ZeomPresenceDot.pulse] when true.
  final bool pulseOnline;

  /// Override for the gradient start color (top-left). Defaults to ink.
  final Color? backgroundGradientStart;

  /// Override for the gradient end color (bottom-right). Defaults to `#2a2a2a`.
  final Color? backgroundGradientEnd;

  /// Override for the initials color. Defaults to gold.
  final Color? textColor;

  /// Optional tap handler. Wraps the avatar in an `InkWell` when provided.
  final VoidCallback? onTap;

  const ZeomAvatar({
    super.key,
    required this.initials,
    this.size = 48,
    this.online = false,
    this.pulseOnline = false,
    this.backgroundGradientStart,
    this.backgroundGradientEnd,
    this.textColor,
    this.onTap,
  });

  /// Profile-variant constructor (§ 4.8 프로필 사진 대체). Uses a lotus → darkRed
  /// gradient with hanji-colored initials. Used on the user profile card.
  const ZeomAvatar.profile({
    super.key,
    required this.initials,
    this.size = 48,
    this.online = false,
    this.pulseOnline = false,
    this.onTap,
  })  : backgroundGradientStart = AppColors.lotusPink,
        backgroundGradientEnd = AppColors.darkRed,
        textColor = AppColors.hanji;

  @override
  Widget build(BuildContext context) {
    final Color startColor = backgroundGradientStart ?? AppColors.ink;
    final Color endColor =
        backgroundGradientEnd ?? const Color(0xFF2A2A2A);
    final Color fg = textColor ?? AppColors.gold;
    final double fontSize = size * 0.42;

    // Online dot: size * 0.22, floor-capped at 9 (minimum readable size).
    final double dotSize = (size * 0.22).clamp(7.0, 9.0);

    final Widget circle = Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [startColor, endColor],
        ),
      ),
      alignment: Alignment.center,
      child: Text(
        initials,
        style: GoogleFonts.notoSerif(
          fontSize: fontSize,
          fontWeight: FontWeight.w700,
          color: fg,
          height: 1.0,
        ),
      ),
    );

    final Widget tapWrapped = onTap == null
        ? circle
        : Material(
            color: Colors.transparent,
            shape: const CircleBorder(),
            clipBehavior: Clip.antiAlias,
            child: InkWell(
              onTap: onTap,
              customBorder: const CircleBorder(),
              child: circle,
            ),
          );

    return Semantics(
      label: '$initials, ${online ? "온라인" : "오프라인"}',
      button: onTap != null,
      child: SizedBox(
        width: size,
        height: size,
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            tapWrapped,
            if (online)
              Positioned(
                right: 0,
                bottom: 0,
                child: ZeomPresenceDot(
                  size: dotSize,
                  pulse: pulseOnline,
                  borderColor: AppColors.hanji,
                ),
              ),
          ],
        ),
      ),
    );
  }
}
