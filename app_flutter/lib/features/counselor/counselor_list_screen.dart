import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../core/api_client.dart';
import '../../shared/theme.dart';
import '../../shared/typography.dart';
import '../../shared/widgets/zeom_avatar.dart';
import '../../shared/widgets/zeom_chip.dart';
import '../../shared/widgets/zeom_presence_dot.dart';
import '../../shared/widgets/zeom_star_rating.dart';

/// Remote counselor fetch (preserved for backwards compatibility; currently
/// unused by the S03 list view which renders a seeded deck per
/// MOBILE_DESIGN_PLAN.md §3.3).
final counselorsProvider =
    FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final apiClient = ref.read(apiClientProvider);
  final response = await apiClient.getCounselors();
  final data = response.data as List;
  return data.cast<Map<String, dynamic>>();
});

/// Lightweight seed record for the S03 상담사 찾기 list.
class _Counselor {
  final String id;
  final String name;
  final String initials;
  final String style;
  final int years;
  final double rating;
  final int reviews;
  final int priceK;
  final String nextSlot;
  final bool online;
  final List<String> tags;

  const _Counselor({
    required this.id,
    required this.name,
    required this.initials,
    required this.style,
    required this.years,
    required this.rating,
    required this.reviews,
    required this.priceK,
    required this.nextSlot,
    required this.online,
    required this.tags,
  });
}

const List<_Counselor> _seedCounselors = <_Counselor>[
  _Counselor(
    id: 'c1',
    name: '지혜',
    initials: '지',
    style: '따뜻한 공감형',
    years: 8,
    rating: 4.9,
    reviews: 1284,
    priceK: 60,
    nextSlot: '지금 가능',
    online: true,
    tags: ['연애·재회', '가족', '공감'],
  ),
  _Counselor(
    id: 'c2',
    name: '현우',
    initials: '현',
    style: '현실적 분석가',
    years: 12,
    rating: 4.8,
    reviews: 932,
    priceK: 70,
    nextSlot: '오늘 20:00',
    online: false,
    tags: ['금전', '진로', '분석'],
  ),
  _Counselor(
    id: 'c3',
    name: '명희',
    initials: '명',
    style: '깊이있는 해석',
    years: 15,
    rating: 4.95,
    reviews: 2103,
    priceK: 90,
    nextSlot: '지금 가능',
    online: true,
    tags: ['종합운', '사주', '깊이'],
  ),
  _Counselor(
    id: 'c4',
    name: '성주',
    initials: '성',
    style: '명쾌한 직관',
    years: 6,
    rating: 4.7,
    reviews: 521,
    priceK: 50,
    nextSlot: '내일 14:00',
    online: false,
    tags: ['연애·재회', '명쾌'],
  ),
  _Counselor(
    id: 'c5',
    name: '수빈',
    initials: '수',
    style: '차분한 상담',
    years: 10,
    rating: 4.85,
    reviews: 1567,
    priceK: 65,
    nextSlot: '지금 가능',
    online: true,
    tags: ['가족', '건강', '차분'],
  ),
  _Counselor(
    id: 'c6',
    name: '은아',
    initials: '은',
    style: '따뜻한 위로',
    years: 5,
    rating: 4.75,
    reviews: 384,
    priceK: 45,
    nextSlot: '오늘 22:00',
    online: false,
    tags: ['연애·재회', '따뜻'],
  ),
  _Counselor(
    id: 'c7',
    name: '도윤',
    initials: '도',
    style: '예리한 통찰',
    years: 14,
    rating: 4.92,
    reviews: 1832,
    priceK: 80,
    nextSlot: '내일 16:00',
    online: false,
    tags: ['진로', '금전', '예리'],
  ),
  _Counselor(
    id: 'c8',
    name: '세원',
    initials: '세',
    style: '종합 운세',
    years: 20,
    rating: 4.98,
    reviews: 3102,
    priceK: 120,
    nextSlot: '지금 가능',
    online: true,
    tags: ['종합운', '사주', '권위'],
  ),
  _Counselor(
    id: 'c9',
    name: '가을',
    initials: '가',
    style: '공감의 대화',
    years: 7,
    rating: 4.8,
    reviews: 684,
    priceK: 55,
    nextSlot: '오늘 19:00',
    online: false,
    tags: ['연애·재회', '가족'],
  ),
  _Counselor(
    id: 'c10',
    name: '하린',
    initials: '하',
    style: '사주 해설',
    years: 11,
    rating: 4.88,
    reviews: 1402,
    priceK: 75,
    nextSlot: '지금 가능',
    online: true,
    tags: ['사주', '연운', '전문'],
  ),
];

const List<String> _categories = <String>[
  '전체',
  '연애·재회',
  '금전',
  '진로',
  '가족',
  '건강',
];

enum _SortKey { popular, rating, years }

