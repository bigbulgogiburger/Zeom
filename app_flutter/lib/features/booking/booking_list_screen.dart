import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/api_client.dart';
import '../../shared/theme.dart';

const _cancelReasons = [
  {'value': 'SCHEDULE_CHANGE', 'label': '일정 변경'},
  {'value': 'PERSONAL', 'label': '개인 사정'},
  {'value': 'OTHER_COUNSELOR', 'label': '다른 상담사 선호'},
  {'value': 'OTHER', 'label': '기타'},
];

const _maxPaymentRetries = 3;
const _entryBeforeMs = 5 * 60 * 1000;
const _entryAfterMs = 10 * 60 * 1000;

/// Parse ISO datetime string from backend (UTC) into a proper UTC DateTime.
DateTime _parseUtc(String s) =>
    DateTime.parse(s.endsWith('Z') ? s : '${s}Z');

/// Groups consecutive 30-min slots into merged time ranges.
List<Map<String, String>> _groupConsecutiveSlots(
    List<Map<String, dynamic>> slots) {
  if (slots.isEmpty) return [];
  final sorted = List<Map<String, dynamic>>.from(slots)
    ..sort((a, b) => _parseUtc(a['startAt'] as String)
        .compareTo(_parseUtc(b['startAt'] as String)));

  final ranges = <Map<String, String>>[];
  var rangeStart = sorted[0]['startAt'] as String;
  var rangeEnd = sorted[0]['endAt'] as String;

  for (var i = 1; i < sorted.length; i++) {
    final slotStart = _parseUtc(sorted[i]['startAt'] as String);
    final prevEnd = _parseUtc(rangeEnd);
    if (!slotStart.isAfter(prevEnd)) {
      rangeEnd = sorted[i]['endAt'] as String;
    } else {
      ranges.add({'startAt': rangeStart, 'endAt': rangeEnd});
      rangeStart = sorted[i]['startAt'] as String;
      rangeEnd = sorted[i]['endAt'] as String;
    }
  }
  ranges.add({'startAt': rangeStart, 'endAt': rangeEnd});
  return ranges;
}

/// Returns cancel policy info based on how far the earliest slot is.
({int refundRate, String message})? _getCancelPolicyInfo(
    List<Map<String, dynamic>> slots) {
  if (slots.isEmpty) return null;
  final sorted = List<Map<String, dynamic>>.from(slots)
    ..sort((a, b) => _parseUtc(a['startAt'] as String)
        .compareTo(_parseUtc(b['startAt'] as String)));

  final earliestStart =
      _parseUtc(sorted.first['startAt'] as String).millisecondsSinceEpoch;
  final now = DateTime.now().millisecondsSinceEpoch;
  final hoursUntilStart = (earliestStart - now) / (1000 * 60 * 60);

  if (hoursUntilStart < 1) {
    return (refundRate: 0, message: '1시간 이내 취소: 취소 불가');
  } else if (hoursUntilStart >= 24) {
    return (refundRate: 100, message: '24시간 이전 취소: 전액 환불');
  } else {
    return (refundRate: 50, message: '1~24시간 전 취소: 50% 환불');
  }
}

/// Whether a booking can be rescheduled (>24h before earliest slot).
bool _canReschedule(List<Map<String, dynamic>> slots) {
  if (slots.isEmpty) return false;
  final sorted = List<Map<String, dynamic>>.from(slots)
    ..sort((a, b) => _parseUtc(a['startAt'] as String)
        .compareTo(_parseUtc(b['startAt'] as String)));
  final earliestStart =
      _parseUtc(sorted.first['startAt'] as String).millisecondsSinceEpoch;
  final now = DateTime.now().millisecondsSinceEpoch;
  final hoursUntilStart = (earliestStart - now) / (1000 * 60 * 60);
  return hoursUntilStart >= 24;
}

class BookingListScreen extends ConsumerStatefulWidget {
  const BookingListScreen({super.key});

