import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../shared/theme.dart';
import 'auth_provider.dart';

class SignupScreen extends ConsumerStatefulWidget {
  const SignupScreen({super.key});

  @override
  ConsumerState<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends ConsumerState<SignupScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;

  // Step tracking (0: basic info, 1: additional info, 2: terms)
  int _currentStep = 0;

  // Step 2: Additional info
  String? _selectedGender;

  // Step 3: Terms
  bool _termsAgreed = false;
  bool _privacyAgreed = false;
  bool _marketingAgreed = false;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  bool get _step1Valid {
    final email = _emailController.text.trim();
    final password = _passwordController.text;
    final confirm = _confirmPasswordController.text;
    final name = _nameController.text.trim();
    return email.contains('@') &&
        password.length >= 8 &&
        password == confirm &&
        name.length >= 2;
  }

  bool get _requiredTermsAgreed => _termsAgreed && _privacyAgreed;

  bool get _allTermsAgreed =>
      _termsAgreed && _privacyAgreed && _marketingAgreed;

  void _handleAllTerms(bool value) {
    setState(() {
      _termsAgreed = value;
      _privacyAgreed = value;
      _marketingAgreed = value;
    });
  }

  Future<void> _handleSignup() async {
    final success = await ref.read(authProvider.notifier).signup(
          email: _emailController.text.trim(),
          password: _passwordController.text,
          name: _nameController.text.trim(),
          phone: _phoneController.text.trim().isEmpty
              ? null
              : _phoneController.text.trim(),
        );

    if (mounted) {
      if (success) {
        context.go('/home');
      } else {
        final error = ref.read(authProvider).error;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(error ?? '회원가입에 실패했습니다'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  void _handleSocialSignup(String provider) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$provider 회원가입은 준비 중입니다'),
        backgroundColor: AppColors.textSecondary,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('회원가입'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 8),
              // Progress indicator
              _buildProgressIndicator(),
              const SizedBox(height: 28),
              // Step content
              if (_currentStep == 0) _buildStep1BasicInfo(),
              if (_currentStep == 1) _buildStep2AdditionalInfo(),
              if (_currentStep == 2) _buildStep3Terms(authState),
              const SizedBox(height: 24),
              // Social login divider and buttons
              _buildSocialLoginSection(),
              const SizedBox(height: 16),
              // Login link
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    '이미 계정이 있으신가요?',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  TextButton(
                    onPressed: () => context.pop(),
                    child: Text(
                      '로그인',
                      style:
                          Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: AppColors.gold,
                                fontWeight: FontWeight.w600,
                              ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildProgressIndicator() {
    const stepLabels = ['기본 정보', '추가 정보', '약관 동의'];

    return Row(
      children: List.generate(stepLabels.length * 2 - 1, (index) {
        if (index.isOdd) {
          // Connector line
          final stepIndex = index ~/ 2;
          return Expanded(
            child: Container(
              height: 2,
              margin: const EdgeInsets.symmetric(horizontal: 4),
              color: stepIndex < _currentStep
                  ? AppColors.gold
                  : AppColors.border.withOpacity(0.4),
            ),
          );
        }

        final stepIndex = index ~/ 2;
        final isActive = stepIndex == _currentStep;
        final isCompleted = stepIndex < _currentStep;

        return Column(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: isActive
                    ? const LinearGradient(
                        colors: [AppColors.gold, Color(0xFFD4A843)],
                      )
                    : null,
                border: !isActive
                    ? Border.all(
                        color: isCompleted
                            ? AppColors.gold
                            : AppColors.border.withOpacity(0.4),
                        width: 2,
                      )
                    : null,
              ),
              alignment: Alignment.center,
              child: isCompleted
                  ? const Icon(Icons.check, size: 18, color: AppColors.gold)
                  : Text(
                      '${stepIndex + 1}',
                      style: GoogleFonts.notoSerif(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: isActive
                            ? AppColors.inkBlack
                            : AppColors.textSecondary,
                      ),
                    ),
            ),
            const SizedBox(height: 4),
            Text(
              stepLabels[stepIndex],
              style: GoogleFonts.notoSans(
                fontSize: 11,
                fontWeight: isActive ? FontWeight.w700 : FontWeight.normal,
                color: isActive
                    ? AppColors.gold
                    : AppColors.textSecondary,
              ),
            ),
          ],
        );
      }),
    );
  }

  Widget _buildStep1BasicInfo() {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Email field
          TextFormField(
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            decoration: const InputDecoration(
              labelText: '이메일',
              hintText: 'example@email.com',
              prefixIcon: Icon(Icons.email_outlined),
            ),
            validator: (value) {
              if (value == null || value.isEmpty) {
                return '이메일을 입력해주세요';
              }
              if (!value.contains('@')) {
                return '올바른 이메일 형식이 아닙니다';
              }
              return null;
            },
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 16),
          // Password field
          TextFormField(
            controller: _passwordController,
            obscureText: _obscurePassword,
            decoration: InputDecoration(
              labelText: '비밀번호',
              hintText: '최소 8자 이상',
              prefixIcon: const Icon(Icons.lock_outlined),
              suffixIcon: IconButton(
                icon: Icon(
                  _obscurePassword
                      ? Icons.visibility_outlined
                      : Icons.visibility_off_outlined,
                ),
                onPressed: () {
                  setState(() {
                    _obscurePassword = !_obscurePassword;
                  });
                },
              ),
            ),
            validator: (value) {
              if (value == null || value.isEmpty) {
                return '비밀번호를 입력해주세요';
              }
              if (value.length < 8) {
                return '비밀번호는 최소 8자 이상이어야 합니다';
              }
              return null;
            },
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 16),
          // Confirm password field
          TextFormField(
            controller: _confirmPasswordController,
            obscureText: _obscureConfirmPassword,
            decoration: InputDecoration(
              labelText: '비밀번호 확인',
              prefixIcon: const Icon(Icons.lock_outlined),
              suffixIcon: IconButton(
                icon: Icon(
                  _obscureConfirmPassword
                      ? Icons.visibility_outlined
                      : Icons.visibility_off_outlined,
                ),
                onPressed: () {
                  setState(() {
                    _obscureConfirmPassword = !_obscureConfirmPassword;
                  });
                },
              ),
            ),
            validator: (value) {
              if (value == null || value.isEmpty) {
                return '비밀번호를 다시 입력해주세요';
              }
              if (value != _passwordController.text) {
                return '비밀번호가 일치하지 않습니다';
              }
              return null;
            },
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 16),
          // Name field
          TextFormField(
            controller: _nameController,
            decoration: const InputDecoration(
              labelText: '이름',
              hintText: '실명을 입력해주세요',
              prefixIcon: Icon(Icons.person_outlined),
            ),
            validator: (value) {
              if (value == null || value.isEmpty) {
                return '이름을 입력해주세요';
              }
              if (value.trim().length < 2) {
                return '이름은 2자 이상이어야 합니다';
              }
              return null;
            },
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 32),
          // Next button
          ElevatedButton(
            onPressed: _step1Valid
                ? () {
                    if (_formKey.currentState!.validate()) {
                      setState(() => _currentStep = 1);
                    }
                  }
                : null,
            child: const Text('다음'),
          ),
        ],
      ),
    );
  }

