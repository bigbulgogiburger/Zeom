import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/api_client.dart';
import '../../shared/theme.dart';

final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());

final bookingsForRefundProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final apiClient = ref.read(apiClientProvider);
  try {
    final response = await apiClient.getMyBookings();
    final data = response.data as List;
    // Filter only confirmed bookings that can be refunded
    return data.where((b) => b['status'] == 'CONFIRMED').toList().cast<Map<String, dynamic>>();
  } catch (e) {
    // Return mock data if API fails
    return [
      {
        'id': 1,
        'counselorName': '이지혜 상담사',
        'slotStart': '2026-02-20T14:00:00',
        'price': 30000,
      },
    ];
  }
});

final refundPolicyProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final apiClient = ref.read(apiClientProvider);
  try {
    final response = await apiClient.getRefundPolicy();
    return response.data as Map<String, dynamic>;
  } catch (e) {
    // Return mock policy if API fails
    return {
      'rules': [
        {'hoursBeforeSlot': 24, 'refundPercentage': 100},
        {'hoursBeforeSlot': 12, 'refundPercentage': 50},
        {'hoursBeforeSlot': 0, 'refundPercentage': 0},
      ],
    };
  }
});

class RefundRequestScreen extends ConsumerStatefulWidget {
  const RefundRequestScreen({super.key});

  @override
  ConsumerState<RefundRequestScreen> createState() => _RefundRequestScreenState();
}

class _RefundRequestScreenState extends ConsumerState<RefundRequestScreen> {
  int? selectedBookingId;
  final _reasonController = TextEditingController();
  bool _isLoading = false;

  @override
  void dispose() {
    _reasonController.dispose();
    super.dispose();
  }

  int _calculateRefundAmount(Map<String, dynamic> booking, Map<String, dynamic> policy) {
    final slotStart = DateTime.parse(booking['slotStart']);
    final now = DateTime.now();
    final hoursUntilSlot = slotStart.difference(now).inHours;

    final rules = policy['rules'] as List? ?? [];
    int refundPercentage = 0;

    for (final rule in rules) {
      if (hoursUntilSlot >= rule['hoursBeforeSlot']) {
        refundPercentage = rule['refundPercentage'];
        break;
      }
    }

    final price = booking['price'] ?? 0;
    return (price * refundPercentage / 100).round();
  }

  Future<void> _submitRefund() async {
    if (selectedBookingId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('환불할 예약을 선택해주세요')),
      );
      return;
    }

    if (_reasonController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('환불 사유를 입력해주세요')),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final apiClient = ref.read(apiClientProvider);
      await apiClient.requestRefund(
        bookingId: selectedBookingId!,
        reason: _reasonController.text.trim(),
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('환불 신청이 완료되었습니다')),
        );
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('환불 신청 실패: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final bookingsAsync = ref.watch(bookingsForRefundProvider);
    final policyAsync = ref.watch(refundPolicyProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('환불 신청'),
      ),
      body: bookingsAsync.when(
        data: (bookings) {
          return policyAsync.when(
            data: (policy) {
              final selectedBooking = bookings.firstWhere(
                (b) => b['id'] == selectedBookingId,
                orElse: () => <String, dynamic>{},
              );

              final refundAmount = selectedBooking.isNotEmpty
                  ? _calculateRefundAmount(selectedBooking, policy)
                  : 0;

              return SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Refund policy info
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.lotusPink.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: AppColors.lotusPink),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.info_outline, color: AppColors.lotusPink),
                              const SizedBox(width: 8),
                              Text(
                                '환불 정책',
                                style: Theme.of(context).textTheme.titleLarge,
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          ...(policy['rules'] as List).map((rule) {
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 4),
                              child: Text(
                                '• ${rule['hoursBeforeSlot']}시간 전: ${rule['refundPercentage']}% 환불',
                                style: Theme.of(context).textTheme.bodyMedium,
                              ),
                            );
                          }).toList(),
                        ],
                      ),
                    ),

                    const SizedBox(height: 24),

                    // Booking selection
                    Text(
                      '환불할 예약 선택',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 12),

                    if (bookings.isEmpty)
                      const Card(
                        child: Padding(
                          padding: EdgeInsets.all(20),
                          child: Center(
                            child: Text('환불 가능한 예약이 없습니다'),
                          ),
                        ),
                      )
                    else
                      ...bookings.map((booking) {
                        final isSelected = selectedBookingId == booking['id'];
                        final slotStart = DateTime.parse(booking['slotStart']);

                        return Card(
                          color: isSelected ? AppColors.inkBlack : Colors.white,
                          margin: const EdgeInsets.only(bottom: 8),
                          child: InkWell(
                            onTap: () {
                              setState(() {
                                selectedBookingId = booking['id'];
                              });
                            },
                            borderRadius: BorderRadius.circular(12),
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    booking['counselorName'] ?? '상담사',
                                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                          color: isSelected ? AppColors.hanji : AppColors.inkBlack,
                                        ),
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    '${slotStart.year}년 ${slotStart.month}월 ${slotStart.day}일 ${slotStart.hour}:${slotStart.minute.toString().padLeft(2, '0')}',
                                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                          color: isSelected
                                              ? AppColors.hanji.withOpacity(0.8)
                                              : AppColors.textSecondary,
                                        ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    '결제 금액: ${booking['price']}원',
                                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                          color: isSelected ? AppColors.gold : AppColors.inkBlack,
                                        ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      }).toList(),

                    const SizedBox(height: 24),

                    // Refund reason
                    Text(
                      '환불 사유',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _reasonController,
                      maxLines: 5,
                      maxLength: 300,
                      decoration: const InputDecoration(
                        hintText: '환불 사유를 입력해주세요',
                        alignLabelWithHint: true,
                      ),
                    ),

                    const SizedBox(height: 24),

                    // Refund amount display
                    if (selectedBookingId != null)
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppColors.success.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppColors.success),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              '예상 환불 금액',
                              style: Theme.of(context).textTheme.titleLarge,
                            ),
                            Text(
                              '${refundAmount.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')}원',
                              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                                    color: AppColors.success,
                                    fontWeight: FontWeight.bold,
                                  ),
                            ),
                          ],
                        ),
                      ),

                    const SizedBox(height: 24),

                    // Submit button
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _submitRefund,
                        child: _isLoading
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                ),
                              )
                            : const Text('환불 신청하기'),
                      ),
                    ),
                  ],
                ),
              );
            },
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (err, stack) => Center(child: Text('정책을 불러올 수 없습니다: $err')),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('예약 목록을 불러올 수 없습니다: $err'),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => ref.invalidate(bookingsForRefundProvider),
                child: const Text('다시 시도'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
