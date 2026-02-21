import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/api_client.dart';
import '../../shared/theme.dart';

final counselorsProvider =
    FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final apiClient = ref.read(apiClientProvider);
  final response = await apiClient.getCounselors();
  final data = response.data as List;
  return data.cast<Map<String, dynamic>>();
});

class CounselorListScreen extends ConsumerStatefulWidget {
  const CounselorListScreen({super.key});

  @override
  ConsumerState<CounselorListScreen> createState() =>
      _CounselorListScreenState();
}

class _CounselorListScreenState extends ConsumerState<CounselorListScreen> {
  String _searchQuery = '';
  String? _selectedSpecialty;

  @override
  Widget build(BuildContext context) {
    final counselorsAsync = ref.watch(counselorsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('상담사 목록'),
      ),
      body: counselorsAsync.when(
        data: (counselors) {
          // Extract unique specialties for filter
          final specialties = counselors
              .map((c) => c['specialty'] as String?)
              .where((s) => s != null && s.isNotEmpty)
              .cast<String>()
              .toSet()
              .toList();

          // Apply search and filter
          var filtered = counselors;
          if (_searchQuery.isNotEmpty) {
            filtered = filtered
                .where((c) => (c['name'] as String? ?? '')
                    .contains(_searchQuery))
                .toList();
          }
          if (_selectedSpecialty != null) {
            filtered = filtered
                .where(
                    (c) => c['specialty'] == _selectedSpecialty)
                .toList();
          }

          return Column(
            children: [
              // Search bar
              Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: TextField(
                  onChanged: (value) {
                    setState(() {
                      _searchQuery = value;
                    });
                  },
                  decoration: InputDecoration(
                    hintText: '상담사 이름 검색',
                    prefixIcon: const Icon(Icons.search),
                    suffixIcon: _searchQuery.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear),
                            onPressed: () {
                              setState(() {
                                _searchQuery = '';
                              });
                            },
                          )
                        : null,
                  ),
                ),
              ),

              // Specialty filter chips
              if (specialties.isNotEmpty)
                SizedBox(
                  height: 48,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    children: [
                      Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ChoiceChip(
                          label: const Text('전체'),
                          selected: _selectedSpecialty == null,
                          onSelected: (_) {
                            setState(() {
                              _selectedSpecialty = null;
                            });
                          },
                          selectedColor:
                              AppColors.gold.withOpacity( 0.3),
                        ),
                      ),
                      ...specialties.map((specialty) {
                        return Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: ChoiceChip(
                            label: Text(specialty),
                            selected: _selectedSpecialty == specialty,
                            onSelected: (selected) {
                              setState(() {
                                _selectedSpecialty =
                                    selected ? specialty : null;
                              });
                            },
                            selectedColor:
                                AppColors.gold.withOpacity( 0.3),
                          ),
                        );
                      }),
                    ],
                  ),
                ),

              const SizedBox(height: 8),

              // Counselor grid
              Expanded(
                child: filtered.isEmpty
                    ? Center(
                        child: Text(
                          _searchQuery.isNotEmpty ||
                                  _selectedSpecialty != null
                              ? '검색 결과가 없습니다'
                              : '등록된 상담사가 없습니다',
                          style: Theme.of(context)
                              .textTheme
                              .bodyLarge
                              ?.copyWith(color: AppColors.textSecondary),
                        ),
                      )
                    : GridView.builder(
                        padding: const EdgeInsets.all(16),
                        gridDelegate:
                            const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          childAspectRatio: 0.75,
                          crossAxisSpacing: 12,
                          mainAxisSpacing: 12,
                        ),
                        itemCount: filtered.length,
                        itemBuilder: (context, index) {
                          final counselor = filtered[index];
                          return _CounselorCard(counselor: counselor);
                        },
                      ),
              ),
            ],
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
                  color: AppColors.lotusPink.withOpacity( 0.2),
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
              if (counselor['supportedConsultationTypes'] != null)
                Text(
                  counselor['supportedConsultationTypes'],
                  style: Theme.of(context)
                      .textTheme
                      .bodySmall
                      ?.copyWith(color: AppColors.gold),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
            ],
          ),
        ),
      ),
    );
  }
}
