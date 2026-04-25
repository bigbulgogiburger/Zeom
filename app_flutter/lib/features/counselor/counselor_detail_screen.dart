import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../shared/providers/bookings_provider.dart';
import '../../shared/providers/pending_booking_provider.dart';
import '../../shared/theme.dart';
import '../../shared/typography.dart';
import '../../shared/widgets/zeom_app_bar.dart';
import '../../shared/widgets/zeom_avatar.dart';
import '../../shared/widgets/zeom_button.dart';
import '../../shared/widgets/zeom_star_rating.dart';

/// Local seed row for the mobile counselor detail screen. The primary app
/// uses live API data, but P1-E3 (MOBILE_DESIGN_PLAN.md §3.4) re-skins the
/// screen around a designed mock. Data is keyed off the route's int ID so
/// the flow still works without backend plumbing.
class _CounselorSeed {
  final String id;
  final String name;
  final String initials;
  final String specialty;
  final String tagline;
  final String bio;
  final int years;
  final double rating;
  final int reviewCount;

  const _CounselorSeed({
    required this.id,
    required this.name,
    required this.initials,
    required this.specialty,
    required this.tagline,
    required this.bio,
    required this.years,
    required this.rating,
    required this.reviewCount,
  });
}

const Map<int, _CounselorSeed> _counselorSeeds = {
  1: _CounselorSeed(
    id: 'c1',
    name: '지혜 상담사',
    initials: '지',
    specialty: '연애·재회 · 가족',
    tagline: '따뜻한 공감 · 연애·재회 전문',
    bio:
        '연애·재회 상담 8년 경력으로 1,200여 분과 마음을 나눴습니다. 급하게 결론을 내기보다 고민을 함께 풀어가며, 내담자 분이 직접 답을 찾을 수 있도록 돕습니다.',
    years: 8,
    rating: 4.9,
    reviewCount: 1284,
  ),
  2: _CounselorSeed(
    id: 'c2',
    name: '현우 상담사',
    initials: '현',
    specialty: '직장·대인관계 · 가족',
    tagline: '현실적 조언 · 직장·가족 전문',
    bio:
        '직장 스트레스와 가족 갈등을 10년 이상 상담해왔습니다. 부드럽지만 솔직한 조언으로 상황을 객관적으로 바라볼 수 있도록 돕습니다.',
    years: 10,
    rating: 4.8,
    reviewCount: 964,
  ),
  3: _CounselorSeed(
    id: 'c3',
    name: '연화 상담사',
    initials: '연',
    specialty: '종합운·사주 · 택일',
    tagline: '정갈한 해석 · 종합운·사주 전문',
    bio:
        '정통 사주명리와 타로를 함께 풀어드립니다. 올해의 흐름과 결정해야 할 시기를 구체적으로 짚어드리는 상담을 지향합니다.',
    years: 12,
    rating: 5.0,
    reviewCount: 2104,
  ),
};

class CounselorDetailScreen extends ConsumerStatefulWidget {
  final int counselorId;

  const CounselorDetailScreen({
    super.key,
    required this.counselorId,
  });

  @override
  ConsumerState<CounselorDetailScreen> createState() =>
      _CounselorDetailScreenState();
}

