import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show HapticFeedback;

import '../theme.dart';
import '../typography.dart';

/// Five fixed-order tabs per MOBILE_DESIGN.md §4.5 and MOBILE_DESIGN_PLAN.md §2.4.
///
/// The order is intentionally non-customizable (MOBILE_DESIGN.md §7 Do #9).
enum ZeomTabId { home, counselors, bookings, wallet, more }

/// Bottom tab bar for 천지연꽃신당 mobile shell.
///
/// Height 80 + `MediaQuery.padding.bottom` for the home indicator.
/// Rendered only on tab-root scrollers (MOBILE_DESIGN.md §5.6) — detail
/// routes are expected to push onto a fresh [Scaffold] without this bar.
class ZeomBottomTabBar extends StatelessWidget {
  const ZeomBottomTabBar({
    super.key,
    required this.activeTab,
    required this.onTabChange,
  });

  final ZeomTabId activeTab;
  final ValueChanged<ZeomTabId> onTabChange;

  static const double _height = 80;
  static const double _basePaddingBottom = 20;

  static const List<_TabSpec> _specs = <_TabSpec>[
    _TabSpec(
      id: ZeomTabId.home,
      label: '홈',
      icon: Icons.home_outlined,
      activeIcon: Icons.home,
    ),
    _TabSpec(
      id: ZeomTabId.counselors,
      label: '상담사',
      icon: Icons.people_alt_outlined,
      activeIcon: Icons.people_alt,
    ),
    _TabSpec(
      id: ZeomTabId.bookings,
      label: '예약',
      icon: Icons.calendar_today_outlined,
      activeIcon: Icons.calendar_today,
    ),
    _TabSpec(
      id: ZeomTabId.wallet,
      label: '지갑',
      icon: Icons.account_balance_wallet_outlined,
      activeIcon: Icons.account_balance_wallet,
    ),
    _TabSpec(
      id: ZeomTabId.more,
      label: '더보기',
      icon: Icons.more_horiz,
      activeIcon: Icons.more_horiz,
    ),
  ];

  void _handleTap(ZeomTabId id) {
    if (id != activeTab) {
      HapticFeedback.lightImpact();
    }
    onTabChange(id);
  }

  @override
  Widget build(BuildContext context) {
    final safeBottom = MediaQuery.of(context).padding.bottom;
    return Container(
      height: _height + safeBottom,
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(
          top: BorderSide(color: AppColors.border, width: 0.5),
        ),
      ),
      padding: EdgeInsets.only(bottom: _basePaddingBottom + safeBottom),
      child: Row(
        children: [
          for (final spec in _specs)
            Expanded(
              child: _ZeomTabButton(
                spec: spec,
                active: spec.id == activeTab,
                onTap: () => _handleTap(spec.id),
              ),
            ),
        ],
      ),
    );
  }
}

class _TabSpec {
  const _TabSpec({
    required this.id,
    required this.label,
    required this.icon,
    required this.activeIcon,
  });

  final ZeomTabId id;
  final String label;
  final IconData icon;
  final IconData activeIcon;
}

class _ZeomTabButton extends StatelessWidget {
  const _ZeomTabButton({
    required this.spec,
    required this.active,
    required this.onTap,
  });

  final _TabSpec spec;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = active ? AppColors.ink : AppColors.ink3;
    final weight = active ? FontWeight.w700 : FontWeight.w500;
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              active ? spec.activeIcon : spec.icon,
              size: 22,
              color: color,
            ),
            const SizedBox(height: 4),
            Text(
              spec.label,
              style: ZeomType.tag.copyWith(
                fontSize: 10.5,
                fontWeight: weight,
                color: color,
                height: 1.2,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
