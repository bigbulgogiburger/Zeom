import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../shared/animations/zeom_animations.dart';
import '../../shared/providers/active_session_provider.dart';
import '../../shared/providers/bookings_provider.dart';
import '../../shared/theme.dart';
import '../../shared/typography.dart';
import '../../shared/widgets/zeom_avatar.dart';
import '../../shared/widgets/zeom_button.dart';

/// S10 — 상담 완료 (MOBILE_DESIGN_PLAN.md §3.10)
///
/// Scaffold `hanji` bg, no AppBar. Back gesture is explicitly blocked with
/// `PopScope(canPop: false)` per spec (상담 후 되돌아가기 방지). Surface layout:
/// 84px gold-gradient lotus 🪷 → display title → description → session
/// summary card → "후기 작성하고 1,000캐시 받기" (gold md) → "홈으로" (outline md).
///
/// Router preserves `bookingId` (path param) + optional `sessionId` (extra)
/// so existing navigations from the consultation room keep working. The
/// screen primarily reads from [activeSessionProvider] which is seeded when
/// the room launches the call.
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
    final session = ref.watch(activeSessionProvider);

    return PopScope(
      canPop: false,
      onPopInvoked: (_) {},
      child: Scaffold(
        backgroundColor: AppColors.hanji,
        body: SafeArea(
          child: ZeomFadeSlideIn(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(40),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Center(child: _LotusBadge()),
                    const SizedBox(height: 24),
                    Center(
                      child: Text(
                        '상담이 끝났어요',
                        textAlign: TextAlign.center,
                        style: ZeomType.displaySm.copyWith(
                          fontSize: 26,
                          fontWeight: FontWeight.w700,
                          color: AppColors.ink,
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      _buildSubtitle(session),
                      textAlign: TextAlign.center,
                      softWrap: true,
                      style: ZeomType.body.copyWith(
                        color: AppColors.ink3,
                        height: 1.7,
                      ),
                    ),
                    const SizedBox(height: 24),
                    if (session != null)
                      _SessionSummaryCard(session: session),
                    const SizedBox(height: 28),
                    if (session != null) ...[
                      ZeomButton(
                        label: '후기 작성하고 1,000캐시 받기',
                        variant: ZeomButtonVariant.gold,
                        size: ZeomButtonSize.md,
                        width: double.infinity,
                        onPressed: () {
                          context.go(
                            '/consultation/${session.booking.id}/review',
                          );
                        },
                      ),
                      const SizedBox(height: 10),
                    ],
                    ZeomButton(
                      label: '홈으로',
                      variant: ZeomButtonVariant.outline,
                      size: ZeomButtonSize.md,
                      width: double.infinity,
                      onPressed: () {
                        ref.read(activeSessionProvider.notifier).clear();
                        context.go('/home');
                      },
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  String _buildSubtitle(ActiveSession? session) {
    if (session == null) {
      return '상담이 완료되었습니다.';
    }
    final name = session.booking.counselorName;
    final minutes = session.booking.durationMinutes;
    return '$name님과 $minutes분의 이야기가 마무리되었습니다.\n'
        '오늘의 마음에도 작은 쉼이 되었기를.';
  }
}

/// 84px gold-gradient (goldSoft → gold @135°) circle with a centered 🪷
/// glyph (36px). Anchored above the title per MOBILE_DESIGN_PLAN §3.10.
class _LotusBadge extends StatelessWidget {
  const _LotusBadge();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 84,
      height: 84,
      decoration: const BoxDecoration(
        shape: BoxShape.circle,
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppColors.goldSoft, AppColors.gold],
        ),
      ),
      alignment: Alignment.center,
      child: const Text(
        '\u{1FAB7}', // 🪷
        style: TextStyle(fontSize: 36, height: 1.0),
      ),
    );
  }
}

/// Session summary card for the 상담 완료 surface.
///
/// White card (14r, 1px borderSoft, padding 16) rendering the counselor's
/// avatar + name/meta + a gold "완료" pill. Mirrors the list variant used
/// on the bookings screen but tightened for the post-call context.
class _SessionSummaryCard extends StatelessWidget {
  final ActiveSession session;

  const _SessionSummaryCard({required this.session});

  @override
  Widget build(BuildContext context) {
    final booking = session.booking;
    final channelLabel =
        booking.channel == BookingChannel.video ? '영상' : '음성';
    final meta =
        '${_formatDate(booking.when)} · ${booking.durationMinutes}분 · $channelLabel';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.borderSoft, width: 1),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          ZeomAvatar(initials: booking.counselorInitials, size: 48),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  booking.counselorName,
                  style: ZeomType.cardTitle,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  meta,
                  style: ZeomType.meta.copyWith(color: AppColors.ink3),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          const _DonePill(),
        ],
      ),
    );
  }

  String _formatDate(DateTime when) {
    final month = when.month.toString().padLeft(2, '0');
    final day = when.day.toString().padLeft(2, '0');
    final hour = when.hour.toString().padLeft(2, '0');
    final minute = when.minute.toString().padLeft(2, '0');
    return '${when.year}.$month.$day $hour:$minute';
  }
}

/// Gold pill badge — `goldBg` fill, `gold` text, 10px/700, 2/8 padding.
class _DonePill extends StatelessWidget {
  const _DonePill();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: AppColors.goldBg,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        '완료',
        style: ZeomType.tag.copyWith(
          fontSize: 10,
          fontWeight: FontWeight.w700,
          color: AppColors.gold,
          letterSpacing: 0,
          height: 1.2,
        ),
      ),
    );
  }
}
