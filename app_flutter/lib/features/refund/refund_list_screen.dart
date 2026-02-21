import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/api_client.dart';
import '../../shared/theme.dart';

final refundsProvider =
    FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final apiClient = ref.read(apiClientProvider);
  final response = await apiClient.getMyRefunds();
  final data = response.data as Map<String, dynamic>;
  final refunds = data['refunds'] as List? ?? [];
  return refunds.cast<Map<String, dynamic>>();
});

class RefundListScreen extends ConsumerWidget {
  const RefundListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final refundsAsync = ref.watch(refundsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('환불 내역'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => context.push('/refund/request'),
          ),
        ],
      ),
      body: refundsAsync.when(
        data: (refunds) {
          if (refunds.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.receipt_long,
                    size: 64,
                    color: AppColors.textSecondary.withOpacity( 0.5),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    '환불 내역이 없습니다',
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () => context.push('/refund/request'),
                    child: const Text('환불 신청하기'),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(refundsProvider);
            },
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: refunds.length,
              itemBuilder: (context, index) {
                final refund = refunds[index];
                return _RefundCard(refund: refund);
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
                onPressed: () => ref.invalidate(refundsProvider),
                child: const Text('다시 시도'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RefundCard extends StatelessWidget {
  final Map<String, dynamic> refund;

  const _RefundCard({required this.refund});

  Color _getStatusColor(String status) {
    switch (status) {
      case 'APPROVED':
        return AppColors.success;
      case 'PENDING':
        return AppColors.gold;
      case 'REJECTED':
        return AppColors.error;
      default:
        return AppColors.textSecondary;
    }
  }

  String _getStatusText(String status) {
    switch (status) {
      case 'APPROVED':
        return '승인됨';
      case 'PENDING':
        return '검토중';
      case 'REJECTED':
        return '거부됨';
      default:
        return status;
    }
  }

  @override
  Widget build(BuildContext context) {
    final createdAtStr = refund['createdAt'] as String?;
    final createdAt =
        createdAtStr != null ? DateTime.tryParse(createdAtStr) : null;
    final status = refund['status'] as String? ?? 'PENDING';

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
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
                    '예약 #${refund['reservationId'] ?? ''}',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(
                    color: _getStatusColor(status).withOpacity( 0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: _getStatusColor(status),
                    ),
                  ),
                  child: Text(
                    _getStatusText(status),
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: _getStatusColor(status),
                          fontWeight: FontWeight.w600,
                        ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              '사유: ${refund['reason'] ?? ''}',
              style: Theme.of(context).textTheme.bodyMedium,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            if (refund['adminNote'] != null &&
                (refund['adminNote'] as String).isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(
                '관리자 메모: ${refund['adminNote']}',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      fontStyle: FontStyle.italic,
                    ),
              ),
            ],
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                if (createdAt != null)
                  Text(
                    '신청일: ${createdAt.year}.${createdAt.month}.${createdAt.day}',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                if (refund['amount'] != null)
                  Text(
                    '환불액: ${refund['amount']}원',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: AppColors.darkRed,
                        ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
