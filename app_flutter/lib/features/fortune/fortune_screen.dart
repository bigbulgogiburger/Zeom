import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../shared/animations/zeom_animations.dart';
import '../../shared/theme.dart';
import '../../shared/typography.dart';
import '../../shared/widgets/zeom_app_bar.dart';
import '../../shared/widgets/zeom_button.dart';

/// S12 — 오늘의 운세 (three-card reveal flow).
///
/// Layout and content follow MOBILE_DESIGN_PLAN.md § 3.12.
/// The user flips three tarot-style cards one by one; once all three
/// faces are revealed, an interpretation panel and a counselor CTA fade
/// in beneath the row.
class FortuneScreen extends ConsumerStatefulWidget {
  const FortuneScreen({super.key});

  @override
  ConsumerState<FortuneScreen> createState() => _FortuneScreenState();
}

class _FortuneScreenState extends ConsumerState<FortuneScreen> {
  static const List<_CardCopy> _cards = [
    _CardCopy(direction: '동(東)', subtitle: '오늘의 흐름'),
    _CardCopy(direction: '남(南)', subtitle: '주의할 점'),
    _CardCopy(direction: '서(西)', subtitle: '행운의 방향'),
  ];

  final List<bool> _flipped = [false, false, false];

  bool get _allFlipped => _flipped.every((v) => v);

  void _flipCard(int i) {
    if (_flipped[i]) return;
    setState(() => _flipped[i] = true);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.hanji,
      appBar: const ZeomAppBar(title: '오늘의 운세'),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 40),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: 20),
            _buildHeader(),
            const SizedBox(height: 24),
            _buildCardsRow(),
            const SizedBox(height: 24),
            AnimatedCrossFade(
              firstChild: const SizedBox(
                width: double.infinity,
                height: 0,
              ),
              secondChild: _allFlipped
                  ? ZeomFadeSlideIn(
                      key: const ValueKey('interpretation'),
                      child: _InterpretationPanel(
                        onReserve: () => context.go('/counselors'),
                      ),
                    )
                  : const SizedBox.shrink(),
              crossFadeState: _allFlipped
                  ? CrossFadeState.showSecond
                  : CrossFadeState.showFirst,
              duration: ZeomAnimations.slideFadeDuration,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Text(
          '세 장의 카드를 뒤집어주세요',
          textAlign: TextAlign.center,
          style: GoogleFonts.notoSerif(
            fontSize: 22,
            fontWeight: FontWeight.w700,
            color: AppColors.ink,
            height: 1.3,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          '마음을 가다듬고 천천히 한 장씩 선택합니다',
          textAlign: TextAlign.center,
          style: ZeomType.meta.copyWith(color: AppColors.ink3),
        ),
      ],
    );
  }

  Widget _buildCardsRow() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        for (var i = 0; i < _cards.length; i++) ...[
          _FlipCard(
            direction: _cards[i].direction,
            subtitle: _cards[i].subtitle,
            flipped: _flipped[i],
            onFlip: () => _flipCard(i),
          ),
          if (i < _cards.length - 1) const SizedBox(width: 16),
        ],
      ],
    );
  }
}

class _CardCopy {
  final String direction;
  final String subtitle;
  const _CardCopy({required this.direction, required this.subtitle});
}

// =================================================================
// _FlipCard — 3D Y-axis flip with reduce-motion fallback
// =================================================================

class _FlipCard extends StatefulWidget {
  final String direction; // e.g. '동(東)'
  final String subtitle; // e.g. '오늘의 흐름'
  final bool flipped;
  final VoidCallback onFlip;

  const _FlipCard({
    required this.direction,
    required this.subtitle,
    required this.flipped,
    required this.onFlip,
  });

  @override
  State<_FlipCard> createState() => _FlipCardState();
}

