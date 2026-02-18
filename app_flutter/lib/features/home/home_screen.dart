import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../shared/theme.dart';
import '../../core/api_client.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  List<Map<String, dynamic>> _counselors = [];
  bool _isLoading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadCounselors();
  }

  Future<void> _loadCounselors() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final apiClient = ref.read(apiClientProvider);
      final response = await apiClient.dio.get('/api/v1/counselors');

      if (response.statusCode == 200) {
        setState(() {
          _counselors = List<Map<String, dynamic>>.from(response.data as List);
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = '상담사 목록을 불러오는데 실패했습니다';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('천지연꽃신당'),
      ),
      body: RefreshIndicator(
        onRefresh: _loadCounselors,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          _error!,
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: _loadCounselors,
                          child: const Text('다시 시도'),
                        ),
                      ],
                    ),
                  )
                : SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Hero banner
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(24),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                              colors: [
                                AppColors.inkBlack,
                                AppColors.inkBlack.withOpacity(0.8),
                              ],
                            ),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '진심을 담은 상담',
                                style: Theme.of(context)
                                    .textTheme
                                    .displaySmall
                                    ?.copyWith(
                                      color: AppColors.hanji,
                                    ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                '믿을 수 있는 전문 상담사와 함께하세요',
                                style: Theme.of(context)
                                    .textTheme
                                    .bodyMedium
                                    ?.copyWith(
                                      color: AppColors.hanji.withOpacity(0.9),
                                    ),
                              ),
                            ],
                          ),
                        ),
                        // Recommended counselors section
                        Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '추천 상담사',
                                style:
                                    Theme.of(context).textTheme.headlineMedium,
                              ),
                              const SizedBox(height: 16),
                              if (_counselors.isEmpty)
                                Center(
                                  child: Padding(
                                    padding: const EdgeInsets.all(32),
                                    child: Text(
                                      '등록된 상담사가 없습니다',
                                      style: Theme.of(context)
                                          .textTheme
                                          .bodyMedium
                                          ?.copyWith(
                                            color: AppColors.textSecondary,
                                          ),
                                    ),
                                  ),
                                )
                              else
                                ListView.builder(
                                  shrinkWrap: true,
                                  physics: const NeverScrollableScrollPhysics(),
                                  itemCount: _counselors.length > 5
                                      ? 5
                                      : _counselors.length,
                                  itemBuilder: (context, index) {
                                    final counselor = _counselors[index];
                                    return Card(
                                      margin: const EdgeInsets.only(bottom: 12),
                                      child: ListTile(
                                        contentPadding: const EdgeInsets.all(16),
                                        leading: CircleAvatar(
                                          radius: 30,
                                          backgroundColor: AppColors.lotusPink,
                                          child: Text(
                                            counselor['name']
                                                    ?.toString()
                                                    .substring(0, 1) ??
                                                '?',
                                            style: Theme.of(context)
                                                .textTheme
                                                .titleLarge
                                                ?.copyWith(
                                                  color: Colors.white,
                                                ),
                                          ),
                                        ),
                                        title: Text(
                                          counselor['name']?.toString() ?? '-',
                                          style: Theme.of(context)
                                              .textTheme
                                              .titleLarge,
                                        ),
                                        subtitle: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            const SizedBox(height: 4),
                                            Text(
                                              counselor['specialty']
                                                      ?.toString() ??
                                                  '',
                                              style: Theme.of(context)
                                                  .textTheme
                                                  .bodySmall
                                                  ?.copyWith(
                                                    color: AppColors.gold,
                                                  ),
                                            ),
                                            const SizedBox(height: 4),
                                            Text(
                                              counselor['intro']?.toString() ??
                                                  '',
                                              maxLines: 2,
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ],
                                        ),
                                        trailing: const Icon(
                                          Icons.arrow_forward_ios,
                                          size: 16,
                                        ),
                                        onTap: () {
                                          // Navigate to counselor detail
                                        },
                                      ),
                                    );
                                  },
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
}
