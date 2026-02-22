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

  // Ohaeng colors
  static const Map<String, Color> ohaengColors = {
    '목': Color(0xFF2E8B57),
    '화': Color(0xFFDC143C),
    '토': Color(0xFFDAA520),
    '금': Color(0xFFC0C0C0),
    '수': Color(0xFF191970),
  };

  static const Map<String, dynamic> _mockFortune = {
    'overallScore': 78,
    'summary': '새로운 만남과 기회가 찾아오는 날입니다. 긍정적인 에너지를 유지하세요.',
    'categories': [
      {
        'label': '총운',
        'score': 78,
        'icon': 'sparkles',
        'description': '전반적으로 안정적인 하루가 예상됩니다.',
      },
      {
        'label': '재물',
        'score': 65,
        'icon': 'money',
        'description': '큰 지출은 자제하는 것이 좋습니다.',
      },
      {
        'label': '애정',
        'score': 82,
        'icon': 'heart',
        'description': '연인과의 관계에서 따뜻한 대화가 이어질 수 있습니다.',
      },
      {
        'label': '건강',
        'score': 71,
        'icon': 'leaf',
        'description': '가벼운 산책이나 스트레칭으로 몸을 풀어주세요.',
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

  bool get _hasSajuData {
    return _fortune != null && _fortune!['dailyPillar'] != null;
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
      case 'career':
        return Icons.work_outline;
      case 'study':
        return Icons.school_outlined;
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

  String _getGradeText(int score) {
    if (score >= 90) return '최고';
    if (score >= 80) return '매우좋음';
    if (score >= 70) return '좋음';
    if (score >= 50) return '보통';
    if (score >= 30) return '주의';
    return '흉';
  }

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    const dayNames = ['월', '화', '수', '목', '금', '토', '일'];
    final dateStr = '${now.year}년 ${now.month}월 ${now.day}일 (${dayNames[now.weekday - 1]}요일)';

    return Scaffold(
      appBar: AppBar(
        title: const Text('오늘의 운세'),
        actions: [
          IconButton(
            icon: const Icon(Icons.auto_awesome_outlined),
            tooltip: '나의 사주',
            onPressed: () => context.push('/my-saju'),
          ),
        ],
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
                        const SizedBox(height: 16),

                        // Daily pillar card (saju data)
                        if (_hasSajuData) ...[
                          _buildDailyPillarCard(),
                          const SizedBox(height: 16),
                        ],

                        // Overall score gauge
                        _buildOverallScore(),
                        const SizedBox(height: 20),

                        // Category details
                        ..._buildCategoryCards(),
                        const SizedBox(height: 16),

                        // Ohaeng balance chart (saju data)
                        if (_hasSajuData && _fortune!['ohaengBalance'] != null) ...[
                          _buildOhaengBalanceCard(),
                          const SizedBox(height: 16),
                        ],

                        // Lucky items + times
                        _buildLuckyItems(),
                        const SizedBox(height: 16),

                        // Lucky/Warning times (saju data)
                        if (_hasSajuData) ...[
                          _buildTimesCard(),
                          const SizedBox(height: 16),
                        ],

                        // Saju insight (saju data)
                        if (_hasSajuData && _fortune!['sajuInsight'] != null) ...[
                          _buildSajuInsightCard(),
                          const SizedBox(height: 16),
                        ],

                        // CTA
                        _buildCtaSection(context),
                        const SizedBox(height: 32),
                      ],
                    ),
                  ),
                ),
    );
  }

  Widget _buildDailyPillarCard() {
    final dailyPillar = _fortune!['dailyPillar'] as Map<String, dynamic>;
    final gan = dailyPillar['gan'] as String? ?? '';
    final ji = dailyPillar['ji'] as String? ?? '';
    final ganHanja = dailyPillar['ganHanja'] as String? ?? '';
    final jiHanja = dailyPillar['jiHanja'] as String? ?? '';
    // ohaeng available in dailyPillar but not displayed directly here
    final myDayGan = _fortune!['myDayGan'] as String? ?? '';
    final relationship = _fortune!['relationship'] as String? ?? '';
    final twelveUnseong = _fortune!['twelveUnseong'] as String? ?? '';
    final sipseong = _fortune!['sipseong'] as String?;

    return Card(
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              AppColors.inkBlack,
              AppColors.inkBlack.withOpacity(0.9),
            ],
          ),
        ),
        child: Column(
          children: [
            Text(
              '오늘의 일진',
              style: GoogleFonts.notoSerif(
                fontSize: 13,
                color: AppColors.gold.withOpacity(0.8),
              ),
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  '$ganHanja$jiHanja',
                  style: GoogleFonts.notoSerif(
                    fontSize: 36,
                    fontWeight: FontWeight.w900,
                    color: AppColors.gold,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  '($gan$ji)',
                  style: GoogleFonts.notoSerif(
                    fontSize: 16,
                    color: AppColors.hanji.withOpacity(0.8),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(8),
                color: Colors.white.withOpacity(0.1),
              ),
              child: Column(
                children: [
                  if (myDayGan.isNotEmpty)
                    Text(
                      '내 일간: $myDayGan',
                      style: GoogleFonts.notoSans(
                        fontSize: 13,
                        color: AppColors.hanji.withOpacity(0.9),
                      ),
                    ),
                  if (relationship.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      '관계: $relationship',
                      style: GoogleFonts.notoSans(
                        fontSize: 13,
                        color: AppColors.hanji.withOpacity(0.9),
                      ),
                    ),
                  ],
                  if (sipseong != null && sipseong.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      '십성: $sipseong',
                      style: GoogleFonts.notoSans(
                        fontSize: 13,
                        color: AppColors.gold,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                  if (twelveUnseong.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      '12운성: $twelveUnseong',
                      style: GoogleFonts.notoSans(
                        fontSize: 13,
                        color: AppColors.gold,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOverallScore() {
    final score = (_fortune!['overallScore'] as num?)?.toInt() ?? 0;
    final summary = _fortune!['summary'] as String? ?? '';
    final grade = _getGradeText(score);

    // Use saju-based category title if available
    String? title;
    if (_hasSajuData) {
      final cats = _fortune!['categories'];
      if (cats is Map) {
        final overall = cats['overall'];
        if (overall is Map) {
          title = overall['title'] as String?;
        }
      }
    }

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
                        grade,
                        style: GoogleFonts.notoSans(
                          fontSize: 12,
                          color: _getScoreColor(score),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              title ?? '총운 점수',
              style: GoogleFonts.notoSerif(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
              textAlign: TextAlign.center,
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
    // Handle both old format (list) and new saju format (map)
    List<Map<String, dynamic>> categories;

    final rawCategories = _fortune!['categories'];
    if (rawCategories is List) {
      // Old format: list of category objects
      categories = rawCategories
          .map((e) => Map<String, dynamic>.from(e as Map))
          .toList();
    } else if (rawCategories is Map) {
      // New saju format: map with keys like overall, wealth, love, etc.
      final catMap = Map<String, dynamic>.from(rawCategories);
      const categoryMeta = {
        'overall': {'label': '총운', 'icon': 'sparkles'},
        'wealth': {'label': '재물운', 'icon': 'money'},
        'love': {'label': '애정운', 'icon': 'heart'},
        'health': {'label': '건강운', 'icon': 'leaf'},
        'career': {'label': '사업운', 'icon': 'career'},
        'study': {'label': '학업운', 'icon': 'study'},
      };
      categories = [];
      for (final key in ['overall', 'wealth', 'love', 'health', 'career', 'study']) {
        if (catMap.containsKey(key) && catMap[key] is Map) {
          final cat = Map<String, dynamic>.from(catMap[key] as Map);
          cat['label'] = categoryMeta[key]?['label'] ?? key;
          cat['icon'] = categoryMeta[key]?['icon'] ?? 'sparkles';
          if (cat['description'] == null) {
            cat['description'] = cat['advice'] ?? '';
          }
          categories.add(cat);
        }
      }
    } else {
      categories = [];
    }

    return categories.map((cat) {
      final score = (cat['score'] as num?)?.toInt() ?? 0;
      final label = cat['label'] as String? ?? '';
      final icon = cat['icon'] as String? ?? 'sparkles';
      final description = cat['description'] as String? ?? '';

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
                if (description.isNotEmpty) ...[
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
              ],
            ),
          ),
        ),
      );
    }).toList();
  }

  Widget _buildOhaengBalanceCard() {
    final balance = _fortune!['ohaengBalance'] as Map<String, dynamic>;

    final totalRaw = balance.values.fold<num>(0, (sum, v) => sum + (v as num));
    final total = totalRaw == 0 ? 1 : totalRaw;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Text(
              '오행 균형',
              style: GoogleFonts.notoSerif(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: 120,
              child: CustomPaint(
                size: const Size(double.infinity, 120),
                painter: _OhaengBarPainter(
                  values: {
                    '목': (balance['목'] as num?)?.toInt() ?? 0,
                    '화': (balance['화'] as num?)?.toInt() ?? 0,
                    '토': (balance['토'] as num?)?.toInt() ?? 0,
                    '금': (balance['금'] as num?)?.toInt() ?? 0,
                    '수': (balance['수'] as num?)?.toInt() ?? 0,
                  },
                  total: total.toInt(),
                  colors: ohaengColors,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTimesCard() {
    final luckyTime = _fortune!['luckyTime'] as String?;
    final warningTime = _fortune!['warningTime'] as String?;

    if (luckyTime == null && warningTime == null) return const SizedBox.shrink();

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            if (luckyTime != null)
              _buildTimeRow(Icons.wb_sunny_outlined, '행운의 시간', luckyTime, AppColors.gold),
            if (luckyTime != null && warningTime != null) const SizedBox(height: 12),
            if (warningTime != null)
              _buildTimeRow(Icons.warning_amber_outlined, '주의 시간', warningTime, AppColors.darkRed),
          ],
        ),
      ),
    );
  }

  Widget _buildTimeRow(IconData icon, String label, String value, Color color) {
    return Row(
      children: [
        Icon(icon, color: color, size: 22),
        const SizedBox(width: 10),
        Text(
          label,
          style: GoogleFonts.notoSans(
            fontSize: 13,
            color: AppColors.textSecondary,
          ),
        ),
        const Spacer(),
        Text(
          value,
          style: GoogleFonts.notoSerif(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            color: color,
          ),
        ),
      ],
    );
  }

  Widget _buildSajuInsightCard() {
    final insight = _fortune!['sajuInsight'] as String;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.lightbulb_outline, color: AppColors.gold, size: 22),
                const SizedBox(width: 8),
                Text(
                  '사주 인사이트',
                  style: GoogleFonts.notoSerif(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              insight,
              style: GoogleFonts.notoSans(
                fontSize: 14,
                color: AppColors.textPrimary,
                height: 1.6,
              ),
            ),
          ],
        ),
      ),
    );
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
    // Use saju-based CTA if available
    final counselorCta = _fortune?['counselorCta'] as Map<String, dynamic>?;
    final ctaMessage = counselorCta?['message'] as String?;
    final showCta = counselorCta?['show'] as bool? ?? true;

    if (!showCta) return const SizedBox.shrink();

    return Card(
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              AppColors.gold.withOpacity(0.1),
              AppColors.gold.withOpacity(0.05),
            ],
          ),
        ),
        child: Column(
          children: [
            Text(
              ctaMessage ?? '운세를 바탕으로 전문 상담사와 상담해보세요',
              style: GoogleFonts.notoSans(
                fontSize: 14,
                color: AppColors.textPrimary,
                height: 1.5,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
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
                  '상담 예약하기',
                  style: GoogleFonts.notoSerif(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
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

class _OhaengBarPainter extends CustomPainter {
  final Map<String, int> values;
  final int total;
  final Map<String, Color> colors;

  _OhaengBarPainter({
    required this.values,
    required this.total,
    required this.colors,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final entries = values.entries.toList();
    final barWidth = (size.width - (entries.length - 1) * 16) / entries.length;
    final maxBarHeight = size.height - 30; // Leave space for labels

    for (var i = 0; i < entries.length; i++) {
      final entry = entries[i];
      final x = i * (barWidth + 16);
      final ratio = total > 0 ? entry.value / total : 0.0;
      final barHeight = maxBarHeight * ratio;

      // Bar background
      final bgRect = RRect.fromRectAndRadius(
        Rect.fromLTWH(x, 0, barWidth, maxBarHeight),
        const Radius.circular(4),
      );
      canvas.drawRRect(
        bgRect,
        Paint()..color = (colors[entry.key] ?? Colors.grey).withOpacity(0.15),
      );

      // Bar fill
      if (barHeight > 0) {
        final fillRect = RRect.fromRectAndRadius(
          Rect.fromLTWH(x, maxBarHeight - barHeight, barWidth, barHeight),
          const Radius.circular(4),
        );
        canvas.drawRRect(
          fillRect,
          Paint()..color = colors[entry.key] ?? Colors.grey,
        );
      }

      // Label
      final labelPainter = TextPainter(
        text: TextSpan(
          text: '${entry.key} ${entry.value}',
          style: TextStyle(
            color: colors[entry.key] ?? Colors.grey,
            fontSize: 11,
            fontWeight: FontWeight.w600,
          ),
        ),
        textDirection: TextDirection.ltr,
      )..layout();
      labelPainter.paint(
        canvas,
        Offset(x + (barWidth - labelPainter.width) / 2, maxBarHeight + 6),
      );
    }
  }

  @override
  bool shouldRepaint(covariant _OhaengBarPainter oldDelegate) {
    return true;
  }
}
