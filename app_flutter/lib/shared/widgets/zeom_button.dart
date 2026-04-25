import 'package:flutter/material.dart';

import '../theme.dart';
import '../typography.dart';

/// MOBILE_DESIGN.md § 4.1 Buttons — `Btn` component.
///
/// Primitive CTA with 5 variants × 2 sizes. Press feedback scales to 0.98
/// for 120ms; disabled state preserves background at 0.4 opacity (spec
/// explicitly avoids dead-gray treatment).
enum ZeomButtonVariant { primary, gold, danger, outline, ghost }

/// Size preset per § 4.1 (sm: 10/16 padding, 13 font; md: 14/20, 15 font).
enum ZeomButtonSize { sm, md }

/// MOBILE_DESIGN.md § 4.1 Buttons — `Btn` component (variant + size driven).
class ZeomButton extends StatefulWidget {
  /// Button label (Pretendard 600).
  final String label;

  /// Tap handler. Null disables the button (opacity 0.4, no tap).
  final VoidCallback? onPressed;

  /// Visual variant. Defaults to `primary` (ink bg / hanji fg).
  final ZeomButtonVariant variant;

  /// Size preset. Defaults to `md`.
  final ZeomButtonSize size;

  /// Corner radius override. Defaults to 10 (CTA). Use 12 for sticky
  /// footer, 8 for small inline actions.
  final double? borderRadius;

  /// Optional leading widget (typically a 16x16 icon).
  final Widget? leading;

  /// When true, replaces label with a 12px spinner in fg color and
  /// disables taps.
  final bool loading;

  /// Optional explicit width. Null = hug content.
  final double? width;

  const ZeomButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.variant = ZeomButtonVariant.primary,
    this.size = ZeomButtonSize.md,
    this.borderRadius,
    this.leading,
    this.loading = false,
    this.width,
  });

  @override
  State<ZeomButton> createState() => _ZeomButtonState();
}

class _ZeomButtonState extends State<ZeomButton> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final _ButtonPalette palette = _paletteFor(widget.variant);
    final _ButtonMetrics metrics = _metricsFor(widget.size);
    final double radius = widget.borderRadius ?? 10;

    final bool isEnabled = widget.onPressed != null && !widget.loading;
    final double opacity =
        (widget.onPressed == null && !widget.loading) ? 0.4 : 1.0;

    final TextStyle labelStyle = ZeomType.bodyLg.copyWith(
      fontSize: metrics.fontSize,
      fontWeight: FontWeight.w600,
      color: palette.fg,
      height: 1.2,
    );

    final Widget content = widget.loading
        ? SizedBox(
            width: 12,
            height: 12,
            child: CircularProgressIndicator(
              strokeWidth: 1.5,
              valueColor: AlwaysStoppedAnimation<Color>(palette.fg),
            ),
          )
        : Row(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (widget.leading != null) ...[
                IconTheme.merge(
                  data: IconThemeData(color: palette.fg, size: 16),
                  child: widget.leading!,
                ),
                const SizedBox(width: 6),
              ],
              Flexible(
                child: Text(
                  widget.label,
                  style: labelStyle,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          );

    final Widget container = AnimatedScale(
      scale: _pressed ? 0.98 : 1.0,
      duration: const Duration(milliseconds: 120),
      curve: Curves.easeOut,
      child: Opacity(
        opacity: opacity,
        child: Container(
          width: widget.width,
          padding: EdgeInsets.symmetric(
            horizontal: metrics.horizontalPadding,
            vertical: metrics.verticalPadding,
          ),
          decoration: BoxDecoration(
            color: palette.bg,
            borderRadius: BorderRadius.circular(radius),
            border: palette.border,
          ),
          alignment: Alignment.center,
          child: content,
        ),
      ),
    );

    return Semantics(
      button: true,
      enabled: isEnabled,
      label: widget.label,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTapDown: isEnabled ? (_) => setState(() => _pressed = true) : null,
        onTapUp: isEnabled ? (_) => setState(() => _pressed = false) : null,
        onTapCancel:
            isEnabled ? () => setState(() => _pressed = false) : null,
        onTap: isEnabled ? widget.onPressed : null,
        child: container,
      ),
    );
  }

  _ButtonPalette _paletteFor(ZeomButtonVariant v) {
    switch (v) {
      case ZeomButtonVariant.primary:
        return const _ButtonPalette(
          bg: AppColors.ink,
          fg: AppColors.hanji,
          border: null,
        );
      case ZeomButtonVariant.gold:
        return const _ButtonPalette(
          bg: AppColors.gold,
          fg: AppColors.ink,
          border: null,
        );
      case ZeomButtonVariant.danger:
        return const _ButtonPalette(
          bg: AppColors.darkRed,
          fg: AppColors.hanji,
          border: null,
        );
      case ZeomButtonVariant.outline:
        return _ButtonPalette(
          bg: Colors.transparent,
          fg: AppColors.ink,
          border: Border.all(color: AppColors.ink, width: 1.5),
        );
      case ZeomButtonVariant.ghost:
        return const _ButtonPalette(
          bg: Colors.transparent,
          fg: AppColors.ink,
          border: null,
        );
    }
  }

  _ButtonMetrics _metricsFor(ZeomButtonSize s) {
    switch (s) {
      case ZeomButtonSize.sm:
        return const _ButtonMetrics(
          verticalPadding: 10,
          horizontalPadding: 16,
          fontSize: 13,
        );
      case ZeomButtonSize.md:
        return const _ButtonMetrics(
          verticalPadding: 14,
          horizontalPadding: 20,
          fontSize: 15,
        );
    }
  }
}

class _ButtonPalette {
  final Color bg;
  final Color fg;
  final BoxBorder? border;
  const _ButtonPalette({
    required this.bg,
    required this.fg,
    required this.border,
  });
}

class _ButtonMetrics {
  final double verticalPadding;
  final double horizontalPadding;
  final double fontSize;
  const _ButtonMetrics({
    required this.verticalPadding,
    required this.horizontalPadding,
    required this.fontSize,
  });
}
