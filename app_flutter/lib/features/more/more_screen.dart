import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../shared/theme.dart';
import '../../shared/typography.dart';
import '../../shared/widgets/zeom_button.dart';
import '../auth/auth_provider.dart';

/// MOBILE_DESIGN_PLAN.md § 3.15 — 더보기 탭 (S15).
///
/// Profile card + 3 menu groups (상담 활동 / 설정 / 계정) + version footer.
class MoreScreen extends ConsumerWidget {
  const MoreScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final user = authState.user;

    final String name = (user?['name']?.toString().trim().isNotEmpty ?? false)
        ? user!['name'].toString()
        : '윤서연';
    final String phone =
        (user?['phone']?.toString().trim().isNotEmpty ?? false)
            ? user!['phone'].toString()
            : '010-1234-5678';

    // Loyalty pill threshold (§3.15): 상담 10회 이상 = 단골. Hardcoded true
    // until backend exposes consultation counter.
    const int consultCount = 12;
    final bool isLoyal = consultCount >= 10;

    final String initial =
        name.characters.isNotEmpty ? name.characters.first : '?';

    return Scaffold(
      backgroundColor: AppColors.hanji,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.only(bottom: 90),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 16),
                child: Text('더보기', style: ZeomType.pageTitle),
              ),

              // Profile card
              _ProfileCard(
                initial: initial,
                name: name,
                phone: phone,
                consultCount: consultCount,
                isLoyal: isLoyal,
              ),

              // 상담 활동
              _MenuGroup(
                title: '상담 활동',
                items: [
                  _MenuItemData(
                    icon: Icons.history,
                    label: '상담 이력',
                    onTap: () => context.push('/consultation/history'),
                  ),
                  _MenuItemData(
                    icon: Icons.replay,
                    label: '환불 요청',
                    onTap: () => context.push('/refund/list'),
                  ),
                  _MenuItemData(
                    icon: Icons.report_outlined,
                    label: '분쟁 신고',
                    onTap: () => context.push('/dispute/list'),
                  ),
                ],
              ),

              // 설정
              const _MenuGroup(
                title: '설정',
                items: [
                  _MenuItemData(
                    icon: Icons.campaign_outlined,
                    label: '공지사항',
                    onTap: null,
                  ),
                  _MenuItemData(
                    icon: Icons.help_outline,
                    label: 'FAQ',
                    onTap: null,
                  ),
                  _MenuItemData(
                    icon: Icons.article_outlined,
                    label: '이용약관',
                    onTap: null,
                  ),
                  _MenuItemData(
                    icon: Icons.shield_outlined,
                    label: '개인정보 처리방침',
                    onTap: null,
                  ),
                ],
              ),

              // 계정
              _MenuGroup(
                title: '계정',
                items: [
                  const _MenuItemData(
                    icon: Icons.settings_outlined,
                    label: '알림·보안 설정',
                    onTap: null,
                  ),
                  _MenuItemData(
                    icon: Icons.logout,
                    label: '로그아웃',
                    onTap: () => _logout(context, ref),
                  ),
                ],
              ),

              // Version footer
              Padding(
                padding: const EdgeInsets.only(top: 24),
                child: Center(
                  child: Text(
                    '천지연꽃신당 v1.0.0 (1042)',
                    style: ZeomType.micro.copyWith(color: AppColors.ink4),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _logout(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
        ),
        title: Text('로그아웃', style: ZeomType.section),
        content: Text('정말 로그아웃하시겠어요?', style: ZeomType.body),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: Text(
              '취소',
              style: TextStyle(color: AppColors.ink3),
            ),
          ),
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            child: Text(
              '로그아웃',
              style: TextStyle(color: AppColors.darkRed),
            ),
          ),
        ],
      ),
    );

    if (confirmed != true || !context.mounted) return;

    try {
      await ref.read(authProvider.notifier).logout();
    } catch (_) {
      // Fail gracefully — always redirect to login.
    }

    if (context.mounted) context.go('/login');
  }
}

// ---------------------------------------------------------------------------
// Profile card
// ---------------------------------------------------------------------------

class _ProfileCard extends StatelessWidget {
  final String initial;
  final String name;
  final String phone;
  final int consultCount;
  final bool isLoyal;

  const _ProfileCard({
    required this.initial,
    required this.name,
    required this.phone,
    required this.consultCount,
    required this.isLoyal,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.borderSoft),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Gradient avatar
          Container(
            width: 52,
            height: 52,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [AppColors.lotusPink, AppColors.darkRed],
              ),
            ),
            alignment: Alignment.center,
            child: Text(
              initial,
              style: GoogleFonts.notoSerif(
                fontSize: 22,
                fontWeight: FontWeight.w700,
                color: AppColors.hanji,
                height: 1.0,
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        name,
                        style: ZeomType.cardTitle,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (isLoyal) ...[
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.goldBg,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          '단골',
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.w700,
                            color: AppColors.ink,
                            height: 1.3,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  phone,
                  style: ZeomType.meta.copyWith(color: AppColors.ink3),
                ),
                const SizedBox(height: 2),
                Text(
                  '상담 $consultCount회 완료',
                  style: ZeomType.meta.copyWith(color: AppColors.ink3),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          const ZeomButton(
            label: '편집',
            onPressed: null,
            variant: ZeomButtonVariant.outline,
            size: ZeomButtonSize.sm,
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Menu group + items
// ---------------------------------------------------------------------------

class _MenuItemData {
  final IconData icon;
  final String label;
  final VoidCallback? onTap;

  const _MenuItemData({
    required this.icon,
    required this.label,
    required this.onTap,
  });
}

class _MenuGroup extends StatelessWidget {
  final String title;
  final List<_MenuItemData> items;

  const _MenuGroup({
    required this.title,
    required this.items,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
          child: Text(
            title.toUpperCase(),
            style: ZeomType.micro.copyWith(
              color: AppColors.ink3,
              letterSpacing: 1,
            ),
          ),
        ),
        Container(
          margin: const EdgeInsets.symmetric(horizontal: 20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.borderSoft),
          ),
          clipBehavior: Clip.antiAlias,
          child: Column(
            children: [
              for (int i = 0; i < items.length; i++) ...[
                _MenuTile(data: items[i]),
                if (i < items.length - 1)
                  Divider(
                    height: 1,
                    thickness: 1,
                    color: AppColors.borderSoft,
                  ),
              ],
            ],
          ),
        ),
      ],
    );
  }
}

class _MenuTile extends StatelessWidget {
  final _MenuItemData data;

  const _MenuTile({required this.data});

  @override
  Widget build(BuildContext context) {
    final bool enabled = data.onTap != null;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: data.onTap,
        child: Opacity(
          opacity: enabled ? 1.0 : 0.5,
          child: Container(
            constraints: const BoxConstraints(minHeight: 44),
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                Container(
                  width: 28,
                  height: 28,
                  decoration: const BoxDecoration(
                    color: AppColors.hanjiDeep,
                    shape: BoxShape.circle,
                  ),
                  alignment: Alignment.center,
                  child: Icon(
                    data.icon,
                    size: 16,
                    color: AppColors.gold,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Text(
                    data.label,
                    style: ZeomType.body.copyWith(
                      color: AppColors.ink,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
                Icon(
                  Icons.chevron_right,
                  size: 20,
                  color: AppColors.ink3,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
