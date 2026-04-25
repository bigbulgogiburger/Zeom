import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../shared/providers/active_session_provider.dart';
import '../../shared/providers/bookings_provider.dart';
import '../../shared/providers/pending_booking_provider.dart';
import '../../shared/providers/wallet_provider.dart';
import '../../shared/theme.dart';
import '../../shared/typography.dart';
import '../../shared/widgets/zeom_app_bar.dart';
import '../../shared/widgets/zeom_avatar.dart';
import '../../shared/widgets/zeom_button.dart';

/// S05 예약 확인 — MOBILE_DESIGN_PLAN.md §3.5.
///
/// Reads draft from [pendingBookingProvider] (populated by P1-E3 before
/// routing into this screen). On confirm: debits wallet, inserts a
/// [Booking] into [bookingsProvider], sets [activeSessionProvider], clears
/// the pending draft, shows a snackbar, then routes back to `/bookings`.
class BookingCreateScreen extends ConsumerStatefulWidget {
  // Constructor preserved so the GoRouter builder at router.dart L87 keeps
  // compiling. None of these values are consumed on this screen — the
  // draft lives in `pendingBookingProvider`.
  final int counselorId;
  final String? initialSlotStart;
  final List<int>? initialSlotIds;
  final Map<String, dynamic>? counselorData;

  const BookingCreateScreen({
    super.key,
    required this.counselorId,
    this.initialSlotStart,
    this.initialSlotIds,
    this.counselorData,
  });

  @override
  ConsumerState<BookingCreateScreen> createState() =>
      _BookingCreateScreenState();
}

class _BookingCreateScreenState extends ConsumerState<BookingCreateScreen> {
  bool _refundAgreed = false;
  bool _privacyAgreed = false;
  bool _isLoading = false;

  bool get _bothAgreed => _refundAgreed && _privacyAgreed;

  @override
  Widget build(BuildContext context) {
    final pending = ref.watch(pendingBookingProvider);
    final balance = ref.watch(walletProvider);

    return Scaffold(
      backgroundColor: AppColors.hanji,
      appBar: const ZeomAppBar(title: '예약 확인'),
      body: pending == null
          ? _buildEmptyState(context)
          : _buildContent(context, pending, balance),
      bottomSheet: pending == null
          ? null
          : _ConfirmCtaBar(
              pending: pending,
              balance: balance,
              agreed: _bothAgreed,
              isLoading: _isLoading,
              onConfirm: _handleConfirm,
            ),
    );
  }

  Widget _buildContent(
    BuildContext context,
    PendingBooking pending,
    int balance,
  ) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 140),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _SummaryCard(pending: pending),
          const SizedBox(height: 16),
          _PaymentCard(pending: pending, balance: balance),
          const SizedBox(height: 16),
          _AgreementsCard(
            refundAgreed: _refundAgreed,
            privacyAgreed: _privacyAgreed,
            onRefundChanged: (v) => setState(() => _refundAgreed = v),
            onPrivacyChanged: (v) => setState(() => _privacyAgreed = v),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(60),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.event_busy_outlined,
              size: 48,
              color: AppColors.ink4,
            ),
            const SizedBox(height: 16),
            Text('예약 정보가 없어요', style: ZeomType.body.copyWith(color: AppColors.ink3)),
            const SizedBox(height: 16),
            ZeomButton(
              label: '홈으로',
              variant: ZeomButtonVariant.outline,
              onPressed: () => context.go('/home'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _handleConfirm() async {
    setState(() => _isLoading = true);
    await Future<void>.delayed(const Duration(milliseconds: 900));

    final pending = ref.read(pendingBookingProvider);
    if (pending == null) {
      if (mounted) setState(() => _isLoading = false);
      return;
    }

    ref.read(walletProvider.notifier).debit(pending.priceCash);

    final newBooking = Booking(
      id: 'b${DateTime.now().millisecondsSinceEpoch}',
      counselorId: pending.counselorId,
      counselorName: pending.counselorName,
      counselorInitials: pending.counselorInitials,
      when: pending.when,
      durationMinutes: pending.durationMinutes,
      channel: pending.channel,
      priceCash: pending.priceCash,
      status: BookingStatus.upcoming,
      hasReview: false,
    );
    ref.read(bookingsProvider.notifier).add(newBooking);
    ref.read(activeSessionProvider.notifier).set(newBooking);
    ref.read(pendingBookingProvider.notifier).state = null;

    if (!mounted) return;
    setState(() => _isLoading = false);

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('예약이 확정되었습니다 🪷'),
        duration: Duration(milliseconds: 2400),
        behavior: SnackBarBehavior.floating,
      ),
    );
    context.go('/bookings');
  }
}

