import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../theme.dart';

/// System UI overlay helpers per MOBILE_DESIGN.md §4.7.
///
/// Usage patterns:
///
/// ```dart
/// // Imperative (e.g. on a route's initState):
/// SystemChrome.setSystemUIOverlayStyle(ZeomStatusBar.light());
///
/// // Declarative (scope to a subtree):
/// ZeomStatusBar.wrap(dark: true, child: const ConsultationScreen());
/// ```
class ZeomStatusBar {
  ZeomStatusBar._();

  /// Overlay for light (hanji) screens — dark icons on transparent
  /// status bar, hanji system nav background with dark nav icons.
  static SystemUiOverlayStyle light() => const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.dark,
        statusBarBrightness: Brightness.light,
        systemNavigationBarColor: AppColors.hanji,
        systemNavigationBarIconBrightness: Brightness.dark,
      );

  /// Overlay for dark rooms (waiting room, consultation room) — light
  /// icons on transparent status bar, inkBlack system nav.
  static SystemUiOverlayStyle dark() => const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.light,
        statusBarBrightness: Brightness.dark,
        systemNavigationBarColor: AppColors.inkBlack,
        systemNavigationBarIconBrightness: Brightness.light,
      );

  /// Declarative helper: wraps [child] in an [AnnotatedRegion] so the
  /// appropriate [SystemUiOverlayStyle] is applied while the subtree is
  /// visible.
  static Widget wrap({
    required Widget child,
    required bool dark,
  }) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: dark ? ZeomStatusBar.dark() : ZeomStatusBar.light(),
      child: child,
    );
  }
}
