import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../shared/animations/zeom_animations.dart';
import '../../shared/providers/bookings_provider.dart';
import '../../shared/theme.dart';
import '../../shared/typography.dart';
import '../../shared/widgets/zeom_app_bar.dart';
import '../../shared/widgets/zeom_avatar.dart';
import '../../shared/widgets/zeom_button.dart';

/// S16 — 환불 요청 화면. Follows MOBILE_DESIGN_PLAN.md §3.16.
///
/// Two-step flow:
/// 1) [_RefundStep.form] — policy box, booking target picker, reason radios,
///    optional detail textarea, sticky CTA.
/// 2) [_RefundStep.success] — confirmation screen with primary CTA back to
///    the home tab.
///
/// The view layer is intentionally decoupled from any backend — the rewrite
/// is purely visual per the phase plan. Data comes from
/// [bookingsCompletedProvider].
class RefundRequestScreen extends ConsumerStatefulWidget {
  const RefundRequestScreen({super.key});

  @override
  ConsumerState<RefundRequestScreen> createState() =>
      _RefundRequestScreenState();
}

enum _RefundStep { form, success }

const List<String> _kReasons = <String>[
  '상담사 일방 종료',
  '연결 품질 문제',
  '중복 결제',
  '단순 변심',
  '기타',
];

class _RefundRequestScreenState extends ConsumerState<RefundRequestScreen> {
  _RefundStep _step = _RefundStep.form;
  Booking? _selected;
  String? _reason;
  // ignore: unused_field
  String _detail = '';
  bool _submitting = false;

  final TextEditingController _detailController = TextEditingController();

  @override
  void dispose() {
    _detailController.dispose();
    super.dispose();
  }

  bool get _canSubmit =>
      _selected != null && _reason != null && !_submitting;

  String get _ctaLabel {
    if (_submitting) return '접수 중…';
    if (_selected != null && _reason != null) return '환불 요청 접수';
    return '대상·사유를 선택해주세요';
  }

  Future<void> _submit() async {
    setState(() => _submitting = true);
    await Future<void>.delayed(const Duration(milliseconds: 1100));
    if (!mounted) return;
    setState(() {
      _submitting = false;
      _step = _RefundStep.success;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.hanji,
      appBar: const ZeomAppBar(title: '환불 요청'),
      body: _step == _RefundStep.form
          ? _buildForm(context)
          : ZeomFadeSlideIn(child: _buildSuccess(context)),
      bottomSheet:
          _step == _RefundStep.form ? _buildStickyCta(context) : null,
    );
  }

  // -------------------------------------------------------------------------
  // Form step
  // -------------------------------------------------------------------------

  Widget _buildForm(BuildContext context) {
    final completed = ref.watch(bookingsCompletedProvider);
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 140),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const _PolicyInfoBox(),
          const SizedBox(height: 20),
          _BookingTargetSection(
            bookings: completed,
            selected: _selected,
            onSelect: (b) => setState(() => _selected = b),
          ),
          const SizedBox(height: 24),
          _ReasonSection(
            selected: _reason,
            onSelect: (r) => setState(() => _reason = r),
          ),
          const SizedBox(height: 16),
          _DetailTextarea(
            controller: _detailController,
            onChanged: (value) => setState(() => _detail = value),
          ),
        ],
      ),
    );
  }

  Widget _buildStickyCta(BuildContext context) {
    final bottomInset = MediaQuery.of(context).padding.bottom;
    return Container(
      padding: EdgeInsets.fromLTRB(20, 14, 20, bottomInset + 14),
      decoration: const BoxDecoration(
        color: AppColors.hanji,
        border: Border(
          top: BorderSide(color: AppColors.borderSoft, width: 1),
        ),
      ),
      child: ZeomButton(
        label: _ctaLabel,
        variant: ZeomButtonVariant.primary,
        size: ZeomButtonSize.md,
        width: double.infinity,
        loading: _submitting,
        onPressed: _canSubmit ? _submit : null,
      ),
    );
  }

  // -------------------------------------------------------------------------
  // Success step
  // -------------------------------------------------------------------------

  Widget _buildSuccess(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: const BoxDecoration(
                color: AppColors.goldBg,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.mark_email_read_outlined,
                size: 40,
                color: AppColors.gold,
              ),
            ),
            const SizedBox(height: 20),
            Text(
              '접수되었습니다',
              textAlign: TextAlign.center,
              style: ZeomType.displaySm.copyWith(
                fontSize: 26,
                fontWeight: FontWeight.w700,
                color: AppColors.ink,
              ),
            ),
            const SizedBox(height: 10),
            Text(
              '3영업일 이내 검토 결과를\n푸시 알림으로 보내드려요.',
              textAlign: TextAlign.center,
              style: ZeomType.body.copyWith(
                color: AppColors.ink3,
                height: 1.7,
              ),
            ),
            const SizedBox(height: 28),
            ZeomButton(
              label: '확인',
              variant: ZeomButtonVariant.primary,
              size: ZeomButtonSize.md,
              width: double.infinity,
              onPressed: () => context.go('/home'),
            ),
          ],
        ),
      ),
    );
  }
}

// ===========================================================================
// Policy info box (top)
// ===========================================================================

class _PolicyInfoBox extends StatelessWidget {
  const _PolicyInfoBox();

