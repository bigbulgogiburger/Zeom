import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'bookings_provider.dart';

/// Transient booking draft shared between the booking flow and the confirm
/// screen. Plain immutable value — no business logic lives here.
@immutable
class PendingBooking {
  final String counselorId;
  final String counselorName;
  final String counselorInitials;
  final DateTime when;
  final int durationMinutes;
  final BookingChannel channel;
  final int priceCash;

  const PendingBooking({
    required this.counselorId,
    required this.counselorName,
    required this.counselorInitials,
    required this.when,
    required this.durationMinutes,
    required this.channel,
    required this.priceCash,
  });

  PendingBooking copyWith({
    String? counselorId,
    String? counselorName,
    String? counselorInitials,
    DateTime? when,
    int? durationMinutes,
    BookingChannel? channel,
    int? priceCash,
  }) {
    return PendingBooking(
      counselorId: counselorId ?? this.counselorId,
      counselorName: counselorName ?? this.counselorName,
      counselorInitials: counselorInitials ?? this.counselorInitials,
      when: when ?? this.when,
      durationMinutes: durationMinutes ?? this.durationMinutes,
      channel: channel ?? this.channel,
      priceCash: priceCash ?? this.priceCash,
    );
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is PendingBooking &&
        other.counselorId == counselorId &&
        other.counselorName == counselorName &&
        other.counselorInitials == counselorInitials &&
        other.when == when &&
        other.durationMinutes == durationMinutes &&
        other.channel == channel &&
        other.priceCash == priceCash;
  }

  @override
  int get hashCode => Object.hash(
        counselorId,
        counselorName,
        counselorInitials,
        when,
        durationMinutes,
        channel,
        priceCash,
      );

  @override
  String toString() =>
      'PendingBooking(counselor: $counselorName, when: $when, '
      'channel: $channel, priceCash: $priceCash)';
}

/// Lightweight transient state for the confirm screen.
/// Null until the booking flow populates it; cleared after confirm/cancel.
final pendingBookingProvider = StateProvider<PendingBooking?>((ref) => null);
