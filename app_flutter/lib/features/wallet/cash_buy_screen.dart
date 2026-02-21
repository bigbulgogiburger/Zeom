import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/api_client.dart';
import '../../shared/theme.dart';
import 'wallet_screen.dart';

final cashProductsProvider =
    FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final apiClient = ref.read(apiClientProvider);
  final response = await apiClient.getCashProducts();
  final data = response.data as Map<String, dynamic>;
  return List<Map<String, dynamic>>.from(data['products'] ?? []);
});

String _formatCurrency(dynamic value) {
  final number = (value is int) ? value : (value as num).toInt();
  return number.toString().replaceAllMapped(
    RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
    (Match m) => '${m[1]},',
  );
}

enum PayMethodType { card, easyPay, transfer }

class _PayMethodOption {
  final PayMethodType type;
  final String label;
  final IconData icon;
  final Color? color;
  final String? easyPayProvider;

  const _PayMethodOption({
    required this.type,
    required this.label,
    required this.icon,
    this.color,
    this.easyPayProvider,
  });
}

const _payMethods = <_PayMethodOption>[
  _PayMethodOption(
    type: PayMethodType.card,
    label: '신용카드',
    icon: Icons.credit_card,
  ),
  _PayMethodOption(
    type: PayMethodType.easyPay,
    label: '카카오페이',
    icon: Icons.account_balance_wallet,
    color: Color(0xFFFEE500),
    easyPayProvider: 'KAKAOPAY',
  ),
  _PayMethodOption(
    type: PayMethodType.easyPay,
    label: '토스페이',
    icon: Icons.account_balance_wallet,
    color: Color(0xFF0064FF),
    easyPayProvider: 'TOSSPAY',
  ),
  _PayMethodOption(
    type: PayMethodType.easyPay,
    label: '네이버페이',
    icon: Icons.account_balance_wallet,
    color: Color(0xFF03C75A),
    easyPayProvider: 'NAVERPAY',
  ),
  _PayMethodOption(
    type: PayMethodType.transfer,
    label: '계좌이체',
    icon: Icons.account_balance,
  ),
];

const _maxRetryCount = 3;

const _failureMessages = <String, String>{
  'CARD_LIMIT_EXCEEDED': '카드 한도가 초과되었습니다. 다른 카드를 이용해 주세요.',
  'CARD_DECLINED': '카드가 거절되었습니다. 카드사에 문의해 주세요.',
  'INSUFFICIENT_FUNDS': '잔액이 부족합니다.',
  'NETWORK_ERROR': '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
  'TIMEOUT': '결제 시간이 초과되었습니다. 다시 시도해 주세요.',
};

String _getFailureMessage(String? errorCode, String defaultMsg) {
  if (errorCode != null && _failureMessages.containsKey(errorCode)) {
    return _failureMessages[errorCode]!;
  }
  return defaultMsg.isNotEmpty ? defaultMsg : '결제 처리 중 오류가 발생했습니다.';
}

enum _PaymentStatus { idle, preparing, processing, success, failed }

class CashBuyScreen extends ConsumerStatefulWidget {
  final String? returnTo;

  const CashBuyScreen({super.key, this.returnTo});

  @override
  ConsumerState<CashBuyScreen> createState() => _CashBuyScreenState();
}

class _CashBuyScreenState extends ConsumerState<CashBuyScreen> {
  int? selectedProductIndex;
  int _selectedMethodIndex = 0;
  _PaymentStatus _paymentStatus = _PaymentStatus.idle;
  int _failureCount = 0;
  String _failureReason = '';
  int? _newBalance;

  bool get _isRetryExhausted => _failureCount >= _maxRetryCount;