  static const Color _bg = Color.fromRGBO(201, 162, 39, 0.08);
  static const Color _border = Color.fromRGBO(201, 162, 39, 0.3);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: _bg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: _border, width: 1),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.info_outline, size: 20, color: AppColors.gold),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '환불 정책',
                  style: ZeomType.cardTitle.copyWith(color: AppColors.gold),
                ),
                const SizedBox(height: 4),
                Text(
                  '상담 24시간 전: 100% 환불\n1시간 전: 50% 환불\n그 이후: 서비스 이슈에 한해 부분 환불 검토',
                  style: ZeomType.body.copyWith(
                    color: AppColors.ink2,
                    height: 1.7,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ===========================================================================
// Booking target section
// ===========================================================================

class _BookingTargetSection extends StatelessWidget {
  const _BookingTargetSection({
    required this.bookings,
    required this.selected,
    required this.onSelect,
  });

  final List<Booking> bookings;
  final Booking? selected;
  final ValueChanged<Booking> onSelect;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('어떤 상담 건인가요?', style: ZeomType.section),
        const SizedBox(height: 10),
        if (bookings.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 24),
            child: Text(
              '환불 가능한 상담이 없습니다',
              style: ZeomType.body.copyWith(color: AppColors.ink3),
            ),
          )
        else
          ...bookings.map(
            (b) => _BookingOption(
              booking: b,
              selected: selected?.id == b.id,
              onTap: () => onSelect(b),
            ),
          ),
      ],
    );
  }
}

class _BookingOption extends StatelessWidget {
  const _BookingOption({
    required this.booking,
    required this.selected,
    required this.onTap,
  });

  final Booking booking;
  final bool selected;
  final VoidCallback onTap;

  String _formatDate(DateTime when) {
    final month = when.month.toString().padLeft(2, '0');
    final day = when.day.toString().padLeft(2, '0');
    return '${when.year}.$month.$day';
  }

  String _formatCash(int cash) {
    final s = cash.toString();
    final buf = StringBuffer();
    for (var i = 0; i < s.length; i++) {
      if (i > 0 && (s.length - i) % 3 == 0) buf.write(',');
      buf.write(s[i]);
    }
    return buf.toString();
  }

  @override
  Widget build(BuildContext context) {
    final Color bg = selected ? AppColors.ink : Colors.white;
    final Color nameColor = selected ? AppColors.hanji : AppColors.ink;
    final Color metaColor =
        selected ? AppColors.hanji.withOpacity(0.7) : AppColors.ink3;

    final hour = booking.when.hour.toString().padLeft(2, '0');
    final meta =
        '${_formatDate(booking.when)} $hour:00 · ${_formatCash(booking.priceCash)} 캐시';

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: onTap,
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: bg,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: selected ? AppColors.ink : AppColors.borderSoft,
                width: selected ? 1.5 : 1,
              ),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                ZeomAvatar(
                  initials: booking.counselorInitials,
                  size: 40,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        booking.counselorName,
                        style: ZeomType.cardTitle.copyWith(color: nameColor),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        meta,
                        style: ZeomType.meta.copyWith(
                          color: metaColor,
                          fontFeatures: kTabularNums,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ===========================================================================
// Reason section (custom radios)
// ===========================================================================

class _ReasonSection extends StatelessWidget {
  const _ReasonSection({
    required this.selected,
    required this.onSelect,
  });

  final String? selected;
  final ValueChanged<String> onSelect;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('환불 사유', style: ZeomType.section),
        const SizedBox(height: 10),
        for (final r in _kReasons)
          _ReasonTile(
            label: r,
            selected: selected == r,
            onTap: () => onSelect(r),
          ),
      ],
    );
  }
}

class _ReasonTile extends StatelessWidget {
  const _ReasonTile({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: AppColors.borderSoft,
                width: 1,
              ),
            ),
            child: Row(
              children: [
                _CustomRadio(selected: selected),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    label,
                    style: ZeomType.body.copyWith(color: AppColors.ink),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _CustomRadio extends StatelessWidget {
  const _CustomRadio({required this.selected});

  final bool selected;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 20,
      height: 20,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(color: AppColors.ink, width: 1.5),
      ),
      alignment: Alignment.center,
      child: selected
          ? Container(
              width: 10,
              height: 10,
              decoration: const BoxDecoration(
                color: AppColors.ink,
                shape: BoxShape.circle,
              ),
            )
          : null,
    );
  }
}

// ===========================================================================
// Detail textarea
// ===========================================================================

class _DetailTextarea extends StatelessWidget {
  const _DetailTextarea({
    required this.controller,
    required this.onChanged,
  });

  final TextEditingController controller;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('상세 내용 (선택)', style: ZeomType.cardTitle),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          onChanged: onChanged,
          minLines: 5,
          maxLines: 5,
          maxLength: 500,
          style: ZeomType.body.copyWith(color: AppColors.ink),
          decoration: InputDecoration(
            filled: true,
            fillColor: Colors.white,
            hintText: '환불이 필요한 상황을 알려주세요',
            hintStyle: ZeomType.body.copyWith(color: AppColors.ink4),
            contentPadding: const EdgeInsets.all(14),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(
                color: AppColors.borderSoft,
                width: 1,
              ),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(
                color: AppColors.borderSoft,
                width: 1,
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(
                color: AppColors.ink,
                width: 1.5,
              ),
            ),
            counterStyle: ZeomType.meta.copyWith(color: AppColors.ink3),
          ),
        ),
      ],
    );
  }
}
