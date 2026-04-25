import 'package:flutter/material.dart';

import '../theme.dart';
import 'zeom_lotus_mandala.dart';

/// Hero card with an ink gradient background and an optional lotus
/// mandala ornament in the corner.
///
/// Translates MOBILE_DESIGN.md §4.11 compact-mandala hero pattern:
/// * background: linear-gradient 135°, [AppColors.inkBlack] →
///   `#2A2A2A`
/// * rounded 16px (param overridable)
/// * mandala positioned absolute top/right: -40, behind the child
/// * IgnorePointer on mandala so gestures land on the child.
///
/// Stacking note: although the mandala is rendered *before* (beneath)
/// the child so the child always reads on top, we still wrap the
/// mandala in [IgnorePointer] inside [ZeomLotusMandala] — belts-and-
/// braces for Stack overflow regions where the mandala juts out from
/// beyond the clip.
class ZeomHeroCard extends StatelessWidget {
  const ZeomHeroCard({
    required this.child,
    this.showMandala = true,
    this.mandalaSize,
    this.mandalaPosition = Alignment.topRight,
    this.padding = const EdgeInsets.all(20),
    this.borderRadius = 16,
    this.glow,
    super.key,
  });

  /// Primary content of the card.
  final Widget child;

  /// Render the mandala ornament. Default true.
  final bool showMandala;

  /// Size of the mandala in logical pixels. Default 180 (compact variant).
  final double? mandalaSize;

  /// Corner anchor for the mandala. Default [Alignment.topRight].
  /// The mandala is offset by -40px outward from the anchored corner.
  final Alignment mandalaPosition;

  /// Inner padding wrapping [child]. Default 20 on all sides.
  final EdgeInsets padding;

  /// Corner radius for the card and its overflow clip. Default 16.
  final double borderRadius;

  /// Optional glow / shadow. Leave null for the flat default; pass one
  /// for featured variants (e.g. LIVE host card).
  final BoxShadow? glow;

  @override
  Widget build(BuildContext context) {
    final radius = BorderRadius.circular(borderRadius);
    final resolvedMandalaSize = mandalaSize ?? 180;

    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft, // 135° — top-left → bottom-right
          end: Alignment.bottomRight,
          colors: [
            AppColors.inkBlack,
            Color(0xFF2A2A2A),
          ],
        ),
        borderRadius: radius,
        boxShadow: glow == null ? null : [glow!],
      ),
      child: ClipRRect(
        borderRadius: radius,
        child: Stack(
          clipBehavior: Clip.hardEdge,
          children: [
            if (showMandala)
              _positionMandala(
                mandalaPosition,
                ZeomLotusMandala(
                  size: resolvedMandalaSize,
                  variant: ZeomMandalaVariant.compact,
                ),
              ),
            // Child sits ON TOP of the mandala so text/controls are
            // always legible and receive gestures.
            Padding(
              padding: padding,
              child: child,
            ),
          ],
        ),
      ),
    );
  }

  /// Resolve the Stack position for the mandala given an [Alignment]
  /// anchor. The mandala is shifted outward by 40px so only a sliver
  /// peeks into the card — see §4.11 "position: absolute; right: -30;
  /// top: -30". We use -40 to account for the slightly bigger default
  /// compact size used in hero cards.
  static Widget _positionMandala(Alignment a, Widget mandala) {
    // Resolve the alignment to top/right/bottom/left positioned offsets.
    const double inset = -40;
    double? top, right, bottom, left;
    if (a.y < 0) {
      top = inset;
    } else if (a.y > 0) {
      bottom = inset;
    }
    if (a.x > 0) {
      right = inset;
    } else if (a.x < 0) {
      left = inset;
    }
    // Centered fall-back: just anchor top-right.
    if (top == null && bottom == null && left == null && right == null) {
      top = inset;
      right = inset;
    }
    return Positioned(
      top: top,
      right: right,
      bottom: bottom,
      left: left,
      child: mandala,
    );
  }
}
