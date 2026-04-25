import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../theme.dart';

/// Visual variants of [ZeomLotusMandala].
///
/// Mirrors MOBILE_DESIGN.md §4.11 (Lotus Mandala) — two registered
/// placements used across the app: a full watermark on the login screen
/// and a compact ornament tucked into hero cards.
enum ZeomMandalaVariant {
  /// Full mandala — 4 concentric circles + 8 rotated petals (45°).
  /// viewBox 300×300. Used as a background watermark on the login screen.
  full,

  /// Compact mandala — 3 concentric circles. viewBox 140×140. Tucked
  /// into the top-right of hero cards as a gold-thread accent.
  compact,
}

/// Gold-thread mandala decoration rendered via [CustomPainter].
///
/// Why [CustomPainter] rather than [Svg]?
/// * Crisp scaling at any DPI / size without rasterizing.
/// * Direct control over stroke alpha which lets us compose the global
///   [opacity] on the final [Opacity] wrapper — so the parts retain
///   their relative 0.5 vs 0.8 alpha ratio from MOBILE_DESIGN.md.
/// * Zero asset bundling overhead.
///
/// The mandala is purely decorative: [IgnorePointer] wraps the output
/// so it never intercepts gestures directed at siblings in a [Stack].
class ZeomLotusMandala extends StatelessWidget {
  const ZeomLotusMandala({
    required this.size,
    this.variant = ZeomMandalaVariant.full,
    this.strokeColor = AppColors.gold,
    double? opacity,
    super.key,
  }) : opacity = opacity ??
            (variant == ZeomMandalaVariant.full ? 0.08 : 0.15);

  /// Rendered square size in logical pixels. The painter scales the
  /// canonical viewBox (300 for full, 140 for compact) to match.
  final double size;

  /// Visual variant — see [ZeomMandalaVariant].
  final ZeomMandalaVariant variant;

  /// Stroke colour applied to every ring (and to petals in full mode,
  /// where [AppColors.gold] is enforced regardless per the spec). Default
  /// [AppColors.gold].
  final Color strokeColor;

  /// Final opacity multiplier applied to the whole decoration.
  /// Defaults: full 0.08 (background watermark), compact 0.15.
  final double opacity;

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: Opacity(
        opacity: opacity.clamp(0.0, 1.0),
        child: SizedBox(
          width: size,
          height: size,
          child: CustomPaint(
            painter: _LotusMandalaPainter(
              variant: variant,
              strokeColor: strokeColor,
            ),
            size: Size.square(size),
          ),
        ),
      ),
    );
  }
}

class _LotusMandalaPainter extends CustomPainter {
  _LotusMandalaPainter({
    required this.variant,
    required this.strokeColor,
  });

  final ZeomMandalaVariant variant;
  final Color strokeColor;

  @override
  void paint(Canvas canvas, Size size) {
    switch (variant) {
      case ZeomMandalaVariant.full:
        _paintFull(canvas, size);
        break;
      case ZeomMandalaVariant.compact:
        _paintCompact(canvas, size);
        break;
    }
  }

  /// viewBox 300×300 — 4 rings + 8 petal ellipses rotated around center.
  void _paintFull(Canvas canvas, Size size) {
    final scale = size.width / 300.0;
    canvas.save();
    canvas.scale(scale);

    // Rings: strokeColor @ 0.5 alpha, strokeWidth 0.5.
    final ringPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 0.5
      ..color = strokeColor.withOpacity(0.5);

    const Offset center = Offset(150, 150);
    for (final r in const <double>[120, 90, 60, 30]) {
      canvas.drawCircle(center, r, ringPaint);
    }

    // 8 petals — ellipse (cx=150, cy=80, rx=22, ry=50) rotated at
    // 0/45/90/135/180/225/270/315 around (150, 150). Stroke always
    // AppColors.gold @ 0.8 alpha per spec, strokeWidth 0.8.
    final petalPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 0.8
      ..color = AppColors.gold.withOpacity(0.8);

    // Ellipse in its own local space: cx=150, cy=80 means the ellipse
    // sits 70px above the mandala center. Because ry=50, its geometric
    // center (150, 80) is the rotation-target; we translate the canvas
    // to the mandala center, rotate, then draw the ellipse offset
    // relative to that rotated origin.
    for (int i = 0; i < 8; i++) {
      final angle = i * (math.pi / 4); // 45° increments
      canvas.save();
      canvas.translate(center.dx, center.dy);
      canvas.rotate(angle);
      // After translate+rotate, (0,0) is the mandala center. The petal
      // ellipse should sit with its center at offset (0, -70) (since
      // original cy=80 and center.dy=150 → delta -70), dimensions 44×100.
      final petalRect = Rect.fromCenter(
        center: const Offset(0, -70),
        width: 44, // rx*2
        height: 100, // ry*2
      );
      canvas.drawOval(petalRect, petalPaint);
      canvas.restore();
    }

    canvas.restore();
  }

  /// viewBox 140×140 — 3 concentric rings only.
  void _paintCompact(Canvas canvas, Size size) {
    final scale = size.width / 140.0;
    canvas.save();
    canvas.scale(scale);

    final ringPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 0.5
      ..color = strokeColor.withOpacity(0.5);

    const Offset center = Offset(70, 70);
    for (final r in const <double>[60, 45, 30]) {
      canvas.drawCircle(center, r, ringPaint);
    }

    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant _LotusMandalaPainter oldDelegate) {
    return oldDelegate.variant != variant ||
        oldDelegate.strokeColor != strokeColor;
  }
}
