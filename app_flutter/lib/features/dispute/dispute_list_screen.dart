import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../shared/theme.dart';
import '../../shared/typography.dart';
import '../../shared/widgets/zeom_app_bar.dart';
import '../../shared/widgets/zeom_button.dart';

class _DisputeSeed {
  final String id;
  final String category;
  final String date;
  final String status;
  const _DisputeSeed({
    required this.id,
    required this.category,
    required this.date,
    required this.status,
  });
}

const List<_DisputeSeed> _kDisputeSeed = [
  _DisputeSeed(
    id: 'd1',
    category: '부적절한 발언',
    date: '2026-04-15',
    status: '검토 중',
  ),
  _DisputeSeed(
    id: 'd2',
    category: '환불 미이행',
    date: '2026-03-22',
    status: '종결',
  ),
];

class DisputeListScreen extends ConsumerWidget {
  const DisputeListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: AppColors.hanji,
      appBar: const ZeomAppBar(title: '분쟁 이력'),
      body: Stack(
        children: [
          ListView.separated(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 140),
            itemCount: _kDisputeSeed.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final dispute = _kDisputeSeed[index];
              return _DisputeCard(
                dispute: dispute,
                onTap: () => context.push('/dispute/${dispute.id}'),
              );
            },
          ),
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: Container(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
              decoration: BoxDecoration(
                color: AppColors.hanji,
                border: Border(
                  top: BorderSide(color: AppColors.borderSoft),
                ),
              ),
              child: SafeArea(
                top: false,
                child: ZeomButton(
                  label: '분쟁 신고',
                  variant: ZeomButtonVariant.primary,
                  size: ZeomButtonSize.md,
                  width: double.infinity,
                  onPressed: () => context.push('/dispute/create'),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _DisputeCard extends StatelessWidget {
  const _DisputeCard({required this.dispute, required this.onTap});

  final _DisputeSeed dispute;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.borderSoft),
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: AppColors.darkRed.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.report_outlined,
                size: 28,
                color: AppColors.darkRed,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(dispute.category, style: ZeomType.cardTitle),
                  const SizedBox(height: 4),
                  Text(
                    dispute.date,
                    style: ZeomType.meta.copyWith(color: AppColors.ink3),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            _StatusPill(status: dispute.status),
          ],
        ),
      ),
    );
  }
}

class _StatusPill extends StatelessWidget {
  const _StatusPill({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final palette = _paletteFor(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: palette.bg,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        status,
        style: ZeomType.tag.copyWith(
          color: palette.fg,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  _PillPalette _paletteFor(String s) {
    switch (s) {
      case '종결':
        return _PillPalette(
          bg: AppColors.jadeSuccess.withOpacity(0.1),
          fg: AppColors.jadeSuccess,
        );
      case '반려':
        return _PillPalette(
          bg: AppColors.darkRed.withOpacity(0.1),
          fg: AppColors.darkRed,
        );
      case '검토 중':
      default:
        return const _PillPalette(
          bg: AppColors.hanjiDeep,
          fg: AppColors.ink2,
        );
    }
  }
}

class _PillPalette {
  final Color bg;
  final Color fg;
  const _PillPalette({required this.bg, required this.fg});
}
