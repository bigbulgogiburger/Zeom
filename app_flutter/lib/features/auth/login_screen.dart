import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../services/kakao_login_service.dart';
import '../../services/naver_login_service.dart';
import '../../shared/animations/zeom_animations.dart';
import '../../shared/theme.dart';
import '../../shared/typography.dart';
import '../../shared/widgets/zeom_button.dart';
import '../../shared/widgets/zeom_lotus_mandala.dart';
import 'auth_provider.dart';

/// S01 로그인 — MOBILE_DESIGN_PLAN.md §3.1 준수.
///
/// Layout: Scaffold(hanji → hanjiDeep gradient) → SafeArea → Stack
///   ├─ Decorative ZeomLotusMandala watermark (top 60, size 280, opacity 0.08)
///   └─ Column(spaceBetween)
///       ├─ Top block: BrandOrb + brand title + subcopy
///       └─ Bottom block: 3 social buttons + or-divider + phone CTA + legal
///
/// Auth wiring preserved from previous revision:
///   - 카카오 / 네이버 → service SDK.login() → ref.read(authProvider.notifier)
///       .socialLogin(provider: 'kakao'|'naver', accessToken: token)
///   - Apple → TODO (service not implemented yet), button disabled.
class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  /// Currently loading provider key: 'kakao' | 'naver' | 'apple' | null.
  String? _loading;

  final _kakaoLoginService = KakaoLoginService();
  final _naverLoginService = NaverLoginService();

  Future<void> _loginWith(String provider) async {
    if (_loading != null) return;
    setState(() => _loading = provider);

    // 의례적 대기 — 공간을 여는 900ms (§3.1 "의례적 대기")
    await Future<void>.delayed(const Duration(milliseconds: 900));
    if (!mounted) return;

    try {
      switch (provider) {
        case 'kakao':
          final token = await _kakaoLoginService.login();
          if (!mounted) return;
          await ref.read(authProvider.notifier).socialLogin(
                provider: 'kakao',
                accessToken: token,
              );
          break;
        case 'naver':
          final token = await _naverLoginService.login();
          if (!mounted) return;
          await ref.read(authProvider.notifier).socialLogin(
                provider: 'naver',
                accessToken: token,
              );
          break;
        case 'apple':
          // TODO: Apple Sign-In 미구현 — AppleLoginService 추가 후 연결.
          throw Exception('apple-not-implemented');
      }
      // Router redirect will navigate on authState change.
    } catch (e) {
      if (!mounted) return;
      final msg = e.toString();
      final display = msg.toLowerCase().contains('cancel')
          ? '취소되었습니다'
          : '연결이 불안정합니다. 다시 시도해주세요';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(display)),
      );
    } finally {
      if (mounted) setState(() => _loading = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bool busy = _loading != null;

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [AppColors.hanji, AppColors.hanjiDeep],
          ),
        ),
        child: SafeArea(
          child: Stack(
            children: [
              // Decorative watermark behind content.
              const Positioned(
                top: 60,
                left: 0,
                right: 0,
                child: Center(
                  child: ZeomLotusMandala(
                    variant: ZeomMandalaVariant.full,
                    size: 280,
                    opacity: 0.08,
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // ─── Top block ─────────────────────────────────────
                    ZeomFadeSlideIn(
                      child: Padding(
                        padding: const EdgeInsets.only(top: 100),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const _BrandOrb(),
                            const SizedBox(height: 20),
                            _buildBrandTitle(),
                            const SizedBox(height: 14),
                            Text(
                              '마음이 복잡한 밤,\n조용히 이야기 나눌 한 분을 찾으세요.',
                              style: ZeomType.body.copyWith(
                                color: AppColors.ink3,
                                height: 1.6,
                              ),
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),
                      ),
                    ),

                    // ─── Bottom block ──────────────────────────────────
                    ZeomFadeSlideIn(
                      delay: const Duration(milliseconds: 120),
                      child: Padding(
                        padding: const EdgeInsets.only(bottom: 32),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            _SocialButton(
                              kind: _SocialKind.kakao,
                              loading: _loading == 'kakao',
                              ignoreTaps: busy && _loading != 'kakao',
                              onTap: () => _loginWith('kakao'),
                            ),
                            const SizedBox(height: 10),
                            _SocialButton(
                              kind: _SocialKind.naver,
                              loading: _loading == 'naver',
                              ignoreTaps: busy && _loading != 'naver',
                              onTap: () => _loginWith('naver'),
                            ),
                            const SizedBox(height: 10),
                            // Apple: 미구현. 스펙 지시에 따라 disable + TODO 주석.
                            _SocialButton(
                              kind: _SocialKind.apple,
                              loading: false,
                              ignoreTaps: true,
                              dimmed: true,
                              onTap: null,
                            ),
                            const SizedBox(height: 18),
                            const _OrDivider(),
                            const SizedBox(height: 18),
                            IgnorePointer(
                              ignoring: busy,
                              child: Opacity(
                                opacity: busy ? 0.4 : 1.0,
                                child: ZeomButton(
                                  label: '휴대폰 번호로 시작',
                                  variant: ZeomButtonVariant.outline,
                                  size: ZeomButtonSize.md,
                                  width: double.infinity,
                                  onPressed: () => context.push('/signup'),
                                ),
                              ),
                            ),
                            const SizedBox(height: 20),
                            Text(
                              '만 19세 이상만 이용 가능합니다\n로그인 시 이용약관 및 개인정보 처리방침에 동의한 것으로 간주됩니다.',
                              style: ZeomType.meta.copyWith(
                                fontSize: 11,
                                color: AppColors.ink3,
                                height: 1.5,
                              ),
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),
                      ),
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

  /// "천지연꽃신당" — 가운데 "꽃" 글자 gold 강조.
  Widget _buildBrandTitle() {
    final base = ZeomType.display.copyWith(
      color: AppColors.ink,
      letterSpacing: -0.5,
    );
    return RichText(
      textAlign: TextAlign.center,
      text: TextSpan(
        style: base,
        children: [
          const TextSpan(text: '천지연'),
          TextSpan(
            text: '꽃',
            style: base.copyWith(color: AppColors.gold),
          ),
          const TextSpan(text: '신당'),
        ],
      ),
    );
  }
}

// =====================================================================
// Brand orb — 72×72 gold radial gradient with "꽃" glyph.
// =====================================================================

class _BrandOrb extends StatelessWidget {
  const _BrandOrb();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 72,
      height: 72,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: const RadialGradient(
          colors: [AppColors.goldSoft, AppColors.gold],
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.gold.withOpacity(0.4),
            offset: const Offset(0, 8),
            blurRadius: 24,
          ),
        ],
      ),
      alignment: Alignment.center,
      child: Text(
        '꽃',
        style: ZeomType.display.copyWith(
          fontSize: 32,
          fontWeight: FontWeight.w700,
          color: AppColors.hanji,
          height: 1.0,
        ),
      ),
    );
  }
}

// =====================================================================
// OrDivider — thin borderSoft rules flanking "또는".
// =====================================================================

class _OrDivider extends StatelessWidget {
  const _OrDivider();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Expanded(
          child: Divider(height: 1, thickness: 1, color: AppColors.borderSoft),
        ),
        const SizedBox(width: 16),
        Text(
          '또는',
          style: ZeomType.meta.copyWith(color: AppColors.ink3),
        ),
        const SizedBox(width: 16),
        const Expanded(
          child: Divider(height: 1, thickness: 1, color: AppColors.borderSoft),
        ),
      ],
    );
  }
}

