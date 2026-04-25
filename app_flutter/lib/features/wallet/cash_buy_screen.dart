import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../shared/animations/zeom_animations.dart';
import '../../shared/providers/wallet_provider.dart';
import '../../shared/theme.dart';
import '../../shared/typography.dart';
import '../../shared/widgets/zeom_app_bar.dart';
import '../../shared/widgets/zeom_button.dart';

/// S06 캐시 충전 — canonical MOBILE_DESIGN_PLAN.md §3.6 screen.
///
/// State machine: [_PayState.idle] → [_PayState.paying] → [_PayState.success].
///
/// On success, credits the local [walletProvider] and returns to the
/// previous route after 1.2s. The credit/상담권 screen is a thin wrapper
/// that renders this same widget so both `/wallet/cash-buy` and
/// `/credits/buy` render the canonical UI (single source of truth).
enum _PayState { idle, paying, success }

/// Cash package catalogue (MOBILE_DESIGN_PLAN.md §3.6).
class _Package {
  final String id;
  final String label;
  final int cash;
  final int bonus;
  final int price;
  final bool popular;

  const _Package({
    required this.id,
    required this.label,
    required this.cash,
    required this.bonus,
    required this.price,
    required this.popular,
  });
}

const List<_Package> _packages = [
  _Package(id: 'p1', label: '60분 1회', cash: 60000, bonus: 0, price: 60000, popular: false),
  _Package(id: 'p2', label: '60분 2회', cash: 120000, bonus: 10000, price: 110000, popular: false),
  _Package(id: 'p3', label: '60분 3회', cash: 180000, bonus: 20000, price: 160000, popular: true),
  _Package(id: 'p4', label: '60분 5회', cash: 300000, bonus: 40000, price: 260000, popular: false),
];

/// Payment method rows (MOBILE_DESIGN_PLAN.md §3.6).
class _PayMethod {
  final String id;
  final String name;
  final String subtitle;
  final IconData icon;

  const _PayMethod({
    required this.id,
    required this.name,
    required this.subtitle,
    required this.icon,
  });
}

const List<_PayMethod> _payMethods = [
  _PayMethod(id: 'card', name: '신용·체크카드', subtitle: 'KG이니시스', icon: Icons.credit_card),
  _PayMethod(
    id: 'kakaopay',
    name: '카카오페이',
    subtitle: '간편결제',
    icon: Icons.account_balance_wallet_outlined,
  ),
  _PayMethod(id: 'toss', name: '토스페이', subtitle: '간편결제', icon: Icons.payments_outlined),
  _PayMethod(
    id: 'bank',
    name: '계좌이체',
    subtitle: '실시간 이체',
    icon: Icons.account_balance_outlined,
  ),
];

String _formatWon(int n) => n.toString().replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (m) => '${m[1]},',
    );

class CashBuyScreen extends ConsumerStatefulWidget {
  /// Optional explicit return target. Preserved for router compatibility;
  /// the idle-state back button and success-state auto-return both use
  /// [GoRouter.pop] / [GoRouter.go] depending on whether this is set.
  final String? returnTo;

  const CashBuyScreen({super.key, this.returnTo});

  @override
  ConsumerState<CashBuyScreen> createState() => _CashBuyScreenState();
}

class _CashBuyScreenState extends ConsumerState<CashBuyScreen> {
  _PayState _state = _PayState.idle;
  _Package? _selectedPackage;
  _PayMethod? _selectedMethod;
  Timer? _returnTimer;

  @override
  void dispose() {
    _returnTimer?.cancel();
    super.dispose();
  }

  bool get _canPay =>
      _state == _PayState.idle &&
      _selectedPackage != null &&
      _selectedMethod != null;

