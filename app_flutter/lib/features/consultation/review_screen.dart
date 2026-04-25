import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../shared/animations/zeom_animations.dart';
import '../../shared/providers/active_session_provider.dart';
import '../../shared/providers/bookings_provider.dart';
import '../../shared/providers/wallet_provider.dart';
import '../../shared/theme.dart';
import '../../shared/typography.dart';
import '../../shared/widgets/zeom_app_bar.dart';
import '../../shared/widgets/zeom_avatar.dart';
import '../../shared/widgets/zeom_button.dart';
import '../../shared/widgets/zeom_chip.dart';
import '../../shared/widgets/zeom_star_rating.dart';

/// S11 — 후기 작성 (MOBILE_DESIGN_PLAN.md §3.11)
///
/// Form consists of four cards: session meta, rating, tag Wrap, free-form
/// review. A sticky gold CTA at the bottom surfaces the incentive copy
/// ("후기 등록 · +1,000캐시"). On submit, we credit the wallet, mark the
/// booking reviewed, fade into a "고맙습니다" success screen, then auto-
/// route to `/bookings` after 1.5s.
class ReviewScreen extends ConsumerStatefulWidget {
  final int bookingId;
  final int? counselorId;

  const ReviewScreen({
    super.key,
    required this.bookingId,
    this.counselorId,
  });

  @override
  ConsumerState<ReviewScreen> createState() => _ReviewScreenState();
}

class _ReviewScreenState extends ConsumerState<ReviewScreen> {
  static const List<String> _tagOptions = <String>[
    '차분해요',
    '현실적이에요',
    '깊이 있어요',
    '공감 잘해요',
    '명쾌해요',
    '따뜻해요',
  ];

  int _rating = 0;
  final Set<String> _tags = <String>{};
  String _text = '';
  bool _submitting = false;
  bool _submitted = false;
  Timer? _redirectTimer;
  final TextEditingController _textController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _textController.addListener(() {
      if (_text != _textController.text) {
        setState(() => _text = _textController.text);
      }
    });
  }

  @override
  void dispose() {
    _redirectTimer?.cancel();
    _textController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _submitting = true);
    await Future<void>.delayed(const Duration(milliseconds: 1500));
    if (!mounted) return;

    ref.read(walletProvider.notifier).credit(1000);
    final session = ref.read(activeSessionProvider);
    if (session != null) {
      ref.read(bookingsProvider.notifier).markReviewed(session.booking.id);
    }

    setState(() {
      _submitting = false;
      _submitted = true;
    });

    _redirectTimer = Timer(const Duration(milliseconds: 1500), () {
      if (!mounted) return;
      ref.read(activeSessionProvider.notifier).clear();
      context.go('/bookings');
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_submitted) {
      return _SuccessView();
    }

    final session = ref.watch(activeSessionProvider);
    final safeBottom = MediaQuery.of(context).padding.bottom;

    return Scaffold(
      backgroundColor: AppColors.hanji,
      appBar: const ZeomAppBar(title: '후기 작성'),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 140),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (session != null) _SessionHeaderCard(session: session),
            if (session != null) const SizedBox(height: 16),
            _RatingCard(
              rating: _rating,
              onChanged: (v) => setState(() => _rating = v),
            ),
            const SizedBox(height: 12),
            _TagsCard(
              options: _tagOptions,
              selected: _tags,
              onToggle: (t) {
                setState(() {
                  if (_tags.contains(t)) {
                    _tags.remove(t);
                  } else {
                    _tags.add(t);
                  }
                });
              },
            ),
            const SizedBox(height: 12),
            _TextReviewCard(
              controller: _textController,
              length: _text.length,
            ),
          ],
        ),
      ),
      bottomSheet: Container(
        width: double.infinity,
        padding: EdgeInsets.fromLTRB(20, 14, 20, safeBottom + 14),
        decoration: const BoxDecoration(
          color: AppColors.hanji,
          border: Border(
            top: BorderSide(color: AppColors.borderSoft, width: 1),
          ),
        ),
        child: ZeomButton(
          label: _ctaLabel(),
          variant: _rating > 0
              ? ZeomButtonVariant.primary
              : ZeomButtonVariant.ghost,
          size: ZeomButtonSize.md,
          width: double.infinity,
          loading: _submitting,
          onPressed: _rating > 0 && !_submitting ? _submit : null,
        ),
      ),
    );
  }

  String _ctaLabel() {
    if (_rating == 0) return '별점을 선택해주세요';
    if (_submitting) return '등록 중\u2026';
    return '후기 등록 · +1,000캐시';
  }
}

/// Top session meta card — avatar + counselor name + formatted date.
class _SessionHeaderCard extends StatelessWidget {
  final ActiveSession session;

  const _SessionHeaderCard({required this.session});