  Widget _buildStep2AdditionalInfo() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Phone field (optional)
        TextFormField(
          controller: _phoneController,
          keyboardType: TextInputType.phone,
          decoration: const InputDecoration(
            labelText: '전화번호 (선택)',
            hintText: '010-1234-5678',
            prefixIcon: Icon(Icons.phone_outlined),
          ),
        ),
        const SizedBox(height: 16),
        // Gender selection (optional)
        Text(
          '성별 (선택)',
          style: GoogleFonts.notoSans(
            fontSize: 14,
            color: AppColors.textSecondary,
          ),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            _buildGenderChip('male', '남성'),
            const SizedBox(width: 12),
            _buildGenderChip('female', '여성'),
            const SizedBox(width: 12),
            _buildGenderChip('none', '선택안함'),
          ],
        ),
        const SizedBox(height: 32),
        // Navigation buttons
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: () => setState(() => _currentStep = 0),
                child: const Text('이전'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton(
                onPressed: () => setState(() => _currentStep = 2),
                child: const Text('다음'),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildGenderChip(String value, String label) {
    final isSelected = _selectedGender == value;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _selectedGender = value),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: isSelected ? AppColors.gold : AppColors.border,
              width: isSelected ? 2 : 1,
            ),
            color: isSelected
                ? AppColors.gold.withOpacity(0.1)
                : Colors.white,
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: GoogleFonts.notoSans(
              fontSize: 13,
              fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
              color: isSelected ? AppColors.gold : AppColors.textPrimary,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStep3Terms(AuthState authState) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Agree all
        Container(
          decoration: BoxDecoration(
            border: Border(
              bottom: BorderSide(
                color: AppColors.border.withOpacity(0.3),
              ),
            ),
          ),
          child: CheckboxListTile(
            value: _allTermsAgreed,
            onChanged: (val) => _handleAllTerms(val ?? false),
            title: Text(
              '전체 동의',
              style: GoogleFonts.notoSans(
                fontSize: 16,
                fontWeight: FontWeight.w700,
              ),
            ),
            controlAffinity: ListTileControlAffinity.leading,
            contentPadding: EdgeInsets.zero,
            activeColor: AppColors.gold,
          ),
        ),
        const SizedBox(height: 8),
        // Terms of service (required)
        CheckboxListTile(
          value: _termsAgreed,
          onChanged: (val) => setState(() => _termsAgreed = val ?? false),
          title: RichText(
            text: TextSpan(
              children: [
                TextSpan(
                  text: '[필수] ',
                  style: GoogleFonts.notoSans(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.darkRed,
                  ),
                ),
                TextSpan(
                  text: '이용약관 동의',
                  style: GoogleFonts.notoSans(
                    fontSize: 14,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
          ),
          controlAffinity: ListTileControlAffinity.leading,
          contentPadding: EdgeInsets.zero,
          activeColor: AppColors.gold,
        ),
        // Privacy policy (required)
        CheckboxListTile(
          value: _privacyAgreed,
          onChanged: (val) => setState(() => _privacyAgreed = val ?? false),
          title: RichText(
            text: TextSpan(
              children: [
                TextSpan(
                  text: '[필수] ',
                  style: GoogleFonts.notoSans(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.darkRed,
                  ),
                ),
                TextSpan(
                  text: '개인정보처리방침 동의',
                  style: GoogleFonts.notoSans(
                    fontSize: 14,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
          ),
          controlAffinity: ListTileControlAffinity.leading,
          contentPadding: EdgeInsets.zero,
          activeColor: AppColors.gold,
        ),
        // Marketing consent (optional)
        CheckboxListTile(
          value: _marketingAgreed,
          onChanged: (val) =>
              setState(() => _marketingAgreed = val ?? false),
          title: RichText(
            text: TextSpan(
              children: [
                TextSpan(
                  text: '[선택] ',
                  style: GoogleFonts.notoSans(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textSecondary,
                  ),
                ),
                TextSpan(
                  text: '마케팅 정보 수신 동의',
                  style: GoogleFonts.notoSans(
                    fontSize: 14,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
          ),
          controlAffinity: ListTileControlAffinity.leading,
          contentPadding: EdgeInsets.zero,
          activeColor: AppColors.gold,
        ),
        const SizedBox(height: 24),
        // Navigation buttons
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: () => setState(() => _currentStep = 1),
                child: const Text('이전'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton(
                onPressed: _requiredTermsAgreed && !authState.isLoading
                    ? _handleSignup
                    : null,
                child: authState.isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(
                            AppColors.hanji,
                          ),
                        ),
                      )
                    : const Text('회원가입'),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildSocialLoginSection() {
    return Column(
      children: [
        // Divider "또는"
        Row(
          children: [
            Expanded(
              child: Divider(
                color: AppColors.border.withOpacity(0.5),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text(
                '또는',
                style: GoogleFonts.notoSans(
                  fontSize: 12,
                  color: AppColors.textSecondary,
                ),
              ),
            ),
            Expanded(
              child: Divider(
                color: AppColors.border.withOpacity(0.5),
              ),
            ),
          ],
        ),
        const SizedBox(height: 20),
        // Kakao signup button
        SizedBox(
          height: 48,
          width: double.infinity,
          child: ElevatedButton(
            onPressed: () => _handleSocialSignup('카카오'),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFFEE500),
              foregroundColor: const Color(0xFF191919),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              elevation: 0,
            ),
            child: Text(
              '카카오로 회원가입',
              style: GoogleFonts.notoSans(
                fontSize: 14,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ),
        const SizedBox(height: 12),
        // Naver signup button
        SizedBox(
          height: 48,
          width: double.infinity,
          child: ElevatedButton(
            onPressed: () => _handleSocialSignup('네이버'),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF03C75A),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              elevation: 0,
            ),
            child: Text(
              '네이버로 회원가입',
              style: GoogleFonts.notoSans(
                fontSize: 14,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ),
      ],
    );
  }
}
