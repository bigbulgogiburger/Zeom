import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../shared/animations/zeom_animations.dart';
import '../../shared/providers/active_session_provider.dart';
import '../../shared/providers/bookings_provider.dart';
import '../../shared/providers/wallet_provider.dart';
import '../../shared/theme.dart';
import '../../shared/typography.dart';
import '../../shared/widgets/zeom_avatar.dart';
import '../../shared/widgets/zeom_button.dart';
import '../../shared/widgets/zeom_hero_card.dart';
import '../../shared/widgets/zeom_presence_dot.dart';
import '../../shared/widgets/zeom_star_rating.dart';

/// S02 홈 — 천지연꽃신당 mobile home tab root.
///
/// Per MOBILE_DESIGN_PLAN.md §3.2 layout:
///   HomeHeader → WalletHeroCard → QuickActionsGrid → FortunePreviewCard
///   → section header → LiveCounselorsCarousel → UpcomingBookingBanner
///
/// Design rules per MOBILE_DESIGN.md:
///   - Canvas: `hanji` (#F5EBDD)
///   - Card surface: white + 1px borderSoft, 14px radius, NO shadow
///   - Numbers: Noto Serif 700 + tabularNums
///   - Page side padding: 20, paddingBottom: 90 (tab bar clearance §5.6)
///   - Quick Action emoji set is the only UI emoji exception (§7 Don't #5)
class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final int balance = ref.watch(walletProvider);
    final List<Booking> upcoming = ref.watch(bookingsUpcomingProvider);

    return Scaffold(
      backgroundColor: AppColors.hanji,
      body: SafeArea(
        bottom: false,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 90),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // 1. Home header (brand + bell)
              const _HomeHeader(hasUnread: true),
              const SizedBox(height: 16),

              // 2. Wallet hero
              ZeomFadeSlideIn(
                child: _WalletHero(balance: balance),
              ),
              const SizedBox(height: 16),

              // 3. Quick actions grid
              ZeomFadeSlideIn(
                delay: const Duration(milliseconds: 60),
                child: const _QuickActionsGrid(),
              ),
              const SizedBox(height: 16),

              // 4. Fortune preview card
              ZeomFadeSlideIn(
                delay: const Duration(milliseconds: 120),
                child: const _FortunePreviewCard(),
              ),
              const SizedBox(height: 24),

              // 5. Section header
              const _SectionHeader(
                title: '지금 상담 가능',
                actionLabel: '전체 보기 ›',
                actionRoute: '/counselors',
              ),
              const SizedBox(height: 10),

              // 6. Live counselors carousel
              const _LiveCounselorsCarousel(),

              // 7. Upcoming booking banner (conditional)
              if (upcoming.isNotEmpty) ...[
                const SizedBox(height: 20),
                _UpcomingBookingBanner(booking: upcoming.first),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

// ===================================================================
// 1. HomeHeader
// ===================================================================

class _HomeHeader extends StatelessWidget {
  const _HomeHeader({required this.hasUnread});

  final bool hasUnread;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // "천지연꽃신당" — 꽃 char in gold
              RichText(
                text: TextSpan(
                  style: GoogleFonts.notoSerif(
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                    color: AppColors.ink,
                    height: 1.3,
                    letterSpacing: -0.2,
                  ),
                  children: [
                    const TextSpan(text: '천지연'),
                    TextSpan(
                      text: '꽃',
                      style: GoogleFonts.notoSerif(
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
                        color: AppColors.gold,
                        height: 1.3,
                        letterSpacing: -0.2,
                      ),
                    ),
                    const TextSpan(text: '신당'),
                  ],
                ),
              ),
              const SizedBox(height: 2),
              Text(
                '안녕하세요, 윤서연님',
                style: ZeomType.body.copyWith(color: AppColors.ink3),
              ),
            ],
          ),
        ),
        // Notification bell
        Semantics(
          button: true,
          label: hasUnread ? '알림 (새 알림 있음)' : '알림',
          child: GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: () {
              // TODO(router): add route /notifications
            },
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: AppColors.borderSoft,
                      width: 1,
                    ),
                  ),
                  alignment: Alignment.center,
                  child: const Icon(
                    Icons.notifications_none_outlined,
                    size: 20,
                    color: AppColors.ink,
                  ),
                ),
                if (hasUnread)
                  Positioned(
                    top: -4,
                    right: -4,
                    child: Container(
                      width: 7,
                      height: 7,
                      decoration: const BoxDecoration(
                        color: AppColors.darkRed,
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

// ===================================================================
// 2. Wallet Hero Card
// ===================================================================

class _WalletHero extends StatelessWidget {
  const _WalletHero({required this.balance});

  final int balance;

  String _formatCash(int n) {
    // Manual thousand-grouping (intl import avoided — not in deps).
    final String s = n.toString();
    final StringBuffer out = StringBuffer();
    for (int i = 0; i < s.length; i++) {
      final int fromEnd = s.length - i;
      out.write(s[i]);
      if (fromEnd > 1 && fromEnd % 3 == 1) out.write(',');
    }
    return out.toString();
  }

  @override
  Widget build(BuildContext context) {
    final bool isEmpty = balance <= 0;
    final TextStyle balanceStyle = GoogleFonts.notoSerif(
      fontSize: 30,
      fontWeight: isEmpty ? FontWeight.w600 : FontWeight.w700,
      color: isEmpty ? AppColors.ink4 : AppColors.gold,
      height: 1.1,
      fontFeatures: kTabularNums,
    );

    return ZeomHeroCard(
      mandalaSize: 180,
      mandalaPosition: Alignment.topRight,
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          // "내 캐시" label
          Text(
            '내 캐시',
            style: GoogleFonts.notoSans(
              fontSize: 11,
              fontWeight: FontWeight.w500,
              letterSpacing: 1,
              color: AppColors.hanji.withOpacity(0.7),
            ),
          ),
          const SizedBox(height: 6),
          // Balance row
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Flexible(
                child: Text(
                  isEmpty ? '0' : _formatCash(balance),
                  style: balanceStyle,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 4),
              Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Text(
                  '캐시',
                  style: GoogleFonts.notoSans(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: AppColors.hanji,
                  ),
                ),
              ),
            ],
          ),
          if (isEmpty) ...[
            const SizedBox(height: 4),
            Text(
              '지금 충전해보세요',
              style: GoogleFonts.notoSans(
                fontSize: 12,
                color: AppColors.hanji.withOpacity(0.7),
              ),
            ),
          ],
          const SizedBox(height: 14),
          // Buttons row
          Row(
            children: [
              Expanded(
                child: ZeomButton(
                  label: '충전',
                  variant: ZeomButtonVariant.gold,
                  size: ZeomButtonSize.sm,
                  onPressed: () => context.push('/wallet/cash-buy'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _DarkGhostButton(
                  label: '내역',
                  onPressed: () => context.push('/wallet'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Ghost button tuned for dark (hero) backgrounds: semi-translucent white
/// surface + hanji text. ZeomButton's ghost variant assumes a light bg.
class _DarkGhostButton extends StatefulWidget {
  const _DarkGhostButton({required this.label, required this.onPressed});

  final String label;
  final VoidCallback onPressed;

  @override
  State<_DarkGhostButton> createState() => _DarkGhostButtonState();
}

class _DarkGhostButtonState extends State<_DarkGhostButton> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: widget.label,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTapDown: (_) => setState(() => _pressed = true),
        onTapUp: (_) => setState(() => _pressed = false),
        onTapCancel: () => setState(() => _pressed = false),
        onTap: widget.onPressed,
        child: AnimatedScale(
          scale: _pressed ? 0.98 : 1.0,
          duration: const Duration(milliseconds: 120),
          curve: Curves.easeOut,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              color: const Color.fromRGBO(255, 255, 255, 0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            alignment: Alignment.center,
            child: Text(
              widget.label,
              style: GoogleFonts.notoSans(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.hanji,
                height: 1.2,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ),
      ),
    );
  }
}

// ===================================================================
// 3. Quick Actions Grid
// ===================================================================

class _QuickActionsGrid extends StatelessWidget {
  const _QuickActionsGrid();

  @override
  Widget build(BuildContext context) {
    // § 7 Don't #5 — the only UI emoji exception. 4 hardcoded actions.
    final actions = <_QuickAction>[
      _QuickAction(
        emoji: '\u{1F52E}', // 🔮
        label: '오늘의 운세',
        onTap: () => context.push('/fortune'),
      ),
      _QuickAction(
        emoji: '\u{1F4C5}', // 📅
        label: '바로 예약',
        onTap: () => context.push('/counselors'),
      ),
      _QuickAction(
        emoji: '\u{1FAB7}', // 🪷
        label: '사주 보기',
        onTap: () => context.push('/my-saju'),
      ),
      _QuickAction(
        emoji: '\u{1F4AC}', // 💬
        label: '상담 내역',
        onTap: () => context.push('/bookings'),
      ),
    ];

    return GridView.count(
      crossAxisCount: 4,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 10,
      mainAxisSpacing: 10,
      childAspectRatio: 1,
      children: actions.map((a) => _QuickActionTile(action: a)).toList(),
    );
  }
}

class _QuickAction {
  final String emoji;
  final String label;
  final VoidCallback onTap;

  _QuickAction({
    required this.emoji,
    required this.label,
    required this.onTap,
  });
}

class _QuickActionTile extends StatelessWidget {
  const _QuickActionTile({required this.action});

  final _QuickAction action;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: action.onTap,
        borderRadius: BorderRadius.circular(14),
        child: Ink(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.borderSoft, width: 1),
          ),
          child: Padding(
            padding: const EdgeInsets.all(8),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  action.emoji,
                  style: const TextStyle(fontSize: 28, height: 1.0),
                ),
                const SizedBox(height: 8),
                Text(
                  action.label,
                  style: ZeomType.body.copyWith(
                    fontWeight: FontWeight.w500,
                    color: AppColors.ink,
                  ),
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ===================================================================
// 4. Fortune Preview Card
// ===================================================================

class _FortunePreviewCard extends StatelessWidget {
  const _FortunePreviewCard();

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final dateStr = '${now.month}월 ${now.day}일';

    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: () => context.push('/fortune'),
        borderRadius: BorderRadius.circular(14),
        child: Ink(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.borderSoft, width: 1),
          ),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Badge + date
                Row(
                  children: [
                    // Gold pill badge
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.goldBg,
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        '오늘의 운세',
                        style: ZeomType.tag.copyWith(color: AppColors.ink),
                      ),
                    ),
                    const Spacer(),
                    Text(
                      dateStr,
                      style: ZeomType.meta.copyWith(color: AppColors.ink3),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                // Quote
                Text(
                  '"인연은 서두르지 않고, 때를 기다리면 스스로 다가옵니다."',
                  style: GoogleFonts.notoSerif(
                    fontSize: 17,
                    fontWeight: FontWeight.w600,
                    color: AppColors.ink,
                    height: 1.5,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 14),
                // 2x2 mini ratings
                Row(
                  children: const [
                    Expanded(child: _MiniRating(label: '총운', value: 4.0)),
                    SizedBox(width: 8),
                    Expanded(child: _MiniRating(label: '애정', value: 4.0)),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: const [
                    Expanded(child: _MiniRating(label: '금전', value: 4.0)),
                    SizedBox(width: 8),
                    Expanded(child: _MiniRating(label: '건강', value: 4.0)),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _MiniRating extends StatelessWidget {
  const _MiniRating({required this.label, required this.value});

  final String label;
  final double value;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(
          label,
          style: GoogleFonts.notoSans(
            fontSize: 11,
            color: AppColors.ink3,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(width: 6),
        ZeomStarRating(value: value, size: 10),
      ],
    );
  }
}

// ===================================================================
// 5. Section Header
// ===================================================================

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({
    required this.title,
    required this.actionLabel,
    required this.actionRoute,
  });

  final String title;
  final String actionLabel;
  final String actionRoute;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text(title, style: ZeomType.section),
        ),
        TextButton(
          onPressed: () => context.push(actionRoute),
          style: TextButton.styleFrom(
            minimumSize: Size.zero,
            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
          ),
          child: Text(
            actionLabel,
            style: ZeomType.meta.copyWith(color: AppColors.ink3),
          ),
        ),
      ],
    );
  }
}

// ===================================================================
// 6. Live Counselors Carousel
// ===================================================================

class _LiveCounselorsCarousel extends StatelessWidget {
  const _LiveCounselorsCarousel();

  @override
  Widget build(BuildContext context) {
    // TODO(data): wire via counselorsProvider when available.
    const seeds = <_CounselorSeed>[
      _CounselorSeed(
        id: 'c1',
        name: '지혜 상담사',
        initials: '지',
        spec: '스타일',
        years: 8,
        rating: 4.9,
        reviews: 421,
        priceK: 60,
      ),
      _CounselorSeed(
        id: 'c2',
        name: '현우 상담사',
        initials: '현',
        spec: '신점',
        years: 12,
        rating: 4.8,
        reviews: 312,
        priceK: 60,
      ),
      _CounselorSeed(
        id: 'c3',
        name: '선화 상담사',
        initials: '선',
        spec: '사주',
        years: 6,
        rating: 4.9,
        reviews: 198,
        priceK: 55,
      ),
      _CounselorSeed(
        id: 'c4',
        name: '민결 상담사',
        initials: '민',
        spec: '타로',
        years: 5,
        rating: 4.7,
        reviews: 156,
        priceK: 50,
      ),
    ];

    return SizedBox(
      height: 180,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        itemCount: seeds.length,
        separatorBuilder: (_, __) => const SizedBox(width: 10),
        itemBuilder: (context, i) => _LiveCounselorCard(seed: seeds[i]),
      ),
    );
  }
}

class _CounselorSeed {
  final String id;
  final String name;
  final String initials;
  final String spec;
  final int years;
  final double rating;
  final int reviews;
  final int priceK;

  const _CounselorSeed({
    required this.id,
    required this.name,
    required this.initials,
    required this.spec,
    required this.years,
    required this.rating,
    required this.reviews,
    required this.priceK,
  });
}

class _LiveCounselorCard extends StatelessWidget {
  const _LiveCounselorCard({required this.seed});

  final _CounselorSeed seed;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: () => context.push('/counselor/${seed.id}'),
        borderRadius: BorderRadius.circular(14),
        child: Ink(
          width: 160,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.borderSoft, width: 1),
          ),
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Top row: LIVE + "지금"
                Row(
                  children: [
                    const ZeomPresenceDot(pulse: true, size: 7),
                    const SizedBox(width: 4),
                    Text(
                      'LIVE',
                      style: GoogleFonts.notoSans(
                        fontSize: 9,
                        fontWeight: FontWeight.w700,
                        color: AppColors.jadeSuccess,
                        letterSpacing: 0.5,
                      ),
                    ),
                    const Spacer(),
                    Text(
                      '지금',
                      style: GoogleFonts.notoSerif(
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                        color: AppColors.ink3,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                // Avatar
                Center(
                  child: ZeomAvatar(
                    initials: seed.initials,
                    size: 48,
                  ),
                ),
                const SizedBox(height: 6),
                // Name
                Text(
                  seed.name,
                  style: ZeomType.cardTitle,
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                // Subtitle
                Text(
                  '${seed.spec} · ${seed.years}년차',
                  style: ZeomType.meta.copyWith(color: AppColors.ink3),
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                // Rating
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    ZeomStarRating(value: seed.rating, size: 10),
                    const SizedBox(width: 4),
                    Text(
                      '(${seed.reviews})',
                      style: GoogleFonts.notoSans(
                        fontSize: 10,
                        color: AppColors.ink3,
                        fontFeatures: kTabularNums,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                // Price
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.baseline,
                  textBaseline: TextBaseline.alphabetic,
                  children: [
                    Text(
                      '${seed.priceK}K',
                      style: GoogleFonts.notoSerif(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: AppColors.gold,
                        fontFeatures: kTabularNums,
                      ),
                    ),
                    const SizedBox(width: 2),
                    Text(
                      '/60분',
                      style: GoogleFonts.notoSans(
                        fontSize: 10,
                        color: AppColors.ink4,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ===================================================================
// 7. Upcoming Booking Banner
// ===================================================================

class _UpcomingBookingBanner extends ConsumerWidget {
  const _UpcomingBookingBanner({required this.booking});

  final Booking booking;

  String _formatTime(DateTime dt) {
    String two(int v) => v.toString().padLeft(2, '0');
    final y = dt.year;
    final m = dt.month;
    final d = dt.day;
    return '$y.${two(m)}.${two(d)} ${two(dt.hour)}:${two(dt.minute)}';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.ink,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          ZeomAvatar(
            initials: booking.counselorInitials,
            size: 40,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  booking.counselorName,
                  style: ZeomType.cardTitle.copyWith(color: AppColors.hanji),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  _formatTime(booking.when),
                  style: ZeomType.meta.copyWith(
                    color: AppColors.hanji.withOpacity(0.7),
                    fontFeatures: kTabularNums,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          ZeomButton(
            label: '입장',
            variant: ZeomButtonVariant.gold,
            size: ZeomButtonSize.sm,
            onPressed: () {
              ref.read(activeSessionProvider.notifier).set(booking);
              // TODO(router): confirm preflight path — currently
              // `/consultation/:bookingId/preflight` is the actual route.
              context.push('/consultation/${booking.id}/preflight');
            },
          ),
        ],
      ),
    );
  }
}
