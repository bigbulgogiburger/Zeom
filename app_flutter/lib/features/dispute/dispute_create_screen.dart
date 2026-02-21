import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/api_client.dart';
import '../../shared/theme.dart';
import '../dispute/dispute_list_screen.dart';

const _disputeCategories = [
  {'value': 'SERVICE_QUALITY', 'label': '서비스 품질'},
  {'value': 'BILLING', 'label': '결제 문제'},
  {'value': 'TECHNICAL', 'label': '기술 문제'},
  {'value': 'COUNSELOR_BEHAVIOR', 'label': '상담사 행동'},
  {'value': 'OTHER', 'label': '기타'},
];

class DisputeCreateScreen extends ConsumerStatefulWidget {
  const DisputeCreateScreen({super.key});

  @override
  ConsumerState<DisputeCreateScreen> createState() =>
      _DisputeCreateScreenState();
}

class _DisputeCreateScreenState extends ConsumerState<DisputeCreateScreen> {
  final _formKey = GlobalKey<FormState>();
  final _reservationIdController = TextEditingController();
  final _descriptionController = TextEditingController();
  String? _selectedCategory;
  bool _isSubmitting = false;

  @override
  void dispose() {
    _reservationIdController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate() || _selectedCategory == null) return;

    setState(() => _isSubmitting = true);

    try {
      final apiClient = ref.read(apiClientProvider);
      await apiClient.createDispute(
        reservationId: int.parse(_reservationIdController.text.trim()),
        category: _selectedCategory!,
        description: _descriptionController.text.trim(),
      );

      if (mounted) {
        ref.invalidate(disputeListProvider);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('분쟁이 접수되었습니다'),
            backgroundColor: AppColors.success,
          ),
        );
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('분쟁 접수에 실패했습니다: ${e.toString().replaceFirst('Exception: ', '')}'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('분쟁 신청'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Info banner
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.gold.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: AppColors.gold.withOpacity(0.3),
                  ),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.info_outline,
                        color: AppColors.gold, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        '분쟁은 상담 완료 후 접수 가능합니다.\n관리자가 검토 후 처리 결과를 안내드립니다.',
                        style: GoogleFonts.notoSans(
                          fontSize: 13,
                          color: AppColors.textPrimary,
                          height: 1.5,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Reservation ID
              TextFormField(
                controller: _reservationIdController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: '예약 번호',
                  hintText: '분쟁을 제기할 예약 번호를 입력해주세요',
                  prefixIcon: Icon(Icons.confirmation_number_outlined),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return '예약 번호를 입력해주세요';
                  }
                  if (int.tryParse(value) == null) {
                    return '올바른 예약 번호를 입력해주세요';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 20),

              // Category selection
              Text(
                '분쟁 유형',
                style: GoogleFonts.notoSans(
                  fontSize: 14,
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _disputeCategories.map((cat) {
                  final isSelected =
                      _selectedCategory == cat['value'];
                  return GestureDetector(
                    onTap: () {
                      setState(() => _selectedCategory = cat['value']);
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 10,
                      ),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: isSelected
                              ? AppColors.gold
                              : AppColors.border,
                          width: isSelected ? 2 : 1,
                        ),
                        color: isSelected
                            ? AppColors.gold.withOpacity(0.1)
                            : Colors.white,
                      ),
                      child: Text(
                        cat['label']!,
                        style: GoogleFonts.notoSans(
                          fontSize: 13,
                          fontWeight: isSelected
                              ? FontWeight.w600
                              : FontWeight.normal,
                          color: isSelected
                              ? AppColors.gold
                              : AppColors.textPrimary,
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
              if (_selectedCategory == null) ...[
                const SizedBox(height: 4),
                Text(
                  '',
                  style: GoogleFonts.notoSans(
                    fontSize: 12,
                    color: AppColors.error,
                  ),
                ),
              ],
              const SizedBox(height: 20),

              // Description
              TextFormField(
                controller: _descriptionController,
                maxLines: 5,
                maxLength: 500,
                decoration: const InputDecoration(
                  labelText: '상세 내용',
                  hintText: '분쟁 사유를 상세히 적어주세요',
                  alignLabelWithHint: true,
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return '분쟁 내용을 입력해주세요';
                  }
                  if (value.trim().length < 10) {
                    return '최소 10자 이상 입력해주세요';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 32),

              // Submit button
              ElevatedButton(
                onPressed: _isSubmitting || _selectedCategory == null
                    ? null
                    : _handleSubmit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.darkRed,
                  foregroundColor: Colors.white,
                ),
                child: _isSubmitting
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor:
                              AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : const Text('분쟁 접수하기'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
