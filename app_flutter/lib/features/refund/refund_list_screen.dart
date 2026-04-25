import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../shared/theme.dart';
import '../../shared/typography.dart';
import '../../shared/widgets/zeom_app_bar.dart';
import '../../shared/widgets/zeom_avatar.dart';
import '../../shared/widgets/zeom_button.dart';

/// S16b — 환불 이력. View-layer rewrite per MOBILE_DESIGN_PLAN.md §3.16.
/// Seed data only; API wiring intentionally deferred to a later phase.
class RefundListScreen extends StatelessWidget {
  const RefundListScreen({super.key});

  static final List<_RefundItem> _seed = <_RefundItem>[
    _RefundItem(
      counselorName: '지혜 상담사',
      counselorInitials: '지',
      reason: '연결 품질 문제',
      amount: 60000,
      status: _RefundStatus.review,
      date: DateTime.now().subtract(const Duration(days: 1)),
    ),
    _RefundItem(
      counselorName: '현우 상담사',
      counselorInitials: '현',
      reason: '단순 변심',
      amount: 30000,
      status: _RefundStatus.approved,
      date: DateTime.now().subtract(const Duration(days: 6)),
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.hanji,
      appBar: const ZeomAppBar(title: '환불 이력'),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
              itemCount: _seed.length,
              itemBuilder: (context, i) => _RefundCard(item: _seed[i]),
            ),
          ),
          Padding(
            padding: EdgeInsets.fromLTRB(
              20,
              8,
              20,
              MediaQuery.of(context).padding.bottom + 20,
            ),
            child: ZeomButton(
              label: '환불 요청',
              variant: ZeomButtonVariant.primary,
              size: ZeomButtonSize.md,
              width: double.infinity,
              onPressed: () => context.push('/refund/request'),
            ),
          ),
        ],
      ),
    );
  }
}

enum _RefundStatus { received, review, approved, rejected }

class _RefundItem {
  final String counselorName;
  final String counselorInitials;
  final String reason;
  final int amount;
  final _RefundStatus status;
  final DateTime date;

  const _RefundItem({
    required this.counselorName,
    required this.counselorInitials,
    required this.reason,
    required this.amount,
    required this.status,
    required this.date,
  });
}

class _RefundCard extends StatelessWidget {
  const _RefundCard({required this.item});

  final _RefundItem item;

  String _formatAmount(int n) {
    final s = n.toString();
    final buf = StringBuffer();
    for (var i = 0; i < s.length; i++) {
      if (i > 0 && (s.length - i) % 3 == 0) buf.write(',');
      buf.write(s[i]);
    }
    return buf.toString();
  }

  String _formatDate(DateTime d) {
    final month = d.month.toString().padLeft(2, '0');
    final day = d.day.toString().padLeft(2, '0');
    return '${d.year}.$month.$day';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.borderSoft, width: 1),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ZeomAvatar(initials: item.counselorInitials, size: 40),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.counselorName,
                  style: ZeomType.cardTitle,
                ),
                const SizedBox(height: 2),
                Text(
                  '${item.reason} · ${_formatAmount(item.amount)} 캐시',
                  style: ZeomType.meta.copyWith(
                    color: AppColors.ink3,
                    fontFeatures: kTabularNums,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              _StatusPill(status: item.status),
              const SizedBox(height: 4),
              Text(
                _formatDate(item.date),
                style: ZeomType.meta.copyWith(
                  color: AppColors.ink3,
                  fontFeatures: kTabularNums,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _StatusPill extends StatelessWidget {
  const _StatusPill({required this.status});

  final _RefundStatus status;

  @override
  Widget build(BuildContext context) {
    late final Color bg;
    late final Color fg;
    late final String label;
    switch (status) {
      case _RefundStatus.received:
        bg = AppColors.goldBg;
        fg = AppColors.gold;
        label = '접수';
        break;
      case _RefundStatus.review:
        bg = AppColors.hanjiDeep;
        fg = AppColors.ink2;
        label = '검토 중';
        break;
      case _RefundStatus.approved:
        bg = const Color.fromRGBO(45, 80, 22, 0.1);
        fg = AppColors.jadeSuccess;
        label = '승인';
        break;
      case _RefundStatus.rejected:
        bg = const Color.fromRGBO(139, 0, 0, 0.1);
        fg = AppColors.darkRed;
        label = '거절';
        break;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: ZeomType.tag.copyWith(color: fg),
      ),
    );
  }
}
