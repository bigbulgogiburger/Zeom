import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/api_client.dart';
import '../../shared/theme.dart';

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

final sessionDataProvider =
    FutureProvider.family<Map<String, dynamic>?, int>((ref, sessionId) async {
  final apiClient = ref.read(apiClientProvider);
  try {
    final response = await apiClient.dio.get('/api/v1/sessions/$sessionId');
    return response.data as Map<String, dynamic>;
  } catch (_) {
    return null;
  }
});

String _formatDuration(int seconds) {
  final mins = seconds ~/ 60;
  final secs = seconds % 60;
  if (mins == 0) return '$secs초';
  return secs > 0 ? '$mins분 $secs초' : '$mins분';
}

String _formatDateTime(String? isoString) {
  if (isoString == null) return '';
  try {
    final dt = DateTime.parse(isoString);
    return '${dt.year}년 ${dt.month}월 ${dt.day}일 '
        '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
  } catch (_) {
    return isoString;
  }
}

String _getEndReasonLabel(String? reason) {
  switch (reason) {
    case 'COMPLETED':
      return '정상 종료';
    case 'TIMEOUT':
      return '시간 만료';
    case 'CLIENT_DISCONNECT':
      return '고객 연결 해제';
    case 'COUNSELOR_DISCONNECT':
      return '상담사 연결 해제';
    case 'ERROR':
      return '오류 발생';
    default:
      return reason ?? '종료';
  }
}

class ConsultationCompleteScreen extends ConsumerWidget {
  final int bookingId;
  final int? sessionId;
  final int? counselorId;

  const ConsultationCompleteScreen({
    super.key,
    required this.bookingId,
    this.sessionId,
    this.counselorId,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settlementAsync =
        sessionId != null ? ref.watch(settlementProvider(sessionId!)) : null;
    final sessionAsync =
        sessionId != null ? ref.watch(sessionDataProvider(sessionId!)) : null;

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

            // Success icon with checkmark (matches React)
            TweenAnimationBuilder<double>(
              tween: Tween(begin: 0.0, end: 1.0),
              duration: const Duration(milliseconds: 600),
              curve: Curves.elasticOut,
              builder: (context, value, child) {
                return Transform.scale(
                  scale: value,
                  child: child,
                );
              },
              child: Container(
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
            ),
            const SizedBox(height: 16),
            Text(
              '상담이 종료되었습니다',
              style: GoogleFonts.notoSerif(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),

            // End reason badge (matches React)
            if (sessionAsync != null)
              sessionAsync.when(
                data: (session) {
                  if (session == null) return const SizedBox.shrink();
                  final endReason = session['endReason'] as String?;
                  if (endReason == null) return const SizedBox.shrink();
                  return Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.textSecondary.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Text(
                        _getEndReasonLabel(endReason),
                        style: GoogleFonts.notoSans(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ),
                  );
                },
                loading: () => const SizedBox.shrink(),
                error: (_, __) => const SizedBox.shrink(),
              ),

            const SizedBox(height: 24),

            // Session summary card (matches React)
            if (sessionAsync != null)
              sessionAsync.when(
                data: (session) {
                  if (session == null) return const SizedBox.shrink();
                  return Card(
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '상담 요약',
                            style: GoogleFonts.notoSerif(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          const Divider(height: 24),
                          _SummaryRow(
                            label: '시작 시간',
                            value: _formatDateTime(
                                session['startedAt']?.toString()),
                          ),
                          if (session['endedAt'] != null) ...[
                            const SizedBox(height: 8),
                            _SummaryRow(
                              label: '종료 시간',
                              value: _formatDateTime(
                                  session['endedAt']?.toString()),
                            ),
                          ],
                          if (session['durationSec'] != null &&
                              (session['durationSec'] as num) > 0) ...[
                            const SizedBox(height: 8),
                            _SummaryRow(
                              label: '실제 상담 시간',
                              value: _formatDuration(
                                  (session['durationSec'] as num).toInt()),
                              valueColor: AppColors.gold,
                              valueBold: true,
                            ),
                          ],
                        ],
                      ),
                    ),
                  );
                },
                loading: () => const Padding(
                  padding: EdgeInsets.all(24),
                  child: CircularProgressIndicator(),
                ),
                error: (_, __) => const SizedBox.shrink(),
              ),

            const SizedBox(height: 12),

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

            // Action buttons (matches React: Review, History, Home)
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: () {
                  context.push(
                    '/consultation/$bookingId/review',
                    extra: {'counselorId': counselorId},
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.gold,
                  foregroundColor: AppColors.inkBlack,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: Text(
                  '리뷰 작성하기',
                  style: GoogleFonts.notoSerif(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
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
                child: const Text('상담 이용 내역'),
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
              '정산 정보가 아직 처리 중입니다.',
              style: GoogleFonts.notoSans(
                fontSize: 14,
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              '잠시 후 다시 확인해주세요.',
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

  Widget _buildSettlementCard(
      BuildContext context, Map<String, dynamic> settlement) {
    final creditsReserved = settlement['creditsReserved'] as int? ?? 0;
    final creditsConsumed = settlement['creditsConsumed'] as int? ?? 0;
    final creditsRefunded = settlement['creditsRefunded'] as int? ?? 0;
    final actualDurationSec = settlement['actualDurationSec'] as int? ?? 0;
    final settlementType = settlement['settlementType'] as String? ?? '';

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
                  '정산 결과',
                  style: GoogleFonts.notoSerif(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
            const Divider(height: 24),

            _SummaryRow(
              label: '예약 상담권',
              value: '$creditsReserved회',
            ),
            const SizedBox(height: 8),
            _SummaryRow(
              label: '사용 상담권',
              value: '$creditsConsumed회',
              valueBold: true,
            ),
            if (creditsRefunded > 0) ...[
              const SizedBox(height: 8),
              _SummaryRow(
                label: '환불 상담권',
                value: '$creditsRefunded회',
                valueColor: AppColors.success,
                valueBold: true,
              ),
            ],
            const Divider(height: 24),
            _SummaryRow(
              label: '실제 상담 시간',
              value: _formatDuration(actualDurationSec),
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '정산 유형',
                  style: GoogleFonts.notoSans(
                    fontSize: 14,
                    color: AppColors.textSecondary,
                  ),
                ),
                _buildSettlementTypeBadge(context, settlementType),
              ],
            ),
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
        label = '정상';
        color = AppColors.success;
      case 'EARLY_END':
        label = '조기 종료';
        color = AppColors.gold;
      case 'TIMEOUT':
        label = '시간 만료';
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
        style: GoogleFonts.notoSans(
          fontSize: 12,
          color: color,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;
  final bool valueBold;

  const _SummaryRow({
    required this.label,
    required this.value,
    this.valueColor,
    this.valueBold = false,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: GoogleFonts.notoSans(
            fontSize: 14,
            color: AppColors.textSecondary,
          ),
        ),
        Text(
          value,
          style: GoogleFonts.notoSans(
            fontSize: 14,
            fontWeight: valueBold ? FontWeight.bold : FontWeight.w500,
            color: valueColor ?? AppColors.textPrimary,
          ),
        ),
      ],
    );
  }
}
