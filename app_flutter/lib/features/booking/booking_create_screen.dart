import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/api_client.dart';
import '../../shared/theme.dart';

class BookingCreateScreen extends ConsumerStatefulWidget {
  final int counselorId;
  final String? initialSlotStart;
  final List<int>? initialSlotIds;
  final Map<String, dynamic>? counselorData;

  const BookingCreateScreen({
    super.key,
    required this.counselorId,
    this.initialSlotStart,
    this.initialSlotIds,
    this.counselorData,
  });

  @override
  ConsumerState<BookingCreateScreen> createState() =>
      _BookingCreateScreenState();
}

class _BookingCreateScreenState extends ConsumerState<BookingCreateScreen> {
  static const int _maxSlots = 3;

  Map<String, dynamic>? _counselor;
  List<Map<String, dynamic>> _slots = [];
  final Set<int> _selectedSlotIds = {};
  String _consultationType = 'VIDEO';
  bool _isLoadingSlots = true;
  bool _isBooking = false;
  String? _loadError;
  String? _maxWarning;
  bool _showConfirm = false;
  String? _bookingError;
  bool _bookingSuccess = false;
  int? _creditBalance;

  @override
  void initState() {
    super.initState();
    _loadCreditBalance();
    if (widget.counselorData != null) {
      _initFromCounselorData(widget.counselorData!);
    } else {
      _loadCounselorSlots();
    }
  }

  Future<void> _loadCreditBalance() async {
    try {
      final apiClient = ref.read(apiClientProvider);
      final response = await apiClient.getCreditBalance();
      final data = response.data as Map<String, dynamic>;
      if (mounted) {
        setState(() {
          _creditBalance = data['remainingUnits'] as int? ?? 0;
        });
      }
    } catch (_) {
      // Credit balance is informational; don't block booking flow
    }
  }

  void _initFromCounselorData(Map<String, dynamic> data) {
    _counselor = data;
    final rawSlots = data['slots'] as List<dynamic>? ?? [];
    _slots = rawSlots.cast<Map<String, dynamic>>();
    _isLoadingSlots = false;

    // Pre-select slots passed from counselor detail screen
    if (widget.initialSlotIds != null && widget.initialSlotIds!.isNotEmpty) {
      final validIds = widget.initialSlotIds!
          .where((id) => _slots.any((s) => s['id'] == id))
          .toSet();
      _selectedSlotIds.addAll(validIds);
      if (_selectedSlotIds.isNotEmpty) {
        _showConfirm = true;
      }
    }
  }

  Future<void> _loadCounselorSlots() async {
    setState(() {
      _isLoadingSlots = true;
      _loadError = null;
    });

    try {
      final apiClient = ref.read(apiClientProvider);
      final response = await apiClient.getCounselorSlots(widget.counselorId);
      final data = response.data as Map<String, dynamic>;

      setState(() {
        _initFromCounselorData(data);
      });
    } catch (e) {
      setState(() {
        _loadError = '상담사 정보를 불러오지 못했습니다.';
        _isLoadingSlots = false;
      });
    }
  }

  void _toggleSlot(int slotId) {
    setState(() {
      if (_selectedSlotIds.contains(slotId)) {
        _selectedSlotIds.remove(slotId);
        _maxWarning = null;
      } else {
        if (_selectedSlotIds.length >= _maxSlots) {
          _maxWarning = '최대 $_maxSlots개 슬롯까지 선택할 수 있습니다.';
          return;
        }
        _selectedSlotIds.add(slotId);
        _maxWarning = null;
      }
      _showConfirm = false;
      _bookingError = null;
    });
  }

  List<Map<String, dynamic>> get _selectedSlots {
    return _slots.where((s) => _selectedSlotIds.contains(s['id'])).toList();
  }

  Map<String, List<Map<String, dynamic>>> _groupSlotsByDate() {
    final groups = <String, List<Map<String, dynamic>>>{};
    for (final slot in _slots) {
      final startAt = slot['startAt'] as String;
      final dt = DateTime.parse(startAt);
      final dateKey =
          '${dt.year}년 ${dt.month}월 ${dt.day}일 (${_weekdayLabel(dt.weekday)})';
      groups.putIfAbsent(dateKey, () => []).add(slot);
    }
    return groups;
  }

