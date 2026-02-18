import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/api_client.dart';
import '../../shared/theme.dart';

final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());

final walletProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final apiClient = ref.read(apiClientProvider);
  try {
    final response = await apiClient.getWallet();
    return response.data as Map<String, dynamic>;
  } catch (e) {
    // Return mock data if API fails
    return {
      'balance': 50000,
      'userId': 1,
    };
  }
});

final transactionsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final apiClient = ref.read(apiClientProvider);
  try {
    final response = await apiClient.getWalletTransactions();
    final data = response.data as List;
    return data.cast<Map<String, dynamic>>();
  } catch (e) {
    // Return mock transactions if API fails
    return [
      {
        'id': 1,
        'type': 'CHARGE',
        'amount': 50000,
        'description': '캐시 충전',
        'createdAt': '2026-02-10T10:00:00',
      },
      {
        'id': 2,
        'type': 'USE',
        'amount': -30000,
        'description': '상담 예약',
        'createdAt': '2026-02-09T14:30:00',
      },
    ];
  }
});

class WalletScreen extends ConsumerWidget {
  const WalletScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final walletAsync = ref.watch(walletProvider);
    final transactionsAsync = ref.watch(transactionsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('지갑'),
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(walletProvider);
          ref.invalidate(transactionsProvider);
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Balance card
              walletAsync.when(
                data: (wallet) {
                  final balance = wallet['balance'] ?? 0;
                  return Container(
                    width: double.infinity,
                    margin: const EdgeInsets.all(16),
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [AppColors.inkBlack, Color(0xFF333333)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.2),
                          blurRadius: 8,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '보유 캐시',
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: AppColors.hanji.withOpacity(0.8),
                              ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          '${balance.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')}원',
                          style: Theme.of(context).textTheme.displayMedium?.copyWith(
                                color: AppColors.gold,
                                fontWeight: FontWeight.bold,
                              ),
                        ),
                        const SizedBox(height: 20),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: () => context.push('/wallet/cash-buy'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.gold,
                              foregroundColor: AppColors.inkBlack,
                            ),
                            child: const Text('캐시 충전'),
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
                  child: Text('잔액을 불러올 수 없습니다: $err'),
                ),
              ),

              // Transaction history
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Text(
                  '거래 내역',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
              ),
              const SizedBox(height: 12),

              transactionsAsync.when(
                data: (transactions) {
                  if (transactions.isEmpty) {
                    return const Padding(
                      padding: EdgeInsets.all(40),
                      child: Center(
                        child: Text('거래 내역이 없습니다'),
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
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (err, stack) => Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text('거래 내역을 불러올 수 없습니다: $err'),
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

class _TransactionItem extends StatelessWidget {
  final Map<String, dynamic> transaction;

  const _TransactionItem({required this.transaction});

  @override
  Widget build(BuildContext context) {
    final type = transaction['type'] ?? '';
    final amount = transaction['amount'] ?? 0;
    final isCharge = type == 'CHARGE';
    final dateTime = DateTime.parse(transaction['createdAt']);

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
                color: (isCharge ? AppColors.success : AppColors.error).withOpacity(0.1),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Icon(
                isCharge ? Icons.add : Icons.remove,
                color: isCharge ? AppColors.success : AppColors.error,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    transaction['description'] ?? '',
                    style: Theme.of(context).textTheme.bodyLarge,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${dateTime.year}.${dateTime.month}.${dateTime.day} ${dateTime.hour}:${dateTime.minute.toString().padLeft(2, '0')}',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ),
            ),
            Text(
              '${amount > 0 ? '+' : ''}${amount.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')}원',
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: isCharge ? AppColors.success : AppColors.error,
                    fontWeight: FontWeight.w600,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}

