import 'dart:ui' show ImageFilter;

import 'package:flutter/material.dart';

import '../theme.dart';
import '../typography.dart';

/// 천지연꽃신당 shared AppBar per MOBILE_DESIGN.md §4.6.
///
/// Height 48 with `EdgeInsets.fromLTRB(8, 4, 8, 10)` inner padding.
///
/// - [title] text is rendered centered in Noto Serif 17/600. Override
///   with [titleWidget] when you need a custom node (e.g. avatar + name).
/// - [dark] flips foreground colors to white for 대기실·상담실 variant.
///   When [transparentBg] is true in combination with [dark], the bar is
///   wrapped in a [BackdropFilter] (blur 10) for the consultation room
///   glass effect.
/// - [elevate] draws a 0.5px bottom hairline: `borderSoft` on light,
///   `rgba(255,255,255,0.08)` on dark.
/// - [onBack] overrides the default pop. When null and
///   `Navigator.canPop(context)` is true, a back chevron is rendered
///   automatically and routes through [Navigator.maybePop].
/// - [leading] overrides the default back button entirely.
/// - [actions] render as a 40×40-aligned row with 4px gap on the right.
class ZeomAppBar extends StatelessWidget implements PreferredSizeWidget {
  const ZeomAppBar({
    super.key,
    this.title,
    this.titleWidget,
    this.dark = false,
    this.elevate = false,
    this.onBack,
    this.actions,
    this.leading,
    this.transparentBg = false,
  });

  /// Title text. Ignored when [titleWidget] is non-null.
  final String? title;

  /// Fully-custom title node. Overrides [title] when provided.
  final Widget? titleWidget;

  /// When true, foreground is white and border tone is muted for dark
  /// rooms (waiting room, consultation room).
  final bool dark;

  /// Draws a 0.5px bottom hairline divider.
  final bool elevate;

  /// Optional back-button override. When null and a previous route
  /// exists, the default chevron pops the current route.
  final VoidCallback? onBack;

  /// 40×40 icon buttons rendered right-aligned with 4px gap.
  final List<Widget>? actions;

  /// Replaces the auto-rendered back chevron entirely.
  final Widget? leading;

  /// When combined with [dark], wraps the bar in a [BackdropFilter]
  /// (blur 10) so the underlying content is frosted — used by the
  /// consultation room overlay.
  final bool transparentBg;

  static const double _barHeight = 48;

  @override
  Size get preferredSize => const Size.fromHeight(_barHeight);

  Color get _foreground => dark ? Colors.white : AppColors.ink;

  Color get _borderColor => dark
      ? const Color.fromRGBO(255, 255, 255, 0.08)
      : AppColors.borderSoft;

  Widget _buildLeading(BuildContext context) {
    if (leading != null) return leading!;
    final canPop = Navigator.of(context).canPop();
    final handler = onBack ?? (canPop ? () => Navigator.of(context).maybePop() : null);
    if (handler == null) {
      return const SizedBox(width: 40, height: 40);
    }
    return InkWell(
      onTap: handler,
      customBorder: const CircleBorder(),
      child: SizedBox(
        width: 40,
        height: 40,
        child: Center(
          child: Text(
            '\u2039', // ‹
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w500,
              color: _foreground,
              height: 1.0,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTitle() {
    if (titleWidget != null) {
      return DefaultTextStyle.merge(
        style: ZeomType.section.copyWith(
          fontSize: 17,
          fontWeight: FontWeight.w600,
          color: _foreground,
        ),
        child: titleWidget!,
      );
    }
    if (title == null || title!.isEmpty) return const SizedBox.shrink();
    return Text(
      title!,
      maxLines: 1,
      overflow: TextOverflow.ellipsis,
      textAlign: TextAlign.center,
      style: ZeomType.section.copyWith(
        fontSize: 17,
        fontWeight: FontWeight.w600,
        color: _foreground,
      ),
    );
  }

  Widget _buildActions() {
    final items = actions;
    if (items == null || items.isEmpty) {
      return const SizedBox(width: 40, height: 40);
    }
    final row = <Widget>[];
    for (var i = 0; i < items.length; i++) {
      if (i > 0) row.add(const SizedBox(width: 4));
      row.add(SizedBox(width: 40, height: 40, child: items[i]));
    }
    return Row(mainAxisSize: MainAxisSize.min, children: row);
  }

  @override
  Widget build(BuildContext context) {
    final content = SizedBox(
      height: _barHeight,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(8, 4, 8, 10),
        child: Row(
          children: [
            _buildLeading(context),
            Expanded(
              child: Center(child: _buildTitle()),
            ),
            _buildActions(),
          ],
        ),
      ),
    );

    final decorated = DecoratedBox(
      decoration: BoxDecoration(
        color: Colors.transparent,
        border: elevate
            ? Border(
                bottom: BorderSide(color: _borderColor, width: 0.5),
              )
            : null,
      ),
      child: content,
    );

    if (dark && transparentBg) {
      return ClipRect(
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: decorated,
        ),
      );
    }
    return decorated;
  }
}
