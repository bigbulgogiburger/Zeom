import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/api_client.dart';
import '../../shared/theme.dart';

class SajuChartScreen extends ConsumerStatefulWidget {
  const SajuChartScreen({super.key});

  @override
  ConsumerState<SajuChartScreen> createState() => _SajuChartScreenState();
}

class _SajuChartScreenState extends ConsumerState<SajuChartScreen> {
  Map<String, dynamic>? _chart;
  bool _isLoading = true;
  String? _error;

  static const Map<String, Color> ohaengColors = {
    '목': Color(0xFF2E8B57),
    '화': Color(0xFFDC143C),
    '토': Color(0xFFDAA520),
    '금': Color(0xFFC0C0C0),
    '수': Color(0xFF191970),
  };

  static const Map<String, String> ohaengLabels = {
    '목': '목(木)',
    '화': '화(火)',
    '토': '토(土)',
    '금': '금(金)',
    '수': '수(水)',
  };

  @override
  void initState() {
    super.initState();
    _loadChart();
  }

  Future<void> _loadChart() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final apiClient = ref.read(apiClientProvider);
      final response = await apiClient.getSajuChart();
      if (response.statusCode == 200) {
        setState(() {
          _chart = response.data as Map<String, dynamic>;
          _isLoading = false;
        });
        return;
      }
      setState(() {
        _error = '사주 정보를 불러올 수 없습니다';
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        // Check if it's a 404 (no birth info)
        _error = 'no_birth_info';
        _isLoading = false;
      });
    }
  }

  Color _getOhaengColor(String? ohaeng) {
    if (ohaeng == null) return AppColors.textSecondary;
    return ohaengColors[ohaeng] ?? AppColors.textSecondary;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('나의 사주 명식'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? _buildErrorOrPrompt()
              : RefreshIndicator(
                  onRefresh: _loadChart,
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        _buildPillarTable(),
                        const SizedBox(height: 20),
                        _buildOhaengDistribution(),
                        const SizedBox(height: 20),
                        if (_chart!['dayGanInterpretation'] != null)
                          _buildDayGanInterpretation(),
                        if (_chart!['dayGanInterpretation'] != null)
                          const SizedBox(height: 20),
                        if (_chart!['yongshin'] != null)
                          _buildYongshinCard(),
                        if (_chart!['yongshin'] != null)
                          const SizedBox(height: 20),
                        _buildCounselorCta(),
                        const SizedBox(height: 32),
                      ],
                    ),
                  ),
                ),
    );
  }

  Widget _buildErrorOrPrompt() {
    if (_error == 'no_birth_info') {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.person_outline,
                size: 64,
                color: AppColors.gold.withOpacity(0.5),
              ),
              const SizedBox(height: 20),
              Text(
                '생년월일 정보가 필요합니다',
                style: GoogleFonts.notoSerif(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              Text(
                '정확한 사주 명식을 보려면\n생년월일과 태어난 시간을 입력해주세요.',
                style: GoogleFonts.notoSans(
                  fontSize: 14,
                  color: AppColors.textSecondary,
                  height: 1.5,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 28),
              ElevatedButton(
                onPressed: () {
                  // Navigate to profile/settings to update birth info
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('프로필 설정에서 생년월일을 입력해주세요')),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.gold,
                  foregroundColor: AppColors.inkBlack,
                  padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(24),
                  ),
                ),
                child: Text(
                  '생년월일 입력하기',
                  style: GoogleFonts.notoSerif(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, size: 48, color: AppColors.textSecondary),
          const SizedBox(height: 12),
          Text(_error ?? '오류가 발생했습니다'),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _loadChart,
            child: const Text('다시 시도'),
          ),
        ],
      ),
    );
  }

  Widget _buildPillarTable() {
    final yearPillar = _chart!['yearPillar'] as Map<String, dynamic>?;
    final monthPillar = _chart!['monthPillar'] as Map<String, dynamic>?;
    final dayPillar = _chart!['dayPillar'] as Map<String, dynamic>?;
    final hourPillar = _chart!['hourPillar'] as Map<String, dynamic>?;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Text(
              '사주 명식 (命式)',
              style: GoogleFonts.notoSerif(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 20),
            // Header row
            Row(
              children: [
                _buildPillarHeader('시주'),
                _buildPillarHeader('일주'),
                _buildPillarHeader('월주'),
                _buildPillarHeader('년주'),
              ],
            ),
            const SizedBox(height: 4),
            // Cheongan row (天干)
            Container(
              decoration: BoxDecoration(
                border: Border.all(color: AppColors.border),
                borderRadius: const BorderRadius.vertical(top: Radius.circular(8)),
              ),
              child: Row(
                children: [
                  _buildPillarCell(
                    hourPillar?['ganHanja'] as String?,
                    hourPillar?['gan'] as String?,
                    hourPillar?['ganOhaeng'] as String?,
                    isHeader: true,
                  ),
                  _buildPillarCell(
                    dayPillar?['ganHanja'] as String?,
                    dayPillar?['gan'] as String?,
                    dayPillar?['ganOhaeng'] as String?,
                    isMe: true,
                  ),
                  _buildPillarCell(
                    monthPillar?['ganHanja'] as String?,
                    monthPillar?['gan'] as String?,
                    monthPillar?['ganOhaeng'] as String?,
                  ),
                  _buildPillarCell(
                    yearPillar?['ganHanja'] as String?,
                    yearPillar?['gan'] as String?,
                    yearPillar?['ganOhaeng'] as String?,
                  ),
                ],
              ),
            ),
            // Label between rows
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 2),
              decoration: BoxDecoration(
                color: AppColors.inkBlack.withOpacity(0.05),
                border: Border.symmetric(
                  vertical: BorderSide(color: AppColors.border),
                ),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      '천간',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.notoSans(fontSize: 10, color: AppColors.textSecondary),
                    ),
                  ),
                ],
              ),
            ),
            // Jiji row (地支)
            Container(
              decoration: BoxDecoration(
                border: Border.all(color: AppColors.border),
                borderRadius: const BorderRadius.vertical(bottom: Radius.circular(8)),
              ),
              child: Row(
                children: [
                  _buildJijiCell(
                    hourPillar?['jiHanja'] as String?,
                    hourPillar?['ji'] as String?,
                    hourPillar?['jiOhaeng'] as String?,
                    hourPillar?['animal'] as String?,
                  ),
                  _buildJijiCell(
                    dayPillar?['jiHanja'] as String?,
                    dayPillar?['ji'] as String?,
                    dayPillar?['jiOhaeng'] as String?,
                    dayPillar?['animal'] as String?,
                  ),
                  _buildJijiCell(
                    monthPillar?['jiHanja'] as String?,
                    monthPillar?['ji'] as String?,
                    monthPillar?['jiOhaeng'] as String?,
                    monthPillar?['animal'] as String?,
                  ),
                  _buildJijiCell(
                    yearPillar?['jiHanja'] as String?,
                    yearPillar?['ji'] as String?,
                    yearPillar?['jiOhaeng'] as String?,
                    yearPillar?['animal'] as String?,
                  ),
                ],
              ),
            ),
            // Label below
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 2),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      '지지',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.notoSans(fontSize: 10, color: AppColors.textSecondary),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPillarHeader(String label) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 6),
        child: Text(
          label,
          textAlign: TextAlign.center,
          style: GoogleFonts.notoSerif(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: AppColors.textSecondary,
          ),
        ),
      ),
    );
  }

  Widget _buildPillarCell(String? hanja, String? hangul, String? ohaeng, {bool isMe = false, bool isHeader = false}) {
    if (hanja == null) {
      return Expanded(
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 16),
          decoration: BoxDecoration(
            border: Border(
              right: BorderSide(color: AppColors.border.withOpacity(0.5)),
            ),
          ),
          child: Center(
            child: Text(
              '-',
              style: GoogleFonts.notoSans(fontSize: 20, color: AppColors.textSecondary),
            ),
          ),
        ),
      );
    }

    final color = _getOhaengColor(ohaeng);
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          border: Border(
            right: BorderSide(color: AppColors.border.withOpacity(0.5)),
          ),
          color: isMe ? AppColors.gold.withOpacity(0.08) : null,
        ),
        child: Column(
          children: [
            Text(
              hanja,
              style: GoogleFonts.notoSerif(
                fontSize: 28,
                fontWeight: FontWeight.w900,
                color: color,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              hangul ?? '',
              style: GoogleFonts.notoSans(
                fontSize: 12,
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 2),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 1),
              decoration: BoxDecoration(
                color: color.withOpacity(0.15),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                ohaeng ?? '',
                style: GoogleFonts.notoSans(
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  color: color,
                ),
              ),
            ),
            if (isMe) ...[
              const SizedBox(height: 4),
              Text(
                '나',
                style: GoogleFonts.notoSans(
                  fontSize: 9,
                  fontWeight: FontWeight.w700,
                  color: AppColors.gold,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildJijiCell(String? hanja, String? hangul, String? ohaeng, String? animal) {
    if (hanja == null) {
      return Expanded(
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 16),
          decoration: BoxDecoration(
            border: Border(
              right: BorderSide(color: AppColors.border.withOpacity(0.5)),
            ),
          ),
          child: Center(
            child: Text(
              '-',
              style: GoogleFonts.notoSans(fontSize: 20, color: AppColors.textSecondary),
            ),
          ),
        ),
      );
    }

    final color = _getOhaengColor(ohaeng);
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          border: Border(
            right: BorderSide(color: AppColors.border.withOpacity(0.5)),
          ),
        ),
        child: Column(
          children: [
            Text(
              hanja,
              style: GoogleFonts.notoSerif(
                fontSize: 28,
                fontWeight: FontWeight.w900,
                color: color,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              hangul ?? '',
              style: GoogleFonts.notoSans(
                fontSize: 12,
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 2),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 1),
              decoration: BoxDecoration(
                color: color.withOpacity(0.15),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                ohaeng ?? '',
                style: GoogleFonts.notoSans(
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  color: color,
                ),
              ),
            ),
            if (animal != null && animal.isNotEmpty) ...[
              const SizedBox(height: 4),
              Text(
                animal,
                style: GoogleFonts.notoSans(
                  fontSize: 10,
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildOhaengDistribution() {
    final ohaengBalance = _chart!['ohaengBalance'] as Map<String, dynamic>?;
    if (ohaengBalance == null) return const SizedBox.shrink();

    final totalRaw = ohaengBalance.values.fold<num>(0, (sum, v) => sum + (v as num));
    final total = totalRaw == 0 ? 1 : totalRaw;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Text(
              '오행 분포',
              style: GoogleFonts.notoSerif(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 20),
            ...['목', '화', '토', '금', '수'].map((key) {
              final value = (ohaengBalance[key] as num?)?.toInt() ?? 0;
              final ratio = value / total;
              final pct = (ratio * 100).round();
              final color = ohaengColors[key] ?? Colors.grey;

              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Row(
                  children: [
                    SizedBox(
                      width: 50,
                      child: Text(
                        ohaengLabels[key] ?? key,
                        style: GoogleFonts.notoSans(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: color,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: ratio,
                          minHeight: 16,
                          backgroundColor: color.withOpacity(0.1),
                          valueColor: AlwaysStoppedAnimation<Color>(color),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    SizedBox(
                      width: 40,
                      child: Text(
                        '$pct%',
                        style: GoogleFonts.notoSans(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: color,
                        ),
                        textAlign: TextAlign.right,
                      ),
                    ),
                  ],
                ),
              );
            }),
            const SizedBox(height: 8),
            if (_chart!['dominantElement'] != null || _chart!['weakElement'] != null)
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (_chart!['dominantElement'] != null)
                    _buildOhaengBadge('강', _chart!['dominantElement'] as String),
                  if (_chart!['dominantElement'] != null && _chart!['weakElement'] != null)
                    const SizedBox(width: 16),
                  if (_chart!['weakElement'] != null)
                    _buildOhaengBadge('약', _chart!['weakElement'] as String),
                ],
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildOhaengBadge(String prefix, String element) {
    final color = ohaengColors[element] ?? Colors.grey;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        color: color.withOpacity(0.12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Text(
        '$prefix: ${ohaengLabels[element] ?? element}',
        style: GoogleFonts.notoSans(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }

  Widget _buildDayGanInterpretation() {
    final interpretation = _chart!['dayGanInterpretation'] as String;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.menu_book_outlined, color: AppColors.gold, size: 22),
                const SizedBox(width: 8),
                Text(
                  '일간 해석',
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
              interpretation,
              style: GoogleFonts.notoSans(
                fontSize: 14,
                color: AppColors.textPrimary,
                height: 1.7,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildYongshinCard() {
    final yongshin = _chart!['yongshin'] as Map<String, dynamic>;
    final element = yongshin['element'] as String? ?? '';
    final description = yongshin['description'] as String? ?? '';
    final color = ohaengColors[element] ?? AppColors.gold;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.lightbulb_outline, color: color, size: 22),
                const SizedBox(width: 8),
                Text(
                  '용신(用神)',
                  style: GoogleFonts.notoSerif(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    color: color.withOpacity(0.15),
                  ),
                  child: Text(
                    ohaengLabels[element] ?? element,
                    style: GoogleFonts.notoSans(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: color,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              description,
              style: GoogleFonts.notoSans(
                fontSize: 14,
                color: AppColors.textPrimary,
                height: 1.7,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCounselorCta() {
    return Card(
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(24),
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
              '전문 상담사에게\n사주 풀이 받기',
              style: GoogleFonts.notoSerif(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppColors.hanji,
                height: 1.4,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              '숫자와 차트 너머의 깊은 의미를\n전문가가 풀어드립니다',
              style: GoogleFonts.notoSans(
                fontSize: 13,
                color: AppColors.hanji.withOpacity(0.7),
                height: 1.4,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
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
