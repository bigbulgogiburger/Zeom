import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'bookings_provider.dart';

/// Snapshot of the currently active consultation session, shared across
/// waiting room and consultation room screens.
@immutable
class ActiveSession {
  final Booking booking;
  final DateTime startedAt;
  final int elapsedSeconds;

  const ActiveSession({
    required this.booking,
    required this.startedAt,
    required this.elapsedSeconds,
  });

  ActiveSession copyWith({
    Booking? booking,
    DateTime? startedAt,
    int? elapsedSeconds,
  }) {
    return ActiveSession(
      booking: booking ?? this.booking,
      startedAt: startedAt ?? this.startedAt,
      elapsedSeconds: elapsedSeconds ?? this.elapsedSeconds,
    );
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is ActiveSession &&
        other.booking == booking &&
        other.startedAt == startedAt &&
        other.elapsedSeconds == elapsedSeconds;
  }

  @override
  int get hashCode => Object.hash(booking, startedAt, elapsedSeconds);

  @override
  String toString() =>
      'ActiveSession(bookingId: ${booking.id}, startedAt: $startedAt, '
      'elapsedSeconds: $elapsedSeconds)';
}

/// Notifier holding the single active session (nullable).
///
/// The [tick] method is intended to be driven by an external
/// `Timer.periodic(Duration(seconds: 1), ...)` owned by the consultation room
/// screen — we keep the timer out of the provider so the UI screen can own the
/// lifecycle (start on enter, cancel on leave).
class ActiveSessionNotifier extends StateNotifier<ActiveSession?> {
  ActiveSessionNotifier() : super(null);

  /// Starts a session for [b] at `DateTime.now()`.
  void set(Booking b) {
    state = ActiveSession(
      booking: b,
      startedAt: DateTime.now(),
      elapsedSeconds: 0,
    );
  }

  /// Increments `elapsedSeconds` by 1. No-op when no session is active.
  void tick() {
    final current = state;
    if (current == null) return;
    state = current.copyWith(elapsedSeconds: current.elapsedSeconds + 1);
  }

  /// Clears the active session.
  void clear() {
    state = null;
  }
}

/// Active session provider — nullable until [ActiveSessionNotifier.set] is called.
final activeSessionProvider =
    StateNotifierProvider<ActiveSessionNotifier, ActiveSession?>(
  (ref) => ActiveSessionNotifier(),
);
