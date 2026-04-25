import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../shared/providers/active_session_provider.dart';
import '../../shared/providers/bookings_provider.dart';
import '../../shared/theme.dart';
import '../../shared/typography.dart';
import '../../shared/widgets/zeom_avatar.dart';
import '../../shared/widgets/zeom_button.dart';

/// S07 예약·내역 — tab root hosting upcoming / completed bookings.
///
/// Per MOBILE_DESIGN_PLAN.md § 3.7 layout:
///   Header → SegmentControl (예정 / 완료) → list of `_BookingCard`.
///
/// Canvas = `hanji`, page side padding 20, bottom padding 90 (tab clearance).
/// The screen is hosted inside `MainScreen.body` via `IndexedStack` — we keep
/// a local [Scaffold] so navigations from inside this tab retain a proper
/// material ancestor, mirroring the [HomeScreen] pattern.
class BookingListScreen extends ConsumerStatefulWidget {
  const BookingListScreen({super.key});

  @override
  ConsumerState<BookingListScreen> createState() => _BookingListScreenState();
}

class _BookingListScreenState extends ConsumerState<BookingListScreen> {
  /// Either `'upcoming'` or `'completed'`. Drives which derived provider
  /// feeds the list.
  String _segment = 'upcoming';

  @override
  Widget build(BuildContext context) {
    final List<Booking> items = _segment == 'upcoming'
        ? ref.watch(bookingsUpcomingProvider)
        : ref.watch(bookingsCompletedProvider);

    return Scaffold(
      backgroundColor: AppColors.hanji,
      body: SafeArea(
        bottom: false,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.only(bottom: 90),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // 1. Header
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
                child: Text('예약·내역', style: ZeomType.pageTitle),
              ),
              const SizedBox(height: 16),

              // 2. Segment control
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: _SegmentControl(
                  value: _segment,
                  onChanged: (next) => setState(() => _segment = next),
                ),
              ),
              const SizedBox(height: 16),

              // 3. List body
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: items.isEmpty
                    ? _EmptyState(segment: _segment)
                    : Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          for (final b in items)
                            _BookingCard(
                              booking: b,
                              onCancel: () => _cancel(b),
                              onEnter: () => _enter(b),
                              onWriteReview: () => _writeReview(b),
                            ),
                        ],
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ---------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------

  void _cancel(Booking b) {
    showDialog<void>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          backgroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          title: Text('예약 취소', style: ZeomType.section),
          content: Text(
            '정말 이 예약을 취소하시겠어요?\n환불 정책에 따라 환불이 진행됩니다.',
            style: ZeomType.body,
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: Text(
                '돌아가기',
                style: TextStyle(color: AppColors.ink3),
              ),
            ),
            TextButton(
              onPressed: () {
                ref.read(bookingsProvider.notifier).cancel(b.id);
                Navigator.of(dialogContext).pop();
                if (!mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('예약이 취소되었습니다')),
                );
              },
              child: Text(
                '취소 확정',
                style: TextStyle(color: AppColors.darkRed),
              ),
            ),
          ],
        );
      },
    );
  }

  void _enter(Booking b) {
    ref.read(activeSessionProvider.notifier).set(b);
    context.push('/consultation/${b.id}/preflight');
  }

  void _writeReview(Booking b) {
    ref.read(activeSessionProvider.notifier).set(b);
    context.push('/consultation/${b.id}/review');
  }
}

// ===================================================================
// SegmentControl — 2-option pill inside a bordered track.
// ===================================================================

class _SegmentControl extends StatelessWidget {
  final String value;
  final ValueChanged<String> onChanged;

  const _SegmentControl({
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.borderSoft),
      ),
      padding: const EdgeInsets.all(4),
      child: Row(
        children: [
          Expanded(
            child: _SegmentButton(
              label: '예정',
              active: value == 'upcoming',
              onTap: () => onChanged('upcoming'),
            ),
          ),
          Expanded(
            child: _SegmentButton(
              label: '완료',
              active: value == 'completed',
              onTap: () => onChanged('completed'),
            ),
          ),
        ],
      ),
    );
  }
}

class _SegmentButton extends StatelessWidget {
  final String label;
  final bool active;
  final VoidCallback onTap;

  const _SegmentButton({
    required this.label,
    required this.active,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        curve: Curves.easeOut,
        height: 36,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: active ? AppColors.ink : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          label,
          style: GoogleFonts.notoSans(
            fontSize: 13,
            fontWeight: active ? FontWeight.w600 : FontWeight.w500,
            color: active ? AppColors.hanji : AppColors.ink,
            height: 1.2,
          ),
        ),
      ),
    );
  }
}

// ===================================================================
// Empty state — lotus glyph + message (+ CTA for upcoming only).
// ===================================================================

class _EmptyState extends StatelessWidget {
  final String segment;

  const _EmptyState({required this.segment});

  @override
  Widget build(BuildContext context) {
    final bool upcoming = segment == 'upcoming';
    final String message =
        upcoming ? '예정된 상담이 없습니다' : '완료된 상담이 없습니다';

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 48),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          const Text(
            '🪷',
            style: TextStyle(fontSize: 60, height: 1.0),
          ),
          const SizedBox(height: 12),
          Text(
            message,
            style: ZeomType.body.copyWith(color: AppColors.ink3),
            textAlign: TextAlign.center,
          ),
          if (upcoming) ...[
            const SizedBox(height: 12),
            ZeomButton(
              label: '상담사 둘러보기',
              variant: ZeomButtonVariant.outline,
              size: ZeomButtonSize.md,
              onPressed: () => context.go('/counselors'),
            ),
          ],
        ],
      ),
    );
  }
}