class _FlipCardState extends State<_FlipCard>
    with SingleTickerProviderStateMixin {
  static const Duration _flipDuration = Duration(milliseconds: 800);

  late final AnimationController _controller;
  final ValueNotifier<bool> _animating = ValueNotifier<bool>(false);

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: _flipDuration,
    );
    _controller.addStatusListener((status) {
      if (status == AnimationStatus.completed ||
          status == AnimationStatus.dismissed) {
        _animating.value = false;
      }
    });
    if (widget.flipped) {
      _controller.value = 1.0;
    }
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Respect reduce-motion setting on each rebuild — if enabled, flips
    // resolve instantly.
    if (ZeomAnimations.isReduceMotion(context)) {
      _controller.duration = Duration.zero;
    } else {
      _controller.duration = _flipDuration;
    }
  }

  @override
  void didUpdateWidget(covariant _FlipCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.flipped && !oldWidget.flipped) {
      _animating.value = true;
      _controller.forward(from: 0);
    } else if (!widget.flipped && oldWidget.flipped) {
      _controller.value = 0;
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    _animating.dispose();
    super.dispose();
  }

  void _handleTap() {
    if (widget.flipped) return;
    if (_animating.value) return;
    _animating.value = true;
    widget.onFlip();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: _handleTap,
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, _) {
          final value = _controller.value;
          final isBack = value > 0.5;
          final matrix = Matrix4.identity()
            ..setEntry(3, 2, 0.001)
            ..rotateY(pi * value);

          final Widget face = isBack
              ? Transform(
                  alignment: Alignment.center,
                  transform: Matrix4.identity()..rotateY(pi),
                  child: _buildBackFace(),
                )
              : _buildFrontFace();

          return Transform(
            alignment: Alignment.center,
            transform: matrix,
            child: face,
          );
        },
      ),
    );
  }

  Widget _buildFrontFace() {
    return Container(
      width: 100,
      height: 150,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppColors.ink, Color(0xFF2A2A2A)],
        ),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.gold, width: 2),
      ),
      alignment: Alignment.center,
      child: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: RadialGradient(
            center: Alignment.center,
            radius: 0.5,
            colors: [
              AppColors.gold.withOpacity(0.7),
              AppColors.darkRed.withOpacity(0.7),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBackFace() {
    return Container(
      width: 100,
      height: 150,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.gold, width: 2),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Text(
            widget.direction,
            textAlign: TextAlign.center,
            style: GoogleFonts.notoSerif(
              fontSize: 28,
              fontWeight: FontWeight.w700,
              color: AppColors.darkRed,
              height: 1.1,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            widget.subtitle,
            textAlign: TextAlign.center,
            style: ZeomType.meta.copyWith(color: AppColors.ink3),
          ),
        ],
      ),
    );
  }
}

// =================================================================
// _InterpretationPanel — quote, three sections, counselor CTA
// =================================================================

class _InterpretationPanel extends StatelessWidget {
  final VoidCallback onReserve;

  const _InterpretationPanel({required this.onReserve});

  static const List<_Section> _sections = [
    _Section(
      title: '오늘의 흐름',
      body:
          '지금은 잠시 멈추고 주변을 살피는 때입니다. 서두르지 않으면 생각보다 일찍 좋은 소식이 찾아옵니다.',
    ),
    _Section(
      title: '주의할 점',
      body: '말 한마디에 날이 서기 쉽습니다. 가까운 사람과는 한 번 더 호흡하고 대답하세요.',
    ),
    _Section(
      title: '행운의 방향',
      body: '동쪽이 좋습니다. 오늘 하루 동쪽에서 오는 제안이 작은 기회가 됩니다.',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _buildQuoteCard(),
        const SizedBox(height: 16),
        for (var i = 0; i < _sections.length; i++) ...[
          _buildSection(_sections[i]),
          if (i < _sections.length - 1) const SizedBox(height: 16),
        ],
        const SizedBox(height: 24),
        ZeomButton(
          label: '더 자세히 상담받기',
          onPressed: onReserve,
          variant: ZeomButtonVariant.gold,
          size: ZeomButtonSize.md,
          width: double.infinity,
        ),
      ],
    );
  }

  Widget _buildQuoteCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.borderSoft, width: 1),
      ),
      child: Text(
        '인연은 서두르지 않고, 때를 기다리면 스스로 다가옵니다.',
        textAlign: TextAlign.center,
        style: GoogleFonts.notoSerif(
          fontSize: 18,
          fontWeight: FontWeight.w700,
          color: AppColors.ink,
          height: 1.5,
        ),
      ),
    );
  }

  Widget _buildSection(_Section section) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Divider (dashed flavor kept as solid 1px per spec note).
        Container(height: 1, color: AppColors.borderSoft),
        const SizedBox(height: 16),
        Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Container(width: 3, height: 3, color: AppColors.gold),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                section.title,
                style: ZeomType.cardTitle,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Text(
          section.body,
          style: ZeomType.body.copyWith(
            color: AppColors.ink,
            height: 1.6,
          ),
        ),
      ],
    );
  }
}

class _Section {
  final String title;
  final String body;
  const _Section({required this.title, required this.body});
}
