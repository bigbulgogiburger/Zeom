import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/api_client.dart';
import '../../shared/theme.dart';

final bookingsForRefundProvider =
    FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final apiClient = ref.read(apiClientProvider);
  final response = await apiClient.getMyBookings();
  final data = response.data as List;
  // Filter only confirmed bookings that can be refunded
  return data
      .where((b) => b['status'] == 'CONFIRMED')
      .toList()
      .cast<Map<String, dynamic>>();
});

class RefundRequestScreen extends ConsumerStatefulWidget {
  const RefundRequestScreen({super.key});

  @override
  ConsumerState<RefundRequestScreen> createState() =>
      _RefundRequestScreenState();
}

class _RefundRequestScreenState extends ConsumerState<RefundRequestScreen> {
  int? _selectedReservationId;
  final _reasonController = TextEditingController();
  bool _isLoading = false;

  @override
  void dispose() {
    _reasonController.dispose();
    super.dispose();
  }

  Future<void> _submitRefund() async {
    if (_selectedReservationId == null) {
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
      // Backend API: POST /api/v1/refunds with { reservationId, reason }
      await apiClient.dio.post('/api/v1/refunds', data: {
        'reservationId': _selectedReservationId,
        'reason': _reasonController.text.trim(),
      });

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

    return Scaffold(
      appBar: AppBar(
        title: const Text('환불 신청'),
      ),
      body: bookingsAsync.when(
        data: (bookings) {
          return SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Info banner
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.lotusPink.withOpacity( 0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppColors.lotusPink),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.info_outline,
                          color: AppColors.lotusPink),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          '환불 신청 후 관리자 검토를 거쳐 처리됩니다.',
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                      ),
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
                    final bookingId = booking['id'] as int?;
                    final isSelected = _selectedReservationId == bookingId;
                    final slotStartStr = booking['slotStart'] as String?;
                    final slotStart = slotStartStr != null
                        ? DateTime.tryParse(slotStartStr)
                        : null;

                    return Card(
                      color: isSelected ? AppColors.inkBlack : Colors.white,
                      margin: const EdgeInsets.only(bottom: 8),
                      child: InkWell(
                        onTap: () {
                          setState(() {
                            _selectedReservationId = bookingId;
                          });
                        },
                        borderRadius: BorderRadius.circular(12),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                booking['counselorName'] ??
                                    '상담사 #${booking['counselorId'] ?? ''}',
                                style: Theme.of(context)
                                    .textTheme
                                    .titleLarge
                                    ?.copyWith(
                                      color: isSelected
                                          ? AppColors.hanji
                                          : AppColors.inkBlack,
                                    ),
                              ),
                              if (slotStart != null) ...[
                                const SizedBox(height: 8),
                                Text(
                                  '${slotStart.year}년 ${slotStart.month}월 ${slotStart.day}일 ${slotStart.hour}:${slotStart.minute.toString().padLeft(2, '0')}',
                                  style: Theme.of(context)
                                      .textTheme
                                      .bodyMedium
                                      ?.copyWith(
                                        color: isSelected
                                            ? AppColors.hanji
                                                .withOpacity( 0.8)
                                            : AppColors.textSecondary,
                                      ),
                                ),
                              ],
                              if (booking['price'] != null) ...[
                                const SizedBox(height: 4),
                                Text(
                                  '결제 금액: ${booking['price']}원',
                                  style: Theme.of(context)
                                      .textTheme
                                      .bodyMedium
                                      ?.copyWith(
                                        color: isSelected
                                            ? AppColors.gold
                                            : AppColors.inkBlack,
                                      ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ),
                    );
                  }),

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
                              valueColor:
                                  AlwaysStoppedAnimation<Color>(Colors.white),
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
