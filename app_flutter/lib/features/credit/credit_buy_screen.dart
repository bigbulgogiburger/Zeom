import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/api_client.dart';
import '../../shared/theme.dart';

final _creditProductsProvider =
    FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final apiClient = ref.read(apiClientProvider);
  final response = await apiClient.getCashProducts();
  final data = response.data as Map<String, dynamic>;
  return List<Map<String, dynamic>>.from(data['products'] ?? []);
});

final _creditBalanceProvider = FutureProvider<int>((ref) async {
  final apiClient = ref.read(apiClientProvider);
  final response = await apiClient.getCreditBalance();
  final data = response.data as Map<String, dynamic>;
  return (data['balance'] ?? data['credits'] ?? 0) as int;
});

final _walletBalanceProvider = FutureProvider<int>((ref) async {
  final apiClient = ref.read(apiClientProvider);
  final response = await apiClient.getWallet();
  final data = response.data as Map<String, dynamic>;
  return ((data['balanceCash'] ?? data['balance'] ?? 0) as num).toInt();
});

String _formatCurrency(dynamic value) {
  final number = (value is int) ? value : (value as num).toInt();
  return number.toString().replaceAllMapped(
    RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
    (Match m) => '${m[1]},',
  );
}

class CreditBuyScreen extends ConsumerStatefulWidget {
  final int? needed;
  final String? returnTo;

  const CreditBuyScreen({super.key, this.needed, this.returnTo});

  @override
  ConsumerState<CreditBuyScreen> createState() => _CreditBuyScreenState();
}

class _CreditBuyScreenState extends ConsumerState<CreditBuyScreen> {
  int? _selectedProductIndex;
  bool _isPurchasing = false;
  bool _isSuccess = false;
  int? _newCreditBalance;

