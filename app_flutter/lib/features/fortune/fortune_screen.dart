import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/api_client.dart';
import '../../shared/theme.dart';
import 'dart:math';

class FortuneScreen extends ConsumerStatefulWidget {
  const FortuneScreen({super.key});

  @override
  ConsumerState<FortuneScreen> createState() => _FortuneScreenState();
}

class _FortuneScreenState extends ConsumerState<FortuneScreen> {
  Map<String, dynamic>? _fortune;
  bool _isLoading = true;

  static const Map<String, dynamic> _mockFortune = {
    'overallScore': 78,
    'summary': '새로운 만남과 기회가 찾아오는 날입니다. 긍정적인 에너지를 유지하세요.',
    'categories': [
      {
        'label': '총운',
        'score': 78,
        'icon': 'sparkles',
        'description': '전반적으로 안정적인 하루가 예상됩니다. 오전에는 집중력이 높아 중요한 업무를 처리하기 좋고, 오후에는 주변 사람들과의 소통에서 좋은 에너지를 받을 수 있습니다.',
      },
      {
        'label': '재물',
        'score': 65,
        'icon': 'money',
        'description': '큰 지출은 자제하는 것이 좋습니다. 예상치 못한 소비가 발생할 수 있으니 충동구매에 주의하세요.',
      },
      {
        'label': '애정',
        'score': 82,
        'icon': 'heart',
        'description': '연인과의 관계에서 따뜻한 대화가 이어질 수 있습니다. 솔로라면 새로운 인연을 만날 가능성이 높습니다.',
      },
      {
        'label': '건강',
        'score': 71,
        'icon': 'leaf',
        'description': '가벼운 산책이나 스트레칭으로 몸을 풀어주세요. 과도한 운동보다는 휴식과 균형 잡힌 식사가 중요한 날입니다.',
      },
    ],
    'luckyColor': '금색',
    'luckyNumber': 7,
    'luckyDirection': '남동쪽',
  };

  @override
  void initState() {
    super.initState();
    _loadFortune();
  }

  Future<void> _loadFortune() async {
    setState(() => _isLoading = true);
    try {
      final apiClient = ref.read(apiClientProvider);
      final response = await apiClient.getTodayFortune();
      if (response.statusCode == 200) {
        setState(() {
          _fortune = response.data as Map<String, dynamic>;
          _isLoading = false;
        });
        return;
      }
    } catch (_) {}
    setState(() {
      _fortune = Map<String, dynamic>.from(_mockFortune);
      _isLoading = false;
    });
  }

  IconData _getCategoryIcon(String icon) {
    switch (icon) {
      case 'sparkles':
        return Icons.auto_awesome;
      case 'money':
        return Icons.account_balance_wallet_outlined;
      case 'heart':
        return Icons.favorite_outline;
      case 'leaf':
        return Icons.eco_outlined;
      default:
        return Icons.star_outline;
    }
  }

  Color _getScoreColor(int score) {
    if (score >= 80) return AppColors.gold;
    if (score >= 60) return const Color(0xFFB08D1F);
    if (score >= 40) return const Color(0xFF8B6914);
    return AppColors.darkRed;
  }

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    const dayNames = ['월', '화', '수', '목', '금', '토', '일'];
    final dateStr = '${now.year}년 ${now.month}월 ${now.day}일 (${dayNames[now.weekday - 1]}요일)';