  String _weekdayLabel(int weekday) {
    const labels = ['월', '화', '수', '목', '금', '토', '일'];
    return labels[weekday - 1];
  }

  String _formatTime(String isoString) {
    final dt = DateTime.parse(isoString);
    return '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
  }

  String _formatDate(String isoString) {
    final dt = DateTime.parse(isoString);
    return '${dt.year}년 ${dt.month}월 ${dt.day}일 (${_weekdayLabel(dt.weekday)})';
  }

  Future<void> _createBooking() async {
    if (_selectedSlots.isEmpty) return;

    setState(() {
      _isBooking = true;
      _bookingError = null;
    });

    try {
      final apiClient = ref.read(apiClientProvider);
      await apiClient.createBooking(
        counselorId: widget.counselorId,
        slotIds: _selectedSlotIds.toList(),
        consultationType: _consultationType,
      );

      setState(() {
        _bookingSuccess = true;
        _isBooking = false;
      });

      await Future.delayed(const Duration(seconds: 2));
      if (mounted) {
        context.go('/bookings');
      }
    } on DioException catch (e) {
      String errorMsg = '예약에 실패했습니다.';
      final data = e.response?.data;
      if (data is Map<String, dynamic> && data['message'] != null) {
        errorMsg = data['message'] as String;
      }
      setState(() {
        _bookingError = errorMsg;
        _isBooking = false;
      });
    } catch (_) {
      setState(() {
        _bookingError = '네트워크 오류가 발생했습니다.';
        _isBooking = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_bookingSuccess) {
      return Scaffold(
        backgroundColor: AppColors.hanji,
        appBar: AppBar(title: const Text('예약 완료')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: AppColors.gold.withOpacity(0.15),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.check_circle,
                      color: AppColors.gold, size: 48),
                ),
                const SizedBox(height: 24),
                Text(
                  '예약이 완료되었습니다!',
                  style: GoogleFonts.notoSerif(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: AppColors.inkBlack,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  '내 예약 페이지로 이동합니다...',
                  style: GoogleFonts.notoSans(
                    fontSize: 14,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.hanji,
      appBar: AppBar(title: const Text('예약하기')),
      body: _isLoadingSlots
          ? const Center(child: CircularProgressIndicator())
          : _loadError != null
              ? _buildErrorView()
              : _buildContent(),
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
              _loadError!,
              style: GoogleFonts.notoSans(
                  fontSize: 16, color: AppColors.textSecondary),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _loadCounselorSlots,
              child: const Text('다시 시도'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContent() {
    final slotsByDate = _groupSlotsByDate();
    final counselorName = _counselor?['name'] ?? '상담사';
    final supportedTypes =
        _counselor?['supportedConsultationTypes'] as String? ?? 'VIDEO';

    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Counselor info header
                _buildCounselorHeader(counselorName),
                const SizedBox(height: 24),

                // Consultation type selector
                if (supportedTypes.contains('CHAT'))
                  ...[_buildConsultationTypeSelector(), const SizedBox(height: 24)],

                // Slot selection section
                _buildSlotSection(slotsByDate),

                // Max warning
                if (_maxWarning != null) ...[
                  const SizedBox(height: 12),
                  Container(
                    width: double.infinity,
                    padding:
                        const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    decoration: BoxDecoration(
                      color: AppColors.gold.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppColors.gold.withOpacity(0.3)),
                    ),
                    child: Text(
                      _maxWarning!,
                      style: GoogleFonts.notoSans(
                          fontSize: 13, color: AppColors.gold),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ],

                // Selected slot summary
                if (_selectedSlots.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  _buildSelectedSummary(),
                ],

                // Confirmation dialog
                if (_showConfirm && _selectedSlots.isNotEmpty) ...[
                  const SizedBox(height: 24),
                  _buildConfirmationCard(counselorName),
                ],

                const SizedBox(height: 100), // space for bottom button
              ],
            ),
          ),
        ),

        // Bottom CTA
        if (_selectedSlots.isNotEmpty && !_showConfirm)
          _buildBottomCTA(),
      ],
    );
  }

  Widget _buildCounselorHeader(String counselorName) {
    final specialty = _counselor?['specialty'] as String? ?? '';
    final intro = _counselor?['intro'] as String? ?? '';

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Text(
              counselorName,
              style: GoogleFonts.notoSerif(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: AppColors.inkBlack,
              ),
            ),
            if (specialty.isNotEmpty) ...[
              const SizedBox(height: 8),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.gold.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.gold.withOpacity(0.3)),
                ),
                child: Text(
                  specialty,
                  style: GoogleFonts.notoSans(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.gold,
                  ),
                ),
              ),
            ],
            if (intro.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text(
                intro,
                style: GoogleFonts.notoSans(
                    fontSize: 14, color: AppColors.textSecondary),
                textAlign: TextAlign.center,
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildConsultationTypeSelector() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '상담 유형 선택',
              style: GoogleFonts.notoSerif(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: AppColors.inkBlack,
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _ConsultationTypeChip(
                    label: '화상상담',
                    subtitle: '상담권 1회/슬롯',
                    isSelected: _consultationType == 'VIDEO',
                    selectedColor: AppColors.gold,
                    onTap: () => setState(() => _consultationType = 'VIDEO'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _ConsultationTypeChip(
                    label: '채팅상담',
                    subtitle: '상담권 0.7회/슬롯',
                    isSelected: _consultationType == 'CHAT',
                    selectedColor: const Color(0xFF4A90D9),
                    onTap: () => setState(() => _consultationType = 'CHAT'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSlotSection(Map<String, List<Map<String, dynamic>>> slotsByDate) {
    if (_slots.isEmpty) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            children: [
              Icon(Icons.event_busy,
                  size: 48, color: AppColors.textSecondary.withOpacity(0.5)),
              const SizedBox(height: 16),
              Text(
                '현재 가능한 슬롯이 없어요',
                style: GoogleFonts.notoSerif(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: AppColors.inkBlack),
              ),
              const SizedBox(height: 8),
              Text(
                '다른 상담사 또는 시간대를 확인해주세요.',
                style: GoogleFonts.notoSans(
                    fontSize: 14, color: AppColors.textSecondary),
              ),
            ],
          ),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '예약 가능 슬롯',
          style: GoogleFonts.notoSerif(
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: AppColors.inkBlack,
          ),
        ),
        const SizedBox(height: 16),
        ...slotsByDate.entries.map((entry) => _buildDateGroup(entry.key, entry.value)),
      ],
    );
  }

  Widget _buildDateGroup(String dateLabel, List<Map<String, dynamic>> slots) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            dateLabel,
            style: GoogleFonts.notoSerif(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: AppColors.inkBlack,
            ),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: slots.map((slot) {
              final slotId = slot['id'] as int;
              final isSelected = _selectedSlotIds.contains(slotId);
              final startTime = _formatTime(slot['startAt'] as String);
              final endTime = _formatTime(slot['endAt'] as String);

              return GestureDetector(
                onTap: () => _toggleSlot(slotId),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? AppColors.inkBlack
                        : Colors.white,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: isSelected
                          ? AppColors.inkBlack
                          : AppColors.border,
                      width: isSelected ? 2 : 1,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (isSelected) ...[
                        Icon(Icons.check,
                            size: 16,
                            color: AppColors.hanji),
                        const SizedBox(width: 4),
                      ],
                      Text(
                        '$startTime ~ $endTime',
                        style: GoogleFonts.notoSans(
                          fontSize: 13,
                          fontWeight:
                              isSelected ? FontWeight.w600 : FontWeight.normal,
                          color: isSelected
                              ? AppColors.hanji
                              : AppColors.inkBlack,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildSelectedSummary() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: AppColors.gold.withOpacity(0.1),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.gold.withOpacity(0.3)),
          ),
          child: Text(
            '${_selectedSlots.length}개 슬롯 선택됨 (${_selectedSlots.length * 30}분)',
            style: GoogleFonts.notoSans(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: AppColors.gold,
            ),
          ),
        ),
        const SizedBox(width: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: AppColors.inkBlack.withOpacity(0.05),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Text(
            '상담권 ${_selectedSlots.length}회 사용',
            style: GoogleFonts.notoSans(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: AppColors.inkBlack,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildConfirmationCard(String counselorName) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Text(
                '예약 확인',
                style: GoogleFonts.notoSerif(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppColors.inkBlack,
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Counselor name
            _confirmRow('상담사', counselorName),
            const SizedBox(height: 12),

            // Consultation type
            _confirmRow(
              '상담 유형',
              _consultationType == 'CHAT' ? '채팅상담' : '화상상담',
            ),
            const SizedBox(height: 12),

            // Selected time slots
            ..._selectedSlots.map((slot) {
              final startAt = slot['startAt'] as String;
              final endAt = slot['endAt'] as String;
              return Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: _confirmRow(
                  '시간',
                  '${_formatDate(startAt)} ${_formatTime(startAt)} ~ ${_formatTime(endAt)}',
                ),
              );
            }),

            const Divider(height: 24),

            _confirmRow('총 소요시간', '${_selectedSlots.length * 30}분'),
            const SizedBox(height: 8),
            _confirmRow('사용 상담권', '${_selectedSlots.length}회'),
            if (_creditBalance != null) ...[
              const SizedBox(height: 8),
              _confirmRow(
                '잔여 상담권',
                '${_creditBalance! - _selectedSlots.length}회',
              ),
              if (_creditBalance! < _selectedSlots.length) ...[
                const SizedBox(height: 12),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.darkRed.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                    border:
                        Border.all(color: AppColors.darkRed.withOpacity(0.3)),
                  ),
                  child: Text(
                    '상담권이 부족합니다 (보유: $_creditBalance회 / 필요: ${_selectedSlots.length}회)',
                    style: GoogleFonts.notoSans(
                        fontSize: 13, color: AppColors.darkRed),
                    textAlign: TextAlign.center,
                  ),
                ),
              ],
            ],

            // Booking error
            if (_bookingError != null) ...[
              const SizedBox(height: 16),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.error.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppColors.error.withOpacity(0.3)),
                ),
                child: Text(
                  _bookingError!,
                  style: GoogleFonts.notoSans(
                      fontSize: 13, color: AppColors.error),
                ),
              ),
            ],

            const SizedBox(height: 20),

            // Action buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: _isBooking
                        ? null
                        : () => setState(() {
                              _showConfirm = false;
                              _bookingError = null;
                            }),
                    child: const Text('취소'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _isBooking ||
                            (_creditBalance != null &&
                                _creditBalance! < _selectedSlots.length)
                        ? null
                        : _createBooking,
                    child: _isBooking
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor:
                                  AlwaysStoppedAnimation<Color>(Colors.white),
                            ),
                          )
                        : const Text('예약 확정'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _confirmRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.notoSans(
              fontSize: 14, color: AppColors.textSecondary),
        ),
        Flexible(
          child: Text(
            value,
            style: GoogleFonts.notoSans(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: AppColors.inkBlack,
            ),
            textAlign: TextAlign.end,
          ),
        ),
      ],
    );
  }

  Widget _buildBottomCTA() {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 8,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SizedBox(
        width: double.infinity,
        height: 48,
        child: ElevatedButton(
          onPressed: () => setState(() {
            _showConfirm = true;
            _bookingError = null;
          }),
          child:
              Text('예약하기 (${_selectedSlots.length}개 슬롯)'),
        ),
      ),
    );
  }
}

class _ConsultationTypeChip extends StatelessWidget {
  final String label;
  final String subtitle;
  final bool isSelected;
  final Color selectedColor;
  final VoidCallback onTap;

  const _ConsultationTypeChip({
    required this.label,
    required this.subtitle,
    required this.isSelected,
    required this.selectedColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
        decoration: BoxDecoration(
          color: isSelected
              ? selectedColor.withOpacity(0.1)
              : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? selectedColor : AppColors.border,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Column(
          children: [
            Text(
              label,
              style: GoogleFonts.notoSans(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: isSelected ? selectedColor : AppColors.inkBlack,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              subtitle,
              style: GoogleFonts.notoSans(
                fontSize: 11,
                color: isSelected
                    ? selectedColor.withOpacity(0.7)
                    : AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
