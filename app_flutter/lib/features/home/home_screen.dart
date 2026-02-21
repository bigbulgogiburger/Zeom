import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/api_client.dart';
import '../../shared/theme.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  List<Map<String, dynamic>> _counselors = [];
  bool _isLoading = false;
  String? _error;
  Map<String, dynamic>? _fortune;
  bool _fortuneLoading = true;
  bool _fortuneExpanded = false;

  @override
  void initState() {
    super.initState();
    _loadCounselors();
    _loadFortune();
  }

  Future<void> _loadFortune() async {
    setState(() => _fortuneLoading = true);
    try {
      final apiClient = ref.read(apiClientProvider);
      final response = await apiClient.getTodayFortune();
      if (response.statusCode == 200) {
        setState(() {
          _fortune = response.data as Map<String, dynamic>;
          _fortuneLoading = false;
        });
        return;
      }
    } catch (_) {}
    // Fallback to mock data
    setState(() {
      _fortune = {
        'overallScore': 78,
        'summary': '새로운 만남과 기회가 찾아오는 날입니다. 긍정적인 에너지를 유지하세요.',
        'categories': [
          {'label': '총운', 'score': 78},
          {'label': '재물', 'score': 65},
          {'label': '애정', 'score': 82},
          {'label': '건강', 'score': 71},
        ],
      };
      _fortuneLoading = false;
    });
  }

  Future<void> _loadCounselors() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final apiClient = ref.read(apiClientProvider);
      final response = await apiClient.getCounselors();

      if (response.statusCode == 200) {
        setState(() {
          _counselors = List<Map<String, dynamic>>.from(response.data as List);
          _isLoading = false;
        });
      }
    } on DioException catch (e) {
      setState(() {
        if (e.type == DioExceptionType.connectionTimeout ||
            e.type == DioExceptionType.receiveTimeout ||
            e.type == DioExceptionType.connectionError) {
          _error = '네트워크 연결을 확인해주세요';
        } else if (e.response?.statusCode != null && e.response!.statusCode! >= 500) {
          _error = '서버에 일시적인 문제가 발생했습니다';
        } else {
          _error = '상담사 목록을 불러오는데 실패했습니다';
        }
        _isLoading = false;
      });
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
                        Icon(
                          Icons.wifi_off,
                          size: 48,
                          color: AppColors.textSecondary.withOpacity(0.5),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          _error!,
                          style: Theme.of(context).textTheme.bodyMedium,
                          textAlign: TextAlign.center,
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
                        // Hero banner with CTA buttons
                        _buildHeroSection(context),
                        // Today's fortune card
                        _buildFortuneCard(context),
                        // Value propositions
                        _buildValuePropsSection(context),
                        // How it works - 4 steps
                        _buildHowItWorksSection(context),
                        // Recommended counselors section
                        _buildCounselorsSection(context),
                        // Trust metrics
                        _buildTrustMetricsSection(context),
                        // Final CTA
                        _buildFinalCtaSection(context),
                      ],
                    ),
                  ),
      ),
    );
  }

  Widget _buildHeroSection(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppColors.inkBlack,
            AppColors.inkBlack.withOpacity(0.85),
          ],
        ),
      ),
      child: Column(
        children: [
          ShaderMask(
            shaderCallback: (bounds) => const LinearGradient(
              colors: [AppColors.gold, Color(0xFFD4A843)],
            ).createShader(bounds),
            child: Text(
              '천지연꽃신당',
              style: GoogleFonts.notoSerif(
                fontSize: 32,
                fontWeight: FontWeight.w900,
                color: Colors.white,
                letterSpacing: 4,
              ),
              textAlign: TextAlign.center,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '天 地 蓮 花 神 堂',
            style: GoogleFonts.notoSerif(
              fontSize: 13,
              color: Colors.white54,
              letterSpacing: 6,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          Text(
            '당신의 운명, 꽃처럼 피어나는 순간',
            style: GoogleFonts.notoSerif(
              fontSize: 16,
              color: AppColors.hanji,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 28),
          // CTA buttons
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => context.push('/counselors'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.gold,
                foregroundColor: AppColors.inkBlack,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(24),
                ),
                elevation: 4,
              ),
              child: Text(
                '상담 예약하기',
                style: GoogleFonts.notoSerif(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: () => context.push('/counselors'),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.gold,
                padding: const EdgeInsets.symmetric(vertical: 14),
                side: const BorderSide(color: AppColors.gold, width: 2),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(24),
                ),
              ),
              child: Text(
                '상담사 보기',
                style: GoogleFonts.notoSerif(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Color _getScoreColor(int score) {
    if (score >= 80) return AppColors.gold;
    if (score >= 60) return const Color(0xFFB08D1F);
    if (score >= 40) return const Color(0xFF8B6914);
    return AppColors.darkRed;
  }

  Widget _buildFortuneCard(BuildContext context) {
    if (_fortuneLoading) {
      return Padding(
        padding: const EdgeInsets.all(16),
        child: Card(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                Container(
                  width: double.infinity,
                  height: 16,
                  decoration: BoxDecoration(
                    color: AppColors.border.withOpacity(0.3),
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  width: 120,
                  height: 16,
                  decoration: BoxDecoration(
                    color: AppColors.border.withOpacity(0.3),
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    if (_fortune == null) return const SizedBox.shrink();

    final score = _fortune!['overallScore'] as int;
    final summary = _fortune!['summary'] as String;
    final categories = (_fortune!['categories'] as List?)
        ?.map((e) => Map<String, dynamic>.from(e as Map))
        .toList() ?? [];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Card(
        elevation: 3,
        child: InkWell(
          onTap: () => setState(() => _fortuneExpanded = !_fortuneExpanded),
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                // Header row
                Row(
                  children: [
                    const Text('\uD83D\uDD2E', style: TextStyle(fontSize: 28)),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '오늘의 운세',
                            style: GoogleFonts.notoSerif(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              color: AppColors.gold,
                            ),
                          ),
                          Text(
                            '${DateTime.now().month}월 ${DateTime.now().day}일',
                            style: GoogleFonts.notoSans(
                              fontSize: 11,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    ShaderMask(
                      shaderCallback: (bounds) => const LinearGradient(
                        colors: [AppColors.gold, Color(0xFFD4A843)],
                      ).createShader(bounds),
                      child: Text(
                        '$score',
                        style: GoogleFonts.notoSerif(
                          fontSize: 28,
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                        ),
                      ),
                    ),
                    Text(
                      ' / 100',
                      style: GoogleFonts.notoSans(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Icon(
                      _fortuneExpanded
                          ? Icons.keyboard_arrow_up
                          : Icons.keyboard_arrow_down,
                      color: AppColors.textSecondary,
                      size: 20,
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  summary,
                  style: GoogleFonts.notoSans(
                    fontSize: 13,
                    color: AppColors.textSecondary,
                    height: 1.4,
                  ),
                ),

                // Expanded: category scores + CTA
                if (_fortuneExpanded) ...[
                  const Divider(height: 24),
                  ...categories.map((cat) {
                    final catScore = cat['score'] as int;
                    final label = cat['label'] as String;
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Row(
                        children: [
                          SizedBox(
                            width: 36,
                            child: Text(
                              label,
                              style: GoogleFonts.notoSans(
                                fontSize: 13,
                                fontWeight: FontWeight.w500,
                                color: AppColors.textPrimary,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(4),
                              child: LinearProgressIndicator(
                                value: catScore / 100,
                                minHeight: 8,
                                backgroundColor: AppColors.gold.withOpacity(0.1),
                                valueColor: AlwaysStoppedAnimation<Color>(_getScoreColor(catScore)),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          SizedBox(
                            width: 28,
                            child: Text(
                              '$catScore',
                              style: GoogleFonts.notoSerif(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: AppColors.gold,
                              ),
                              textAlign: TextAlign.right,
                            ),
                          ),
                        ],
                      ),
                    );
                  }),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      TextButton(
                        onPressed: () => context.push('/fortune'),
                        child: Text(
                          '자세히 보기',
                          style: GoogleFonts.notoSerif(
                            color: AppColors.gold,
                            fontWeight: FontWeight.w700,
                            fontSize: 13,
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      ElevatedButton(
                        onPressed: () => context.push('/counselors'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.gold,
                          foregroundColor: AppColors.inkBlack,
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(20),
                          ),
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        child: Text(
                          '상담 받기',
                          style: GoogleFonts.notoSerif(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildValuePropsSection(BuildContext context) {
    const valueProps = [
      {
        'icon': Icons.verified_user_outlined,
        'title': '검증된 상담사',
        'desc': '엄선된 전문가가 전통 점술의 지혜로 당신의 길을 밝혀드립니다',
      },
      {
        'icon': Icons.lock_outline,
        'title': '안전한 결제',
        'desc': 'PortOne 통합결제로 안심하고 간편하게 결제하세요',
      },
      {
        'icon': Icons.chat_bubble_outline,
        'title': '실시간 상담방',
        'desc': '예약 즉시 1:1 비밀 상담방이 자동 개설됩니다',
      },
    ];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 32),
      child: Column(
        children: [
          Text(
            '전통의 지혜, 현대의 편리함',
            style: GoogleFonts.notoSerif(
              fontSize: 22,
              fontWeight: FontWeight.w900,
              color: AppColors.textPrimary,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 20),
          ...valueProps.map((prop) => Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    Icon(
                      prop['icon'] as IconData,
                      size: 40,
                      color: AppColors.gold,
                    ),
                    const SizedBox(height: 12),
                    Text(
                      prop['title'] as String,
                      style: GoogleFonts.notoSerif(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      prop['desc'] as String,
                      style: GoogleFonts.notoSans(
                        fontSize: 13,
                        color: AppColors.textSecondary,
                        height: 1.5,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ),
          )),
        ],
      ),
    );
  }

  Widget _buildHowItWorksSection(BuildContext context) {
    const steps = [
      {'num': '01', 'title': '상담사 선택', 'desc': '원하는 분야의 전문 상담사를 둘러보세요'},
      {'num': '02', 'title': '시간 예약', 'desc': '가능한 시간대 중 편한 때를 선택하세요'},
      {'num': '03', 'title': '안전한 결제', 'desc': 'PortOne 통합결제로 간편하게'},
      {'num': '04', 'title': '1:1 상담 시작', 'desc': '예약 시간에 상담방이 자동 개설됩니다'},
    ];

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 32),
      color: const Color(0xFF1A1612),
      child: Column(
        children: [
          Text(
            '간단한 4단계로 시작하세요',
            style: GoogleFonts.notoSerif(
              fontSize: 22,
              fontWeight: FontWeight.w900,
              color: AppColors.hanji,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          ...steps.map((step) {
            final index = steps.indexOf(step);
            return Padding(
              padding: const EdgeInsets.only(bottom: 20),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: AppColors.gold, width: 2),
                      color: Colors.black26,
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      step['num']!,
                      style: GoogleFonts.notoSerif(
                        fontSize: 18,
                        fontWeight: FontWeight.w900,
                        color: AppColors.gold,
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 2),
                        Text(
                          step['title']!,
                          style: GoogleFonts.notoSerif(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: AppColors.hanji,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          step['desc']!,
                          style: GoogleFonts.notoSans(
                            fontSize: 13,
                            color: const Color(0xFFA49484),
                            height: 1.4,
                          ),
                        ),
                      ],
                    ),
                  ),
                  // Connector line (except last)
                  if (index < steps.length - 1)
                    const SizedBox.shrink(),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildCounselorsSection(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '추천 상담사',
            style: Theme.of(context).textTheme.headlineMedium,
          ),
          const SizedBox(height: 16),
          if (_counselors.isEmpty)
            Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  children: [
                    Text(
                      '등록된 상담사가 없습니다',
                      style: Theme.of(context)
                          .textTheme
                          .bodyMedium
                          ?.copyWith(
                            color: AppColors.textSecondary,
                          ),
                    ),
                    const SizedBox(height: 12),
                    TextButton(
                      onPressed: () => context.push('/counselors'),
                      child: Text(
                        '상담사 페이지로 이동 →',
                        style: GoogleFonts.notoSerif(
                          color: AppColors.gold,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
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
                      final id = counselor['id'];
                      if (id != null) {
                        context.push('/counselor/$id');
                      }
                    },
                  ),
                );
              },
            ),
          if (_counselors.isNotEmpty)
            Center(
              child: TextButton(
                onPressed: () => context.push('/counselors'),
                child: Text(
                  '전체 상담사 보기 →',
                  style: GoogleFonts.notoSerif(
                    color: AppColors.gold,
                    fontWeight: FontWeight.w700,
                    fontSize: 14,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildTrustMetricsSection(BuildContext context) {
    const trustStats = [
      {'value': '3', 'suffix': '명', 'label': '전문 상담사'},
      {'value': '39', 'suffix': '슬롯', 'label': '예약 가능'},
      {'value': '24', 'suffix': '시간', 'label': '연중무휴'},
      {'value': '100', 'suffix': '%', 'label': '비밀 보장'},
    ];

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 32),
      color: AppColors.inkBlack.withOpacity(0.95),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: trustStats.map((stat) {
          return Expanded(
            child: Column(
              children: [
                ShaderMask(
                  shaderCallback: (bounds) => const LinearGradient(
                    colors: [AppColors.gold, Color(0xFFD4A843)],
                  ).createShader(bounds),
                  child: Text(
                    '${stat['value']}${stat['suffix']}',
                    style: GoogleFonts.notoSerif(
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                      color: Colors.white,
                    ),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  stat['label']!,
                  style: GoogleFonts.notoSerif(
                    fontSize: 12,
                    color: const Color(0xFFA49484),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildFinalCtaSection(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
      child: Column(
        children: [
          Text(
            '지금 바로 운명의\n꽃을 피워보세요',
            style: GoogleFonts.notoSerif(
              fontSize: 22,
              fontWeight: FontWeight.w900,
              color: AppColors.textPrimary,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 12),
          Text(
            '첫 상담 예약은 간단합니다.\n상담사를 선택하고 원하는 시간에 예약하세요.',
            style: GoogleFonts.notoSans(
              fontSize: 14,
              color: AppColors.textSecondary,
              height: 1.5,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => context.push('/signup'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.gold,
                foregroundColor: AppColors.inkBlack,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(24),
                ),
                elevation: 4,
              ),
              child: Text(
                '무료로 시작하기',
                style: GoogleFonts.notoSerif(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