extension on _SortKey {
  String get label {
    switch (this) {
      case _SortKey.popular:
        return '인기순';
      case _SortKey.rating:
        return '평점순';
      case _SortKey.years:
        return '경력순';
    }
  }
}

class CounselorListScreen extends ConsumerStatefulWidget {
  const CounselorListScreen({super.key});

  @override
  ConsumerState<CounselorListScreen> createState() =>
      _CounselorListScreenState();
}

class _CounselorListScreenState extends ConsumerState<CounselorListScreen> {
  final TextEditingController _searchController = TextEditingController();
  Timer? _debounce;

  String _query = '';
  int _selectedCategory = 0;
  bool _onlineOnly = false;
  _SortKey _sort = _SortKey.popular;

  @override
  void dispose() {
    _debounce?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged(String value) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 300), () {
      if (!mounted) return;
      setState(() {
        _query = value.trim();
      });
    });
  }

  List<_Counselor> _applyFilters() {
    final String q = _query.toLowerCase();
    final String category = _categories[_selectedCategory];

    final List<_Counselor> filtered = _seedCounselors.where((c) {
      if (_onlineOnly && !c.online) return false;
      if (category != '전체') {
        final bool matches = c.tags.any((t) => t.contains(category)) ||
            c.style.contains(category);
        if (!matches) return false;
      }
      if (q.isNotEmpty) {
        final String hay =
            '${c.name} ${c.style} ${c.tags.join(' ')}'.toLowerCase();
        if (!hay.contains(q)) return false;
      }
      return true;
    }).toList();

    switch (_sort) {
      case _SortKey.popular:
        filtered.sort((a, b) => b.reviews.compareTo(a.reviews));
        break;
      case _SortKey.rating:
        filtered.sort((a, b) => b.rating.compareTo(a.rating));
        break;
      case _SortKey.years:
        filtered.sort((a, b) => b.years.compareTo(a.years));
        break;
    }
    return filtered;
  }

  Future<void> _openSortSheet() async {
    final _SortKey? picked = await showModalBottomSheet<_SortKey>(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return SafeArea(
          top: false,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 8),
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 8),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 8),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: Text('정렬', style: ZeomType.section),
                ),
              ),
              for (final key in _SortKey.values)
                ListTile(
                  title: Text(
                    key.label,
                    style: ZeomType.body.copyWith(
                      color: AppColors.ink,
                      fontWeight:
                          _sort == key ? FontWeight.w600 : FontWeight.w400,
                    ),
                  ),
                  trailing: _sort == key
                      ? const Icon(Icons.check, size: 18, color: AppColors.ink)
                      : null,
                  onTap: () => Navigator.of(ctx).pop(key),
                ),
              const SizedBox(height: 8),
            ],
          ),
        );
      },
    );
    if (picked != null && picked != _sort) {
      setState(() => _sort = picked);
    }
  }

  @override
  Widget build(BuildContext context) {
    final List<_Counselor> results = _applyFilters();

    return Scaffold(
      backgroundColor: AppColors.hanji,
      body: SafeArea(
        bottom: false,
        child: ListView(
          padding: const EdgeInsets.only(bottom: 90),
          children: [
            // 1. Header
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 16),
              child: Text('상담사 찾기', style: ZeomType.pageTitle),
            ),

            // 2. SearchBar
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: _SearchBar(
                controller: _searchController,
                onChanged: _onSearchChanged,
              ),
            ),

            const SizedBox(height: 14),

            // 3. Category chips
            SizedBox(
              height: 36,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 20),
                itemCount: _categories.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (ctx, i) => ZeomChip(
                  label: _categories[i],
                  active: i == _selectedCategory,
                  variant: ZeomChipVariant.category,
                  onTap: () => setState(() => _selectedCategory = i),
                ),
              ),
            ),

            const SizedBox(height: 12),

            // 4. Filter row
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                children: [
                  _AvailableNowToggle(
                    value: _onlineOnly,
                    onChanged: (v) => setState(() => _onlineOnly = v),
                  ),
                  const Spacer(),
                  TextButton(
                    style: TextButton.styleFrom(
                      foregroundColor: AppColors.ink,
                      padding:
                          const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                      minimumSize: const Size(0, 32),
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                    onPressed: _openSortSheet,
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          _sort.label,
                          style: ZeomType.bodySm.copyWith(
                            color: AppColors.ink,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(width: 2),
                        const Icon(
                          Icons.keyboard_arrow_down,
                          size: 16,
                          color: AppColors.ink,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 10),

            // 5. Results
            if (results.isEmpty)
              const _EmptyState()
            else
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Column(
                  children: [
                    for (final c in results) _CounselorCard(counselor: c),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _SearchBar extends StatelessWidget {
  final TextEditingController controller;
  final ValueChanged<String> onChanged;

  const _SearchBar({required this.controller, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 40,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.borderSoft, width: 1),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 12),
      child: Row(
        children: [
          const Icon(Icons.search, size: 16, color: AppColors.ink3),
          const SizedBox(width: 8),
          Expanded(
            child: TextField(
              controller: controller,
              onChanged: onChanged,
              style: ZeomType.bodySm.copyWith(color: AppColors.ink),
              cursorColor: AppColors.ink,
              decoration: InputDecoration(
                isCollapsed: true,
                border: InputBorder.none,
                enabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
                filled: false,
                hintText: '이름, 분야로 검색',
                hintStyle:
                    ZeomType.bodySm.copyWith(color: AppColors.ink4),
                contentPadding: EdgeInsets.zero,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _AvailableNowToggle extends StatelessWidget {
  final bool value;
  final ValueChanged<bool> onChanged;

  const _AvailableNowToggle({required this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(6),
      onTap: () => onChanged(!value),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 2),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: 18,
              height: 18,
              child: Checkbox(
                value: value,
                onChanged: (v) => onChanged(v ?? false),
                visualDensity: VisualDensity.compact,
                materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                side: const BorderSide(color: AppColors.border, width: 1.2),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(4),
                ),
                fillColor:
                    MaterialStateProperty.resolveWith<Color>((states) {
                  if (states.contains(MaterialState.selected)) {
                    return AppColors.ink;
                  }
                  return Colors.white;
                }),
                checkColor: AppColors.hanji,
              ),
            ),
            const SizedBox(width: 8),
            Text(
              '지금 가능',
              style: ZeomType.bodySm.copyWith(
                color: AppColors.ink2,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CounselorCard extends StatelessWidget {
  final _Counselor counselor;

  const _CounselorCard({required this.counselor});

  @override
  Widget build(BuildContext context) {
    final c = counselor;
    final String statusPill = c.online ? '지금 가능' : '예약형';
    final Color pillFg = c.online ? AppColors.jadeSuccess : AppColors.ink3;
    final Color pillBg = c.online
        ? const Color.fromRGBO(45, 80, 22, 0.12)
        : AppColors.hanjiDeep;

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: () => context.push('/counselor/${c.id}'),
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.borderSoft, width: 1),
            ),
            padding: const EdgeInsets.all(14),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ZeomAvatar(
                  initials: c.initials,
                  size: 58,
                  online: c.online,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Name row + status pill
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Flexible(
                            child: Text(
                              c.name,
                              style: ZeomType.cardTitle,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          if (c.online) ...[
                            const SizedBox(width: 6),
                            const ZeomPresenceDot(size: 7, pulse: false),
                          ],
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: pillBg,
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: Text(
                              statusPill,
                              style: ZeomType.tag.copyWith(
                                color: pillFg,
                                letterSpacing: 0,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${c.style} · ${c.years}년차',
                        style: ZeomType.meta.copyWith(color: AppColors.ink3),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          ZeomStarRating(value: c.rating, size: 12),
                          const SizedBox(width: 4),
                          Text(
                            c.rating.toStringAsFixed(
                                c.rating.truncateToDouble() == c.rating
                                    ? 1
                                    : 2),
                            style: ZeomType.tabularNums(
                              base: ZeomType.meta.copyWith(
                                color: AppColors.ink2,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            '(${_formatCount(c.reviews)})',
                            style: ZeomType.tabularNums(
                              base: ZeomType.meta
                                  .copyWith(color: AppColors.ink3),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Wrap(
                        spacing: 4,
                        runSpacing: 4,
                        children: [
                          for (final tag in c.tags.take(3))
                            ZeomChip(
                              label: tag,
                              variant: ZeomChipVariant.tag,
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 10),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  mainAxisAlignment: MainAxisAlignment.start,
                  children: [
                    Text(
                      c.nextSlot,
                      style: ZeomType.meta.copyWith(color: AppColors.ink3),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${c.priceK}K',
                      style: GoogleFonts.notoSerif(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: AppColors.gold,
                        height: 1.2,
                        fontFeatures: kTabularNums,
                      ),
                    ),
                    Text(
                      '/60분',
                      style: ZeomType.micro.copyWith(color: AppColors.ink3),
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

  String _formatCount(int n) {
    final String s = n.toString();
    final StringBuffer buf = StringBuffer();
    for (int i = 0; i < s.length; i++) {
      final int fromEnd = s.length - i;
      buf.write(s[i]);
      if (fromEnd > 1 && fromEnd % 3 == 1) {
        buf.write(',');
      }
    }
    return buf.toString();
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 60, horizontal: 20),
      child: Column(
        children: [
          const Icon(Icons.search_off, size: 48, color: AppColors.ink4),
          const SizedBox(height: 12),
          Text(
            '해당 조건의 상담사가 없어요',
            textAlign: TextAlign.center,
            style: ZeomType.body.copyWith(color: AppColors.ink3),
          ),
        ],
      ),
    );
  }
}