// =====================================================================
// Social buttons — brand-coloured, custom (not ZeomButton).
// =====================================================================

enum _SocialKind { kakao, naver, apple }

class _SocialButton extends StatelessWidget {
  const _SocialButton({
    required this.kind,
    required this.loading,
    required this.ignoreTaps,
    required this.onTap,
    this.dimmed = false,
  });

  final _SocialKind kind;
  final bool loading;
  final bool ignoreTaps;
  final bool dimmed;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final palette = _paletteFor(kind);
    final double opacity = (ignoreTaps || dimmed) ? 0.4 : 1.0;

    final Widget label = Text(
      palette.label,
      style: ZeomType.bodyLg.copyWith(
        fontSize: 15,
        fontWeight: FontWeight.w600,
        color: palette.fg,
        height: 1.2,
      ),
    );

    final Widget child = loading
        ? SizedBox(
            width: 18,
            height: 18,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              valueColor: AlwaysStoppedAnimation<Color>(palette.fg),
            ),
          )
        : Row(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _buildIcon(palette),
              const SizedBox(width: 8),
              label,
            ],
          );

    final bool tappable = onTap != null && !ignoreTaps && !loading && !dimmed;

    return IgnorePointer(
      ignoring: ignoreTaps || !tappable,
      child: Opacity(
        opacity: opacity,
        child: Material(
          color: palette.bg,
          borderRadius: BorderRadius.circular(10),
          child: InkWell(
            onTap: tappable ? onTap : null,
            borderRadius: BorderRadius.circular(10),
            child: Container(
              height: 52,
              alignment: Alignment.center,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: child,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildIcon(_SocialPalette p) {
    switch (kind) {
      case _SocialKind.kakao:
        // 말풍선 이모지(대체 아이콘)
        return Text(
          '\u{1F4AC}',
          style: TextStyle(fontSize: 16, color: p.fg, height: 1.0),
        );
      case _SocialKind.naver:
        return Text(
          'N',
          style: ZeomType.bodyLg.copyWith(
            fontSize: 16,
            fontWeight: FontWeight.w900,
            color: p.fg,
            height: 1.0,
          ),
        );
      case _SocialKind.apple:
        return Icon(Icons.apple, size: 18, color: p.fg);
    }
  }

  _SocialPalette _paletteFor(_SocialKind k) {
    switch (k) {
      case _SocialKind.kakao:
        return const _SocialPalette(
          bg: Color(0xFFFEE500),
          fg: AppColors.ink,
          label: '카카오로 시작하기',
        );
      case _SocialKind.naver:
        return const _SocialPalette(
          bg: Color(0xFF03C75A),
          fg: AppColors.hanji,
          label: '네이버로 시작하기',
        );
      case _SocialKind.apple:
        return const _SocialPalette(
          bg: AppColors.ink,
          fg: AppColors.hanji,
          label: 'Apple로 시작하기',
        );
    }
  }
}

class _SocialPalette {
  final Color bg;
  final Color fg;
  final String label;
  const _SocialPalette({
    required this.bg,
    required this.fg,
    required this.label,
  });
}