  Future<void> _purchaseCredit(
    List<Map<String, dynamic>> products,
    int walletBalance,
  ) async {
    if (_selectedProductIndex == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('구매할 상품을 선택해주세요')),
      );
      return;
    }

    final product = products[_selectedProductIndex!];
    final priceKrw = ((product['priceKrw'] ?? 0) as num).toInt();
    final productId = product['id'] as int;

    // Check if cash is sufficient
    if (walletBalance < priceKrw) {
      _showInsufficientCashModal(priceKrw - walletBalance);
      return;
    }

    setState(() => _isPurchasing = true);

    try {
      final apiClient = ref.read(apiClientProvider);
      await apiClient.purchaseCredit(productId);

      // Fetch updated credit balance
      final creditResponse = await apiClient.getCreditBalance();
      final creditData = creditResponse.data as Map<String, dynamic>;
      final newBalance =
          (creditData['balance'] ?? creditData['credits'] ?? 0) as int;

      if (mounted) {
        setState(() {
          _isSuccess = true;
          _isPurchasing = false;
          _newCreditBalance = newBalance;
        });

        // Auto navigate after 3 seconds
        Future.delayed(const Duration(seconds: 3), () {
          if (mounted) {
            if (widget.returnTo != null) {
              context.go(widget.returnTo!);
            } else {
              context.pop();
            }
          }
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isPurchasing = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('구매 실패: ${e.toString()}')),
        );
      }
    }
  }

  void _showInsufficientCashModal(int shortfall) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        backgroundColor: Colors.white,
        title: Text(
          '캐시 부족',
          style: GoogleFonts.notoSerif(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '상담권 구매에 캐시가 부족합니다.',
              style: GoogleFonts.notoSans(
                fontSize: 14,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.hanji,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: AppColors.gold.withOpacity(0.2),
                ),
              ),
              child: Text(
                '부족 금액: ${_formatCurrency(shortfall)}원',
                style: GoogleFonts.notoSerif(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: AppColors.darkRed,
                ),
                textAlign: TextAlign.center,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              '캐시를 충전한 후 다시 시도해 주세요.',
              style: GoogleFonts.notoSans(
                fontSize: 13,
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: Text(
              '취소',
              style: GoogleFonts.notoSans(color: AppColors.textSecondary),
            ),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              context.push('/wallet/cash-buy');
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.gold,
              foregroundColor: AppColors.inkBlack,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(24),
              ),
            ),
            child: Text(
              '캐시 충전하기',
              style: GoogleFonts.notoSans(fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final productsAsync = ref.watch(_creditProductsProvider);
    final creditAsync = ref.watch(_creditBalanceProvider);
    final walletAsync = ref.watch(_walletBalanceProvider);

    // Success state
    if (_isSuccess) {
      return Scaffold(
        appBar: AppBar(title: const Text('상담권 구매')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Container(
              padding: const EdgeInsets.all(40),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    AppColors.inkBlack,
                    AppColors.inkBlack.withOpacity(0.85),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: AppColors.gold.withOpacity(0.15),
                ),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TweenAnimationBuilder<double>(
                    tween: Tween(begin: 0.0, end: 1.0),
                    duration: const Duration(milliseconds: 600),
                    builder: (context, value, child) {
                      return Transform.scale(scale: value, child: child);
                    },
                    child: Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        color: AppColors.gold.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(40),
                      ),
                      child: const Icon(
                        Icons.check_circle,
                        size: 56,
                        color: AppColors.gold,
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    '구매 완료!',
                    style: GoogleFonts.notoSerif(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: AppColors.gold,
                    ),
                  ),
                  if (_newCreditBalance != null) ...[
                    const SizedBox(height: 16),
                    Text(
                      '보유 상담권',
                      style: GoogleFonts.notoSans(
                        fontSize: 14,
                        color: AppColors.hanji.withOpacity(0.7),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '$_newCreditBalance회',
                      style: GoogleFonts.notoSerif(
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        color: AppColors.gold,
                      ),
                    ),
                  ],
                  const SizedBox(height: 24),
                  Text(
                    widget.returnTo != null
                        ? '잠시 후 이전 페이지로 이동합니다...'
                        : '잠시 후 돌아갑니다...',
                    style: GoogleFonts.notoSans(
                      fontSize: 13,
                      color: AppColors.hanji.withOpacity(0.5),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('상담권 구매')),
      body: productsAsync.when(
        data: (products) {
          final walletBalance = walletAsync.valueOrNull ?? 0;

          return Column(
            children: [
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Balance cards row
                      Row(
                        children: [
                          // Credit balance card
                          Expanded(
                            child: Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [
                                    AppColors.inkBlack,
                                    AppColors.inkBlack.withOpacity(0.85),
                                  ],
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                ),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                  color: AppColors.gold.withOpacity(0.15),
                                ),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Icon(
                                        Icons.confirmation_number_outlined,
                                        size: 18,
                                        color: AppColors.gold.withOpacity(0.7),
                                      ),
                                      const SizedBox(width: 6),
                                      Text(
                                        '보유 상담권',
                                        style: GoogleFonts.notoSans(
                                          fontSize: 12,
                                          color:
                                              AppColors.hanji.withOpacity(0.7),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  creditAsync.when(
                                    data: (balance) => Text(
                                      '${balance}회',
                                      style: GoogleFonts.notoSerif(
                                        fontSize: 22,
                                        fontWeight: FontWeight.bold,
                                        color: AppColors.gold,
                                      ),
                                    ),
                                    loading: () => SizedBox(
                                      height: 22,
                                      width: 22,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        color: AppColors.gold,
                                      ),
                                    ),
                                    error: (_, __) => Text(
                                      '-',
                                      style: GoogleFonts.notoSerif(
                                        fontSize: 22,
                                        color: AppColors.hanji.withOpacity(0.5),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          // Cash balance card
                          Expanded(
                            child: Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                  color: AppColors.border,
                                ),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Icon(
                                        Icons.account_balance_wallet_outlined,
                                        size: 18,
                                        color: AppColors.textSecondary,
                                      ),
                                      const SizedBox(width: 6),
                                      Text(
                                        '보유 캐시',
                                        style: GoogleFonts.notoSans(
                                          fontSize: 12,
                                          color: AppColors.textSecondary,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  walletAsync.when(
                                    data: (balance) => Text(
                                      '${_formatCurrency(balance)}원',
                                      style: GoogleFonts.notoSerif(
                                        fontSize: 22,
                                        fontWeight: FontWeight.bold,
                                        color: AppColors.textPrimary,
                                      ),
                                    ),
                                    loading: () => SizedBox(
                                      height: 22,
                                      width: 22,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        color: AppColors.gold,
                                      ),
                                    ),
                                    error: (_, __) => Text(
                                      '-',
                                      style: GoogleFonts.notoSerif(
                                        fontSize: 22,
                                        color: AppColors.textSecondary,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),

                      // Needed credit notice
                      if (widget.needed != null && widget.needed! > 0) ...[
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: AppColors.darkRed.withOpacity(0.08),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: AppColors.darkRed.withOpacity(0.2),
                            ),
                          ),
                          child: Row(
                            children: [
                              Icon(
                                Icons.info_outline,
                                size: 20,
                                color: AppColors.darkRed,
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  '예약에 상담권 ${widget.needed}회가 필요합니다.',
                                  style: GoogleFonts.notoSans(
                                    fontSize: 13,
                                    color: AppColors.darkRed,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 20),
                      ],

                      // Info banner
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppColors.hanji,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: AppColors.gold.withOpacity(0.15),
                            width: 2,
                          ),
                        ),
                        child: Text(
                          '상담권을 구매하면 보유 캐시에서 차감됩니다. 상담 예약 시 상담권 1회가 사용되며, 미사용 상담권은 환불 가능합니다.',
                          style: GoogleFonts.notoSans(
                            fontSize: 13,
                            height: 1.6,
                            color: AppColors.textPrimary,
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Product selection heading
                      Text(
                        '상담권 상품 선택',
                        style: GoogleFonts.notoSerif(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Processing state
                      if (_isPurchasing) ...[
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(40),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                AppColors.inkBlack,
                                AppColors.inkBlack.withOpacity(0.85),
                              ],
                            ),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: AppColors.gold.withOpacity(0.15),
                            ),
                          ),
                          child: Column(
                            children: [
                              SizedBox(
                                width: 48,
                                height: 48,
                                child: CircularProgressIndicator(
                                  color: AppColors.gold,
                                  strokeWidth: 3,
                                ),
                              ),
                              const SizedBox(height: 16),
                              Text(
                                '구매 처리 중...',
                                style: GoogleFonts.notoSerif(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.gold,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                '잠시만 기다려 주세요',
                                style: GoogleFonts.notoSans(
                                  fontSize: 13,
                                  color: AppColors.hanji.withOpacity(0.5),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ] else if (products.isEmpty) ...[
                        Padding(
                          padding: const EdgeInsets.all(40),
                          child: Center(
                            child: Column(
                              children: [
                                Icon(
                                  Icons.inventory_2_outlined,
                                  size: 48,
                                  color:
                                      AppColors.textSecondary.withOpacity(0.5),
                                ),
                                const SizedBox(height: 12),
                                Text(
                                  '이용 가능한 상품이 없습니다',
                                  style: GoogleFonts.notoSerif(
                                    fontSize: 16,
                                    color: AppColors.textSecondary,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  '잠시 후 다시 시도해주세요',
                                  style: GoogleFonts.notoSans(
                                    fontSize: 13,
                                    color: AppColors.textSecondary,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ] else ...[
                        // Product grid (2 columns)
                        GridView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          gridDelegate:
                              const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            childAspectRatio: 0.85,
                            crossAxisSpacing: 12,
                            mainAxisSpacing: 12,
                          ),
                          itemCount: products.length,
                          itemBuilder: (context, index) {
                            final product = products[index];
                            final isSelected =
                                _selectedProductIndex == index;
                            final name = product['name'] ?? '';
                            final priceKrw = product['priceKrw'] ?? 0;
                            final durationMinutes =
                                product['durationMinutes'];
                            final creditUnits = durationMinutes != null
                                ? ((durationMinutes as num).toInt() / 30)
                                    .ceil()
                                : 1;

                            return Card(
                              color: isSelected
                                  ? AppColors.inkBlack
                                  : Colors.white,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                                side: BorderSide(
                                  color: isSelected
                                      ? AppColors.gold
                                      : AppColors.border,
                                  width: isSelected ? 2 : 1,
                                ),
                              ),
                              child: InkWell(
                                onTap: _isPurchasing
                                    ? null
                                    : () {
                                        setState(() {
                                          _selectedProductIndex = index;
                                        });
                                      },
                                borderRadius: BorderRadius.circular(16),
                                child: Padding(
                                  padding: const EdgeInsets.all(14),
                                  child: Column(
                                    mainAxisAlignment:
                                        MainAxisAlignment.center,
                                    children: [
                                      // Credit units badge
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 12,
                                          vertical: 6,
                                        ),
                                        decoration: BoxDecoration(
                                          color: isSelected
                                              ? AppColors.gold
                                                  .withOpacity(0.2)
                                              : AppColors.gold
                                                  .withOpacity(0.1),
                                          borderRadius:
                                              BorderRadius.circular(20),
                                        ),
                                        child: Text(
                                          '$creditUnits회',
                                          style: GoogleFonts.notoSerif(
                                            fontSize: 18,
                                            fontWeight: FontWeight.w900,
                                            color: AppColors.gold,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(height: 10),
                                      Text(
                                        name,
                                        style: GoogleFonts.notoSerif(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w600,
                                          color: isSelected
                                              ? AppColors.hanji
                                              : AppColors.inkBlack,
                                        ),
                                        textAlign: TextAlign.center,
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      const SizedBox(height: 10),
                                      Divider(
                                        color: isSelected
                                            ? AppColors.gold
                                                .withOpacity(0.3)
                                            : AppColors.border,
                                        height: 1,
                                      ),
                                      const SizedBox(height: 10),
                                      if (durationMinutes != null) ...[
                                        Row(
                                          mainAxisAlignment:
                                              MainAxisAlignment
                                                  .spaceBetween,
                                          children: [
                                            Text(
                                              '상담 시간',
                                              style: GoogleFonts.notoSans(
                                                fontSize: 11,
                                                color: isSelected
                                                    ? AppColors.hanji
                                                        .withOpacity(0.6)
                                                    : AppColors
                                                        .textSecondary,
                                              ),
                                            ),
                                            Text(
                                              '${durationMinutes}분',
                                              style: GoogleFonts.notoSerif(
                                                fontSize: 12,
                                                fontWeight: FontWeight.bold,
                                                color: AppColors.gold,
                                              ),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 4),
                                      ],
                                      const Spacer(),
                                      Text(
                                        '${_formatCurrency(priceKrw)}원',
                                        style: GoogleFonts.notoSerif(
                                          fontSize: 18,
                                          fontWeight: FontWeight.w900,
                                          color: AppColors.gold,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                      ],
                    ],
                  ),
                ),
              ),

              // Bottom action area
              SafeArea(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      SizedBox(
                        width: double.infinity,
                        height: 48,
                        child: ElevatedButton(
                          onPressed: (_isPurchasing ||
                                  _selectedProductIndex == null)
                              ? null
                              : () => _purchaseCredit(
                                    productsAsync.valueOrNull ?? products,
                                    walletBalance,
                                  ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.gold,
                            foregroundColor: AppColors.inkBlack,
                            disabledBackgroundColor:
                                AppColors.border.withOpacity(0.5),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(24),
                            ),
                          ),
                          child: Text(
                            _selectedProductIndex != null
                                ? '구매하기'
                                : '상품을 선택해주세요',
                            style: GoogleFonts.notoSerif(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      TextButton(
                        onPressed: _isPurchasing ? null : () => context.pop(),
                        child: Text(
                          '돌아가기',
                          style: GoogleFonts.notoSans(
                            fontSize: 14,
                            color: AppColors.gold,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, color: AppColors.error, size: 40),
              const SizedBox(height: 12),
              const Text('상품을 불러올 수 없습니다'),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => ref.invalidate(_creditProductsProvider),
                child: const Text('다시 시도'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