// ===================================================================
// _BookingCard — one booking row.
// ===================================================================

class _BookingCard extends StatelessWidget {
  final Booking booking;
  final VoidCallback onCancel;
  final VoidCallback onEnter;
  final VoidCallback onWriteReview;

  const _BookingCard({
    required this.booking,
    required this.onCancel,
    required this.onEnter,
    required this.onWriteReview,
  });

  @override
  Widget build(BuildContext context) {
    final DateTime local = booking.when.toLocal();
    final String dateLabel = formatBookingDate(local);
    final String timeLabel = formatBookingTime(local);
    final bool isUpcoming = booking.status == BookingStatus.upcoming;
    final bool isCompleted = booking.status == BookingStatus.completed;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.borderSoft),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Top row: avatar + name/meta + right price column
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ZeomAvatar(
                initials: booking.counselorInitials,
                size: 48,
                online: false,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            booking.counselorName,
                            style: ZeomType.cardTitle,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 6),
                        _ChannelBadge(channel: booking.channel),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '$dateLabel $timeLabel',
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
                  Text(
                    '${booking.durationMinutes}분',
                    style: ZeomType.micro.copyWith(color: AppColors.ink3),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    formatCash(booking.priceCash),
                    style: GoogleFonts.notoSerif(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: AppColors.ink,
                      height: 1.2,
                      fontFeatures: kTabularNums,
                    ),
                  ),
                ],
              ),
            ],
          ),

          const SizedBox(height: 12),

          // Bottom action row keyed by status.
          if (isUpcoming) _upcomingActions(),
          if (isCompleted && booking.hasReview) _reviewDoneRow(),
          if (isCompleted && !booking.hasReview) _reviewCtaRow(),
        ],
      ),
    );
  }

  Widget _upcomingActions() {
    return Row(
      children: [
        Expanded(
          child: ZeomButton(
            label: '취소',
            variant: ZeomButtonVariant.outline,
            size: ZeomButtonSize.sm,
            onPressed: onCancel,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          flex: 2,
          child: ZeomButton(
            label: '대기실 입장',
            variant: ZeomButtonVariant.primary,
            size: ZeomButtonSize.md,
            onPressed: onEnter,
          ),
        ),
      ],
    );
  }

  Widget _reviewDoneRow() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(
          Icons.check_circle_outline,
          size: 18,
          color: AppColors.jadeSuccess,
        ),
        const SizedBox(width: 6),
        Text(
          '후기 작성 완료',
          style: ZeomType.body.copyWith(
            color: AppColors.jadeSuccess,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }

  Widget _reviewCtaRow() {
    return Row(
      children: [
        Expanded(
          child: ZeomButton(
            label: '후기 작성',
            variant: ZeomButtonVariant.gold,
            size: ZeomButtonSize.sm,
            onPressed: onWriteReview,
          ),
        ),
      ],
    );
  }
}

// ===================================================================
// Channel pill: hanjiDeep bg, ink2 text, leading video / mic icon.
// ===================================================================

class _ChannelBadge extends StatelessWidget {
  final BookingChannel channel;

  const _ChannelBadge({required this.channel});

  @override
  Widget build(BuildContext context) {
    final bool video = channel == BookingChannel.video;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: AppColors.hanjiDeep,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            video ? Icons.videocam : Icons.mic,
            size: 14,
            color: AppColors.ink2,
          ),
          const SizedBox(width: 4),
          Text(
            video ? '화상' : '음성',
            style: GoogleFonts.notoSans(
              fontSize: 10,
              fontWeight: FontWeight.w600,
              color: AppColors.ink2,
              height: 1.3,
            ),
          ),
        ],
      ),
    );
  }
}

// ===================================================================
// Formatters (module-level helpers).
// ===================================================================

/// Relative day label for a booking. Same-day → "오늘 (요일)",
/// tomorrow → "내일 (요일)", yesterday → "어제 (요일)",
/// otherwise "M월 D일 (요일)".
String formatBookingDate(DateTime d) {
  final now = DateTime.now();
  final today = DateTime(now.year, now.month, now.day);
  final target = DateTime(d.year, d.month, d.day);
  final diffDays = target.difference(today).inDays;
  final w = const ['월', '화', '수', '목', '금', '토', '일'][d.weekday - 1];
  if (diffDays == 0) return '오늘 ($w)';
  if (diffDays == 1) return '내일 ($w)';
  if (diffDays == -1) return '어제 ($w)';
  return '${d.month}월 ${d.day}일 ($w)';
}

/// Hour-only booking time rendering ("HH:00"). Minutes aren't shown because
/// bookings are slot-aligned on the hour per § 3.7.
String formatBookingTime(DateTime d) =>
    '${d.hour.toString().padLeft(2, '0')}:00';

/// Thousands-separated cash formatter (mirrors `booking_create_screen.dart`).
String formatCash(int cash) {
  final s = cash.toString();
  final buf = StringBuffer();
  for (var i = 0; i < s.length; i++) {
    if (i > 0 && (s.length - i) % 3 == 0) buf.write(',');
    buf.write(s[i]);
  }
  return buf.toString();
}

