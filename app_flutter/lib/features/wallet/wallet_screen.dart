import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../shared/providers/wallet_provider.dart';
import '../../shared/theme.dart';
import '../../shared/typography.dart';
import '../../shared/widgets/zeom_button.dart';
import '../../shared/widgets/zeom_hero_card.dart';

/// S14 지갑 — tab root rendered inside [MainScreen].
///
/// Per MOBILE_DESIGN_PLAN.md §3.14:
/// * Hero card with lotus mandala (top-right) surfacing cash balance
/// * Dual CTAs — gold 충전 → `/wallet/cash-buy`, dark outline 환불 요청 →
///   `/refund/request`
/// * Grouped transaction history seeded locally (today / yesterday /
///   YYYY-MM-DD buckets)
///
/// Renders as a plain [Column] + [SingleChildScrollView] (no local
/// [Scaffold]) because [MainScreen] already owns the scaffold.
class WalletScreen extends ConsumerWidget {
  const WalletScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final int balance = ref.watch(walletProvider);

    return SingleChildScrollView(
      padding: const EdgeInsets.only(bottom: 90),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.fromLTRB(20, 24, 20, 16),
            child: _Header(),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: _WalletHeroCard(balance: balance),
          ),
          const Padding(
            padding: EdgeInsets.fromLTRB(20, 24, 20, 0),
            child: _TransactionsSection(),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------

class _Header extends StatelessWidget {
  const _Header();

  @override
  Widget build(BuildContext context) {
    return Text(
      '지갑',
      style: ZeomType.pageTitle.copyWith(color: AppColors.ink),
    );
  }
}

// ---------------------------------------------------------------------
// Hero card (balance + CTAs)
// ---------------------------------------------------------------------

class _WalletHeroCard extends StatelessWidget {
  const _WalletHeroCard({required this.balance});

  final int balance;

  @override
  Widget build(BuildContext context) {
    final bool isEmpty = balance == 0;

    return ZeomHeroCard(
      mandalaSize: 200,
      mandalaPosition: Alignment.topRight,
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '보유 캐시',
            style: ZeomType.micro.copyWith(
              fontSize: 11,
              fontWeight: FontWeight.w500,
              letterSpacing: 1.0,
              color: AppColors.hanji.withOpacity(0.7),
            ),
          ),
          const SizedBox(height: 8),
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                _formatCash(balance),
                style: ZeomType.displayLg.copyWith(
                  color: AppColors.gold,
                  fontWeight: FontWeight.w700,
                  fontFeatures: kTabularNums,
                ),
              ),
              const SizedBox(width: 6),
              Text(
                '캐시',
                style: ZeomType.body.copyWith(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: AppColors.hanji,
                ),
              ),
            ],
          ),
          if (isEmpty) ...[
            const SizedBox(height: 6),
            Text(
              '지금 충전해보세요',
              style: ZeomType.meta.copyWith(
                color: AppColors.hanji.withOpacity(0.7),
              ),
            ),
          ],
          const SizedBox(height: 16),
          Row(
            children: [
              ZeomButton(
                label: '충전',
                variant: ZeomButtonVariant.gold,
                size: ZeomButtonSize.md,
                onPressed: () => context.push('/wallet/cash-buy'),
              ),
              const SizedBox(width: 8),
              _DarkOutlineButton(
                label: '환불 요청',
                onTap: () => context.push('/refund/request'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Dark-card secondary CTA: 10r, rgba(255,255,255,0.12) fill, hanji label.
class _DarkOutlineButton extends StatelessWidget {
  const _DarkOutlineButton({required this.label, required this.onTap});

  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        decoration: BoxDecoration(
          color: const Color.fromRGBO(255, 255, 255, 0.12),
          borderRadius: BorderRadius.circular(10),
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          style: ZeomType.bodyLg.copyWith(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: AppColors.hanji,
            height: 1.2,
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------
// Transactions section
// ---------------------------------------------------------------------

/// Local seed of transactions for this iteration. Tuple shape:
/// (groupKey, sign, amount, description, icon, isIncomeBadge)
///
/// `isIncomeBadge` governs both the icon tint (jade vs ink2) and the
/// right-side amount color (jade vs ink). A refund counts as income.
class _SeedTx {
  final String group;
  final String sign;
  final int amount;
  final String desc;
  final IconData icon;
  final bool isIncome;

  const _SeedTx(
    this.group,
    this.sign,
    this.amount,
    this.desc,
    this.icon,
    this.isIncome,
  );
}

const List<_SeedTx> _kSeedTx = <_SeedTx>[
  _SeedTx('today', '-', 60000, '지혜 상담사 · 60분 예약', Icons.remove, false),
  _SeedTx('today', '+', 60000, '캐시 충전', Icons.add, true),
  _SeedTx('yesterday', '+', 1000, '후기 감사 캐시', Icons.add, true),
  _SeedTx('2026-04-17', '-', 50000, '성주 상담사 · 60분 예약', Icons.remove, false),
  _SeedTx('2026-04-17', '+', 100000, '캐시 충전 · 2회 패키지', Icons.add, true),
  _SeedTx('2026-04-15', '-', 30000, '미사용 환불 처리', Icons.replay, true),
];

class _TransactionsSection extends StatelessWidget {
  const _TransactionsSection();

  @override
  Widget build(BuildContext context) {
    if (_kSeedTx.isEmpty) {
      return const _EmptyState();
    }

    // Preserve the seed order while grouping by the first tuple element.
    final List<String> groupOrder = <String>[];
    final Map<String, List<_SeedTx>> grouped = <String, List<_SeedTx>>{};
    for (final _SeedTx tx in _kSeedTx) {
      if (!grouped.containsKey(tx.group)) {
        groupOrder.add(tx.group);
        grouped[tx.group] = <_SeedTx>[];
      }
      grouped[tx.group]!.add(tx);
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              '거래 내역',
              style: ZeomType.section.copyWith(color: AppColors.ink),
            ),
            const Spacer(),
            TextButton(
              onPressed: null,
              style: TextButton.styleFrom(
                padding: EdgeInsets.zero,
                minimumSize: const Size(0, 0),
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                foregroundColor: AppColors.ink3,
                disabledForegroundColor: AppColors.ink3,
              ),
              child: Text(
                '전체 보기 ›',
                style: ZeomType.meta.copyWith(color: AppColors.ink3),
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        for (final String key in groupOrder) ...[
          _GroupHeader(label: _groupLabel(key)),
          Column(
            children: <Widget>[
              for (final _SeedTx tx in grouped[key]!)
                Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: _TxRow(tx: tx),
                ),
            ],
          ),
        ],
      ],
    );
  }

  static String _groupLabel(String key) {
    switch (key) {
      case 'today':
        return '오늘';
      case 'yesterday':
        return '어제';
      default:
        return key;
    }
  }
}

class _GroupHeader extends StatelessWidget {
  const _GroupHeader({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 16, bottom: 8),
      child: Text(
        label,
        style: ZeomType.micro.copyWith(
          color: AppColors.ink3,
          letterSpacing: 1.0,
        ),
      ),
    );
  }
}

class _TxRow extends StatelessWidget {
  const _TxRow({required this.tx});

  final _SeedTx tx;

  @override
  Widget build(BuildContext context) {
    final Color bubbleBg =
        tx.isIncome ? AppColors.goldBg : AppColors.hanjiDeep;
    final Color iconColor =
        tx.isIncome ? AppColors.jadeSuccess : AppColors.ink2;
    final Color amountColor =
        tx.isIncome ? AppColors.jadeSuccess : AppColors.ink;
    final String amountPrefix = tx.isIncome ? '+' : '-';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.borderSoft, width: 1),
      ),
      child: Row(
        children: [
          Container(
            width: 30,
            height: 30,
            decoration: BoxDecoration(
              color: bubbleBg,
              borderRadius: BorderRadius.circular(15),
            ),
            alignment: Alignment.center,
            child: Icon(tx.icon, size: 16, color: iconColor),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              tx.desc,
              style: ZeomType.body.copyWith(
                color: AppColors.ink,
                fontWeight: FontWeight.w500,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          const SizedBox(width: 8),
          Text(
            '$amountPrefix${_formatCash(tx.amount)}',
            style: ZeomType.tabularNums(
              base: ZeomType.cardTitle.copyWith(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: amountColor,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 60),
      child: Center(
        child: Column(
          children: [
            const Text('🪷', style: TextStyle(fontSize: 32)),
            const SizedBox(height: 12),
            Text(
              '아직 거래 내역이 없어요',
              style: ZeomType.body.copyWith(color: AppColors.ink3),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------

/// Formats a cash balance with thousands separators (no "원" suffix —
/// callers append the unit label themselves).
String _formatCash(int value) {
  final int abs = value < 0 ? -value : value;
  final String digits = abs.toString();
  final StringBuffer buf = StringBuffer();
  for (int i = 0; i < digits.length; i++) {
    final int remaining = digits.length - i;
    buf.write(digits[i]);
    if (remaining > 1 && remaining % 3 == 1) {
      buf.write(',');
    }
  }
  return value < 0 ? '-$buf' : buf.toString();
}