// ---------------------------------------------------------------------------
// Summary card (counselor + 4 info tiles)
// ---------------------------------------------------------------------------

class _SummaryCard extends StatelessWidget {
  final PendingBooking pending;
  const _SummaryCard({required this.pending});

  @override
  Widget build(BuildContext context) {
    final when = pending.when;
    final dateText =
        '${when.month}월 ${when.day}일 (${_weekdayKo(when.weekday)})';
    final timeText = '${when.hour}:${when.minute.toString().padLeft(2, '0')}';
    final channelText =
        pending.channel == BookingChannel.video ? '화상' : '음성';
    final durationText = '${pending.durationMinutes}분';
    final channelLabel =
        pending.channel == BookingChannel.video ? '화상' : '음성';

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.borderSoft, width: 1),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              ZeomAvatar(initials: pending.counselorInitials, size: 48),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      pending.counselorName,
                      style: ZeomType.cardTitle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '$channelLabel · $durationText',
                      style: ZeomType.meta.copyWith(color: AppColors.ink3),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          const Divider(
            height: 1,
            thickness: 1,
            color: AppColors.borderSoft,
          ),
          const SizedBox(height: 14),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            childAspectRatio: 2.4,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            children: [
              _InfoTile(label: '날짜', value: dateText),
              _InfoTile(label: '시간', value: timeText),
              _InfoTile(label: '방식', value: channelText),
              _InfoTile(label: '소요', value: durationText),
            ],
          ),
        ],
      ),
    );
  }
}