  Future<void> _pay() async {
    setState(() => _state = _PayState.paying);
    await Future<void>.delayed(const Duration(milliseconds: 1100));
    if (!mounted) return;
    ref.read(walletProvider.notifier).credit(_selectedPackage!.cash);
    setState(() => _state = _PayState.success);
    _returnTimer = Timer(const Duration(milliseconds: 1200), () {
      if (!mounted) return;
      if (widget.returnTo != null) {
        context.go(widget.returnTo!);
      } else if (Navigator.of(context).canPop()) {
        context.pop();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_state == _PayState.success) {
      return _SuccessView(
        cashAdded: _selectedPackage!.cash,
        newBalance: ref.watch(walletProvider),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.hanji,
      appBar: const ZeomAppBar(title: '캐시 충전'),
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      '패키지가 클수록 보너스가 많아요',
                      style: ZeomType.meta.copyWith(color: AppColors.ink3),
                    ),
                    const SizedBox(height: 16),
                    _PackageGrid(
                      selected: _selectedPackage,
                      onSelect: (pkg) => setState(() => _selectedPackage = pkg),
                    ),
                    const SizedBox(height: 24),
                    Text('결제 수단', style: ZeomType.section),
                    const SizedBox(height: 12),
                    _PaymentMethodList(
                      selected: _selectedMethod,
                      onSelect: (m) => setState(() => _selectedMethod = m),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
      bottomSheet: _StickyPayBar(
        state: _state,
        selectedPackage: _selectedPackage,
        selectedMethod: _selectedMethod,
        canPay: _canPay,
        onPay: _pay,
      ),
    );
  }
}

// =================================================================
// PackageGrid
// =================================================================

class _PackageGrid extends StatelessWidget {
  final _Package? selected;
  final ValueChanged<_Package> onSelect;

  const _PackageGrid({required this.selected, required this.onSelect});

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      childAspectRatio: 1.15,
      crossAxisSpacing: 10,
      mainAxisSpacing: 10,
      children: [
        for (final pkg in _packages)
          _PackageCard(
            pkg: pkg,
            active: selected?.id == pkg.id,
            onTap: () => onSelect(pkg),
          ),
      ],
    );
  }
}

class _PackageCard extends StatelessWidget {
  final _Package pkg;
  final bool active;
  final VoidCallback onTap;

  const _PackageCard({
    required this.pkg,
    required this.active,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final Color bg = active ? AppColors.ink : Colors.white;
    final Color fg = active ? AppColors.hanji : AppColors.ink;
    final Color fgMuted = active
        ? AppColors.hanji.withOpacity(0.75)
        : AppColors.ink3;
    final Color bonusColor = active ? AppColors.goldSoft : AppColors.jadeSuccess;

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        curve: Curves.easeOut,
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: active ? AppColors.ink : AppColors.borderSoft,
            width: active ? 1.5 : 1,
          ),
        ),
        child: Stack(
          children: [
            Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Text(
                    pkg.label,
                    style: ZeomType.meta.copyWith(color: fg),
                  ),
                  const SizedBox(height: 6),
                  Text.rich(
                    TextSpan(
                      children: [
                        TextSpan(
                          text: _formatWon(pkg.cash),
                          style: ZeomType.tabularNums(
                            base: ZeomType.subTitle.copyWith(
                              fontSize: 24,
                              color: AppColors.gold,
                            ),
                          ),
                        ),
                        TextSpan(
                          text: ' 캐시',
                          style: ZeomType.meta.copyWith(color: fgMuted),
                        ),
                      ],
                    ),
                    textAlign: TextAlign.center,
                  ),
                  if (pkg.bonus > 0) ...[
                    const SizedBox(height: 4),
                    Text(
                      '+ ${_formatWon(pkg.bonus)}원',
                      style: ZeomType.tabularNums(
                        base: ZeomType.tag.copyWith(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: bonusColor,
                        ),
                      ),
                    ),
                  ],
                  const SizedBox(height: 6),
                  Text(
                    '₩${_formatWon(pkg.price)}',
                    style: ZeomType.tabularNums(
                      base: ZeomType.cardTitle.copyWith(color: fg),
                    ),
                  ),
                ],
              ),
            ),
            if (pkg.popular)
              Positioned(
                top: 0,
                right: 0,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppColors.gold,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    '인기',
                    style: ZeomType.tag.copyWith(
                      color: AppColors.ink,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

// =================================================================
// PaymentMethodList
// =================================================================

class _PaymentMethodList extends StatelessWidget {
  final _PayMethod? selected;
  final ValueChanged<_PayMethod> onSelect;

  const _PaymentMethodList({required this.selected, required this.onSelect});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        for (final m in _payMethods)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: _PaymentMethodTile(
              method: m,
              selected: selected?.id == m.id,
              onTap: () => onSelect(m),
            ),
          ),
      ],
    );
  }
}

