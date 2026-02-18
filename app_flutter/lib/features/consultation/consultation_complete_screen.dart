import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/api_client.dart';
import '../../shared/theme.dart';

final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());

final settlementProvider =
    FutureProvider.family<Map<String, dynamic>?, int>((ref, sessionId) async {
  final apiClient = ref.read(apiClientProvider);
  try {
    final response = await apiClient.getSettlementBySession(sessionId);
    return response.data as Map<String, dynamic>;
  } catch (_) {
    return null;
  }
});

class ConsultationCompleteScreen extends ConsumerWidget {
  final int bookingId;
  final int? sessionId;

  const ConsultationCompleteScreen({
    super.key,
    required this.bookingId,
    this.sessionId,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settlementAsync =
        sessionId != null ? ref.watch(settlementProvider(sessionId!)) : null;

    return Scaffold(
      appBar: AppBar(
        title: const Text('상담 완료'),
        automaticallyImplyLeading: false,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const SizedBox(height: 16),

            // Success icon
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: AppColors.success.withOpacity(0.1),
                borderRadius: BorderRadius.circular(40),
              ),
              child: const Icon(
                Icons.check_circle,
                size: 48,
                color: AppColors.success,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              '상담이 종료되었습니다',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 32),

            // Settlement details
            if (settlementAsync != null)
              settlementAsync.when(
                data: (settlement) {
                  if (settlement == null) {
                    return _buildNoSettlement(context);
                  }
                  return _buildSettlementCard(context, settlement);
                },
                loading: () => const Padding(
                  padding: EdgeInsets.all(24),
                  child: CircularProgressIndicator(),
                ),
                error: (_, __) => _buildNoSettlement(context),
              )
            else
              _buildNoSettlement(context),

            const SizedBox(height: 32),

            // Action buttons
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: () {
                  context.push('/consultation/$bookingId/review');
                },
                child: const Text('리뷰 작성'),
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: OutlinedButton(
                onPressed: () {
                  context.push('/consultation/history');
                },
                child: const Text('이력 보기'),
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: TextButton(
                onPressed: () {
                  context.go('/home');
                },
                child: const Text('홈으로'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNoSettlement(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Icon(
              Icons.receipt_long,
              size: 40,
              color: AppColors.textSecondary.withOpacity(0.5),
            ),
            const SizedBox(height: 12),
            Text(
              '정산 정보를 불러올 수 없습니다',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textSecondary,
                  ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSettlementCard(
      BuildContext context, Map<String, dynamic> settlement) {
    final creditsReserved = settlement['creditsReserved'] as int? ?? 0;
    final creditsConsumed = settlement['creditsConsumed'] as int? ?? 0;
    final creditsRefunded = settlement['creditsRefunded'] as int? ?? 0;
    final actualDurationSec = settlement['actualDurationSec'] as int? ?? 0;
    final settlementType = settlement['settlementType'] as String? ?? '';

    final durationMin = (actualDurationSec / 60).ceil();

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.receipt_long, color: AppColors.gold),
                const SizedBox(width: 8),
                Text(
                  '정산 내역',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
              ],
            ),
            const Divider(height: 24),

            _SettlementRow(
              label: '상담 시간',
              value: '$durationMin분',
            ),
            const SizedBox(height: 8),
            _SettlementRow(
              label: '예약 크레딧',
              value: '$creditsReserved 크레딧',
            ),
            const SizedBox(height: 8),
            _SettlementRow(
              label: '사용 크레딧',
              value: '$creditsConsumed 크레딧',
              valueColor: AppColors.textPrimary,
            ),

            if (creditsRefunded > 0) ...[
              const SizedBox(height: 8),
              _SettlementRow(
                label: '환불 크레딧',
                value: '+$creditsRefunded 크레딧',
                valueColor: AppColors.success,
              ),
            ],

            const SizedBox(height: 12),
            _buildSettlementTypeBadge(context, settlementType),
          ],
        ),
      ),
    );
  }

  Widget _buildSettlementTypeBadge(BuildContext context, String type) {
    String label;
    Color color;

    switch (type) {
      case 'NORMAL':
        label = '정상 종료';
        color = AppColors.success;
      case 'TIMEOUT':
        label = '시간 초과';
        color = AppColors.gold;
      case 'NETWORK_SHORT':
        label = '네트워크 오류 (전액 환불)';
        color = AppColors.error;
      case 'NETWORK_PARTIAL':
        label = '네트워크 오류 (부분 환불)';
        color = AppColors.error;
      case 'ADMIN_REFUND':
        label = '관리자 환불';
        color = AppColors.textSecondary;
      default:
        label = type;
        color = AppColors.textSecondary;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withOpacity(0.3)),
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

class _SettlementRow extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;

  const _SettlementRow({
    required this.label,
    required this.value,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppColors.textSecondary,
              ),
        ),
        Text(
          value,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.w600,
                color: valueColor,
              ),
        ),
      ],
    );
  }
}
