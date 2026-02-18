import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/api_client.dart';
import '../../shared/theme.dart';

final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());

final consultationHistoryProvider =
    FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final apiClient = ref.read(apiClientProvider);
  try {
    final response = await apiClient.getMySettlements();
    final data = response.data as Map<String, dynamic>;
    final settlements = data['settlements'] as List? ?? [];
    return settlements.cast<Map<String, dynamic>>();
  } catch (e) {
    return [];
  }
});

class ConsultationHistoryScreen extends ConsumerWidget {
  const ConsultationHistoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final historyAsync = ref.watch(consultationHistoryProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('상담 내역'),
      ),
      body: historyAsync.when(
        data: (history) {
          if (history.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.history,
                    size: 64,
                    color: AppColors.textSecondary.withOpacity(0.5),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    '상담 내역이 없습니다',
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(consultationHistoryProvider);
            },
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: history.length,
              itemBuilder: (context, index) {
                final settlement = history[index];
                return _ConsultationHistoryCard(settlement: settlement);
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
                onPressed: () => ref.invalidate(consultationHistoryProvider),
                child: const Text('다시 시도'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ConsultationHistoryCard extends StatelessWidget {
  final Map<String, dynamic> settlement;

  const _ConsultationHistoryCard({required this.settlement});

  @override
  Widget build(BuildContext context) {
    final settledAtStr = settlement['settledAt'] as String?;
    final settledAt =
        settledAtStr != null ? DateTime.tryParse(settledAtStr) : null;
    final creditsConsumed = settlement['creditsConsumed'] as int? ?? 0;
    final creditsRefunded = settlement['creditsRefunded'] as int? ?? 0;
    final actualDurationSec = settlement['actualDurationSec'] as int? ?? 0;
    final settlementType = settlement['settlementType'] as String? ?? '';
    final bookingId = settlement['bookingId'] as int?;

    final durationMin = (actualDurationSec / 60).ceil();

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Date and type
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                if (settledAt != null)
                  Text(
                    '${settledAt.year}년 ${settledAt.month}월 ${settledAt.day}일',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                _buildTypeBadge(context, settlementType),
              ],
            ),
            const SizedBox(height: 12),

            // Duration
            Row(
              children: [
                const Icon(Icons.timer, size: 16, color: AppColors.textSecondary),
                const SizedBox(width: 8),
                Text(
                  '$durationMin분',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ],
            ),
            const SizedBox(height: 8),

            // Credits consumed
            Row(
              children: [
                const Icon(Icons.credit_card,
                    size: 16, color: AppColors.textSecondary),
                const SizedBox(width: 8),
                Text(
                  '사용: $creditsConsumed 크레딧',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                if (creditsRefunded > 0) ...[
                  const SizedBox(width: 12),
                  Text(
                    '환불: +$creditsRefunded',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppColors.success,
                          fontWeight: FontWeight.w600,
                        ),
                  ),
                ],
              ],
            ),

            if (bookingId != null) ...[
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () {
                    context.push('/consultation/$bookingId/review');
                  },
                  child: const Text('리뷰 작성하기'),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildTypeBadge(BuildContext context, String type) {
    String label;
    Color color;

    switch (type) {
      case 'NORMAL':
        label = '정상';
        color = AppColors.success;
      case 'TIMEOUT':
        label = '시간초과';
        color = AppColors.gold;
      case 'NETWORK_SHORT':
      case 'NETWORK_PARTIAL':
      case 'NETWORK':
        label = '네트워크';
        color = AppColors.error;
      case 'ADMIN_REFUND':
        label = '관리자';
        color = AppColors.textSecondary;
      default:
        label = type.isNotEmpty ? type : '기타';
        color = AppColors.textSecondary;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: color,
              fontWeight: FontWeight.w600,
            ),
      ),
    );
  }
}
