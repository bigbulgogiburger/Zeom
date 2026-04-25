import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../shared/theme.dart';
import '../../shared/typography.dart';
import '../../shared/widgets/zeom_app_bar.dart';

class DisputeDetailScreen extends ConsumerStatefulWidget {
  final int disputeId;

  const DisputeDetailScreen({super.key, required this.disputeId});

  @override
  ConsumerState<DisputeDetailScreen> createState() =>
      _DisputeDetailScreenState();
}

class _DisputeDetailScreenState extends ConsumerState<DisputeDetailScreen> {
  // Static seed values (view-only rewrite per S17 spec).
  static const String _status = '검토 중';
  static const String _statusDescription = '담당자가 검토하고 있습니다';
  static const String _category = '부적절한 발언';
  static const String _target = '예약 #2024-0412 / 김상담';
  static const String _detail =
      '상담 도중 부적절한 표현과 무례한 태도로 인해 불쾌함을 느꼈습니다. 세션 녹취 검토를 요청드립니다.';

  static const List<_TimelineEvent> _events = [
    _TimelineEvent(title: '신고 접수', date: '2026-04-15 14:20', completed: true),
    _TimelineEvent(title: '검토 시작', date: '2026-04-16 10:05', completed: true),
    _TimelineEvent(title: '처리 완료', date: '예정', completed: false),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.hanji,
      appBar: const ZeomAppBar(title: '분쟁 상세'),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 40),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _buildStatusCard(),
            const SizedBox(height: 12),
            _buildContentCard(),
            const SizedBox(height: 12),
            _buildTimelineCard(),
          ],
        ),
      ),
    );
  }

  // -----------------------------------------------------------------
  // Cards
  // -----------------------------------------------------------------

  Widget _buildCardShell({required Widget child}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.borderSoft),
      ),
      child: child,
    );
  }

  Widget _buildStatusCard() {
    final palette = _statusPalette(_status);
    return _buildCardShell(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: palette.bg,
              borderRadius: BorderRadius.circular(999),
            ),
            child: Text(
              _status,
              style: ZeomType.tag.copyWith(
                color: palette.fg,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          const SizedBox(height: 10),
          Text(_status, style: ZeomType.cardTitle),
          const SizedBox(height: 4),
          Text(
            _statusDescription,
            style: ZeomType.meta.copyWith(color: AppColors.ink3),
          ),
        ],
      ),
    );
  }

  Widget _buildContentCard() {
    return _buildCardShell(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('신고 내용', style: ZeomType.section),
          const SizedBox(height: 12),
          _buildLabelValue('신고 유형', _category),
          const SizedBox(height: 10),
          _buildLabelValue('대상', _target),
          const SizedBox(height: 10),
          _buildLabelValue('상세 내용', _detail),
        ],
      ),
    );
  }

  Widget _buildLabelValue(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: ZeomType.meta.copyWith(color: AppColors.ink3),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: ZeomType.body.copyWith(color: AppColors.ink),
        ),
      ],
    );
  }

  Widget _buildTimelineCard() {
    return _buildCardShell(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('처리 타임라인', style: ZeomType.section),
          const SizedBox(height: 12),
          for (var i = 0; i < _events.length; i++)
            _TimelineRow(
              event: _events[i],
              isFirst: i == 0,
              isLast: i == _events.length - 1,
            ),
        ],
      ),
    );
  }

  _PillPalette _statusPalette(String s) {
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

class _TimelineEvent {
  final String title;
  final String date;
  final bool completed;
  const _TimelineEvent({
    required this.title,
    required this.date,
    required this.completed,
  });
}

class _TimelineRow extends StatelessWidget {
  const _TimelineRow({
    required this.event,
    required this.isFirst,
    required this.isLast,
  });

  final _TimelineEvent event;
  final bool isFirst;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    final Color dotColor =
        event.completed ? AppColors.darkRed : AppColors.ink4;
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 16,
            child: Column(
              children: [
                if (!isFirst)
                  Container(width: 1, height: 6, color: AppColors.borderSoft),
                Container(
                  width: 10,
                  height: 10,
                  decoration: BoxDecoration(
                    color: dotColor,
                    shape: BoxShape.circle,
                  ),
                ),
                if (!isLast)
                  Expanded(
                    child: Container(width: 1, color: AppColors.borderSoft),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(bottom: isLast ? 0 : 14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    event.title,
                    style: ZeomType.body.copyWith(
                      fontWeight: FontWeight.w600,
                      color: event.completed ? AppColors.ink : AppColors.ink3,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    event.date,
                    style: ZeomType.meta.copyWith(color: AppColors.ink3),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _PillPalette {
  final Color bg;
  final Color fg;
  const _PillPalette({required this.bg, required this.fg});
}
