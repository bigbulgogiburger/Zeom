import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Channel through which a consultation is delivered.
enum BookingChannel { video, voice }

/// Lifecycle status of a booking.
enum BookingStatus { upcoming, completed, canceled }

/// Immutable booking record.
@immutable
class Booking {
  final String id;
  final String counselorId;
  final String counselorName;
  final String counselorInitials;
  final DateTime when;
  final int durationMinutes;
  final BookingChannel channel;
  final int priceCash;
  final BookingStatus status;
  final bool hasReview;

  const Booking({
    required this.id,
    required this.counselorId,
    required this.counselorName,
    required this.counselorInitials,
    required this.when,
    required this.durationMinutes,
    required this.channel,
    required this.priceCash,
    required this.status,
    required this.hasReview,
  });

  Booking copyWith({
    String? id,
    String? counselorId,
    String? counselorName,
    String? counselorInitials,
    DateTime? when,
    int? durationMinutes,
    BookingChannel? channel,
    int? priceCash,
    BookingStatus? status,
    bool? hasReview,
  }) {
    return Booking(
      id: id ?? this.id,
      counselorId: counselorId ?? this.counselorId,
      counselorName: counselorName ?? this.counselorName,
      counselorInitials: counselorInitials ?? this.counselorInitials,
      when: when ?? this.when,
      durationMinutes: durationMinutes ?? this.durationMinutes,
      channel: channel ?? this.channel,
      priceCash: priceCash ?? this.priceCash,
      status: status ?? this.status,
      hasReview: hasReview ?? this.hasReview,
    );
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Booking &&
        other.id == id &&
        other.counselorId == counselorId &&
        other.counselorName == counselorName &&
        other.counselorInitials == counselorInitials &&
        other.when == when &&
        other.durationMinutes == durationMinutes &&
        other.channel == channel &&
        other.priceCash == priceCash &&
        other.status == status &&
        other.hasReview == hasReview;
  }

  @override
  int get hashCode => Object.hash(
        id,
        counselorId,
        counselorName,
        counselorInitials,
        when,
        durationMinutes,
        channel,
        priceCash,
        status,
        hasReview,
      );

  @override
  String toString() {
    return 'Booking(id: $id, counselor: $counselorName, when: $when, '
        'channel: $channel, status: $status, hasReview: $hasReview)';
  }
}

/// Notifier managing the full list of bookings for the signed-in user.
/// Seeds with two demo entries (one upcoming, one completed) for dev mode.
class BookingsNotifier extends StateNotifier<List<Booking>> {
  BookingsNotifier() : super(_seed());

  static List<Booking> _seed() {
    final now = DateTime.now();
    return <Booking>[
      Booking(
        id: 'demo1',
        counselorId: 'c1',
        counselorName: '지혜 상담사',
        counselorInitials: '지',
        when: now.add(const Duration(hours: 2)),
        durationMinutes: 60,
        channel: BookingChannel.video,
        priceCash: 60000,
        status: BookingStatus.upcoming,
        hasReview: false,
      ),
      Booking(
        id: 'demo2',
        counselorId: 'c2',
        counselorName: '현우 상담사',
        counselorInitials: '현',
        when: now.subtract(const Duration(days: 2)),
        durationMinutes: 60,
        channel: BookingChannel.voice,
        priceCash: 60000,
        status: BookingStatus.completed,
        hasReview: false,
      ),
    ];
  }

  /// Appends a new booking.
  void add(Booking b) {
    state = <Booking>[...state, b];
  }

  /// Marks the booking with [id] as [BookingStatus.canceled].
  void cancel(String id) {
    state = <Booking>[
      for (final b in state)
        if (b.id == id) b.copyWith(status: BookingStatus.canceled) else b,
    ];
  }

  /// Marks the booking with [id] as [BookingStatus.completed].
  void markCompleted(String id) {
    state = <Booking>[
      for (final b in state)
        if (b.id == id) b.copyWith(status: BookingStatus.completed) else b,
    ];
  }

  /// Flips `hasReview` to true for the booking with [id].
  void markReviewed(String id) {
    state = <Booking>[
      for (final b in state)
        if (b.id == id) b.copyWith(hasReview: true) else b,
    ];
  }

  /// Upcoming bookings: status == upcoming AND `when` is in the future.
  List<Booking> get upcoming {
    final now = DateTime.now();
    return state
        .where((b) => b.status == BookingStatus.upcoming && b.when.isAfter(now))
        .toList(growable: false);
  }

  /// Completed bookings.
  List<Booking> get completed => state
      .where((b) => b.status == BookingStatus.completed)
      .toList(growable: false);
}

/// Main bookings provider: the full list.
final bookingsProvider =
    StateNotifierProvider<BookingsNotifier, List<Booking>>(
  (ref) => BookingsNotifier(),
);

/// Derived provider: upcoming bookings (status == upcoming && future `when`).
final bookingsUpcomingProvider = Provider<List<Booking>>((ref) {
  final all = ref.watch(bookingsProvider);
  final now = DateTime.now();
  return all
      .where((b) => b.status == BookingStatus.upcoming && b.when.isAfter(now))
      .toList(growable: false);
});

/// Derived provider: completed bookings.
final bookingsCompletedProvider = Provider<List<Booking>>((ref) {
  final all = ref.watch(bookingsProvider);
  return all
      .where((b) => b.status == BookingStatus.completed)
      .toList(growable: false);
});
