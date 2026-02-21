import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/api_client.dart';
import '../../shared/theme.dart';

final disputeListProvider =
    FutureProvider<Map<String, dynamic>>((ref) async {
  final apiClient = ref.read(apiClientProvider);
  final response = await apiClient.getMyDisputes();
  return response.data as Map<String, dynamic>;
});

class DisputeListScreen extends ConsumerWidget {
  const DisputeListScreen({super.key});

  String _getStatusLabel(String status) {
    switch (status) {
      case 'OPEN':
        return '접수됨';
      case 'IN_REVIEW':
        return '검토중';
      case 'RESOLVED':
        return '해결됨';
      case 'CLOSED':
        return '종료';
      default:
        return status;
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'OPEN':
        return AppColors.gold;
      case 'IN_REVIEW':
        return const Color(0xFF1565C0);
      case 'RESOLVED':
        return AppColors.success;
      case 'CLOSED':
        return AppColors.textSecondary;
      default:
        return AppColors.textSecondary;
    }
  }

  String _getCategoryLabel(String category) {
    switch (category) {
      case 'SERVICE_QUALITY':
        return '서비스 품질';
      case 'BILLING':
        return '결제 문제';
      case 'TECHNICAL':
        return '기술 문제';
      case 'COUNSELOR_BEHAVIOR':
        return '상담사 행동';
      case 'OTHER':
        return '기타';
      default:
        return category;
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final disputeAsync = ref.watch(disputeListProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('분쟁 내역'),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/dispute/create'),
        backgroundColor: AppColors.gold,
        foregroundColor: AppColors.inkBlack,
        icon: const Icon(Icons.add),
        label: Text(
          '분쟁 신청',
          style: GoogleFonts.notoSans(fontWeight: FontWeight.w600),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(disputeListProvider),
        child: disputeAsync.when(
          data: (data) {
            final disputes =
                List<Map<String, dynamic>>.from(data['disputes'] ?? []);

            if (disputes.isEmpty) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.gavel,
                      size: 48,
                      color: AppColors.textSecondary.withOpacity(0.5),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      '분쟁 내역이 없습니다',
                      style: GoogleFonts.notoSerif(
                        fontSize: 16,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              );
            }

            return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: disputes.length,
              itemBuilder: (context, index) {
                final dispute = disputes[index];
                final status = (dispute['status'] ?? '') as String;
                final category = (dispute['category'] ?? '') as String;
                final createdAt = dispute['createdAt']?.toString();

                String dateStr = '';
                if (createdAt != null) {
                  try {
                    final dt = DateTime.parse(createdAt);
                    dateStr =
                        '${dt.year}.${dt.month.toString().padLeft(2, '0')}.${dt.day.toString().padLeft(2, '0')}';
                  } catch (_) {
                    dateStr = createdAt;
                  }
                }

                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(12),
                    onTap: () => context.push('/dispute/${dispute['id']}'),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: _getStatusColor(status)
                                      .withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  _getStatusLabel(status),
                                  style: GoogleFonts.notoSans(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: _getStatusColor(status),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: AppColors.border.withOpacity(0.3),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  _getCategoryLabel(category),
                                  style: GoogleFonts.notoSans(
                                    fontSize: 12,
                                    color: AppColors.textSecondary,
                                  ),
                                ),
                              ),
                              const Spacer(),
                              Text(
                                dateStr,
                                style: GoogleFonts.notoSans(
                                  fontSize: 12,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(
                            dispute['description']?.toString() ?? '',
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: GoogleFonts.notoSans(
                              fontSize: 14,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '예약 #${dispute['reservationId']}',
                            style: GoogleFonts.notoSans(
                              fontSize: 12,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            );
          },
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (err, stack) => Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text('분쟁 내역을 불러올 수 없습니다'),
                const SizedBox(height: 8),
                ElevatedButton(
                  onPressed: () => ref.invalidate(disputeListProvider),
                  child: const Text('다시 시도'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
