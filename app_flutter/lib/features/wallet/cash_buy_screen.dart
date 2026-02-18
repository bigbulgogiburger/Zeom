import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/api_client.dart';
import '../../shared/theme.dart';

final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());

final cashProductsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final apiClient = ref.read(apiClientProvider);
  try {
    final response = await apiClient.getCashProducts();
    final data = response.data as List;
    return data.cast<Map<String, dynamic>>();
  } catch (e) {
    // Return mock products if API fails
    return [
      {'id': 1, 'name': '10,000원', 'price': 10000, 'cashAmount': 10000},
      {'id': 2, 'name': '30,000원', 'price': 30000, 'cashAmount': 30000},
      {'id': 3, 'name': '50,000원', 'price': 50000, 'cashAmount': 50000},
      {'id': 4, 'name': '100,000원', 'price': 100000, 'cashAmount': 100000},
    ];
  }
});

class CashBuyScreen extends ConsumerStatefulWidget {
  const CashBuyScreen({super.key});

  @override
  ConsumerState<CashBuyScreen> createState() => _CashBuyScreenState();
}

class _CashBuyScreenState extends ConsumerState<CashBuyScreen> {
  int? selectedProductId;
  int quantity = 1;
  bool isLoading = false;

  Future<void> _buyCash() async {
    if (selectedProductId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('충전할 금액을 선택해주세요')),
      );
      return;
    }

    setState(() {
      isLoading = true;
    });

    try {
      final apiClient = ref.read(apiClientProvider);
      await apiClient.buyCash(
        productId: selectedProductId!,
        quantity: quantity,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('캐시 충전이 완료되었습니다')),
        );
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('충전 실패: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final productsAsync = ref.watch(cashProductsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('캐시 충전'),
      ),
      body: productsAsync.when(
        data: (products) {
          final selectedProduct = products.firstWhere(
            (p) => p['id'] == selectedProductId,
            orElse: () => <String, dynamic>{},
          );
          final totalAmount = (selectedProduct['price'] ?? 0) * quantity;

          return Column(
            children: [
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '충전 금액 선택',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 16),

                      // Product selection grid
                      GridView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          childAspectRatio: 1.5,
                          crossAxisSpacing: 12,
                          mainAxisSpacing: 12,
                        ),
                        itemCount: products.length,
                        itemBuilder: (context, index) {
                          final product = products[index];
                          final isSelected = selectedProductId == product['id'];

                          return Card(
                            color: isSelected ? AppColors.inkBlack : Colors.white,
                            child: InkWell(
                              onTap: () {
                                setState(() {
                                  selectedProductId = product['id'];
                                });
                              },
                              borderRadius: BorderRadius.circular(12),
                              child: Center(
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(
                                      Icons.account_balance_wallet,
                                      color: isSelected ? AppColors.gold : AppColors.inkBlack,
                                      size: 32,
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      product['name'] ?? '',
                                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                            color: isSelected ? AppColors.hanji : AppColors.inkBlack,
                                          ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          );
                        },
                      ),

                      const SizedBox(height: 32),

                      // Quantity selector
                      if (selectedProductId != null) ...[
                        Text(
                          '수량',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        const SizedBox(height: 12),
                        Card(
                          child: Padding(
                            padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                IconButton(
                                  onPressed: quantity > 1
                                      ? () {
                                          setState(() {
                                            quantity--;
                                          });
                                        }
                                      : null,
                                  icon: const Icon(Icons.remove_circle_outline),
                                  iconSize: 32,
                                ),
                                Text(
                                  '$quantity',
                                  style: Theme.of(context).textTheme.headlineSmall,
                                ),
                                IconButton(
                                  onPressed: () {
                                    setState(() {
                                      quantity++;
                                    });
                                  },
                                  icon: const Icon(Icons.add_circle_outline),
                                  iconSize: 32,
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 32),

                        // Total amount
                        Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: AppColors.lotusPink.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppColors.lotusPink),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                '총 결제 금액',
                                style: Theme.of(context).textTheme.titleLarge,
                              ),
                              Text(
                                '${totalAmount.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')}원',
                                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                                      color: AppColors.darkRed,
                                      fontWeight: FontWeight.bold,
                                    ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),

              // Purchase button
              SafeArea(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      onPressed: isLoading || selectedProductId == null ? null : _buyCash,
                      child: isLoading
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                              ),
                            )
                          : const Text('충전하기'),
                    ),
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
              Text('상품을 불러올 수 없습니다: $err'),
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
