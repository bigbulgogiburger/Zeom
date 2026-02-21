import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/api_client.dart';
import '../../shared/theme.dart';

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  int _currentStep = 0;
  final _pageController = PageController();

  // Step 0: Birth date
  String _birthYear = '';
  String _birthMonth = '';
  String _birthDay = '';
  String _birthTime = '';

  // Step 1: Interests
  final Set<String> _selectedInterests = {};

  // Step 2: Concerns
  final Set<String> _selectedConcerns = {};

  // Step 3: Recommended counselors
  List<Map<String, dynamic>> _recommended = [];
  bool _loadingRec = false;

  static const _interests = [
    {'id': 'saju', 'label': '사주', 'icon': Icons.auto_awesome},
    {'id': 'tarot', 'label': '타로', 'icon': Icons.style_outlined},
    {'id': 'sinjeom', 'label': '신점', 'icon': Icons.visibility_outlined},
    {'id': 'dream', 'label': '꿈해몽', 'icon': Icons.nightlight_round},
  ];

  static const _concerns = [
    {'id': 'love', 'label': '연애', 'icon': Icons.favorite_outline},
    {'id': 'wealth', 'label': '재물', 'icon': Icons.account_balance_wallet_outlined},
    {'id': 'career', 'label': '진로', 'icon': Icons.rocket_launch_outlined},
    {'id': 'health', 'label': '건강', 'icon': Icons.eco_outlined},
    {'id': 'family', 'label': '가정', 'icon': Icons.home_outlined},
  ];

  static const _mockRecommended = [
    {'id': 1, 'name': '김신명', 'specialty': '사주/타로', 'intro': '20년 경력의 전문 상담사입니다.'},
    {'id': 2, 'name': '이연화', 'specialty': '신점/꿈해몽', 'intro': '정확한 신점으로 길을 밝혀드립니다.'},
    {'id': 3, 'name': '박도윤', 'specialty': '사주/신점', 'intro': '운명의 흐름을 읽어드립니다.'},
  ];

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  bool _canProceed() {
    switch (_currentStep) {
      case 0:
        return _birthYear.length == 4 && _birthMonth.isNotEmpty && _birthDay.isNotEmpty;
      case 1:
        return _selectedInterests.isNotEmpty;
      case 2:
        return _selectedConcerns.isNotEmpty;
      default:
        return true;
    }
  }

  Future<void> _loadRecommendations() async {
    setState(() => _loadingRec = true);
    try {
      final apiClient = ref.read(apiClientProvider);
      final response = await apiClient.getCounselors();
      if (response.statusCode == 200) {
        final data = response.data;
        final list = data is List ? data : (data is Map ? (data['content'] ?? []) : []);
        setState(() {
          _recommended = List<Map<String, dynamic>>.from(
            (list as List).take(3).map((e) => Map<String, dynamic>.from(e as Map)),
          );
        });
      } else {
        setState(() {
          _recommended = _mockRecommended.map((e) => Map<String, dynamic>.from(e)).toList();
        });
      }
    } catch (_) {
      setState(() {
        _recommended = _mockRecommended.map((e) => Map<String, dynamic>.from(e)).toList();
      });
    } finally {
      setState(() => _loadingRec = false);
    }
  }

  void _goNext() {
    if (_currentStep == 2) {
      _loadRecommendations();
    }
    if (_currentStep < 3) {
      setState(() => _currentStep++);
      _pageController.animateToPage(
        _currentStep,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  void _goBack() {
    if (_currentStep > 0) {
      setState(() => _currentStep--);
      _pageController.animateToPage(
        _currentStep,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  void _complete() {
    context.go('/home');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('프로필 설정'),
        automaticallyImplyLeading: false,
        actions: [
          TextButton(
            onPressed: _complete,
            child: Text(
              '건너뛰기',
              style: GoogleFonts.notoSans(
                color: AppColors.hanji.withOpacity(0.6),
                fontSize: 14,
              ),
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Step indicator
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(4, (i) {
                  return Container(
                    margin: const EdgeInsets.symmetric(horizontal: 3),
                    height: 6,
                    width: i == _currentStep ? 28 : 8,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(3),
                      color: i == _currentStep
                          ? AppColors.gold
                          : i < _currentStep
                              ? AppColors.gold
                              : AppColors.gold.withOpacity(0.2),
                    ),
                  );
                }),
              ),
            ),

            // Pages
            Expanded(
              child: PageView(
                controller: _pageController,
                physics: const NeverScrollableScrollPhysics(),
                children: [
                  _buildBirthDateStep(),
                  _buildInterestsStep(),
                  _buildConcernsStep(),
                  _buildRecommendedStep(),
                ],
              ),
            ),

            // Navigation
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  if (_currentStep > 0)
                    Expanded(
                      child: OutlinedButton(
                        onPressed: _goBack,
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.gold,
                          side: const BorderSide(color: AppColors.gold),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(24),
                          ),
                        ),
                        child: Text(
                          '이전',
                          style: GoogleFonts.notoSerif(
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                  if (_currentStep > 0) const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: _canProceed() || _currentStep == 3
                          ? (_currentStep < 3 ? _goNext : _complete)
                          : null,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.gold,
                        foregroundColor: AppColors.inkBlack,
                        disabledBackgroundColor: AppColors.gold.withOpacity(0.3),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(24),
                        ),
                      ),
                      child: Text(
                        _currentStep < 3 ? '다음' : '시작하기',
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
          ],
        ),
      ),
    );
  }

  Widget _buildBirthDateStep() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        children: [
          const SizedBox(height: 20),
          Text(
            '\uD83C\uDF38',
            style: const TextStyle(fontSize: 48),
          ),
          const SizedBox(height: 12),
          Text(
            '생년월일 입력',
            style: GoogleFonts.notoSerif(
              fontSize: 24,
              fontWeight: FontWeight.w900,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '정확한 운세 분석을 위해 생년월일을 알려주세요',
            style: GoogleFonts.notoSans(
              fontSize: 14,
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 32),

          // Year / Month / Day row
          Row(
            children: [
              Expanded(
                flex: 2,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('연도', style: GoogleFonts.notoSans(fontSize: 12, color: AppColors.textSecondary)),
                    const SizedBox(height: 6),
                    TextFormField(
                      keyboardType: TextInputType.number,
                      maxLength: 4,
                      decoration: const InputDecoration(
                        hintText: '1990',
                        counterText: '',
                      ),
                      onChanged: (v) => setState(() => _birthYear = v),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('월', style: GoogleFonts.notoSans(fontSize: 12, color: AppColors.textSecondary)),
                    const SizedBox(height: 6),
                    DropdownButtonFormField<String>(
                      value: _birthMonth.isEmpty ? null : _birthMonth,
                      hint: const Text('월'),
                      items: List.generate(12, (i) => DropdownMenuItem(
                        value: '${i + 1}',
                        child: Text('${i + 1}월'),
                      )),
                      onChanged: (v) => setState(() => _birthMonth = v ?? ''),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('일', style: GoogleFonts.notoSans(fontSize: 12, color: AppColors.textSecondary)),
                    const SizedBox(height: 6),
                    DropdownButtonFormField<String>(
                      value: _birthDay.isEmpty ? null : _birthDay,
                      hint: const Text('일'),
                      items: List.generate(31, (i) => DropdownMenuItem(
                        value: '${i + 1}',
                        child: Text('${i + 1}일'),
                      )),
                      onChanged: (v) => setState(() => _birthDay = v ?? ''),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Birth time (optional)
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '태어난 시간 (선택)',
                style: GoogleFonts.notoSans(fontSize: 12, color: AppColors.textSecondary),
              ),
              const SizedBox(height: 6),
              DropdownButtonFormField<String>(
                value: _birthTime.isEmpty ? null : _birthTime,
                hint: const Text('모름 / 선택안함'),
                items: const [
                  DropdownMenuItem(value: '자', child: Text('자시 (23:00~01:00)')),
                  DropdownMenuItem(value: '축', child: Text('축시 (01:00~03:00)')),
                  DropdownMenuItem(value: '인', child: Text('인시 (03:00~05:00)')),
                  DropdownMenuItem(value: '묘', child: Text('묘시 (05:00~07:00)')),
                  DropdownMenuItem(value: '진', child: Text('진시 (07:00~09:00)')),
                  DropdownMenuItem(value: '사', child: Text('사시 (09:00~11:00)')),
                  DropdownMenuItem(value: '오', child: Text('오시 (11:00~13:00)')),
                  DropdownMenuItem(value: '미', child: Text('미시 (13:00~15:00)')),
                  DropdownMenuItem(value: '신', child: Text('신시 (15:00~17:00)')),
                  DropdownMenuItem(value: '유', child: Text('유시 (17:00~19:00)')),
                  DropdownMenuItem(value: '술', child: Text('술시 (19:00~21:00)')),
                  DropdownMenuItem(value: '해', child: Text('해시 (21:00~23:00)')),
                ],
                onChanged: (v) => setState(() => _birthTime = v ?? ''),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildInterestsStep() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        children: [
          const SizedBox(height: 20),
          Text(
            '\uD83D\uDD2E',
            style: const TextStyle(fontSize: 48),
          ),
          const SizedBox(height: 12),
          Text(
            '관심 분야 선택',
            style: GoogleFonts.notoSerif(
              fontSize: 24,
              fontWeight: FontWeight.w900,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '관심 있는 상담 분야를 모두 선택해주세요',
            style: GoogleFonts.notoSans(
              fontSize: 14,
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 32),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            alignment: WrapAlignment.center,
            children: _interests.map((item) {
              final id = item['id'] as String;
              final label = item['label'] as String;
              final icon = item['icon'] as IconData;
              final selected = _selectedInterests.contains(id);

              return _buildChip(
                icon: icon,
                label: label,
                selected: selected,
                onTap: () {
                  setState(() {
                    if (selected) {
                      _selectedInterests.remove(id);
                    } else {
                      _selectedInterests.add(id);
                    }
                  });
                },
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildConcernsStep() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        children: [
          const SizedBox(height: 20),
          Text(
            '\uD83D\uDCAD',
            style: const TextStyle(fontSize: 48),
          ),
          const SizedBox(height: 12),
          Text(
            '고민 유형 선택',
            style: GoogleFonts.notoSerif(
              fontSize: 24,
              fontWeight: FontWeight.w900,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '현재 가장 관심 있는 고민을 모두 선택해주세요',
            style: GoogleFonts.notoSans(
              fontSize: 14,
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 32),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            alignment: WrapAlignment.center,
            children: _concerns.map((item) {
              final id = item['id'] as String;
              final label = item['label'] as String;
              final icon = item['icon'] as IconData;
              final selected = _selectedConcerns.contains(id);

              return _buildChip(
                icon: icon,
                label: label,
                selected: selected,
                onTap: () {
                  setState(() {
                    if (selected) {
                      _selectedConcerns.remove(id);
                    } else {
                      _selectedConcerns.add(id);
                    }
                  });
                },
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildRecommendedStep() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        children: [
          const SizedBox(height: 20),
          Text(
            '\u{1FAB7}',
            style: const TextStyle(fontSize: 48),
          ),
          const SizedBox(height: 12),
          Text(
            '추천 상담사',
            style: GoogleFonts.notoSerif(
              fontSize: 24,
              fontWeight: FontWeight.w900,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '선택하신 관심사에 맞는 상담사입니다',
            style: GoogleFonts.notoSans(
              fontSize: 14,
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 24),
          if (_loadingRec)
            const Center(child: CircularProgressIndicator())
          else
            ...(_recommended.map((c) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Card(
                child: ListTile(
                  contentPadding: const EdgeInsets.all(12),
                  leading: CircleAvatar(
                    radius: 24,
                    backgroundColor: AppColors.gold,
                    child: Text(
                      (c['name']?.toString() ?? '?').substring(0, 1),
                      style: GoogleFonts.notoSerif(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: AppColors.inkBlack,
                      ),
                    ),
                  ),
                  title: Text(
                    c['name']?.toString() ?? '-',
                    style: GoogleFonts.notoSerif(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        c['specialty']?.toString() ?? '',
                        style: GoogleFonts.notoSans(
                          fontSize: 12,
                          color: AppColors.gold,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        c['intro']?.toString() ?? '',
                        style: GoogleFonts.notoSans(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                  trailing: const Icon(Icons.arrow_forward_ios, size: 14),
                  onTap: () {
                    final id = c['id'];
                    if (id != null) {
                      context.push('/counselor/$id');
                    }
                  },
                ),
              ),
            ))),
        ],
      ),
    );
  }

  Widget _buildChip({
    required IconData icon,
    required String label,
    required bool selected,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(24),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: selected ? AppColors.gold : AppColors.border,
            width: selected ? 2 : 1,
          ),
          color: selected ? AppColors.gold.withOpacity(0.1) : Colors.transparent,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 20,
              color: selected ? AppColors.gold : AppColors.textSecondary,
            ),
            const SizedBox(width: 8),
            Text(
              label,
              style: GoogleFonts.notoSans(
                fontSize: 14,
                fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
                color: selected ? AppColors.gold : AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