  Future<void> _buyCash(List<Map<String, dynamic>> products) async {
    if (selectedProductIndex == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('충전할 상품을 선택해주세요')),
      );
      return;
    }

    setState(() {
      _paymentStatus = _PaymentStatus.preparing;
      _failureReason = '';
    });

    final product = products[selectedProductIndex!];
    final amount = (product['cashAmount'] ?? product['priceKrw'] ?? 0) as num;

    try {
      setState(() {
        _paymentStatus = _PaymentStatus.processing;
      });

      final apiClient = ref.read(apiClientProvider);
      final response = await apiClient.buyCash(amount: amount.toInt());
      final data = response.data as Map<String, dynamic>;
      final newBalance = data['newBalance'] as num?;

      // Invalidate wallet/credit providers so wallet screen refreshes
      ref.invalidate(walletProvider);
      ref.invalidate(creditBalanceProvider);
      ref.invalidate(transactionsProvider);

      if (mounted) {
        setState(() {
          _paymentStatus = _PaymentStatus.success;
          _newBalance = newBalance?.toInt();
          _failureCount = 0;
        });

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              newBalance != null
                  ? '충전 완료! 새 잔액: ${_formatCurrency(newBalance)}원'
                  : '충전이 완료되었습니다.',
            ),
            backgroundColor: AppColors.gold,
          ),
        );

        // Auto redirect after 3 seconds
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
    } on DioException catch (e) {
      if (mounted) {
        final newCount = _failureCount + 1;
        final errorCode = e.response?.data is Map
            ? (e.response!.data as Map<String, dynamic>)['errorCode']
                ?.toString()
            : null;
        final serverMsg = e.response?.data is Map
            ? (e.response!.data as Map<String, dynamic>)['message']
                ?.toString() ?? ''
            : '';
        final reason = _getFailureMessage(errorCode, serverMsg);
        setState(() {
          _failureCount = newCount;
          _paymentStatus = _PaymentStatus.failed;
          _failureReason = reason;
          selectedProductIndex = null;
        });
      }
    } catch (e) {
      if (mounted) {
        final newCount = _failureCount + 1;
        setState(() {
          _failureCount = newCount;
          _paymentStatus = _PaymentStatus.failed;
          _failureReason = '결제 처리 중 오류가 발생했습니다.';
          selectedProductIndex = null;
        });
      }
    }
  }

  void _handleRetry() {
    setState(() {
      _paymentStatus = _PaymentStatus.idle;
      _failureReason = '';
      selectedProductIndex = null;
      _newBalance = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    final productsAsync = ref.watch(cashProductsProvider);

    // Success state
    if (_paymentStatus == _PaymentStatus.success) {
      return Scaffold(
        appBar: AppBar(title: const Text('캐시 충전')),
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
                      return Transform.scale(
                        scale: value,
                        child: child,
                      );
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
                    '충전 완료!',
                    style: GoogleFonts.notoSerif(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: AppColors.gold,
                    ),
                  ),
                  if (_newBalance != null) ...[
                    const SizedBox(height: 16),
                    Text(
                      '새로운 잔액',
                      style: GoogleFonts.notoSans(
                        fontSize: 14,
                        color: AppColors.hanji.withOpacity(0.7),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${_formatCurrency(_newBalance!)}원',
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
                        : '잠시 후 지갑 페이지로 이동합니다...',
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
      appBar: AppBar(title: const Text('캐시 충전')),
      body: productsAsync.when(
        data: (products) {
          return Column(
            children: [
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Failed state
                      if (_paymentStatus == _PaymentStatus.failed) ...[
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(24),
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
                              const Icon(
                                Icons.warning_amber_rounded,
                                size: 48,
                                color: AppColors.darkRed,
                              ),
                              const SizedBox(height: 12),
                              Text(
                                '결제 실패',
                                style: GoogleFonts.notoSerif(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.darkRed,
                                ),
                              ),
                              if (_failureReason.isNotEmpty) ...[
                                const SizedBox(height: 8),
                                Text(
                                  _failureReason,
                                  style: GoogleFonts.notoSans(
                                    fontSize: 13,
                                    color: AppColors.hanji.withOpacity(0.6),
                                  ),
                                  textAlign: TextAlign.center,
                                ),
                              ],
                              if (_failureCount > 1 && !_isRetryExhausted) ...[
                                const SizedBox(height: 8),
                                Text(
                                  '실패 횟수: $_failureCount/$_maxRetryCount',
                                  style: GoogleFonts.notoSans(
                                    fontSize: 12,
                                    color: AppColors.hanji.withOpacity(0.4),
                                  ),
                                ),
                              ],
                              const SizedBox(height: 16),
                              if (_isRetryExhausted) ...[
                                Text(
                                  '결제 시도 횟수를 초과했습니다.',
                                  style: GoogleFonts.notoSerif(
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.darkRed,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  '고객센터에 문의해 주세요.',
                                  style: GoogleFonts.notoSans(
                                    fontSize: 13,
                                    color: AppColors.hanji.withOpacity(0.5),
                                  ),
                                ),
                                const SizedBox(height: 16),
                                OutlinedButton(
                                  onPressed: () => context.pop(),
                                  style: OutlinedButton.styleFrom(
                                    foregroundColor: AppColors.gold,
                                    side: BorderSide(
                                      color: AppColors.gold.withOpacity(0.3),
                                    ),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(24),
                                    ),
                                  ),
                                  child: const Text('지갑으로 돌아가기'),
                                ),
                              ] else
                                ElevatedButton(
                                  onPressed: _handleRetry,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppColors.gold,
                                    foregroundColor: AppColors.inkBlack,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(24),
                                    ),
                                  ),
                                  child: const Text('다시 시도하기'),
                                ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 24),
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
                          '상담 서비스 이용을 위해 필요한 캐시를 충전하세요. 충전한 캐시는 지갑에 보관되며, 상담 예약 시 자동으로 차감됩니다.',
                          style: GoogleFonts.notoSans(
                            fontSize: 13,
                            height: 1.6,
                            color: AppColors.textPrimary,
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Payment method selection
                      Text(
                        '결제 수단 선택',
                        style: GoogleFonts.notoSerif(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: List.generate(_payMethods.length, (idx) {
                          final method = _payMethods[idx];
                          final isSelected = _selectedMethodIndex == idx;
                          final isDisabled = _paymentStatus != _PaymentStatus.idle &&
                              _paymentStatus != _PaymentStatus.failed;

                          return GestureDetector(
                            onTap: isDisabled
                                ? null
                                : () {
                                    setState(() {
                                      _selectedMethodIndex = idx;
                                    });
                                  },
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              padding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 10,
                              ),
                              decoration: BoxDecoration(
                                color: isSelected
                                    ? AppColors.gold.withOpacity(0.12)
                                    : AppColors.inkBlack.withOpacity(0.05),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: isSelected
                                      ? AppColors.gold
                                      : AppColors.gold.withOpacity(0.15),
                                  width: isSelected ? 2 : 1,
                                ),
                              ),
                              child: Opacity(
                                opacity: isDisabled ? 0.5 : 1.0,
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(
                                      method.icon,
                                      size: 20,
                                      color: method.color ?? AppColors.gold,
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      method.label,
                                      style: GoogleFonts.notoSans(
                                        fontSize: 13,
                                        fontWeight: isSelected
                                            ? FontWeight.bold
                                            : FontWeight.normal,
                                        color: isSelected
                                            ? AppColors.gold
                                            : AppColors.textSecondary,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          );
                        }),
                      ),
                      const SizedBox(height: 24),

                      // Product selection heading
                      Text(
                        '충전 상품 선택',
                        style: GoogleFonts.notoSerif(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Processing states
                      if (_paymentStatus == _PaymentStatus.preparing ||
                          _paymentStatus == _PaymentStatus.processing) ...[
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
                                _paymentStatus == _PaymentStatus.preparing
                                    ? '결제 준비 중...'
                                    : '결제 처리 중...',
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
                        // Product cards
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
                            final isSelected = selectedProductIndex == index;
                            final name = product['name'] ?? '';
                            final cashAmount = product['cashAmount'] ?? 0;
                            final priceKrw = product['priceKrw'] ?? 0;
                            final description = product['description'];
                            final durationMinutes =
                                product['minutes'] ?? product['durationMinutes'];

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
                                onTap: (_paymentStatus != _PaymentStatus.idle ||
                                        _isRetryExhausted)
                                    ? null
                                    : () {
                                        setState(() {
                                          selectedProductIndex = index;
                                        });
                                      },
                                borderRadius: BorderRadius.circular(16),
                                child: Padding(
                                  padding: const EdgeInsets.all(14),
                                  child: Column(
                                    mainAxisAlignment:
                                        MainAxisAlignment.center,
                                    children: [
                                      Text(
                                        name,
                                        style: GoogleFonts.notoSerif(
                                          fontSize: 15,
                                          fontWeight: FontWeight.w600,
                                          color: isSelected
                                              ? AppColors.hanji
                                              : AppColors.inkBlack,
                                        ),
                                        textAlign: TextAlign.center,
                                      ),
                                      if (description != null &&
                                          description
                                              .toString()
                                              .isNotEmpty) ...[
                                        const SizedBox(height: 4),
                                        Text(
                                          description.toString(),
                                          style: GoogleFonts.notoSans(
                                            fontSize: 11,
                                            color: isSelected
                                                ? AppColors.hanji
                                                    .withOpacity(0.6)
                                                : AppColors.textSecondary,
                                          ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                          textAlign: TextAlign.center,
                                        ),
                                      ],
                                      const SizedBox(height: 12),
                                      Divider(
                                        color: isSelected
                                            ? AppColors.gold.withOpacity(0.3)
                                            : AppColors.border,
                                        height: 1,
                                      ),
                                      const SizedBox(height: 12),
                                      if (durationMinutes != null) ...[
                                        Row(
                                          mainAxisAlignment:
                                              MainAxisAlignment.spaceBetween,
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
                                      Row(
                                        mainAxisAlignment:
                                            MainAxisAlignment.spaceBetween,
                                        children: [
                                          Text(
                                            '충전 캐시',
                                            style: GoogleFonts.notoSans(
                                              fontSize: 11,
                                              color: isSelected
                                                  ? AppColors.hanji
                                                      .withOpacity(0.6)
                                                  : AppColors.textSecondary,
                                            ),
                                          ),
                                          Text(
                                            '${_formatCurrency(cashAmount)}원',
                                            style: GoogleFonts.notoSerif(
                                              fontSize: 12,
                                              fontWeight: FontWeight.bold,
                                              color: AppColors.gold,
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 10),
                                      Text(
                                        '${_formatCurrency(priceKrw)}원',
                                        style: GoogleFonts.notoSerif(
                                          fontSize: 20,
                                          fontWeight: FontWeight.w900,
                                          color: isSelected
                                              ? AppColors.gold
                                              : AppColors.gold,
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
                          onPressed: (_paymentStatus != _PaymentStatus.idle ||
                                  selectedProductIndex == null ||
                                  _isRetryExhausted)
                              ? null
                              : () => _buyCash(
                                  productsAsync.valueOrNull ?? products),
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
                            selectedProductIndex != null
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
                        onPressed: (_paymentStatus ==
                                    _PaymentStatus.processing ||
                                _paymentStatus == _PaymentStatus.preparing)
                            ? null
                            : () => context.pop(),
                        child: Text(
                          '지갑으로 돌아가기',
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
                onPressed: () => ref.invalidate(cashProductsProvider),
                child: const Text('다시 시도'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