class _PaymentMethodTile extends StatelessWidget {
  final _PayMethod method;
  final bool selected;
  final VoidCallback onTap;

  const _PaymentMethodTile({
    required this.method,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        curve: Curves.easeOut,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: selected ? AppColors.ink : AppColors.borderSoft,
            width: selected ? 1.5 : 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: const BoxDecoration(
                color: AppColors.hanjiDeep,
                shape: BoxShape.circle,
              ),
              child: Icon(method.icon, size: 20, color: AppColors.ink),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(method.name, style: ZeomType.cardTitle),
                  const SizedBox(height: 2),
                  Text(
                    method.subtitle,
                    style: ZeomType.meta.copyWith(color: AppColors.ink3),
                  ),
                ],
              ),
            ),
            Radio<String>(
              value: method.id,
              groupValue: selected ? method.id : null,
              onChanged: (_) => onTap(),
              activeColor: AppColors.ink,
              visualDensity: VisualDensity.compact,
              materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
          ],
        ),
      ),
    );
  }
}

// =================================================================
// Sticky pay bar
// =================================================================

class _StickyPayBar extends StatelessWidget {
  final _PayState state;
  final _Package? selectedPackage;
  final _PayMethod? selectedMethod;
  final bool canPay;
  final VoidCallback onPay;

  const _StickyPayBar({
    required this.state,
    required this.selectedPackage,
    required this.selectedMethod,
    required this.canPay,
    required this.onPay,
  });

  String _buildLabel() {
    if (selectedPackage == null) return '패키지를 선택해주세요';
    if (selectedMethod == null) return '결제 수단을 선택해주세요';
    if (state == _PayState.paying) return '결제 중…';
    return '₩${_formatWon(selectedPackage!.price)} 결제하기';
  }

  @override
  Widget build(BuildContext context) {
    final double safeBottom = MediaQuery.of(context).padding.bottom;
    return Container(
      width: double.infinity,
      decoration: const BoxDecoration(
        color: AppColors.hanji,
        border: Border(
          top: BorderSide(color: AppColors.borderSoft, width: 1),
        ),
      ),
      padding: EdgeInsets.fromLTRB(20, 14, 20, safeBottom + 14),
      child: ZeomButton(
        label: _buildLabel(),
        variant: ZeomButtonVariant.primary,
        size: ZeomButtonSize.md,
        width: double.infinity,
        loading: state == _PayState.paying,
        onPressed: canPay ? onPay : null,
      ),
    );
  }
}

// =================================================================
// Success view
// =================================================================

class _SuccessView extends StatelessWidget {
  final int cashAdded;
  final int newBalance;

  const _SuccessView({required this.cashAdded, required this.newBalance});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.hanji,
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(40),
            child: ZeomFadeSlideIn(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 84,
                    height: 84,
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: LinearGradient(
                        colors: [AppColors.goldSoft, AppColors.gold],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                    ),
                    child: const Icon(
                      Icons.check_rounded,
                      size: 40,
                      color: AppColors.ink,
                    ),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    '충전 완료',
                    textAlign: TextAlign.center,
                    style: ZeomType.displaySm.copyWith(color: AppColors.ink),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '${_formatWon(cashAdded)} 캐시가 반영되었어요',
                    textAlign: TextAlign.center,
                    style: ZeomType.body.copyWith(color: AppColors.ink3),
                  ),
                  const SizedBox(height: 28),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 16,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.hanjiCard,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: AppColors.gold.withOpacity(0.35),
                        width: 1,
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Text(
                          '현재 잔액',
                          style: ZeomType.meta.copyWith(color: AppColors.ink3),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          '${_formatWon(newBalance)} 캐시',
                          style: ZeomType.tabularNums(
                            base: ZeomType.subTitle.copyWith(
                              color: AppColors.gold,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
