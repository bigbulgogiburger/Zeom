import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../shared/animations/zeom_animations.dart';
import '../../shared/theme.dart';
import '../../shared/typography.dart';
import '../../shared/widgets/zeom_app_bar.dart';
import '../../shared/widgets/zeom_button.dart';

/// S13 사주 보기 (MOBILE_DESIGN_PLAN.md §3.13)
///
/// Two phases:
///   1. Input — birth date / time / gender form.
///   2. Result — pillar chart, five-elements bars, year-flow cards.
class SajuChartScreen extends StatefulWidget {
  const SajuChartScreen({super.key});

  @override
  State<SajuChartScreen> createState() => _SajuChartScreenState();
}

class _SajuChartScreenState extends State<SajuChartScreen> {
  DateTime? _birthDate;
  TimeOfDay? _birthTime;
  String? _gender; // 'F' | 'M'
  bool _submitted = false;
  bool _calculating = false;

  bool get _canSubmit =>
      _birthDate != null && _birthTime != null && _gender != null;

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _birthDate ?? DateTime(1995, 3, 14),
      firstDate: DateTime(1900),
      lastDate: DateTime.now(),
    );
    if (!mounted) return;
    if (picked != null) setState(() => _birthDate = picked);
  }

  Future<void> _pickTime() async {
    final picked = await showTimePicker(
      context: context,
      initialTime: _birthTime ?? const TimeOfDay(hour: 6, minute: 0),
    );
    if (!mounted) return;
    if (picked != null) setState(() => _birthTime = picked);
  }

  Future<void> _submit() async {
    setState(() => _calculating = true);
    await Future<void>.delayed(const Duration(milliseconds: 900));
    if (!mounted) return;
    setState(() {
      _calculating = false;
      _submitted = true;
    });
  }

  @override
  Widget build(BuildContext context) {
    return _submitted ? _buildResultView() : _buildInputView();
  }

  // ================================================================
  // Input view
  // ================================================================

  Widget _buildInputView() {
    return Scaffold(
      backgroundColor: AppColors.hanji,
      appBar: const ZeomAppBar(title: '사주 보기'),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 120),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              '나의 생년월일을 입력해주세요',
              style: GoogleFonts.notoSerif(
                fontSize: 22,
                fontWeight: FontWeight.w700,
                color: AppColors.ink,
                height: 1.3,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              '양력 기준, 태어난 시각을 함께 넣으면 더 정확합니다',
              style: ZeomType.meta.copyWith(color: AppColors.ink3),
            ),
            const SizedBox(height: 24),
            _buildInputCard(),
            const SizedBox(height: 16),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text(
                '입력 정보는 암호화 저장되며, 외부 공유되지 않습니다',
                style: GoogleFonts.notoSans(
                  fontSize: 10,
                  fontWeight: FontWeight.w400,
                  color: AppColors.ink4,
                  height: 1.3,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ],
        ),
      ),
      bottomSheet: _buildStickyCta(),
    );
  }

  Widget _buildInputCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.borderSoft, width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _buildDateField(),
          const SizedBox(height: 14),
          _buildTimeField(),
          const SizedBox(height: 14),
          _buildGenderToggle(),
        ],
      ),
    );
  }

  Widget _buildFieldLabel(String label) {
    return Text(
      label,
      style: ZeomType.micro.copyWith(
        color: AppColors.ink3,
        letterSpacing: 1,
      ),
    );
  }

  Widget _buildDateField() {
    final hasValue = _birthDate != null;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _buildFieldLabel('생년월일'.toUpperCase()),
        const SizedBox(height: 6),
        InkWell(
          onTap: _pickDate,
          borderRadius: BorderRadius.circular(10),
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppColors.hanji,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppColors.borderSoft, width: 1),
            ),
            child: Row(
              children: [
                Text(
                  hasValue ? _formatBirthDate(_birthDate!) : 'YYYY-MM-DD 선택',
                  style: ZeomType.body.copyWith(
                    color: hasValue ? AppColors.ink : AppColors.ink3,
                  ),
                ),
                const Spacer(),
                const Icon(
                  Icons.calendar_today_outlined,
                  size: 18,
                  color: AppColors.ink3,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTimeField() {
    final hasValue = _birthTime != null;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _buildFieldLabel('태어난 시각'.toUpperCase()),
        const SizedBox(height: 6),
        InkWell(
          onTap: _pickTime,
          borderRadius: BorderRadius.circular(10),
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppColors.hanji,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppColors.borderSoft, width: 1),
            ),
            child: Row(
              children: [
                Text(
                  hasValue ? _formatBirthTime(_birthTime!) : 'HH:MM 선택',
                  style: ZeomType.body.copyWith(
                    color: hasValue ? AppColors.ink : AppColors.ink3,
                  ),
                ),
                const Spacer(),
                const Icon(
                  Icons.access_time,
                  size: 18,
                  color: AppColors.ink3,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildGenderToggle() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _buildFieldLabel('성별'.toUpperCase()),
        const SizedBox(height: 6),
        Row(
          children: [
            Expanded(child: _genderChip('F', '여성')),
            const SizedBox(width: 10),
            Expanded(child: _genderChip('M', '남성')),
          ],
        ),
      ],
    );
  }

  Widget _genderChip(String value, String label) {
    final active = _gender == value;
    return InkWell(
      onTap: () => setState(() => _gender = value),
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: active ? AppColors.ink : Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: active
              ? null
              : Border.all(color: AppColors.borderSoft, width: 1),
        ),
        child: Text(
          label,
          style: ZeomType.body.copyWith(
            fontWeight: FontWeight.w600,
            color: active ? AppColors.hanji : AppColors.ink,
          ),
        ),
      ),
    );
  }

  Widget _buildStickyCta() {
    return Container(
      color: AppColors.hanji,
      padding: EdgeInsets.fromLTRB(
        20,
        12,
        20,
        12 + MediaQuery.of(context).padding.bottom,
      ),
      child: ZeomButton(
        label: '사주 풀어보기',
        variant: ZeomButtonVariant.primary,
        size: ZeomButtonSize.md,
        width: double.infinity,
        loading: _calculating,
        onPressed: _canSubmit ? _submit : null,
      ),
    );
  }

  // ================================================================
  // Result view
  // ================================================================

  Widget _buildResultView() {
    return Scaffold(
      backgroundColor: AppColors.hanji,
      appBar: ZeomAppBar(
        title: '사주 보기',
        onBack: () => setState(() => _submitted = false),
      ),
      body: ZeomFadeSlideIn(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 100),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _buildResultHeader(),
              const SizedBox(height: 20),
              _buildSajuPillarCard(),
              const SizedBox(height: 20),
              _buildFiveElementsCard(),
              const SizedBox(height: 16),
              _buildYearFlowCard(),
              const SizedBox(height: 28),
              ZeomButton(
                label: '전문 상담사에게 해석 듣기',
                variant: ZeomButtonVariant.gold,
                size: ZeomButtonSize.md,
                width: double.infinity,
                onPressed: () => context.go('/counselors'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildResultHeader() {
    final genderLabel = _gender == 'F' ? '여' : '남';
    final dateLabel = _birthDate != null ? _formatBirthDate(_birthDate!) : '';
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '갑목(甲木)의 기운',
          style: GoogleFonts.notoSerif(
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: AppColors.ink,
            height: 1.3,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          '$dateLabel · 묘시(卯時) · $genderLabel',
          style: ZeomType.meta.copyWith(color: AppColors.ink3),
        ),
      ],
    );
  }

  Widget _buildSajuPillarCard() {
    const pillars = <_Pillar>[
      _Pillar(name: '年柱', top: '乙', bottom: '亥'),
      _Pillar(name: '月柱', top: '己', bottom: '卯'),
      _Pillar(name: '日柱', top: '甲', bottom: '子'),
      _Pillar(name: '時柱', top: '丙', bottom: '寅'),
    ];

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.ink,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Text(
            '四柱八字',
            textAlign: TextAlign.center,
            style: GoogleFonts.notoSerif(
              fontSize: 11,
              fontWeight: FontWeight.w500,
              color: AppColors.goldSoft,
              letterSpacing: 2,
            ),
          ),
          const SizedBox(height: 14),
          GridView.count(
            crossAxisCount: 4,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            childAspectRatio: 0.55,
            crossAxisSpacing: 8,
            mainAxisSpacing: 8,
            children: pillars.map(_buildPillarCell).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildPillarCell(_Pillar pillar) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color.fromRGBO(201, 162, 39, 0.08),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: const Color.fromRGBO(201, 162, 39, 0.15),
          width: 1,
        ),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Text(
            pillar.name,
            style: GoogleFonts.notoSerif(
              fontSize: 10,
              fontWeight: FontWeight.w400,
              color: AppColors.goldSoft,
            ),
          ),
          const SizedBox(height: 8),
          Container(
            height: 1,
            color: const Color.fromRGBO(217, 183, 74, 0.2),
          ),
          const SizedBox(height: 8),
          Text(
            pillar.top,
            style: GoogleFonts.notoSerif(
              fontSize: 22,
              fontWeight: FontWeight.w700,
              color: AppColors.gold,
              height: 1.1,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            pillar.bottom,
            style: GoogleFonts.notoSerif(
              fontSize: 18,
              fontWeight: FontWeight.w500,
              color: AppColors.hanji,
              height: 1.1,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFiveElementsCard() {
    const elements = <_Element>[
      _Element(name: '木', color: Color(0xFF2D5016), count: 4),
      _Element(name: '火', color: Color(0xFFC85A3A), count: 2),
      _Element(name: '土', color: Color(0xFFA57E3A), count: 1),
      _Element(name: '金', color: Color(0xFF888888), count: 0),
      _Element(name: '水', color: Color(0xFF3A6AC8), count: 1),
    ];

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.borderSoft, width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('오행 분포', style: ZeomType.section),
          const SizedBox(height: 14),
          ...elements.map(_buildElementRow),
          const SizedBox(height: 16),
          Text(
            '木이 강하고 金이 약합니다. 성장 에너지가 풍부한 반면, 마무리와 결단이 필요한 때입니다.',
            style: ZeomType.body.copyWith(
              color: AppColors.ink2,
              height: 1.6,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildElementRow(_Element element) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          SizedBox(
            width: 28,
            child: Text(
              element.name,
              style: GoogleFonts.notoSerif(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: element.color,
              ),
            ),
          ),
          const SizedBox(width: 4),
          Expanded(
            child: SizedBox(
              height: 8,
              child: Stack(
                children: [
                  Container(
                    decoration: BoxDecoration(
                      color: AppColors.hanjiDeep,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                  Positioned.fill(
                    child: FractionallySizedBox(
                      alignment: Alignment.centerLeft,
                      widthFactor: (element.count / 4).clamp(0.0, 1.0),
                      child: Container(
                        decoration: BoxDecoration(
                          color: element.color,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 10),
          Text(
            '${element.count}',
            style: ZeomType.meta.copyWith(
              color: AppColors.ink,
              fontWeight: FontWeight.w600,
              fontFeatures: kTabularNums,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildYearFlowCard() {
    const entries = <_YearFlow>[
      _YearFlow(
        title: '上半期',
        body: '변화의 물결이 시작됩니다. 새로운 인연에 마음을 여세요.',
      ),
      _YearFlow(
        title: '下半期',
        body: '기존의 관계를 다시 돌아보는 시기. 익숙함 속의 진심을 발견하게 됩니다.',
      ),
      _YearFlow(
        title: '특히 6-7월',
        body: '재정적 결정을 신중히 하되, 기회를 놓치지 마세요. 결단의 달입니다.',
      ),
    ];

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.borderSoft, width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('올해의 흐름', style: ZeomType.section),
          const SizedBox(height: 12),
          for (int i = 0; i < entries.length; i++) ...[
            if (i > 0) const SizedBox(height: 14),
            _buildYearFlowRow(entries[i]),
          ],
        ],
      ),
    );
  }

  Widget _buildYearFlowRow(_YearFlow entry) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(width: 4, height: 36, color: AppColors.gold),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(entry.title, style: ZeomType.cardTitle),
              const SizedBox(height: 4),
              Text(
                entry.body,
                style: ZeomType.body.copyWith(
                  color: AppColors.ink2,
                  height: 1.6,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // ================================================================
  // Formatters
  // ================================================================

  String _formatBirthDate(DateTime d) =>
      '${d.year}년 ${d.month}월 ${d.day}일';

  String _formatBirthTime(TimeOfDay t) {
    final hh = t.hour.toString().padLeft(2, '0');
    final mm = t.minute.toString().padLeft(2, '0');
    return '$hh:$mm';
  }
}

// ================================================================
// Immutable row models
// ================================================================

class _Pillar {
  final String name;
  final String top;
  final String bottom;
  const _Pillar({required this.name, required this.top, required this.bottom});
}

class _Element {
  final String name;
  final Color color;
  final int count;
  const _Element({
    required this.name,
    required this.color,
    required this.count,
  });
}

class _YearFlow {
  final String title;
  final String body;
  const _YearFlow({required this.title, required this.body});
}
