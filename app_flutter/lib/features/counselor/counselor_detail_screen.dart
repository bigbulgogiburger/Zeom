import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/api_client.dart';
import '../../shared/theme.dart';

final counselorDetailProvider =
    FutureProvider.family<Map<String, dynamic>, int>(
  (ref, counselorId) async {
    final apiClient = ref.read(apiClientProvider);
    final response = await apiClient.getCounselorDetail(counselorId);
    return response.data as Map<String, dynamic>;
  },
);

final counselorReviewsProvider =
    FutureProvider.family<Map<String, dynamic>, int>(
  (ref, counselorId) async {
    final apiClient = ref.read(apiClientProvider);
    final response = await apiClient.getCounselorReviews(counselorId);
    return response.data as Map<String, dynamic>;
  },
);

final creditBalanceProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final apiClient = ref.read(apiClientProvider);
  final response = await apiClient.getCreditBalance();
  return response.data as Map<String, dynamic>;
});

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
  final Set<int> _selectedSlotIds = {};

  void _onBookingTap() {
    final needed = _selectedSlotIds.isNotEmpty ? _selectedSlotIds.length : 1;
    final creditData = ref.read(creditBalanceProvider).valueOrNull;
    final remaining = creditData?['remainingUnits'] as int? ?? 0;

    if (creditData != null && remaining < needed) {
      final deficit = needed - remaining;
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('상담권이 부족합니다'),
          content: Text(
            '필요: $needed회 / 보유: $remaining회 / 부족: $deficit회',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text('취소'),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.of(ctx).pop();
                context.push(
                  '/credits/buy',
                  extra: {
                    'needed': deficit,
                    'returnTo': '/counselor/${widget.counselorId}',
                  },
                );
              },
              child: const Text('상담권 구매하기'),
            ),
          ],
        ),
      );
      return;
    }

    final detailData = ref
        .read(counselorDetailProvider(widget.counselorId))
        .valueOrNull;
    context.push(
      '/booking/create',
      extra: {
        'counselorId': widget.counselorId,
        if (_selectedSlotIds.isNotEmpty)
          'slotIds': _selectedSlotIds.toList(),
        if (detailData != null) 'counselorData': detailData,
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final detailAsync = ref.watch(counselorDetailProvider(widget.counselorId));
    final reviewsAsync =
        ref.watch(counselorReviewsProvider(widget.counselorId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('상담사 상세'),
      ),
      body: detailAsync.when(
        data: (counselor) {
          final slots = (counselor['slots'] as List?)
                  ?.cast<Map<String, dynamic>>() ??
              [];

          // Group slots by date
          final slotsByDate = <String, List<Map<String, dynamic>>>{};
          for (final slot in slots) {
            final startAt = DateTime.parse(slot['startAt']);
            final dateKey =
                '${startAt.year}-${startAt.month.toString().padLeft(2, '0')}-${startAt.day.toString().padLeft(2, '0')}';
            slotsByDate.putIfAbsent(dateKey, () => []).add(slot);
          }

          return SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Profile header
                Container(
                  color: Colors.white,
                  padding: const EdgeInsets.all(20),
                  child: Row(
                    children: [
                      Container(
                        width: 80,
                        height: 80,
                        decoration: BoxDecoration(
                          color: AppColors.lotusPink.withOpacity( 0.2),
                          borderRadius: BorderRadius.circular(40),
                        ),
                        child: const Icon(
                          Icons.person,
                          size: 40,
                          color: AppColors.lotusPink,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              counselor['name'] ?? '상담사',
                              style:
                                  Theme.of(context).textTheme.headlineSmall,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              counselor['specialty'] ?? '',
                              style: Theme.of(context).textTheme.bodyMedium,
                            ),
                            if (counselor['supportedConsultationTypes'] !=
                                null) ...[
                              const SizedBox(height: 4),
                              Text(
                                counselor['supportedConsultationTypes'],
                                style: Theme.of(context)
                                    .textTheme
                                    .bodySmall
                                    ?.copyWith(color: AppColors.gold),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const Divider(height: 1),

                // Intro
                if (counselor['intro'] != null &&
                    (counselor['intro'] as String).isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '소개',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          counselor['intro'],
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                      ],
                    ),
                  ),

                // Available slots grouped by date
                if (slotsByDate.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '예약 가능 시간',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        const SizedBox(height: 12),
                        ...slotsByDate.entries.map((entry) {
                          final date = DateTime.parse(entry.key);
                          return Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Padding(
                                padding:
                                    const EdgeInsets.only(top: 8, bottom: 8),
                                child: Text(
                                  '${date.month}월 ${date.day}일',
                                  style: Theme.of(context)
                                      .textTheme
                                      .labelLarge
                                      ?.copyWith(
                                          fontWeight: FontWeight.w600),
                                ),
                              ),
                              Wrap(
                                spacing: 8,
                                runSpacing: 8,
                                children:
                                    entry.value.map((slot) {
                                  final slotId = slot['id'] as int;
                                  final startAt =
                                      DateTime.parse(slot['startAt']);
                                  final endAt =
                                      DateTime.parse(slot['endAt']);
                                  final isSelected =
                                      _selectedSlotIds.contains(slotId);

                                  return ChoiceChip(
                                    label: Text(
                                      '${startAt.hour}:${startAt.minute.toString().padLeft(2, '0')} - ${endAt.hour}:${endAt.minute.toString().padLeft(2, '0')}',
                                    ),
                                    selected: isSelected,
                                    onSelected: (selected) {
                                      setState(() {
                                        if (selected) {
                                          _selectedSlotIds.add(slotId);
                                        } else {
                                          _selectedSlotIds.remove(slotId);
                                        }
                                      });
                                    },
                                    selectedColor:
                                        AppColors.gold.withOpacity( 0.3),
                                    backgroundColor: Colors.white,
                                    side: BorderSide(
                                      color: isSelected
                                          ? AppColors.gold
                                          : AppColors.border,
                                    ),
                                  );
                                }).toList(),
                              ),
                            ],
                          );
                        }),
                      ],
                    ),
                  ),

                if (slots.isEmpty)
                  Padding(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 20, vertical: 12),
                    child: Text(
                      '현재 예약 가능한 시간이 없습니다',
                      style: Theme.of(context)
                          .textTheme
                          .bodyMedium
                          ?.copyWith(color: AppColors.textSecondary),
                    ),
                  ),

                const SizedBox(height: 24),

                // Reviews
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Text(
                    '리뷰',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                ),
                const SizedBox(height: 12),

                reviewsAsync.when(
                  data: (data) {
                    final reviews =
                        (data['reviews'] as List?)
                                ?.cast<Map<String, dynamic>>() ??
                            [];
                    if (reviews.isEmpty) {
                      return const Padding(
                        padding: EdgeInsets.all(20),
                        child: Center(child: Text('아직 리뷰가 없습니다')),
                      );
                    }
                    return Column(
                      children: [
                        ...reviews.map((review) {
                          final createdAt = review['createdAt'] != null
                              ? DateTime.tryParse(
                                  review['createdAt'].toString())
                              : null;
                          return Card(
                            margin: const EdgeInsets.symmetric(
                                horizontal: 20, vertical: 6),
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment:
                                    CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Text(
                                        '사용자 #${review['userId'] ?? ''}',
                                        style: Theme.of(context)
                                            .textTheme
                                            .labelLarge,
                                      ),
                                      const Spacer(),
                                      Row(
                                        children: List.generate(
                                          review['rating'] ?? 0,
                                          (i) => const Icon(
                                            Icons.star,
                                            size: 14,
                                            color: AppColors.gold,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    review['comment'] ?? '',
                                    style: Theme.of(context)
                                        .textTheme
                                        .bodyMedium,
                                  ),
                                  if (createdAt != null) ...[
                                    const SizedBox(height: 8),
                                    Text(
                                      '${createdAt.year}.${createdAt.month}.${createdAt.day}',
                                      style: Theme.of(context)
                                          .textTheme
                                          .bodySmall,
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          );
                        }),
                        if ((data['totalElements'] as int? ?? 0) >
                            reviews.length)
                          Padding(
                            padding: const EdgeInsets.all(16),
                            child: Text(
                              '총 ${data['totalElements']}개의 리뷰',
                              style: Theme.of(context)
                                  .textTheme
                                  .bodySmall
                                  ?.copyWith(color: AppColors.textSecondary),
                            ),
                          ),
                      ],
                    );
                  },
                  loading: () =>
                      const Center(child: CircularProgressIndicator()),
                  error: (err, stack) => Padding(
                    padding: const EdgeInsets.all(20),
                    child: Text('리뷰를 불러올 수 없습니다: $err'),
                  ),
                ),

                const SizedBox(height: 80),
              ],
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('오류가 발생했습니다: $err'),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => ref.invalidate(
                    counselorDetailProvider(widget.counselorId)),
                child: const Text('다시 시도'),
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Credit balance badge
              ref.watch(creditBalanceProvider).when(
                    data: (credit) {
                      final remaining = credit['remainingUnits'] as int? ?? 0;
                      return Container(
                        width: double.infinity,
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 8),
                        decoration: BoxDecoration(
                          color: AppColors.gold.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                              color: AppColors.gold.withOpacity(0.3)),
                        ),
                        child: Text(
                          '보유 상담권: $remaining회',
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: AppColors.gold,
                          ),
                        ),
                      );
                    },
                    loading: () => const SizedBox.shrink(),
                    error: (_, __) => const SizedBox.shrink(),
                  ),
              ElevatedButton(
                onPressed: () => _onBookingTap(),
                child: Text(
                  _selectedSlotIds.isNotEmpty
                      ? '예약하기 (${_selectedSlotIds.length}개 선택)'
                      : '예약하기',
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
