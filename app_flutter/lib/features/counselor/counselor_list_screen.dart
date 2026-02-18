import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/api_client.dart';
import '../../shared/theme.dart';

final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());

final counselorsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final apiClient = ref.read(apiClientProvider);
  try {
    final response = await apiClient.getCounselors();
    final data = response.data as List;
    return data.cast<Map<String, dynamic>>();
  } catch (e) {
    // Return mock data if API fails
    return [
      {
        'id': 1,
        'name': '이지혜 상담사',
        'specialty': '타로·사주',
        'rating': 4.8,
        'reviewCount': 234,
        'profileImage': null,
      },
      {
        'id': 2,
        'name': '박미영 상담사',
        'specialty': '운세·궁합',
        'rating': 4.9,
        'reviewCount': 189,
        'profileImage': null,
      },
      {
        'id': 3,
        'name': '최영수 상담사',
        'specialty': '토정비결',
        'rating': 4.7,
        'reviewCount': 156,
        'profileImage': null,
      },
    ];
  }
});

class CounselorListScreen extends ConsumerWidget {
  const CounselorListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final counselorsAsync = ref.watch(counselorsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('상담사 목록'),
      ),
      body: counselorsAsync.when(
        data: (counselors) {
          if (counselors.isEmpty) {
            return const Center(
              child: Text('등록된 상담사가 없습니다'),
            );
          }

          return GridView.builder(
            padding: const EdgeInsets.all(16),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              childAspectRatio: 0.75,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
            ),
            itemCount: counselors.length,
            itemBuilder: (context, index) {
              final counselor = counselors[index];
              return _CounselorCard(counselor: counselor);
            },
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
                onPressed: () => ref.invalidate(counselorsProvider),
                child: const Text('다시 시도'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CounselorCard extends StatelessWidget {
  final Map<String, dynamic> counselor;

  const _CounselorCard({required this.counselor});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: () {
          context.push('/counselor/${counselor['id']}');
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Profile image placeholder
              Container(
                height: 100,
                decoration: BoxDecoration(
                  color: AppColors.lotusPink.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Center(
                  child: Icon(
                    Icons.person,
                    size: 48,
                    color: AppColors.lotusPink,
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                counselor['name'] ?? '상담사',
                style: Theme.of(context).textTheme.titleLarge,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 4),
              Text(
                counselor['specialty'] ?? '',
                style: Theme.of(context).textTheme.bodySmall,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const Spacer(),
              Row(
                children: [
                  const Icon(Icons.star, size: 16, color: AppColors.gold),
                  const SizedBox(width: 4),
                  Text(
                    '${counselor['rating'] ?? 0.0}',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    '(${counselor['reviewCount'] ?? 0})',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