  @override
  Widget build(BuildContext context) {
    final booking = session.booking;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.borderSoft, width: 1),
      ),
      child: Padding(
        padding: const EdgeInsets.all(8),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            ZeomAvatar(initials: booking.counselorInitials, size: 44),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    booking.counselorName,
                    style: ZeomType.cardTitle,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _formatDate(booking.when),
                    style: ZeomType.meta.copyWith(color: AppColors.ink3),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime when) {
    final month = when.month.toString().padLeft(2, '0');
    final day = when.day.toString().padLeft(2, '0');
    final hour = when.hour.toString().padLeft(2, '0');
    final minute = when.minute.toString().padLeft(2, '0');
    return '${when.year}.$month.$day $hour:$minute';
  }
}

/// Rating card — interactive [ZeomStarRating] + tier-label feedback.
class _RatingCard extends StatelessWidget {
  final int rating;
  final ValueChanged<int> onChanged;

  const _RatingCard({required this.rating, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.borderSoft, width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('상담은 어떠셨나요?', style: ZeomType.cardTitle),
          const SizedBox(height: 16),
          Center(
            child: ZeomStarRating(
              value: rating.toDouble(),
              size: 36,
              interactive: true,
              onChanged: onChanged,
            ),
          ),
          const SizedBox(height: 10),
          Center(
            child: Text(
              _label(rating),
              style: ZeomType.meta.copyWith(color: AppColors.ink3),
            ),
          ),
        ],
      ),
    );
  }

  String _label(int rating) {
    switch (rating) {
      case 1:
        return '아쉬웠어요';
      case 2:
        return '보통이에요';
      case 3:
        return '괜찮아요';
      case 4:
        return '좋았어요';
      case 5:
        return '완벽했어요';
      default:
        return '별점을 선택해주세요';
    }
  }
}

/// Tag card — 6 toggleable category chips laid out in a Wrap.
class _TagsCard extends StatelessWidget {
  final List<String> options;
  final Set<String> selected;
  final ValueChanged<String> onToggle;

  const _TagsCard({
    required this.options,
    required this.selected,
    required this.onToggle,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.borderSoft, width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('어떤 점이 좋았나요?', style: ZeomType.cardTitle),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final t in options)
                ZeomChip(
                  label: t,
                  variant: ZeomChipVariant.category,
                  active: selected.contains(t),
                  onTap: () => onToggle(t),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Freeform text review card with inline counter.
class _TextReviewCard extends StatelessWidget {
  final TextEditingController controller;
  final int length;

  const _TextReviewCard({required this.controller, required this.length});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.borderSoft, width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text('자세한 후기', style: ZeomType.cardTitle),
              const SizedBox(width: 6),
              Text(
                '(선택)',
                style: ZeomType.meta.copyWith(color: AppColors.ink3),
              ),
            ],
          ),
          const SizedBox(height: 10),
          TextField(
            controller: controller,
            minLines: 5,
            maxLines: 5,
            maxLength: 500,
            style: ZeomType.body,
            buildCounter: (
              BuildContext context, {
              required int currentLength,
              required bool isFocused,
              int? maxLength,
            }) =>
                null,
            decoration: InputDecoration(
              hintText: '상담 과정에서 좋았던 부분, 아쉬웠던 부분을 남겨주세요',
              hintStyle: ZeomType.body.copyWith(color: AppColors.ink4),
              filled: true,
              fillColor: AppColors.hanji,
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide:
                    const BorderSide(color: AppColors.borderSoft, width: 1),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide:
                    const BorderSide(color: AppColors.borderSoft, width: 1),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide:
                    const BorderSide(color: AppColors.ink, width: 1.5),
              ),
            ),
          ),
          const SizedBox(height: 6),
          Align(
            alignment: Alignment.centerRight,
            child: Text(
              '$length/500',
              style: ZeomType.micro.copyWith(color: AppColors.ink3),
            ),
          ),
        ],
      ),
    );
  }
}

/// Full-screen success view rendered after `_submitted = true`. Auto-
/// navigates to `/bookings` after 1.5s (timer lives on the parent state).
class _SuccessView extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.hanji,
      body: SafeArea(
        child: ZeomFadeSlideIn(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(40),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 84,
                    height: 84,
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [AppColors.goldSoft, AppColors.gold],
                      ),
                    ),
                    alignment: Alignment.center,
                    child: const Text(
                      '\u{1FAB7}', // 🪷
                      style: TextStyle(fontSize: 36, height: 1.0),
                    ),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    '고맙습니다',
                    textAlign: TextAlign.center,
                    style: ZeomType.displaySm.copyWith(
                      fontSize: 26,
                      fontWeight: FontWeight.w700,
                      color: AppColors.ink,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    '후기 감사 캐시 +1,000 적립',
                    textAlign: TextAlign.center,
                    style: ZeomType.body.copyWith(color: AppColors.ink3),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '보여주신 후기는 다른 분들에게 큰 도움이 됩니다',
                    textAlign: TextAlign.center,
                    style: ZeomType.meta.copyWith(color: AppColors.ink3),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