class _InfoTile extends StatelessWidget {
  final String label;
  final String value;
  const _InfoTile({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.hanjiDeep,
        borderRadius: BorderRadius.circular(10),
      ),
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label.toUpperCase(),
            style: ZeomType.micro.copyWith(
              color: AppColors.ink3,
              letterSpacing: 1,
            ),
          ),
          Text(
            value,
            style: ZeomType.cardTitle,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Payment card (price / debit / remaining balance + optional shortage banner)
// ---------------------------------------------------------------------------

class _PaymentCard extends ConsumerWidget {
  final PendingBooking pending;
  final int balance;
  const _PaymentCard({required this.pending, required this.balance});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final price = pending.priceCash;
    final remaining = math.max(0, balance - price);
    final insufficient = balance < price;
    final shortage = insufficient ? price - balance : 0;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.borderSoft, width: 1),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('결제', style: ZeomType.section),
          const SizedBox(height: 12),
          _paymentRow(
            left: Text(
              '상담료',
              style: ZeomType.body.copyWith(color: AppColors.ink2),
            ),
            right: Text(
              '+ ${formatCash(price)}',
              style: ZeomType.tabularNums(
                base: ZeomType.body.copyWith(
                  color: AppColors.ink,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
          const SizedBox(height: 8),
          _paymentRow(
            left: Text(
              '캐시 차감',
              style: ZeomType.body.copyWith(color: AppColors.ink2),
            ),
            right: Text(
              '- ${formatCash(price)}',
              style: ZeomType.tabularNums(
                base: ZeomType.cardTitle.copyWith(color: AppColors.ink),
              ),
            ),
          ),
          const SizedBox(height: 12),
          const Divider(
            height: 1,
            thickness: 1,
            color: AppColors.borderSoft,
          ),
          const SizedBox(height: 12),
          _paymentRow(
            left: Text('차감 후 잔액', style: ZeomType.cardTitle),
            right: Row(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.baseline,
              textBaseline: TextBaseline.alphabetic,
              children: [
                Text(
                  formatCash(remaining),
                  style: ZeomType.tabularNums(
                    base: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: AppColors.gold,
                      height: 1.2,
                      fontFamily: ZeomType.cardTitle.fontFamily,
                    ),
                  ),
                ),
                const SizedBox(width: 4),
                Text(
                  '캐시',
                  style: ZeomType.meta.copyWith(
                    color: AppColors.ink2,
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
          if (insufficient) ...[
            const SizedBox(height: 12),
            _InsufficientCashBanner(shortage: shortage),
          ],
        ],
      ),
    );
  }

  Widget _paymentRow({required Widget left, required Widget right}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [Flexible(child: left), const SizedBox(width: 8), right],
    );
  }
}

class _InsufficientCashBanner extends StatelessWidget {
  final int shortage;
  const _InsufficientCashBanner({required this.shortage});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: const Color.fromRGBO(184, 115, 51, 0.08),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: const Color.fromRGBO(184, 115, 51, 0.3),
          width: 1,
        ),
      ),
      padding: const EdgeInsets.all(12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          const Icon(
            Icons.warning_amber_rounded,
            color: AppColors.warning,
            size: 20,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '캐시가 부족해요',
                  style:
                      ZeomType.cardTitle.copyWith(color: AppColors.warning),
                ),
                const SizedBox(height: 2),
                Text(
                  '남은 ${formatCash(shortage)} 충전이 필요합니다',
                  style: ZeomType.meta.copyWith(color: AppColors.warning),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          ZeomButton(
            label: '충전',
            variant: ZeomButtonVariant.gold,
            size: ZeomButtonSize.sm,
            onPressed: () => context.push('/wallet/cash-buy'),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Agreements card (2 required checkboxes)
// ---------------------------------------------------------------------------

class _AgreementsCard extends StatelessWidget {
  final bool refundAgreed;
  final bool privacyAgreed;
  final ValueChanged<bool> onRefundChanged;
  final ValueChanged<bool> onPrivacyChanged;

  const _AgreementsCard({
    required this.refundAgreed,
    required this.privacyAgreed,
    required this.onRefundChanged,
    required this.onPrivacyChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.borderSoft, width: 1),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('약관 동의', style: ZeomType.section),
          const SizedBox(height: 10),
          _AgreementRow(
            checked: refundAgreed,
            onChanged: onRefundChanged,
            label: '환불 정책 동의 (24h 100% · 1h 50% · 이후 불가)',
          ),
          const SizedBox(height: 8),
          _AgreementRow(
            checked: privacyAgreed,
            onChanged: onPrivacyChanged,
            label: '상담 진행 및 개인정보 처리방침 동의',
          ),
        ],
      ),
    );
  }
}

class _AgreementRow extends StatelessWidget {
  final bool checked;
  final ValueChanged<bool> onChanged;
  final String label;

  const _AgreementRow({
    required this.checked,
    required this.onChanged,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => onChanged(!checked),
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 4),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            SizedBox(
              width: 22,
              height: 22,
              child: Checkbox(
                value: checked,
                onChanged: (v) => onChanged(v ?? false),
                materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                visualDensity: VisualDensity.compact,
                side: const BorderSide(color: AppColors.border, width: 1.5),
                fillColor: MaterialStateProperty.resolveWith((states) {
                  if (states.contains(MaterialState.selected)) {
                    return AppColors.ink;
                  }
                  return Colors.white;
                }),
                checkColor: AppColors.hanji,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: RichText(
                text: TextSpan(
                  style: ZeomType.bodySm.copyWith(color: AppColors.ink),
                  children: [
                    TextSpan(
                      text: '[필수] ',
                      style: ZeomType.bodySm.copyWith(
                        color: AppColors.ink,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    TextSpan(text: label),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Sticky bottom CTA
// ---------------------------------------------------------------------------

class _ConfirmCtaBar extends StatelessWidget {
  final PendingBooking pending;
  final int balance;
  final bool agreed;
  final bool isLoading;
  final Future<void> Function() onConfirm;

  const _ConfirmCtaBar({
    required this.pending,
    required this.balance,
    required this.agreed,
    required this.isLoading,
    required this.onConfirm,
  });

  @override
  Widget build(BuildContext context) {
    final safeBottom = MediaQuery.of(context).padding.bottom;
    final price = pending.priceCash;
    final insufficient = balance < price;

    final String label;
    final VoidCallback? action;
    if (!agreed) {
      label = '약관 동의가 필요합니다';
      action = null;
    } else if (insufficient) {
      label = '캐시 부족';
      action = null;
    } else if (isLoading) {
      label = '확정 중…';
      action = null;
    } else {
      label = '${formatCash(price)} 예약 확정';
      action = () => onConfirm();
    }

    return Container(
      decoration: const BoxDecoration(
        color: AppColors.hanji,
        border: Border(
          top: BorderSide(color: AppColors.borderSoft, width: 1),
        ),
      ),
      padding: EdgeInsets.fromLTRB(
        20,
        14,
        20,
        math.max(20.0, safeBottom + 14.0),
      ),
      child: ZeomButton(
        label: label,
        variant: ZeomButtonVariant.primary,
        size: ZeomButtonSize.md,
        width: double.infinity,
        loading: isLoading,
        onPressed: action,
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

String formatCash(int cash) {
  final s = cash.toString();
  final buf = StringBuffer();
  for (var i = 0; i < s.length; i++) {
    if (i > 0 && (s.length - i) % 3 == 0) buf.write(',');
    buf.write(s[i]);
  }
  return buf.toString();
}

String _weekdayKo(int weekday) =>
    const ['월', '화', '수', '목', '금', '토', '일'][weekday - 1];