  @override
  ConsumerState<BookingListScreen> createState() => _BookingListScreenState();
}

class _BookingListScreenState extends ConsumerState<BookingListScreen> {
  List<Map<String, dynamic>> _bookings = [];
  bool _isLoading = true;
  bool _loadError = false;
  String? _message;
  int? _enteringId;
  int? _retryingId;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _loadBookings();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _loadBookings() async {
    setState(() {
      _isLoading = true;
      _loadError = false;
    });

    try {
      final apiClient = ref.read(apiClientProvider);
      final response = await apiClient.getMyBookings();
      final data = response.data as List;
      setState(() {
        _bookings = data.cast<Map<String, dynamic>>();
        _isLoading = false;
        _message = null;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _loadError = true;
        _message = '예약 목록을 불러오지 못했습니다.';
      });
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'BOOKED':
        return AppColors.gold;
      case 'PAID':
        return AppColors.success;
      case 'PAYMENT_FAILED':
        return AppColors.darkRed;
      case 'CANCELED':
      case 'CANCELLED':
        return AppColors.textSecondary;
      case 'COMPLETED':
        return AppColors.inkBlack;
      default:
        return AppColors.textSecondary;
    }
  }

  String _getStatusText(String status) {
    switch (status) {
      case 'BOOKED':
        return '예약됨';
      case 'PAID':
        return '결제완료';
      case 'PAYMENT_FAILED':
        return '결제실패';
      case 'CANCELED':
      case 'CANCELLED':
        return '취소됨';
      case 'COMPLETED':
        return '완료';
      default:
        return status;
    }
  }

  String _formatDate(String isoString) {
    final dt = _parseUtc(isoString).toLocal();
    const weekdays = ['월', '화', '수', '목', '금', '토', '일'];
    return '${dt.year}년 ${dt.month}월 ${dt.day}일 (${weekdays[dt.weekday - 1]})';
  }

  String _formatTime(String isoString) {
    final dt = _parseUtc(isoString).toLocal();
    return '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
  }

  List<Map<String, dynamic>> _normalizeSlots(Map<String, dynamic> booking) {
    final slots = booking['slots'] as List<dynamic>?;
    if (slots != null && slots.isNotEmpty) {
      return slots.cast<Map<String, dynamic>>();
    }
    final startAt = booking['startAt'];
    final endAt = booking['endAt'];
    if (startAt != null && endAt != null) {
      return [
        {
          'slotId': booking['slotId'] ?? 0,
          'startAt': startAt,
          'endAt': endAt,
        }
      ];
    }
    return [];
  }

  ({String phase, int minutesUntilEntry}) _getEntryState(
      List<Map<String, dynamic>> slots) {
    if (slots.isEmpty) return (phase: 'ended', minutesUntilEntry: 0);

    final sorted = List<Map<String, dynamic>>.from(slots)
      ..sort((a, b) => _parseUtc(a['startAt'] as String)
          .compareTo(_parseUtc(b['startAt'] as String)));

    final earliestStart =
        _parseUtc(sorted.first['startAt'] as String).millisecondsSinceEpoch;
    final latestEnd =
        _parseUtc(sorted.last['endAt'] as String).millisecondsSinceEpoch;
    final now = DateTime.now().millisecondsSinceEpoch;

    final entryOpenTime = earliestStart - _entryBeforeMs;
    final entryCloseTime = latestEnd + _entryAfterMs;

    if (now < entryOpenTime) {
      final minutesLeft = ((entryOpenTime - now) / 60000).ceil();
      return (phase: 'too_early', minutesUntilEntry: minutesLeft);
    }
    if (now >= entryOpenTime && now < earliestStart) {
      return (phase: 'entry_available', minutesUntilEntry: 0);
    }
    if (now >= earliestStart && now <= entryCloseTime) {
      return (phase: 'in_session', minutesUntilEntry: 0);
    }
    return (phase: 'ended', minutesUntilEntry: 0);
  }

