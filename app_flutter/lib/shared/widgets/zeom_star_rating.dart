import 'package:flutter/material.dart';

import '../theme.dart';

/// MOBILE_DESIGN.md § 4.9 Star Rating — `St` component.
///
/// Renders a row of `★` (U+2605) glyphs. Non-interactive by default; opt
/// into tap-to-rate via [interactive] + [onChanged]. Partial fills use a
/// ShaderMask gradient stop at `value / count` (floor-rounded per spec).
class ZeomStarRating extends StatelessWidget {
  /// Current rating value, 0..count. Partial fills use a gradient stop.
  final double value;

  /// Glyph font size. Inline default is 12; interactive reviews use 36.
  final double size;

  /// Total number of stars (spec pins this to 5, but kept flexible).
  final int count;

  /// When true, tapping a star calls [onChanged] with the 1-based rating.
  final bool interactive;

  /// Callback invoked with 1..count when [interactive] is true.
  final ValueChanged<int>? onChanged;

  const ZeomStarRating({
    super.key,
    required this.value,
    this.size = 12,
    this.count = 5,
    this.interactive = false,
    this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final double clamped = value.clamp(0, count.toDouble());
    final double fraction = count == 0 ? 0 : clamped / count;

    final TextStyle glyphStyle = TextStyle(
      fontSize: size,
      color: AppColors.border,
      letterSpacing: 1,
      height: 1.0,
    );

    final Widget emptyRow = Text(
      '\u2605' * count,
      style: glyphStyle,
    );

    final Widget filledRow = Text(
      '\u2605' * count,
      style: glyphStyle.copyWith(color: AppColors.gold),
    );

    // ShaderMask draws the gold row clipped to [0, fraction] horizontally.
    final Widget stack = Stack(
      children: [
        emptyRow,
        if (fraction > 0)
          ShaderMask(
            blendMode: BlendMode.dstIn,
            shaderCallback: (Rect bounds) {
              return LinearGradient(
                begin: Alignment.centerLeft,
                end: Alignment.centerRight,
                stops: [fraction, fraction],
                colors: const [Colors.black, Colors.transparent],
              ).createShader(bounds);
            },
            child: filledRow,
          ),
      ],
    );

    final Widget display = Semantics(
      label: '5점 만점에 ${clamped.toStringAsFixed(1)}점',
      value: clamped.toStringAsFixed(1),
      child: stack,
    );

    if (!interactive || onChanged == null) {
      return display;
    }

    // Build tappable glyph row for interactive mode. Each star is a flex
    // cell that emits `(i + 1)` on tap.
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(count, (i) {
        final int rating = i + 1;
        final bool filled = rating <= clamped;
        return Semantics(
          button: true,
          label: '$rating점',
          child: InkWell(
            onTap: () => onChanged!(rating),
            borderRadius: BorderRadius.circular(4),
            child: Padding(
              padding: const EdgeInsets.all(2),
              child: Text(
                '\u2605',
                style: TextStyle(
                  fontSize: size,
                  letterSpacing: 1,
                  color: filled ? AppColors.gold : AppColors.border,
                  height: 1.0,
                ),
              ),
            ),
          ),
        );
      }),
    );
  }
}