class _CounselorDetailScreenState
    extends ConsumerState<CounselorDetailScreen> {
  int _tabIndex = 0; // 0=소개, 1=후기, 2=안내
  int _dateIndex = 0; // 0..6
  int? _timeIndex; // 0..12 (10:00 ~ 22:00)
  BookingChannel? _channel;
  bool _favorite = false;

  static const List<int> _hours = [
    10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22,
  ];

  _CounselorSeed get _counselor {
    return _counselorSeeds[widget.counselorId] ??
        _CounselorSeed(
          id: 'c${widget.counselorId}',
          name: '상담사',
          initials: '상',
          specialty: '종합 상담',
          tagline: '따뜻한 공감 · 종합 상담',
          bio:
              '상담사와 첫 대화를 시작해보세요. 오늘 하루를 돌아보며 마음을 정리할 수 있도록 도와드립니다.',
          years: 5,
          rating: 4.7,
          reviewCount: 320,
        );
  }

  DateTime get _selectedDate {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    return today.add(Duration(days: _dateIndex));
  }

  DateTime? get _combinedDateTime {
    if (_timeIndex == null) return null;
    final d = _selectedDate;
    return DateTime(d.year, d.month, d.day, _hours[_timeIndex!]);
  }

  /// Deterministic set of booked hour indices for the current date.
  /// Hash the counselor+date to pick 3 of the 13 slots so the UI is stable
  /// per date but varies across dates/counselors.
  Set<int> get _bookedIndices {
    final d = _selectedDate;
    final key = '${_counselor.id}-${d.year}${d.month}${d.day}';
    int h = 0;
    for (final cu in key.codeUnits) {
      h = (h * 31 + cu) & 0x7fffffff;
    }
    final picks = <int>{};
    var cursor = h;
    while (picks.length < 3) {
      picks.add(cursor % _hours.length);
      cursor = (cursor * 1103515245 + 12345) & 0x7fffffff;
    }
    return picks;
  }

  void _confirm() {
    final when = _combinedDateTime;
    final channel = _channel;
    if (when == null || channel == null) return;
    final c = _counselor;
    ref.read(pendingBookingProvider.notifier).state = PendingBooking(
      counselorId: c.id,
      counselorName: c.name,
      counselorInitials: c.initials,
      when: when,
      durationMinutes: 60,
      channel: channel,
      priceCash: 60000,
    );
    // Router expects extras including an int counselorId — pass widget's
    // path param so `/booking/create` loads without crashing.
    context.push(
      '/booking/create',
      extra: {
        'counselorId': widget.counselorId,
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final c = _counselor;
    final bookedIdx = _bookedIndices;
    final canConfirm = _timeIndex != null && _channel != null;

    return Scaffold(
      backgroundColor: AppColors.hanji,
      appBar: ZeomAppBar(
        title: '상담사',
        actions: [
          IconButton(
            onPressed: () => setState(() => _favorite = !_favorite),
            icon: Icon(
              _favorite ? Icons.favorite : Icons.favorite_border,
              size: 22,
              color: _favorite ? AppColors.darkRed : AppColors.ink2,
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.only(bottom: 140),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildProfileHeader(c),
            _buildTabSelector(),
            const SizedBox(height: 16),
            _buildTabContent(c),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 12),
              child: Text('날짜 선택', style: ZeomType.section),
            ),
            _buildDateStrip(),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 12),
              child: Text('시간 선택 · 1시간 단위', style: ZeomType.section),
            ),
            _buildTimeGrid(bookedIdx),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 12),
              child: Text('상담 방식', style: ZeomType.section),
            ),
            _buildChannelToggle(),
          ],
        ),
      ),
      bottomSheet: _buildStickyCta(canConfirm: canConfirm),
    );
  }

  // ---------------- Profile header ----------------

  Widget _buildProfileHeader(_CounselorSeed c) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ZeomAvatar(initials: c.initials, size: 84, online: true),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    _buildPill(
                      '지금 가능',
                      bg: AppColors.jadeSuccess.withOpacity(0.10),
                      fg: AppColors.jadeSuccess,
                    ),
                    const SizedBox(width: 6),
                    _buildPill(
                      '${c.years}년차',
                      bg: AppColors.gold.withOpacity(0.15),
                      fg: AppColors.gold,
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(c.name, style: ZeomType.pageTitle),
                const SizedBox(height: 2),
                Text(
                  c.tagline,
                  style: ZeomType.meta.copyWith(color: AppColors.ink3),
                ),
                const SizedBox(height: 6),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    ZeomStarRating(value: c.rating, size: 14),
                    const SizedBox(width: 4),
                    Text(
                      ' ${c.rating.toStringAsFixed(1)}',
                      style: ZeomType.tabularNums(base: ZeomType.cardTitle),
                    ),
                    Text(
                      ' (${_formatCount(c.reviewCount)})',
                      style: ZeomType.tabularNums(
                        base: ZeomType.meta.copyWith(color: AppColors.ink3),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPill(String text, {required Color bg, required Color fg}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w600,
          color: fg,
          height: 1.2,
        ),
      ),
    );
  }

  String _formatCount(int n) {
    final s = n.toString();
    final buf = StringBuffer();
    for (var i = 0; i < s.length; i++) {
      if (i > 0 && (s.length - i) % 3 == 0) buf.write(',');
      buf.write(s[i]);
    }
    return buf.toString();
  }

  // ---------------- Tab selector ----------------

  Widget _buildTabSelector() {
    const labels = ['소개', '후기', '안내'];
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: List.generate(labels.length, (i) {
          final active = _tabIndex == i;
          return Expanded(
            child: GestureDetector(
              behavior: HitTestBehavior.opaque,
              onTap: () => setState(() => _tabIndex = i),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  border: Border(
                    bottom: BorderSide(
                      color: active ? AppColors.ink : Colors.transparent,
                      width: 2,
                    ),
                  ),
                ),
                alignment: Alignment.center,
                child: Text(
                  labels[i],
                  style: TextStyle(
                    fontFamily: 'Pretendard',
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: active ? AppColors.ink : AppColors.ink3,
                  ),
                ),
              ),
            ),
          );
        }),
      ),
    );
  }

  // ---------------- Tab content ----------------

  Widget _buildTabContent(_CounselorSeed c) {
    switch (_tabIndex) {
      case 0:
        return _buildIntroTab(c);
      case 1:
        return _buildReviewsTab();
      case 2:
      default:
        return _buildPolicyTab();
    }
  }

  Widget _buildIntroTab(_CounselorSeed c) {
    final info = <List<String>>[
      ['전문 분야', '연애·재회 · 가족'],
      ['상담 스타일', '차분한 공감'],
      ['경력', '${c.years}년 · 누적 ${_formatCount(c.reviewCount)}건'],
      ['응답 속도', '평균 1분 이내'],
    ];
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            c.bio,
            style: ZeomType.body.copyWith(color: AppColors.ink, height: 1.7),
          ),
          const SizedBox(height: 16),
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 2,
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
            childAspectRatio: 3,
            children: info
                .map(
                  (row) => Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.hanjiDeep,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          row[0],
                          style: ZeomType.micro.copyWith(
                            color: AppColors.ink3,
                            letterSpacing: 1,
                          ),
                        ),
                        Text(
                          row[1],
                          style: ZeomType.cardTitle
                              .copyWith(color: AppColors.ink),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                )
                .toList(growable: false),
          ),
        ],
      ),
    );
  }

  Widget _buildReviewsTab() {
    final reviews = <_SeededReview>[
      const _SeededReview(
        initials: '민',
        name: '민지',
        rating: 5,
        date: '2일 전',
        body:
            '마음이 답답할 때 찾아갔는데, 판단하지 않고 끝까지 들어주셨어요. 상담 끝나고 나니 마음이 한결 가벼워졌습니다.',
        tags: ['차분해요', '공감 잘해요'],
      ),
      _SeededReview(
        initials: '수',
        name: '수현',
        rating: 5,
        date: '1주 전',
        body:
            '재회 가능성에 대해 냉정하게 짚어주시면서도 따뜻한 조언을 해주셨어요. 현실적인 조언이라 더 믿음이 갔어요.',
        tags: const ['정확해요', '친절해요'],
      ),
      const _SeededReview(
        initials: '하',
        name: '하늘',
        rating: 4,
        date: '2주 전',
        body: '시간이 조금 부족하게 느껴졌지만, 꼭 필요한 이야기를 정리해서 말씀해주셨습니다. 다음에 또 찾아뵙고 싶어요.',
        tags: ['이해가 쉬워요'],
      ),
    ];
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        children: reviews
            .map((r) => Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppColors.borderSoft),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          ZeomAvatar(initials: r.initials, size: 32),
                          const SizedBox(width: 10),
                          Text(r.name, style: ZeomType.cardTitle),
                          const SizedBox(width: 8),
                          ZeomStarRating(
                            value: r.rating.toDouble(),
                            size: 12,
                          ),
                          const Spacer(),
                          Text(
                            r.date,
                            style: ZeomType.meta.copyWith(color: AppColors.ink4),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Text(
                        r.body,
                        style: ZeomType.body
                            .copyWith(color: AppColors.ink, height: 1.6),
                      ),
                      if (r.tags.isNotEmpty) ...[
                        const SizedBox(height: 10),
                        Wrap(
                          spacing: 6,
                          runSpacing: 6,
                          children: r.tags
                              .map((t) => Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: AppColors.hanjiDeep,
                                      borderRadius: BorderRadius.circular(999),
                                    ),
                                    child: Text(
                                      '#$t',
                                      style: ZeomType.micro.copyWith(
                                        color: AppColors.ink2,
                                        letterSpacing: 0,
                                      ),
                                    ),
                                  ))
                              .toList(growable: false),
                        ),
                      ],
                    ],
                  ),
                ))
            .toList(growable: false),
      ),
    );
  }

  Widget _buildPolicyTab() {
    final items = <_PolicyItem>[
      const _PolicyItem(
        icon: Icons.access_time,
        title: '60분 기준',
        desc: '상담 시간은 1시간이며, 시작 1분 전부터 입장 가능합니다',
      ),
      const _PolicyItem(
        icon: Icons.login,
        title: '입장 안내',
        desc: '대기실에서 마이크·카메라 점검 후 입장하세요',
      ),
      const _PolicyItem(
        icon: Icons.replay,
        title: '환불 정책',
        desc: '상담 24시간 전 100% · 1시간 전 50% · 이후 서비스 이슈 심사',
      ),
      const _PolicyItem(
        icon: Icons.wifi,
        title: '재연결',
        desc: '네트워크 단절 시 5분 내 재연결 시 상담 이어집니다',
      ),
    ];
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        children: items
            .map(
              (it) => Padding(
                padding: const EdgeInsets.only(bottom: 14),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: AppColors.hanjiDeep,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      alignment: Alignment.center,
                      child: Icon(it.icon, size: 18, color: AppColors.ink),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(it.title, style: ZeomType.cardTitle),
                          const SizedBox(height: 4),
                          Text(
                            it.desc,
                            style: ZeomType.body.copyWith(
                              color: AppColors.ink2,
                              height: 1.6,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            )
            .toList(growable: false),
      ),
    );
  }

  // ---------------- Date strip ----------------

  Widget _buildDateStrip() {
    const weekdayAbbr = ['월', '화', '수', '목', '금', '토', '일'];
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    return SizedBox(
      height: 72,
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        scrollDirection: Axis.horizontal,
        itemCount: 7,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (context, i) {
          final d = today.add(Duration(days: i));
          final selected = _dateIndex == i;
          final label = i == 0
              ? '오늘'
              : i == 1
                  ? '내일'
                  // DateTime.weekday: Mon=1..Sun=7 → 0..6
                  : weekdayAbbr[(d.weekday - 1) % 7];
          return GestureDetector(
            onTap: () => setState(() {
              _dateIndex = i;
              _timeIndex = null;
            }),
            child: Container(
              width: 52,
              padding: const EdgeInsets.symmetric(vertical: 10),
              decoration: BoxDecoration(
                color: selected ? AppColors.ink : Colors.white,
                borderRadius: BorderRadius.circular(10),
                border: selected
                    ? null
                    : Border.all(color: AppColors.borderSoft),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    label,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                      color: selected ? AppColors.hanji : AppColors.ink,
                      height: 1.2,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${d.day}',
                    style: GoogleFonts.notoSerif(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: selected ? AppColors.hanji : AppColors.ink,
                      height: 1.0,
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  // ---------------- Time grid ----------------

  Widget _buildTimeGrid(Set<int> booked) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: GridView.count(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        crossAxisCount: 4,
        crossAxisSpacing: 6,
        mainAxisSpacing: 6,
        childAspectRatio: 2.4,
        children: List.generate(_hours.length, (i) {
          final isBooked = booked.contains(i);
          final selected = _timeIndex == i;
          final label = '${_hours[i]}:00';
          final bg = isBooked
              ? AppColors.hanjiDeep
              : selected
                  ? AppColors.gold
                  : Colors.white;
          final border = isBooked
              ? Border.all(color: AppColors.hanjiDeep)
              : selected
                  ? Border.all(color: AppColors.gold, width: 1.5)
                  : Border.all(color: AppColors.borderSoft);
          final textColor = isBooked
              ? AppColors.ink4
              : selected
                  ? AppColors.ink
                  : AppColors.ink;
          return GestureDetector(
            onTap: isBooked
                ? null
                : () => setState(() => _timeIndex = i),
            child: Container(
              decoration: BoxDecoration(
                color: bg,
                borderRadius: BorderRadius.circular(8),
                border: border,
              ),
              alignment: Alignment.center,
              child: Text(
                label,
                style: ZeomType.tabularNums(
                  base: ZeomType.body.copyWith(
                    color: textColor,
                    fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
                    decoration: isBooked
                        ? TextDecoration.lineThrough
                        : TextDecoration.none,
                  ),
                ),
              ),
            ),
          );
        }),
      ),
    );
  }

  // ---------------- Channel toggle ----------------

  Widget _buildChannelToggle() {
    final items = <_ChannelOption>[
      const _ChannelOption(
        channel: BookingChannel.video,
        icon: Icons.videocam,
        label: '화상',
        desc: '얼굴 보며 대화',
      ),
      const _ChannelOption(
        channel: BookingChannel.voice,
        icon: Icons.mic,
        label: '음성',
        desc: '목소리로 조용히',
      ),
    ];
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: GridView.count(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        crossAxisCount: 2,
        crossAxisSpacing: 10,
        mainAxisSpacing: 10,
        childAspectRatio: 2.5,
        children: items.map((opt) {
          final selected = _channel == opt.channel;
          final bg = selected ? AppColors.ink : Colors.white;
          final fg = selected ? AppColors.hanji : AppColors.ink;
          return GestureDetector(
            onTap: () => setState(() => _channel = opt.channel),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              decoration: BoxDecoration(
                color: bg,
                borderRadius: BorderRadius.circular(12),
                border: selected
                    ? null
                    : Border.all(color: AppColors.borderSoft),
              ),
              child: Row(
                children: [
                  Icon(opt.icon, size: 22, color: fg),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          opt.label,
                          style: ZeomType.cardTitle.copyWith(color: fg),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          opt.desc,
                          style: ZeomType.meta.copyWith(
                            color: selected
                                ? AppColors.hanji.withOpacity(0.8)
                                : AppColors.ink3,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
        }).toList(growable: false),
      ),
    );
  }

  // ---------------- Sticky CTA ----------------

  Widget _buildStickyCta({required bool canConfirm}) {
    final time = _timeIndex == null ? null : _hours[_timeIndex!];
    final labelText = _ctaLabel(time);

    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            AppColors.hanji.withOpacity(0.0),
            AppColors.hanji.withOpacity(1.0),
          ],
          stops: const [0.0, 0.3],
        ),
      ),
      padding: const EdgeInsets.fromLTRB(20, 14, 20, 34),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  '60분',
                  style: ZeomType.micro.copyWith(color: AppColors.ink3),
                ),
                const SizedBox(height: 2),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.baseline,
                  textBaseline: TextBaseline.alphabetic,
                  children: [
                    Text(
                      '60,000',
                      style: GoogleFonts.notoSerif(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: AppColors.gold,
                        height: 1.0,
                        fontFeatures: kTabularNums,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '캐시',
                      style: ZeomType.meta.copyWith(color: AppColors.ink3),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          SizedBox(
            width: 180,
            child: ZeomButton(
              label: labelText,
              onPressed: canConfirm ? _confirm : null,
              variant: canConfirm
                  ? ZeomButtonVariant.primary
                  : ZeomButtonVariant.ghost,
              size: ZeomButtonSize.md,
            ),
          ),
        ],
      ),
    );
  }

  String _ctaLabel(int? hour) {
    if (hour == null) return '시간을 선택해주세요';
    final dayLabel = _dateIndex == 0
        ? '오늘'
        : _dateIndex == 1
            ? '내일'
            : '${_selectedDate.month}/${_selectedDate.day}';
    return '$dayLabel $hour:00 예약';
  }
}

class _SeededReview {
  final String initials;
  final String name;
  final int rating;
  final String date;
  final String body;
  final List<String> tags;

  const _SeededReview({
    required this.initials,
    required this.name,
    required this.rating,
    required this.date,
    required this.body,
    required this.tags,
  });
}

class _PolicyItem {
  final IconData icon;
  final String title;
  final String desc;
  const _PolicyItem({
    required this.icon,
    required this.title,
    required this.desc,
  });
}

class _ChannelOption {
  final BookingChannel channel;
  final IconData icon;
  final String label;
  final String desc;
  const _ChannelOption({
    required this.channel,
    required this.icon,
    required this.label,
    required this.desc,
  });
}
