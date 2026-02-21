import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/auth_provider.dart';
import '../../shared/theme.dart';

class MoreScreen extends ConsumerWidget {
  const MoreScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final user = authState.user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('더보기'),
      ),
      body: ListView(
        children: [
          // User info section
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: AppColors.inkBlack,
              border: Border(
                bottom: BorderSide(
                  color: AppColors.border,
                  width: 1,
                ),
              ),
            ),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 30,
                  backgroundColor: AppColors.lotusPink,
                  child: Text(
                    user?['name']?.toString().substring(0, 1) ?? '?',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          color: Colors.white,
                        ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        user?['name']?.toString() ?? '사용자',
                        style:
                            Theme.of(context).textTheme.titleLarge?.copyWith(
                                  color: AppColors.hanji,
                                ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        user?['email']?.toString() ?? '',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AppColors.hanji.withOpacity(0.8),
                            ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          // Menu items
          _buildMenuItem(
            context,
            icon: Icons.calendar_today,
            title: '내 예약',
            onTap: () {
              context.push('/bookings');
            },
          ),
          _buildMenuItem(
            context,
            icon: Icons.history,
            title: '상담 히스토리',
            onTap: () {
              context.push('/consultation/history');
            },
          ),
          _buildMenuItem(
            context,
            icon: Icons.account_balance_wallet,
            title: '내 지갑',
            onTap: () {
              context.push('/wallet');
            },
          ),
          _buildMenuItem(
            context,
            icon: Icons.receipt_long,
            title: '환불 내역',
            onTap: () {
              context.push('/refund/list');
            },
          ),
          _buildMenuItem(
            context,
            icon: Icons.gavel,
            title: '분쟁 내역',
            onTap: () {
              context.push('/dispute/list');
            },
          ),
          _buildMenuItem(
            context,
            icon: Icons.favorite_outline,
            title: '찜한 상담사',
            onTap: () {
              // Not implemented yet
            },
          ),
          _buildMenuItem(
            context,
            icon: Icons.notifications_outlined,
            title: '알림 설정',
            onTap: () {
              // Not implemented yet
            },
          ),
          _buildMenuItem(
            context,
            icon: Icons.help_outline,
            title: '고객센터',
            onTap: () {
              // Not implemented yet
            },
          ),
          _buildMenuItem(
            context,
            icon: Icons.settings_outlined,
            title: '설정',
            onTap: () {
              // Not implemented yet
            },
          ),
          const Divider(height: 1),
          _buildMenuItem(
            context,
            icon: Icons.logout,
            title: '로그아웃',
            textColor: AppColors.error,
            onTap: () async {
              final confirm = await showDialog<bool>(
                context: context,
                builder: (context) => AlertDialog(
                  title: const Text('로그아웃'),
                  content: const Text('로그아웃 하시겠습니까?'),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(context, false),
                      child: const Text('취소'),
                    ),
                    TextButton(
                      onPressed: () => Navigator.pop(context, true),
                      child: const Text('로그아웃'),
                    ),
                  ],
                ),
              );

              if (confirm == true) {
                await ref.read(authProvider.notifier).logout();
                if (context.mounted) {
                  context.go('/login');
                }
              }
            },
          ),
        ],
      ),
    );
  }

  Widget _buildMenuItem(
    BuildContext context, {
    required IconData icon,
    required String title,
    required VoidCallback onTap,
    Color? textColor,
  }) {
    return ListTile(
      leading: Icon(
        icon,
        color: textColor ?? AppColors.textPrimary,
      ),
      title: Text(
        title,
        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
              color: textColor,
            ),
      ),
      trailing: const Icon(
        Icons.arrow_forward_ios,
        size: 16,
      ),
      onTap: onTap,
    );
  }
}