    return Scaffold(
      appBar: AppBar(
        title: const Text('오늘의 운세'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _fortune == null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline, size: 48, color: AppColors.textSecondary),
                      const SizedBox(height: 12),
                      const Text('운세를 불러올 수 없습니다'),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _loadFortune,
                        child: const Text('다시 시도'),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadFortune,
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        // Date
                        Text(
                          dateStr,
                          style: GoogleFonts.notoSans(
                            fontSize: 13,
                            color: AppColors.textSecondary,
                          ),
                        ),
                        const SizedBox(height: 20),

                        // Overall score gauge
                        _buildOverallScore(),
                        const SizedBox(height: 24),

                        // Category details
                        ..._buildCategoryCards(),
                        const SizedBox(height: 20),

                        // Lucky items
                        _buildLuckyItems(),
                        const SizedBox(height: 24),

                        // CTA
                        _buildCtaSection(context),
                        const SizedBox(height: 32),
                      ],
                    ),
                  ),
                ),
    );
  }

  Widget _buildOverallScore() {
    final score = _fortune!['overallScore'] as int;
    final summary = _fortune!['summary'] as String;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            SizedBox(
              width: 140,
              height: 140,
              child: CustomPaint(
                painter: _ScoreGaugePainter(score: score, color: _getScoreColor(score)),
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      ShaderMask(
                        shaderCallback: (bounds) => const LinearGradient(
                          colors: [AppColors.gold, Color(0xFFD4A843)],
                        ).createShader(bounds),
                        child: Text(
                          '$score',
                          style: GoogleFonts.notoSerif(
                            fontSize: 36,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                          ),
                        ),
                      ),
                      Text(
                        '/ 100',
                        style: GoogleFonts.notoSans(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              '총운 점수',
              style: GoogleFonts.notoSerif(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              summary,
              style: GoogleFonts.notoSans(
                fontSize: 14,
                color: AppColors.textSecondary,
                height: 1.6,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  List<Widget> _buildCategoryCards() {
    final categories = (_fortune!['categories'] as List)
        .map((e) => Map<String, dynamic>.from(e as Map))
        .toList();

    return categories.map((cat) {
      final score = cat['score'] as int;
      final label = cat['label'] as String;
      final icon = cat['icon'] as String;
      final description = cat['description'] as String;

      return Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(
                      _getCategoryIcon(icon),
                      color: AppColors.gold,
                      size: 24,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      label,
                      style: GoogleFonts.notoSerif(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const Spacer(),
                    Text(
                      '$score',
                      style: GoogleFonts.notoSerif(
                        fontSize: 20,
                        fontWeight: FontWeight.w900,
                        color: AppColors.gold,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                // Score bar
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: score / 100,
                    minHeight: 8,
                    backgroundColor: AppColors.gold.withOpacity(0.1),
                    valueColor: AlwaysStoppedAnimation<Color>(_getScoreColor(score)),
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  description,
                  style: GoogleFonts.notoSans(
                    fontSize: 13,
                    color: AppColors.textSecondary,
                    height: 1.5,
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }).toList();
  }

  Widget _buildLuckyItems() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Text(
              '행운의 아이템',
              style: GoogleFonts.notoSerif(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildLuckyItem(
                  Icons.palette_outlined,
                  '행운의 색',
                  _fortune!['luckyColor']?.toString() ?? '-',
                ),
                _buildLuckyItem(
                  Icons.tag,
                  '행운의 숫자',
                  _fortune!['luckyNumber']?.toString() ?? '-',
                ),
                _buildLuckyItem(
                  Icons.explore_outlined,
                  '행운의 방향',
                  _fortune!['luckyDirection']?.toString() ?? '-',
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLuckyItem(IconData icon, String label, String value) {
    return Column(
      children: [
        Icon(icon, size: 28, color: AppColors.gold),
        const SizedBox(height: 6),
        Text(
          label,
          style: GoogleFonts.notoSans(
            fontSize: 11,
            color: AppColors.textSecondary,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: GoogleFonts.notoSerif(
            fontSize: 15,
            fontWeight: FontWeight.w700,
            color: AppColors.gold,
          ),
        ),
      ],
    );
  }

  Widget _buildCtaSection(BuildContext context) {
    return Column(
      children: [
        Text(
          '운세를 바탕으로 전문 상담사와 상담해보세요',
          style: GoogleFonts.notoSans(
            fontSize: 13,
            color: AppColors.textSecondary,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 12),
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
            ),
            child: Text(
              '상담 받기',
              style: GoogleFonts.notoSerif(
                fontSize: 16,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _ScoreGaugePainter extends CustomPainter {
  final int score;
  final Color color;

  _ScoreGaugePainter({required this.score, required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2 - 8;

    // Background arc
    final bgPaint = Paint()
      ..color = AppColors.gold.withOpacity(0.1)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 8
      ..strokeCap = StrokeCap.round;

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -pi / 2,
      2 * pi,
      false,
      bgPaint,
    );

    // Score arc
    final scorePaint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 8
      ..strokeCap = StrokeCap.round;

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -pi / 2,
      2 * pi * (score / 100),
      false,
      scorePaint,
    );
  }

  @override
  bool shouldRepaint(covariant _ScoreGaugePainter oldDelegate) {
    return oldDelegate.score != score || oldDelegate.color != color;
  }
}
