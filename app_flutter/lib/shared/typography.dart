import 'dart:ui' show FontFeature;

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'theme.dart';

/// Shared list of [FontFeature] enabling tabular figures.
///
/// Splice into any [TextStyle.fontFeatures] list to guarantee monospace
/// digit rendering — required for prices, timers, countdowns, balances,
/// review counts, and star ratings (MOBILE_DESIGN.md §3.3).
const List<FontFeature> kTabularNums = [FontFeature.tabularFigures()];

/// Type scale presets for 천지연꽃신당 mobile app (Phase 0 foundation).
///
/// Based on MOBILE_DESIGN.md §3.2 (Type Scale) and §3.3 (numeric rules).
///
/// Font rules:
/// - Serif roles (display/title/section/card) → [GoogleFonts.notoSerif]
/// - Body/meta/tag/micro roles → Pretendard if available; otherwise
///   [GoogleFonts.notoSans] as graceful fallback. `google_fonts` does not
///   currently ship a Pretendard Variable entry, so [_pretendard] resolves
///   to Noto Sans KR until a local Pretendard bundle lands in pubspec.yaml.
class ZeomType {
  ZeomType._();

  // ---------------------------------------------------------------
  // Font family resolvers
  // ---------------------------------------------------------------

  /// Pretendard resolver. Falls back to Noto Sans (covered by
  /// `google_fonts`) because Pretendard Variable is not distributed via
  /// the google_fonts package; the local variable bundle is a planned
  /// follow-up (see pubspec.yaml `fonts:` TODO).
  static TextStyle _pretendard({
    required double fontSize,
    required FontWeight fontWeight,
    double? height,
    double? letterSpacing,
    Color? color,
    List<FontFeature>? fontFeatures,
  }) {
    return GoogleFonts.notoSans(
      fontSize: fontSize,
      fontWeight: fontWeight,
      height: height,
      letterSpacing: letterSpacing,
      color: color ?? AppColors.ink,
      fontFeatures: fontFeatures,
    );
  }

  static TextStyle _serif({
    required double fontSize,
    required FontWeight fontWeight,
    double? height,
    double? letterSpacing,
    Color? color,
    List<FontFeature>? fontFeatures,
  }) {
    return GoogleFonts.notoSerif(
      fontSize: fontSize,
      fontWeight: fontWeight,
      height: height,
      letterSpacing: letterSpacing,
      color: color ?? AppColors.ink,
      fontFeatures: fontFeatures,
    );
  }

  // ---------------------------------------------------------------
  // Serif presets (Noto Serif)
  // ---------------------------------------------------------------

  /// Waiting-room countdown digits. Noto Serif 40/700/LH 1.0/LS -0.5.
  static TextStyle heroDisplay = _serif(
    fontSize: 40,
    fontWeight: FontWeight.w700,
    height: 1.0,
    letterSpacing: -0.5,
    fontFeatures: kTabularNums,
  );

  /// Wallet balance. Noto Serif 34/700/LH 1.1/LS -0.3.
  static TextStyle displayLg = _serif(
    fontSize: 34,
    fontWeight: FontWeight.w700,
    height: 1.1,
    letterSpacing: -0.3,
    fontFeatures: kTabularNums,
  );

  /// Login brand title. Noto Serif 30/700/LH 1.1/LS -0.5.
  static TextStyle display = _serif(
    fontSize: 30,
    fontWeight: FontWeight.w700,
    height: 1.1,
    letterSpacing: -0.5,
  );

  /// Success screen title. Noto Serif 24/700/LH 1.15/LS -0.3.
  static TextStyle displaySm = _serif(
    fontSize: 24,
    fontWeight: FontWeight.w700,
    height: 1.15,
    letterSpacing: -0.3,
  );

  /// Tab page header. Noto Serif 22/700/LH 1.3/LS -0.2.
  static TextStyle pageTitle = _serif(
    fontSize: 22,
    fontWeight: FontWeight.w700,
    height: 1.3,
    letterSpacing: -0.2,
  );

  /// Saju core result. Noto Serif 20/700/LH 1.3/LS -0.2.
  static TextStyle subTitle = _serif(
    fontSize: 20,
    fontWeight: FontWeight.w700,
    height: 1.3,
    letterSpacing: -0.2,
  );

  /// Section headers ("오늘의 운세"). Noto Serif 17/700/LH 1.4.
  static TextStyle section = _serif(
    fontSize: 17,
    fontWeight: FontWeight.w700,
    height: 1.4,
  );

  /// Counselor name, booking card title. Noto Serif 15/700/LH 1.4.
  static TextStyle cardTitle = _serif(
    fontSize: 15,
    fontWeight: FontWeight.w700,
    height: 1.4,
  );

  // ---------------------------------------------------------------
  // Body presets (Pretendard → Noto Sans fallback)
  // ---------------------------------------------------------------

  /// Primary button label (md). Pretendard 15/500/LH 1.5.
  static TextStyle bodyLg = _pretendard(
    fontSize: 15,
    fontWeight: FontWeight.w500,
    height: 1.5,
  );

  /// Body paragraph, card description. Pretendard 14/400/LH 1.6.
  static TextStyle body = _pretendard(
    fontSize: 14,
    fontWeight: FontWeight.w400,
    height: 1.6,
  );

  /// Secondary paragraph, checkbox label. Pretendard 13/500/LH 1.5.
  static TextStyle bodySm = _pretendard(
    fontSize: 13,
    fontWeight: FontWeight.w500,
    height: 1.5,
  );

  /// Time · counts · "오늘" meta text. Pretendard 12/400/LH 1.5.
  static TextStyle meta = _pretendard(
    fontSize: 12,
    fontWeight: FontWeight.w400,
    height: 1.5,
  );

  /// Status badge / pill. Pretendard 10.5/600/LH 1.3.
  static TextStyle tag = _pretendard(
    fontSize: 10.5,
    fontWeight: FontWeight.w600,
    height: 1.3,
  );

  /// Legal fine print, "/60분" qualifiers. Pretendard 10/400/LH 1.3/LS 0.5.
  static TextStyle micro = _pretendard(
    fontSize: 10,
    fontWeight: FontWeight.w400,
    height: 1.3,
    letterSpacing: 0.5,
  );

  // ---------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------

  /// Return [base] with tabular figures enabled. Use when a non-numeric
  /// preset needs to render numerics (e.g., a body row containing a
  /// price) without switching font family.
  static TextStyle tabularNums({required TextStyle base}) {
    final merged = <FontFeature>[
      ...?base.fontFeatures,
      ...kTabularNums,
    ];
    return base.copyWith(fontFeatures: merged);
  }

  /// Baseline line-height for Korean paragraphs. Pair with
  /// `Text(..., softWrap: true)` and `wordSpacing` on callers — Flutter
  /// does not support CSS `word-break: keep-all` directly, so Korean
  /// wrapping relies on generous line-height + balanced layouts
  /// (MOBILE_DESIGN.md §3.4).
  static const TextStyle koreanWrap = TextStyle(height: 1.6);
}
