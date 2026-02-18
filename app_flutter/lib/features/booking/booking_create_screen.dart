import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/api_client.dart';
import '../../shared/theme.dart';

final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());

enum BookingChannel { VIDEO, VOICE }

class BookingCreateScreen extends ConsumerStatefulWidget {
  final int counselorId;
  final String? initialSlotStart;

  const BookingCreateScreen({
    super.key,
    required this.counselorId,
    this.initialSlotStart,
  });

  @override
  ConsumerState<BookingCreateScreen> createState() => _BookingCreateScreenState();
}

class _BookingCreateScreenState extends ConsumerState<BookingCreateScreen> {
  DateTime? selectedDate;
  TimeOfDay? selectedTime;
  BookingChannel selectedChannel = BookingChannel.VIDEO;
  bool isLoading = false;

  @override
  void initState() {
    super.initState();
    if (widget.initialSlotStart != null) {
      final dateTime = DateTime.parse(widget.initialSlotStart!);
      selectedDate = dateTime;
      selectedTime = TimeOfDay.fromDateTime(dateTime);
    }
  }

  Future<void> _selectDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: selectedDate ?? DateTime.now().add(const Duration(days: 1)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 30)),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.light(
              primary: AppColors.inkBlack,
              onPrimary: AppColors.hanji,
              surface: Colors.white,
              onSurface: AppColors.inkBlack,
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() {
        selectedDate = picked;
      });
    }
  }

  Future<void> _selectTime() async {
    final picked = await showTimePicker(
      context: context,
      initialTime: selectedTime ?? const TimeOfDay(hour: 10, minute: 0),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.light(
              primary: AppColors.inkBlack,
              onPrimary: AppColors.hanji,
              surface: Colors.white,
              onSurface: AppColors.inkBlack,
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() {
        selectedTime = picked;
      });
    }
  }

  Future<void> _createBooking() async {
    if (selectedDate == null || selectedTime == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('날짜와 시간을 선택해주세요')),
      );
      return;
    }

    setState(() {
      isLoading = true;
    });

    try {
      final slotDateTime = DateTime(
        selectedDate!.year,
        selectedDate!.month,
        selectedDate!.day,
        selectedTime!.hour,
        selectedTime!.minute,
      );

      final apiClient = ref.read(apiClientProvider);
      await apiClient.createBooking(
        counselorId: widget.counselorId,
        slotStart: slotDateTime.toIso8601String(),
        channel: selectedChannel.name,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('예약이 완료되었습니다')),
        );
        context.go('/bookings');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('예약 실패: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('예약하기'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Date selection
            Text(
              '날짜 선택',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 12),
            Card(
              child: ListTile(
                leading: const Icon(Icons.calendar_today, color: AppColors.gold),
                title: Text(
                  selectedDate != null
                      ? '${selectedDate!.year}년 ${selectedDate!.month}월 ${selectedDate!.day}일'
                      : '날짜를 선택하세요',
                ),
                trailing: const Icon(Icons.chevron_right),
                onTap: _selectDate,
              ),
            ),

            const SizedBox(height: 24),

            // Time selection
            Text(
              '시간 선택',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 12),
            Card(
              child: ListTile(
                leading: const Icon(Icons.access_time, color: AppColors.gold),
                title: Text(
                  selectedTime != null
                      ? '${selectedTime!.hour}:${selectedTime!.minute.toString().padLeft(2, '0')}'
                      : '시간을 선택하세요',
                ),
                trailing: const Icon(Icons.chevron_right),
                onTap: _selectTime,
              ),
            ),

            const SizedBox(height: 24),

            // Channel selection
            Text(
              '상담 방식',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _ChannelCard(
                    icon: Icons.videocam,
                    label: '영상 통화',
                    isSelected: selectedChannel == BookingChannel.VIDEO,
                    onTap: () {
                      setState(() {
                        selectedChannel = BookingChannel.VIDEO;
                      });
                    },
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _ChannelCard(
                    icon: Icons.phone,
                    label: '음성 통화',
                    isSelected: selectedChannel == BookingChannel.VOICE,
                    onTap: () {
                      setState(() {
                        selectedChannel = BookingChannel.VOICE;
                      });
                    },
                  ),
                ),
              ],
            ),

            const SizedBox(height: 32),

            // Price info
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.lotusPink.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppColors.lotusPink),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '상담 요금',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  Text(
                    '30,000원',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          color: AppColors.darkRed,
                        ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Confirm button
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: isLoading ? null : _createBooking,
                child: isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : const Text('예약 확정'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ChannelCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _ChannelCard({
    required this.icon,
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      color: isSelected ? AppColors.inkBlack : Colors.white,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 20),
          child: Column(
            children: [
              Icon(
                icon,
                size: 40,
                color: isSelected ? AppColors.hanji : AppColors.inkBlack,
              ),
              const SizedBox(height: 8),
              Text(
                label,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: isSelected ? AppColors.hanji : AppColors.inkBlack,
                    ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