  Future<void> _cancelBooking(int bookingId, String? reason) async {
    try {
      final apiClient = ref.read(apiClientProvider);
      await apiClient.cancelBooking(bookingId, reason: reason);
      setState(() {
        _message = '예약이 취소되었습니다.';
      });
      await _loadBookings();
    } on DioException catch (e) {
      String errorMsg = '취소 실패';
      final data = e.response?.data;
      if (data is Map<String, dynamic> && data['message'] != null) {
        errorMsg = data['message'] as String;
      }
      setState(() {
        _message = errorMsg;
      });
    } catch (_) {
      setState(() {
        _message = '취소 중 오류가 발생했습니다.';
      });
    }
  }

  Future<void> _retryPayment(int bookingId) async {
    setState(() {
      _retryingId = bookingId;
      _message = null;
    });

    try {
      final apiClient = ref.read(apiClientProvider);
      await apiClient.retryPayment(bookingId);
      setState(() {
        _message = '결제를 다시 시도할 수 있습니다.';
      });
      await _loadBookings();
    } catch (e) {
      setState(() {
        _message = '결제 재시도에 실패했습니다.';
      });
    } finally {
      setState(() {
        _retryingId = null;
      });
    }
  }

  Future<void> _enterSession(int bookingId) async {
    setState(() {
      _enteringId = bookingId;
    });

    try {
      final apiClient = ref.read(apiClientProvider);
      await apiClient.startSession(bookingId);
      if (mounted) {
        context.push('/consultation/$bookingId');
      }
    } catch (e) {
      setState(() {
        _message = '입장 중 오류가 발생했습니다.';
      });
    } finally {
      setState(() {
        _enteringId = null;
      });
    }
  }

