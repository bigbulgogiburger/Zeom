import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/api_client.dart';
import '../../shared/theme.dart';

final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());

final counselorDetailProvider = FutureProvider.family<Map<String, dynamic>, int>(
  (ref, counselorId) async {
    final apiClient = ref.read(apiClientProvider);
    try {
      final response = await apiClient.getCounselorDetail(counselorId);
      return response.data as Map<String, dynamic>;
    } catch (e) {
      // Return mock data if API fails
      return {
        'id': counselorId,
        'name': '이지혜 상담사',
        'specialty': '타로·사주',
        'rating': 4.8,
        'reviewCount': 234,
        'bio': '20년 경력의 타로 전문 상담사입니다. 연애, 진로, 사업 등 다양한 분야의 고민을 함께 풀어드립니다.',
        'availableSlots': [
          '2026-02-16T10:00:00',
          '2026-02-16T14:00:00',
          '2026-02-17T11:00:00',
        ],
      };
    }
  },
);

final counselorReviewsProvider = FutureProvider.family<List<Map<String, dynamic>>, int>(
  (ref, counselorId) async {
    final apiClient = ref.read(apiClientProvider);
    try {
      final response = await apiClient.getCounselorReviews(counselorId);
      final data = response.data as List;
      return data.cast<Map<String, dynamic>>();
    } catch (e) {
      // Return mock reviews if API fails
      return [
        {
          'id': 1,
          'userName': '김*민',
          'rating': 5,
          'comment': '정확한 상담 감사합니다. 많은 도움이 되었어요.',
          'createdAt': '2026-02-10',
        },
        {
          'id': 2,
          'userName': '이*수',
          'rating': 5,
          'comment': '따뜻하고 세심한 상담이었습니다.',
          'createdAt': '2026-02-08',
        },
      ];
    }
  },
);

class CounselorDetailScreen extends ConsumerWidget {
  final int counselorId;

  const CounselorDetailScreen({
    super.key,
    required this.counselorId,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detailAsync = ref.watch(counselorDetailProvider(counselorId));
    final reviewsAsync = ref.watch(counselorReviewsProvider(counselorId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('상담사 상세'),
      ),
      body: detailAsync.when(
        data: (counselor) {
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
                          color: AppColors.lotusPink.withOpacity(0.2),
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
                              style: Theme.of(context).textTheme.headlineSmall,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              counselor['specialty'] ?? '',
                              style: Theme.of(context).textTheme.bodyMedium,
                            ),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                const Icon(Icons.star, size: 18, color: AppColors.gold),
                                const SizedBox(width: 4),
                                Text(
                                  '${counselor['rating'] ?? 0.0}',
                                  style: Theme.of(context).textTheme.bodyMedium,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  '(리뷰 ${counselor['reviewCount'] ?? 0}개)',
                                  style: Theme.of(context).textTheme.bodySmall,
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const Divider(height: 1),

                // Bio
                if (counselor['bio'] != null)
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
                          counselor['bio'],
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                      ],
                    ),
                  ),

                // Available slots
                if (counselor['availableSlots'] != null)
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
                        ...(counselor['availableSlots'] as List).map((slot) {
                          final dateTime = DateTime.parse(slot);
                          return Card(
                            margin: const EdgeInsets.only(bottom: 8),
                            child: ListTile(
                              leading: const Icon(Icons.schedule, color: AppColors.gold),
                              title: Text(
                                '${dateTime.month}월 ${dateTime.day}일 ${dateTime.hour}:${dateTime.minute.toString().padLeft(2, '0')}',
                              ),
                              trailing: const Icon(Icons.chevron_right),
                              onTap: () {
                                // Navigate to booking flow
                                context.push(
                                  '/booking/create',
                                  extra: {
                                    'counselorId': counselorId,
                                    'slotStart': slot,
                                  },
                                );
                              },
                            ),
                          );
                        }).toList(),
                      ],
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
                  data: (reviews) {
                    if (reviews.isEmpty) {
                      return const Padding(
                        padding: EdgeInsets.all(20),
                        child: Center(child: Text('아직 리뷰가 없습니다')),
                      );
                    }
                    return Column(
                      children: reviews.map((review) {
                        return Card(
                          margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Text(
                                      review['userName'] ?? '익명',
                                      style: Theme.of(context).textTheme.labelLarge,
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
                                  style: Theme.of(context).textTheme.bodyMedium,
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  review['createdAt'] ?? '',
                                  style: Theme.of(context).textTheme.bodySmall,
                                ),
                              ],
                            ),
                          ),
                        );
                      }).toList(),
                    );
                  },
                  loading: () => const Center(child: CircularProgressIndicator()),
                  error: (err, stack) => Padding(
                    padding: const EdgeInsets.all(20),
                    child: Text('리뷰를 불러올 수 없습니다: $err'),
                  ),
                ),

                const SizedBox(height: 80), // Bottom padding for button
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
                onPressed: () => ref.invalidate(counselorDetailProvider(counselorId)),
                child: const Text('다시 시도'),
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: ElevatedButton(
            onPressed: () {
              context.push(
                '/booking/create',
                extra: {'counselorId': counselorId},
              );
            },
            child: const Text('예약하기'),
          ),
        ),
      ),
    );
  }
}
