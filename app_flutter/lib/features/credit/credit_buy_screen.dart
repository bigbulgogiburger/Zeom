import 'package:flutter/material.dart';

import '../wallet/cash_buy_screen.dart';

/// Thin redirect to the canonical [CashBuyScreen].
///
/// The project previously maintained two parallel purchase flows
/// (캐시 충전 vs 상담권 구매). MOBILE_DESIGN_PLAN.md §3.6 consolidates
/// them into a single 캐시 충전 surface (S06), so this screen now just
/// renders [CashBuyScreen] to guarantee a single source of truth.
///
/// The `needed` parameter is accepted for legacy router compatibility
/// (`/credits/buy` still passes it via `state.extra`) but is intentionally
/// unused — the consolidated screen lists every package unconditionally.
/// `returnTo` is forwarded so auto-return after success still lands on the
/// caller (e.g. booking confirm).
class CreditBuyScreen extends StatelessWidget {
  /// Legacy field. Accepted for router compatibility; not used.
  final int? needed;

  /// Auto-return target after success, forwarded to [CashBuyScreen].
  final String? returnTo;

  const CreditBuyScreen({super.key, this.needed, this.returnTo});

  @override
  Widget build(BuildContext context) => CashBuyScreen(returnTo: returnTo);
}