  void _showCancelDialog(int bookingId, List<Map<String, dynamic>> slots) {
    String? selectedReason;
    final otherTextController = TextEditingController();
    final cancelPolicy = _getCancelPolicyInfo(slots);

    showDialog(
      context: context,
      builder: (dialogContext) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              backgroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16)),
              title: Text(
                '예약 취소',
                style: GoogleFonts.notoSerif(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppColors.inkBlack,
                ),
              ),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '취소 사유를 선택해주세요.',
                      style: GoogleFonts.notoSans(
                          fontSize: 14, color: AppColors.textSecondary),
                    ),

                    // Cancel policy info
                    if (cancelPolicy != null) ...[
                      const SizedBox(height: 12),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 12),
                        decoration: BoxDecoration(
                          color: cancelPolicy.refundRate == 100
                              ? AppColors.success.withOpacity(0.1)
                              : cancelPolicy.refundRate == 50
                                  ? AppColors.gold.withOpacity(0.1)
                                  : AppColors.darkRed.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: cancelPolicy.refundRate == 100
                                ? AppColors.success.withOpacity(0.3)
                                : cancelPolicy.refundRate == 50
                                    ? AppColors.gold.withOpacity(0.3)
                                    : AppColors.darkRed.withOpacity(0.3),
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              cancelPolicy.message,
                              style: GoogleFonts.notoSerif(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                color: cancelPolicy.refundRate == 100
                                    ? AppColors.success
                                    : cancelPolicy.refundRate == 50
                                        ? AppColors.gold
                                        : AppColors.darkRed,
                              ),
                            ),
                            if (cancelPolicy.refundRate < 100) ...[
                              const SizedBox(height: 4),
                              Text(
                                cancelPolicy.refundRate == 0
                                    ? '이 시간대에는 취소 시 환불이 불가합니다.'
                                    : '환불 금액의 50%만 돌려받으실 수 있습니다.',
                                style: GoogleFonts.notoSans(
                                  fontSize: 11,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ],

                    const SizedBox(height: 16),
                    ..._cancelReasons.map((reason) {
                      final isSelected = selectedReason == reason['value'];
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: GestureDetector(
                          onTap: () {
                            setDialogState(
                                () => selectedReason = reason['value']);
                          },
                          child: Container(
                            width: double.infinity,
                            padding: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 12),
                            decoration: BoxDecoration(
                              color: isSelected
                                  ? AppColors.gold.withOpacity(0.1)
                                  : Colors.white,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: isSelected
                                    ? AppColors.gold
                                    : AppColors.border,
                                width: isSelected ? 2 : 1,
                              ),
                            ),
                            child: Text(
                              reason['label']!,
                              style: GoogleFonts.notoSans(
                                fontSize: 14,
                                fontWeight: isSelected
                                    ? FontWeight.w600
                                    : FontWeight.normal,
                                color: isSelected
                                    ? AppColors.gold
                                    : AppColors.inkBlack,
                              ),
                            ),
                          ),
                        ),
                      );
                    }),
                    if (selectedReason == 'OTHER') ...[
                      const SizedBox(height: 8),
                      TextField(
                        controller: otherTextController,
                        maxLines: 3,
                        decoration: InputDecoration(
                          hintText: '취소 사유를 입력해주세요...',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(dialogContext).pop(),
                  child: Text(
                    '닫기',
                    style: GoogleFonts.notoSans(color: AppColors.textSecondary),
                  ),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.darkRed,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8)),
                  ),
                  onPressed: () {
                    String? reason = selectedReason;
                    if (selectedReason == 'OTHER' &&
                        otherTextController.text.trim().isNotEmpty) {
                      reason = 'OTHER: ${otherTextController.text.trim()}';
                    }
                    Navigator.of(dialogContext).pop();
                    _cancelBooking(bookingId, reason);
                  },
                  child: Text('예약 취소',
                      style: GoogleFonts.notoSans(fontWeight: FontWeight.w600)),
                ),
              ],
            );
          },
        );
      },
    ).then((_) {
      otherTextController.dispose();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.hanji,
      appBar: AppBar(title: const Text('예약 내역')),
      body: Column(
        children: [
          // Message banner
          if (_message != null)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              color: _message!.contains('취소되었습니다') || _message!.contains('다시 시도')
                  ? AppColors.success.withOpacity(0.1)
                  : AppColors.error.withOpacity(0.1),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      _message!,
                      style: GoogleFonts.notoSans(
                        fontSize: 13,
                        color: _message!.contains('취소되었습니다') ||
                                _message!.contains('다시 시도')
                            ? AppColors.success
                            : AppColors.error,
                      ),
                    ),
                  ),
                  GestureDetector(
                    onTap: () => setState(() => _message = null),
                    child: Icon(Icons.close, size: 18, color: AppColors.textSecondary),
                  ),
                ],
              ),
            ),

          // Content
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _loadError
                    ? _buildErrorView()
                    : _bookings.isEmpty
                        ? _buildEmptyView()
                        : _buildBookingList(),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorView() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline,
                size: 48, color: AppColors.error.withOpacity(0.6)),
            const SizedBox(height: 16),
            Text(
              '예약 목록을 불러오지 못했습니다',
              style: GoogleFonts.notoSerif(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: AppColors.inkBlack),
            ),
            const SizedBox(height: 8),
            Text(
              '네트워크 상태를 확인하고 다시 시도해주세요.',
              style:
                  GoogleFonts.notoSans(fontSize: 14, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _loadBookings,
              child: const Text('다시 시도'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyView() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.event_busy,
                size: 64, color: AppColors.textSecondary.withOpacity(0.5)),
            const SizedBox(height: 16),
            Text(
              '예약 내역이 없어요',
              style: GoogleFonts.notoSerif(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: AppColors.inkBlack,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              '아직 예약이 없습니다. 상담사를 둘러보고 예약해보세요.',
              style:
                  GoogleFonts.notoSans(fontSize: 14, color: AppColors.textSecondary),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => context.go('/counselors'),
              child: const Text('상담사 둘러보기'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBookingList() {
    return RefreshIndicator(
      onRefresh: _loadBookings,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _bookings.length,
        itemBuilder: (context, index) {
          return _buildBookingCard(_bookings[index]);
        },
      ),
    );
  }

  Widget _buildBookingCard(Map<String, dynamic> booking) {
    final bookingId = booking['id'] as int;
    final counselorName = booking['counselorName'] as String? ?? '상담사';
    final status = booking['status'] as String? ?? '';
    final cancelReason = booking['cancelReason'] as String?;
    final cancelType = booking['cancelType'] as String?;
    final refundedCredits = booking['refundedCredits'] as int?;
    final paymentRetryCount = booking['paymentRetryCount'] as int? ?? 0;
    final consultationType = booking['consultationType'] as String?;
    final slots = _normalizeSlots(booking);
    final slotCount = slots.length;
    final statusColor = _getStatusColor(status);
    final statusText = _getStatusText(status);

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header: counselor name + status badge
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Row(
                    children: [
                      Text(
                        counselorName,
                        style: GoogleFonts.notoSerif(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: AppColors.inkBlack,
                        ),
                      ),
                      if (slotCount > 1) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.inkBlack.withOpacity(0.05),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            '30분 x ${slotCount}회',
                            style: GoogleFonts.notoSans(
                              fontSize: 11,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: statusColor),
                  ),
                  child: Text(
                    statusText,
                    style: GoogleFonts.notoSans(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: statusColor,
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 12),

            // Time slots (grouped consecutive ranges)
            ..._groupConsecutiveSlots(slots).map((range) {
              final startAt = range['startAt']!;
              final endAt = range['endAt']!;
              return Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Row(
                  children: [
                    Icon(Icons.access_time,
                        size: 14, color: AppColors.textSecondary),
                    const SizedBox(width: 6),
                    Text(
                      '${_formatDate(startAt)} ${_formatTime(startAt)} ~ ${_formatTime(endAt)}',
                      style: GoogleFonts.notoSans(
                          fontSize: 13, color: AppColors.textSecondary),
                    ),
                  ],
                ),
              );
            }),

            // Consultation type
            if (consultationType != null) ...[
              const SizedBox(height: 4),
              Row(
                children: [
                  Icon(
                    consultationType == 'CHAT' ? Icons.chat : Icons.videocam,
                    size: 14,
                    color: AppColors.textSecondary,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    consultationType == 'CHAT' ? '채팅상담' : '화상상담',
                    style: GoogleFonts.notoSans(
                        fontSize: 13, color: AppColors.textSecondary),
                  ),
                ],
              ),
            ],

            // Cancel info
            if ((status == 'CANCELED' || status == 'CANCELLED')) ...[
              const SizedBox(height: 8),
              if (cancelType != null)
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: cancelType == 'FREE_CANCEL'
                            ? AppColors.success.withOpacity(0.1)
                            : AppColors.gold.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        cancelType == 'FREE_CANCEL' ? '전액 환불' : '부분 환불',
                        style: GoogleFonts.notoSans(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: cancelType == 'FREE_CANCEL'
                              ? AppColors.success
                              : AppColors.gold,
                        ),
                      ),
                    ),
                    if (refundedCredits != null && refundedCredits > 0) ...[
                      const SizedBox(width: 6),
                      Text(
                        '환불 $refundedCredits회',
                        style: GoogleFonts.notoSans(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ],
                ),
              if (cancelReason != null) ...[
                const SizedBox(height: 4),
                Text(
                  '취소 사유: $cancelReason',
                  style:
                      GoogleFonts.notoSans(fontSize: 12, color: AppColors.textSecondary),
                ),
              ],
            ],

            // Payment failed section
            if (status == 'PAYMENT_FAILED') ...[
              const SizedBox(height: 12),
              _buildPaymentFailedSection(bookingId, paymentRetryCount),
            ],

            // Action buttons for BOOKED / PAID
            if (status == 'BOOKED' || status == 'PAID') ...[
              const SizedBox(height: 12),
              _buildActionButtons(booking, slots),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildPaymentFailedSection(int bookingId, int retryCount) {
    final exhausted = retryCount >= _maxPaymentRetries;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppColors.darkRed.withOpacity(0.08),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: AppColors.darkRed.withOpacity(0.2)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '결제에 실패했습니다',
                style: GoogleFonts.notoSans(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.darkRed,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                exhausted
                    ? '결제 재시도 횟수를 초과했습니다.'
                    : '재시도 횟수: $retryCount/$_maxPaymentRetries',
                style: GoogleFonts.notoSans(
                    fontSize: 12, color: AppColors.textSecondary),
              ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        SizedBox(
          width: double.infinity,
          child: exhausted
              ? OutlinedButton(
                  onPressed: () {},
                  child: const Text('고객센터 문의'),
                )
              : ElevatedButton(
                  onPressed: _retryingId == bookingId
                      ? null
                      : () => _retryPayment(bookingId),
                  child: _retryingId == bookingId
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor:
                                AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : const Text('다시 시도'),
                ),
        ),
      ],
    );
  }

  Widget _buildActionButtons(
      Map<String, dynamic> booking, List<Map<String, dynamic>> slots) {
    final bookingId = booking['id'] as int;
    final status = booking['status'] as String? ?? '';
    final buttons = <Widget>[];

    // Entry button for PAID status
    if (status == 'PAID') {
      final entryState = _getEntryState(slots);

      switch (entryState.phase) {
        case 'too_early':
          buttons.add(
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: null,
                child: Text('${entryState.minutesUntilEntry}분 후 입장 가능'),
              ),
            ),
          );
          break;
        case 'entry_available':
          buttons.add(
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _enteringId == bookingId
                    ? null
                    : () => _enterSession(bookingId),
                icon: const Icon(Icons.login, size: 18),
                label: Text(
                    _enteringId == bookingId ? '입장 중...' : '입장 가능'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.gold,
                  foregroundColor: AppColors.inkBlack,
                ),
              ),
            ),
          );
          break;
        case 'in_session':
          buttons.add(
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _enteringId == bookingId
                    ? null
                    : () => _enterSession(bookingId),
                icon: const Icon(Icons.login, size: 18),
                label: Text(_enteringId == bookingId
                    ? '입장 중...'
                    : '상담 중 (입장하기)'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.success,
                  foregroundColor: Colors.white,
                ),
              ),
            ),
          );
          break;
        case 'ended':
          buttons.add(
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: null,
                child: const Text('상담 종료'),
              ),
            ),
          );
          break;
      }
    }

    // Reschedule + Cancel row for BOOKED status
    if (status == 'BOOKED') {
      final showReschedule = _canReschedule(slots);
      final counselorId = booking['counselorId'] as int?;

      buttons.add(
        Row(
          children: [
            if (showReschedule && counselorId != null) ...[
              Expanded(
                child: OutlinedButton(
                  onPressed: () => context.push('/counselor/$counselorId'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.gold,
                    side: BorderSide(color: AppColors.gold.withOpacity(0.5)),
                  ),
                  child: const Text('예약 변경'),
                ),
              ),
              const SizedBox(width: 8),
            ],
            Expanded(
              child: ElevatedButton(
                onPressed: () => _showCancelDialog(bookingId, slots),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.darkRed,
                  foregroundColor: Colors.white,
                ),
                child: const Text('예약 취소'),
              ),
            ),
          ],
        ),
      );
    }

    if (buttons.isEmpty) return const SizedBox.shrink();

    return Column(
      children: buttons
          .expand((w) => [w, const SizedBox(height: 8)])
          .toList()
        ..removeLast(),
    );
  }
}
