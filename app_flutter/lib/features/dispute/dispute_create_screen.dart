import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../shared/animations/zeom_animations.dart';
import '../../shared/theme.dart';
import '../../shared/typography.dart';
import '../../shared/widgets/zeom_app_bar.dart';
import '../../shared/widgets/zeom_button.dart';

enum _DisputeStep { form, success }

const List<String> _kDisputeCategories = [
  '상담 내용 문제',
  '부적절한 발언',
  '상담사 노쇼',
  '환불 미이행',
  '개인정보 침해',
  '기타',
];

const int _kDetailMaxLength = 1000;

class DisputeCreateScreen extends ConsumerStatefulWidget {
  const DisputeCreateScreen({super.key});

  @override
  ConsumerState<DisputeCreateScreen> createState() =>
      _DisputeCreateScreenState();
}

class _DisputeCreateScreenState extends ConsumerState<DisputeCreateScreen> {
  _DisputeStep _step = _DisputeStep.form;
  String? _category;
  String _targetText = '';
  String _detail = '';
  bool _submitting = false;

  bool get _canSubmit =>
      _category != null && _targetText.isNotEmpty && _detail.isNotEmpty;

  String get _ctaLabel {
    if (_submitting) return '접수 중…';
    if (_canSubmit) return '신고 접수';
    return '유형·대상·내용을 입력해주세요';
  }

  Future<void> _submit() async {
    setState(() => _submitting = true);
    await Future<void>.delayed(const Duration(milliseconds: 1200));
    if (!mounted) return;
    setState(() {
      _submitting = false;
      _step = _DisputeStep.success;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.hanji,
      appBar: _step == _DisputeStep.form
          ? const ZeomAppBar(title: '분쟁 신고')
          : null,
      body: _step == _DisputeStep.form ? _buildForm() : _buildSuccess(),
    );
  }

  // -----------------------------------------------------------------
  // Form step
  // -----------------------------------------------------------------

  Widget _buildForm() {
    return Stack(
      children: [
        SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 140),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 8),
              _buildWarningBox(),
              const SizedBox(height: 20),
              _buildCategoryGrid(),
              const SizedBox(height: 20),
              _buildTargetInput(),
              const SizedBox(height: 16),
              _buildDetailTextarea(),
              const SizedBox(height: 16),
              _buildAttachmentButton(),
            ],
          ),
        ),
        _buildStickyCta(),
      ],
    );
  }

  Widget _buildWarningBox() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFFDECEC),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: const Color.fromRGBO(139, 0, 0, 0.2),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(
            Icons.priority_high_rounded,
            size: 20,
            color: AppColors.darkRed,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              '부당한 경험을 하셨다면 주저 없이 신고해주세요. 접수된 모든 사안은 내부 정책에 따라 엄정 검토됩니다.',
              style: ZeomType.body.copyWith(
                color: AppColors.darkRed,
                height: 1.6,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryGrid() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('신고 유형', style: ZeomType.section),
        const SizedBox(height: 10),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          childAspectRatio: 3,
          mainAxisSpacing: 10,
          crossAxisSpacing: 10,
          children: _kDisputeCategories.map(_buildCategoryTile).toList(),
        ),
      ],
    );
  }

  Widget _buildCategoryTile(String label) {
    final bool selected = _category == label;
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () => setState(() => _category = label),
      child: Container(
        padding: const EdgeInsets.all(12),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: selected ? AppColors.darkRed : Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: selected ? AppColors.darkRed : AppColors.borderSoft,
            width: selected ? 1.5 : 1,
          ),
        ),
        child: Text(
          label,
          textAlign: TextAlign.center,
          style: ZeomType.body.copyWith(
            fontWeight: FontWeight.w600,
            color: selected ? AppColors.hanji : AppColors.ink,
          ),
        ),
      ),
    );
  }

  InputDecoration _inputDecoration(String hint) {
    return InputDecoration(
      hintText: hint,
      hintStyle: ZeomType.body.copyWith(color: AppColors.ink4),
      filled: true,
      fillColor: Colors.white,
      contentPadding:
          const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: AppColors.borderSoft),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: AppColors.borderSoft),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: AppColors.ink, width: 1.5),
      ),
      counterText: '',
    );
  }

  Widget _buildTargetInput() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('대상 상담', style: ZeomType.section),
        const SizedBox(height: 8),
        TextField(
          style: ZeomType.body,
          decoration: _inputDecoration('예약 번호 또는 상담사 이름'),
          onChanged: (v) => setState(() => _targetText = v),
        ),
      ],
    );
  }

  Widget _buildDetailTextarea() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('상세 내용', style: ZeomType.section),
        const SizedBox(height: 8),
        TextField(
          maxLines: 6,
          minLines: 6,
          maxLength: _kDetailMaxLength,
          style: ZeomType.body,
          decoration: _inputDecoration('겪으신 상황을 구체적으로 설명해주세요'),
          onChanged: (v) => setState(() => _detail = v),
        ),
        const SizedBox(height: 4),
        Align(
          alignment: Alignment.centerRight,
          child: Text(
            '${_detail.length}/$_kDetailMaxLength',
            style: ZeomType.micro.copyWith(color: AppColors.ink3),
          ),
        ),
      ],
    );
  }

  Widget _buildAttachmentButton() {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('파일 첨부는 준비 중입니다')),
        );
      },
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.transparent,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: const Color.fromRGBO(102, 102, 102, 0.4),
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.attach_file,
              size: 18,
              color: AppColors.ink3,
            ),
            const SizedBox(width: 8),
            Text(
              '증빙 자료 첨부 (선택)',
              style: ZeomType.body.copyWith(
                color: AppColors.ink3,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStickyCta() {
    return Positioned(
      left: 0,
      right: 0,
      bottom: 0,
      child: Container(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
        decoration: BoxDecoration(
          color: AppColors.hanji,
          border: Border(
            top: BorderSide(color: AppColors.borderSoft),
          ),
        ),
        child: SafeArea(
          top: false,
          child: ZeomButton(
            label: _ctaLabel,
            variant: ZeomButtonVariant.danger,
            size: ZeomButtonSize.md,
            width: double.infinity,
            loading: _submitting,
            onPressed: _canSubmit && !_submitting ? _submit : null,
          ),
        ),
      ),
    );
  }

  // -----------------------------------------------------------------
  // Success step
  // -----------------------------------------------------------------

  Widget _buildSuccess() {
    return SafeArea(
      child: ZeomFadeSlideIn(
        child: Padding(
          padding: const EdgeInsets.all(40),
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 80,
                  height: 80,
                  decoration: const BoxDecoration(
                    color: Color(0xFFFDECEC),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.priority_high_rounded,
                    size: 40,
                    color: AppColors.darkRed,
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  '신고가 접수되었습니다',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.notoSerif(
                    fontSize: 26,
                    fontWeight: FontWeight.w700,
                    color: AppColors.ink,
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  '담당 팀이 검토 후 72시간 이내\n답변 드립니다.',
                  textAlign: TextAlign.center,
                  style: ZeomType.body.copyWith(
                    color: AppColors.ink3,
                    height: 1.7,
                  ),
                ),
                const SizedBox(height: 28),
                ZeomButton(
                  label: '확인',
                  variant: ZeomButtonVariant.primary,
                  size: ZeomButtonSize.md,
                  width: double.infinity,
                  onPressed: () => context.go('/home'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
