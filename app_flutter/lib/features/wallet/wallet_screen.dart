import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:path_provider/path_provider.dart';
import 'package:open_filex/open_filex.dart';
import '../../core/api_client.dart';
import '../../shared/theme.dart';

final walletProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final apiClient = ref.read(apiClientProvider);
  final response = await apiClient.getWallet();
  return response.data as Map<String, dynamic>;
});

final creditBalanceProvider =
    FutureProvider<Map<String, dynamic>>((ref) async {
  final apiClient = ref.read(apiClientProvider);
  final response = await apiClient.getCreditBalance();
  return response.data as Map<String, dynamic>;
});

final transactionsProvider =
    FutureProvider<Map<String, dynamic>>((ref) async {
  final apiClient = ref.read(apiClientProvider);
  final response = await apiClient.getWalletTransactions();
  return response.data as Map<String, dynamic>;
});

String _formatCurrency(dynamic value) {
  final number = (value is int) ? value : (value as num).toInt();
  return number.toString().replaceAllMapped(
    RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
    (Match m) => '${m[1]},',
  );
}

class WalletScreen extends ConsumerWidget {
  const WalletScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final walletAsync = ref.watch(walletProvider);
    final creditAsync = ref.watch(creditBalanceProvider);
    final transactionsAsync = ref.watch(transactionsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('내 지갑'),
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(walletProvider);
          ref.invalidate(creditBalanceProvider);
          ref.invalidate(transactionsProvider);
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Balance card - dark gradient matching React
              walletAsync.when(
                data: (wallet) {
                  final balance =
                      wallet['balanceCash'] ?? wallet['balance'] ?? 0;
                  return Container(
                    width: double.infinity,
                    margin: const EdgeInsets.all(16),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 24,
                      vertical: 32,
                    ),
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
                        color: AppColors.gold.withOpacity(0.1),
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.2),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Text(
                          '현재 잔액',
                          style: GoogleFonts.notoSerif(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: AppColors.gold,
                            letterSpacing: 1.5,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          '${_formatCurrency(balance)}원',
                          style: GoogleFonts.notoSerif(
                            fontSize: 36,
                            fontWeight: FontWeight.w900,
                            color: AppColors.gold,
                          ),
                        ),
                        const SizedBox(height: 24),
                        SizedBox(
                          width: double.infinity,
                          height: 48,
                          child: ElevatedButton(
                            onPressed: () => context.push('/wallet/cash-buy'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.gold,
                              foregroundColor: AppColors.inkBlack,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(24),
                              ),
                              elevation: 0,
                            ),
                            child: Text(
                              '충전하기',
                              style: GoogleFonts.notoSerif(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                },
                loading: () => Container(
                  height: 200,
                  margin: const EdgeInsets.all(16),
                  child: const Center(child: CircularProgressIndicator()),
                ),
                error: (err, stack) => Container(
                  margin: const EdgeInsets.all(16),
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: AppColors.error.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    children: [
                      const Icon(Icons.error_outline,
                          color: AppColors.error, size: 40),
                      const SizedBox(height: 8),
                      const Text('잔액을 불러올 수 없습니다'),
                      const SizedBox(height: 8),
                      ElevatedButton(
                        onPressed: () => ref.invalidate(walletProvider),
                        child: const Text('다시 시도'),
                      ),
                    ],
                  ),
                ),
              ),

              // Credit balance card
              creditAsync.when(
                data: (credit) {
                  final remaining = credit['remainingUnits'] ?? credit['remaining'] ?? 0;
                  final used = credit['usedUnits'] ?? credit['used'] ?? 0;
                  return Container(
                    width: double.infinity,
                    margin: const EdgeInsets.symmetric(horizontal: 16),
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: AppColors.gold.withOpacity(0.4),
                        width: 1.5,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.gold.withOpacity(0.08),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 36,
                              height: 36,
                              decoration: BoxDecoration(
                                color: AppColors.gold.withOpacity(0.12),
                                borderRadius: BorderRadius.circular(18),
                              ),
                              child: const Icon(
                                Icons.confirmation_number,
                                color: AppColors.gold,
                                size: 20,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                '보유 상담권: $remaining회',
                                style: GoogleFonts.notoSerif(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                            ),
                          ],
                        ),
                        if ((used as num) > 0) ...[
                          const SizedBox(height: 4),
                          Align(
                            alignment: Alignment.centerLeft,
                            child: Padding(
                              padding: const EdgeInsets.only(left: 48),
                              child: Text(
                                '($used회 사용됨)',
                                style: GoogleFonts.notoSans(
                                  fontSize: 13,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                            ),
                          ),
                        ],
                        const SizedBox(height: 16),
                        SizedBox(
                          width: double.infinity,
                          height: 44,
                          child: OutlinedButton(
                            onPressed: () =>
                                context.push('/credits/buy'),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: AppColors.gold,
                              side: const BorderSide(
                                color: AppColors.gold,
                                width: 1.5,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(22),
                              ),
                            ),
                            child: Text(
                              '상담권 구매',
                              style: GoogleFonts.notoSerif(
                                fontSize: 15,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                },
                loading: () => Container(
                  height: 100,
                  margin: const EdgeInsets.symmetric(horizontal: 16),
                  child: const Center(child: CircularProgressIndicator()),
                ),
                error: (err, stack) => const SizedBox.shrink(),
              ),
              const SizedBox(height: 20),

              // Transaction history header
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Text(
                  '거래 내역',
                  style: GoogleFonts.notoSerif(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
              const SizedBox(height: 12),

              transactionsAsync.when(
                data: (data) {
                  final transactions =
                      List<Map<String, dynamic>>.from(data['content'] ?? []);

                  if (transactions.isEmpty) {
                    return Padding(
                      padding: const EdgeInsets.all(40),
                      child: Center(
                        child: Column(
                          children: [
                            Icon(
                              Icons.receipt_long,
                              size: 48,
                              color:
                                  AppColors.textSecondary.withOpacity(0.5),
                            ),
                            const SizedBox(height: 12),
                            Text(
                              '거래 내역이 없습니다',
                              style: GoogleFonts.notoSerif(
                                fontSize: 16,
                                color: AppColors.textSecondary,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '지갑을 충전하여 상담 서비스를 이용해보세요',
                              style: GoogleFonts.notoSans(
                                fontSize: 13,
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  }

                  return ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: transactions.length,
                    itemBuilder: (context, index) {
                      final tx = transactions[index];
                      return _TransactionItem(transaction: tx);
                    },
                  );
                },
                loading: () => const Padding(
                  padding: EdgeInsets.all(32),
                  child: Center(child: CircularProgressIndicator()),
                ),
                error: (err, stack) => Padding(
                  padding: const EdgeInsets.all(16),
                  child: Center(
                    child: Column(
                      children: [
                        const Text('거래 내역을 불러올 수 없습니다'),
                        const SizedBox(height: 8),
                        ElevatedButton(
                          onPressed: () =>
                              ref.invalidate(transactionsProvider),
                          child: const Text('다시 시도'),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }
}

class _TransactionItem extends ConsumerWidget {
  final Map<String, dynamic> transaction;

  const _TransactionItem({required this.transaction});

  String _getTypeLabel(String type) {
    switch (type) {
      case 'CHARGE':
        return '충전';
      case 'CONFIRM':
      case 'USE':
        return '사용';
      case 'REFUND':
        return '환불';
      default:
        return type;
    }
  }

  /// Transaction type colors matching React:
  /// CHARGE = green (success), USE/CONFIRM = red (danger), REFUND = gold
  Color _getTypeColor(String type) {
    switch (type) {
      case 'CHARGE':
        return AppColors.success;
      case 'CONFIRM':
      case 'USE':
        return AppColors.darkRed;
      case 'REFUND':
        return AppColors.gold;
      default:
        return AppColors.textSecondary;
    }
  }

  IconData _getTypeIcon(String type) {
    switch (type) {
      case 'CHARGE':
        return Icons.add_circle;
      case 'CONFIRM':
      case 'USE':
        return Icons.remove_circle;
      case 'REFUND':
        return Icons.replay_circle_filled;
      default:
        return Icons.circle;
    }
  }

  Future<void> _downloadReceipt(BuildContext context, WidgetRef ref, int txId) async {
    try {
      final apiClient = ref.read(apiClientProvider);
      final response = await apiClient.getTransactionReceiptPdf(txId);
      final bytes = Uint8List.fromList(response.data!);
      final dir = await getTemporaryDirectory();
      final file = File('${dir.path}/receipt_$txId.pdf');
      await file.writeAsBytes(bytes);
      await OpenFilex.open(file.path);
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('영수증을 다운로드할 수 없습니다')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final type = (transaction['type'] ?? '') as String;
    final amount = transaction['amount'] ?? 0;
    final balanceAfter = transaction['balanceAfter'];
    final refType = transaction['refType'];
    final refId = transaction['refId'];
    final txId = transaction['id'];
    final createdAt = transaction['createdAt']?.toString();
    final isPositive = type == 'CHARGE' || type == 'REFUND';
    final color = _getTypeColor(type);

    String dateStr = '';
    if (createdAt != null) {
      try {
        final dt = DateTime.parse(createdAt);
        dateStr =
            '${dt.year}.${dt.month.toString().padLeft(2, '0')}.${dt.day.toString().padLeft(2, '0')} '
            '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
      } catch (_) {
        dateStr = createdAt;
      }
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Icon(
                _getTypeIcon(type),
                color: color,
                size: 22,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: color.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          _getTypeLabel(type),
                          style: GoogleFonts.notoSans(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: color,
                          ),
                        ),
                      ),
                    ],
                  ),
                  if (refType != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      '$refType${refId != null ? ' #$refId' : ''}',
                      style: GoogleFonts.notoSans(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                  const SizedBox(height: 4),
                  Text(
                    dateStr,
                    style: GoogleFonts.notoSans(
                      fontSize: 11,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  '${isPositive ? '+' : '-'}${_formatCurrency((amount as num).abs())}원',
                  style: GoogleFonts.notoSerif(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: color,
                  ),
                ),
                if (balanceAfter != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    '잔액: ${_formatCurrency(balanceAfter)}원',
                    style: GoogleFonts.notoSans(
                      fontSize: 11,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
                if (txId != null) ...[
                  const SizedBox(height: 4),
                  GestureDetector(
                    onTap: () => _downloadReceipt(context, ref, txId as int),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.receipt_outlined, size: 12, color: AppColors.gold),
                        const SizedBox(width: 2),
                        Text(
                          '영수증',
                          style: GoogleFonts.notoSans(
                            fontSize: 11,
                            color: AppColors.gold,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}
