import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/api_client.dart';
import '../../shared/theme.dart';

final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());

final bookingsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final apiClient = ref.read(apiClientProvider);
  try {
    final response = await apiClient.getMyBookings();
    final data = response.data as List;
    return data.cast<Map<String, dynamic>>();
  } catch (e) {
    // Return mock data if API fails
    return [
      {
        'id': 1,
        'counselorName': '이지혜 상담사',
        'slotStart': '2026-02-20T14:00:00',
        'channel': 'VIDEO',
        'status': 'CONFIRMED',
        'price': 30000,
      },
      {
        'id': 2,
        'counselorName': '박미영 상담사',
        'slotStart': '2026-02-18T10:00:00',
        'channel': 'VOICE',
        'status': 'PENDING',
        'price': 30000,
      },
    ];
  }
});

class BookingListScreen extends ConsumerWidget {
  const BookingListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bookingsAsync = ref.watch(bookingsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('예약 내역'),
      ),
      body: bookingsAsync.when(
        data: (bookings) {
          if (bookings.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.event_busy,
                    size: 64,
                    color: AppColors.textSecondary.withOpacity(0.5),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    '예약 내역이 없습니다',
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () => context.go('/counselors'),
                    child: const Text('상담사 둘러보기'),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(bookingsProvider);
            },
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: bookings.length,
              itemBuilder: (context, index) {
                final booking = bookings[index];
                return _BookingCard(booking: booking);
              },
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('오류가 발생했습니다: $err'),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => ref.invalidate(bookingsProvider),
                child: const Text('다시 시도'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _BookingCard extends StatelessWidget {
  final Map<String, dynamic> booking;

  const _BookingCard({required this.booking});

  Color _getStatusColor(String status) {
    switch (status) {
      case 'CONFIRMED':
        return AppColors.success;
      case 'PENDING':
        return AppColors.gold;
      case 'CANCELLED':
        return AppColors.error;
      default:
        return AppColors.textSecondary;
    }
  }

  String _getStatusText(String status) {
    switch (status) {
      case 'CONFIRMED':
        return '확정';
      case 'PENDING':
        return '대기중';
      case 'CANCELLED':
        return '취소됨';
      default:
        return status;
    }
  }

  @override
  Widget build(BuildContext context) {
    final slotDateTime = DateTime.parse(booking['slotStart']);
    final now = DateTime.now();
    final isPast = slotDateTime.isBefore(now);

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () {
          // Navigate to preflight check before consultation
          if (!isPast && booking['status'] == 'CONFIRMED') {
            context.push('/consultation/${booking['id']}/preflight');
          }
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      booking['counselorName'] ?? '상담사',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      color: _getStatusColor(booking['status'] ?? 'PENDING').withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: _getStatusColor(booking['status'] ?? 'PENDING'),
                      ),
                    ),
                    child: Text(
                      _getStatusText(booking['status'] ?? 'PENDING'),
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: _getStatusColor(booking['status'] ?? 'PENDING'),
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Icon(
                    Icons.calendar_today,
                    size: 16,
                    color: AppColors.textSecondary,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    '${slotDateTime.year}년 ${slotDateTime.month}월 ${slotDateTime.day}일',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  const SizedBox(width: 16),
                  Icon(
                    Icons.access_time,
                    size: 16,
                    color: AppColors.textSecondary,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    '${slotDateTime.hour}:${slotDateTime.minute.toString().padLeft(2, '0')}',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Icon(
                    booking['channel'] == 'VIDEO' ? Icons.videocam : Icons.phone,
                    size: 16,
                    color: AppColors.textSecondary,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    booking['channel'] == 'VIDEO' ? '영상 통화' : '음성 통화',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  const Spacer(),
                  Text(
                    '${booking['price']}원',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

