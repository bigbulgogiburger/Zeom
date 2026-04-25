import 'package:flutter/material.dart';

import '../theme.dart';
import '../typography.dart';

/// MOBILE_DESIGN.md § 4.4 Chips — `Chip` component.
///
/// Two variants: `category` (horizontal scroll filter) and `tag` (in-card
/// badge, e.g. "종합운·연애"). Fully rounded (999px radius).
enum ZeomChipVariant { category, tag }

/// MOBILE_DESIGN.md § 4.4 Chips — `Chip` (category + tag variants).
class ZeomChip extends StatelessWidget {
  /// Chip label text.
  final String label;

  /// Whether the category chip is in the active state (ignored for `tag`).
  final bool active;

  /// Optional tap handler. Tag chips are typically non-interactive.
  final VoidCallback? onTap;

  /// Visual variant. Defaults to `category`.
  final ZeomChipVariant variant;

  const ZeomChip({
    super.key,
    required this.label,
    this.active = false,
    this.onTap,
    this.variant = ZeomChipVariant.category,
  });

  @override
  Widget build(BuildContext context) {
    switch (variant) {
      case ZeomChipVariant.category:
        return _buildCategory();
      case ZeomChipVariant.tag:
        return _buildTag();
    }
  }

  Widget _buildCategory() {
    final Color bg = active ? AppColors.ink : Colors.white;
    final Color fg = active ? AppColors.hanji : AppColors.ink2;
    final Color borderColor = active ? AppColors.ink : AppColors.border;
    final FontWeight weight = active ? FontWeight.w600 : FontWeight.w500;

    final Widget body = Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: borderColor, width: 1),
      ),
      child: Text(
        label,
        style: ZeomType.bodySm.copyWith(
          fontSize: 12.5,
          fontWeight: weight,
          color: fg,
          height: 1.2,
        ),
        softWrap: false,
        overflow: TextOverflow.clip,
      ),
    );

    if (onTap == null) {
      return Semantics(label: label, selected: active, child: body);
    }

    return Semantics(
      button: true,
      selected: active,
      label: label,
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(999),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(999),
          child: body,
        ),
      ),
    );
  }

  Widget _buildTag() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: AppColors.hanjiDeep,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: ZeomType.micro.copyWith(
          fontSize: 10,
          fontWeight: FontWeight.w500,
          color: AppColors.ink2,
          letterSpacing: 0,
          height: 1.3,
        ),
        softWrap: false,
        overflow: TextOverflow.clip,
      ),
    );
  }
}
