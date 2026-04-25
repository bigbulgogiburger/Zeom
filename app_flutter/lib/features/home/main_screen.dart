import 'package:flutter/material.dart';

import 'package:cheonjiyeon_app/shared/theme.dart';
import 'package:cheonjiyeon_app/shared/widgets/zeom_status_bar.dart';
import 'package:cheonjiyeon_app/shared/widgets/zeom_tab_bar.dart';

import '../booking/booking_list_screen.dart';
import '../counselor/counselor_list_screen.dart';
import '../more/more_screen.dart';
import '../wallet/wallet_screen.dart';
import 'home_screen.dart';

/// Root shell hosting the 5 primary tabs per MOBILE_DESIGN.md §4.5 and
/// MOBILE_DESIGN_PLAN.md §2.4.
///
/// Tabs render inside an [IndexedStack] so their internal scroll positions
/// and state are preserved when switching (see MOBILE_DESIGN_PLAN §5.6).
class MainScreen extends StatefulWidget {
  /// Preserved for router compatibility — maps to a position within
  /// [_MainScreenState._tabOrder].
  final int initialIndex;

  const MainScreen({
    super.key,
    this.initialIndex = 0,
  });

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  static const List<ZeomTabId> _tabOrder = <ZeomTabId>[
    ZeomTabId.home,
    ZeomTabId.counselors,
    ZeomTabId.bookings,
    ZeomTabId.wallet,
    ZeomTabId.more,
  ];

  late ZeomTabId _currentTab;

  @override
  void initState() {
    super.initState();
    final clamped =
        widget.initialIndex.clamp(0, _tabOrder.length - 1).toInt();
    _currentTab = _tabOrder[clamped];
  }

  Widget _pageFor(ZeomTabId tab) {
    switch (tab) {
      case ZeomTabId.home:
        return const HomeScreen();
      case ZeomTabId.counselors:
        return const CounselorListScreen();
      case ZeomTabId.bookings:
        return const BookingListScreen();
      case ZeomTabId.wallet:
        return const WalletScreen();
      case ZeomTabId.more:
        return const MoreScreen();
    }
  }

  @override
  Widget build(BuildContext context) {
    return ZeomStatusBar.wrap(
      dark: false,
      child: Scaffold(
        backgroundColor: AppColors.hanji,
        body: SafeArea(
          bottom: false,
          child: IndexedStack(
            index: _tabOrder.indexOf(_currentTab),
            children: _tabOrder.map(_pageFor).toList(growable: false),
          ),
        ),
        bottomNavigationBar: ZeomBottomTabBar(
          activeTab: _currentTab,
          onTabChange: (next) => setState(() => _currentTab = next),
        ),
      ),
    );
  }
}
