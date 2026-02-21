import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/api_client.dart';
import '../../shared/theme.dart';

class DisputeDetailScreen extends ConsumerStatefulWidget {
  final int disputeId;

  const DisputeDetailScreen({super.key, required this.disputeId});

  @override
  ConsumerState<DisputeDetailScreen> createState() =>
      _DisputeDetailScreenState();
}

class _DisputeDetailScreenState extends ConsumerState<DisputeDetailScreen> {
  Map<String, dynamic>? _dispute;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadDispute();
  }

  Future<void> _loadDispute() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final apiClient = ref.read(apiClientProvider);
      final response = await apiClient.getDisputeDetail(widget.disputeId);
      setState(() {
        _dispute = response.data as Map<String, dynamic>;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = '분쟁 상세 정보를 불러올 수 없습니다';
        _isLoading = false;
      });
    }
  }

  String _getStatusLabel(String status) {
    switch (status) {
      case 'OPEN':
        return '접수됨';
      case 'IN_REVIEW':
        return '검토중';
      case 'RESOLVED':
        return '해결됨';
      case 'CLOSED':
        return '종료';
      default:
        return status;
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'OPEN':
        return AppColors.gold;
      case 'IN_REVIEW':
        return const Color(0xFF1565C0);
      case 'RESOLVED':
        return AppColors.success;
      case 'CLOSED':
        return AppColors.textSecondary;
      default:
        return AppColors.textSecondary;
    }
  }

  String _getCategoryLabel(String category) {
    switch (category) {
      case 'SERVICE_QUALITY':
        return '서비스 품질';
      case 'BILLING':
        return '결제 문제';
      case 'TECHNICAL':
        return '기술 문제';
      case 'COUNSELOR_BEHAVIOR':
        return '상담사 행동';
      case 'OTHER':
        return '기타';
      default:
        return category;
    }
  }

  String _getResolutionTypeLabel(String type) {
    switch (type) {
      case 'REFUND':
        return '환불 처리';
      case 'CREDIT':
        return '크레딧 보상';
      case 'WARNING':
        return '경고 조치';
      case 'DISMISS':
        return '기각';
      default:
        return type;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('분쟁 상세'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(_error!),
                      const SizedBox(height: 8),
                      ElevatedButton(
                        onPressed: _loadDispute,
                        child: const Text('다시 시도'),
                      ),
                    ],
                  ),
                )
              : _buildContent(),
    );
  }

  Widget _buildContent() {
    if (_dispute == null) return const SizedBox.shrink();

    final status = (_dispute!['status'] ?? '') as String;
    final category = (_dispute!['category'] ?? '') as String;
    final description = (_dispute!['description'] ?? '') as String;
    final resolution = _dispute!['resolution']?.toString();
    final resolutionType = _dispute!['resolutionType']?.toString();
    final resolutionNote = _dispute!['resolutionNote']?.toString();
    final resolvedAt = _dispute!['resolvedAt']?.toString();
    final createdAt = _dispute!['createdAt']?.toString();

    String createdStr = '';
    if (createdAt != null) {
      try {
        final dt = DateTime.parse(createdAt);
        createdStr =
            '${dt.year}.${dt.month.toString().padLeft(2, '0')}.${dt.day.toString().padLeft(2, '0')} '
            '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
      } catch (_) {
        createdStr = createdAt;
      }
    }

    return RefreshIndicator(
      onRefresh: _loadDispute,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status and category header
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: _getStatusColor(status).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    _getStatusLabel(status),
                    style: GoogleFonts.notoSans(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: _getStatusColor(status),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.border.withOpacity(0.3),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    _getCategoryLabel(category),
                    style: GoogleFonts.notoSans(
                      fontSize: 14,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Meta info
            _buildInfoRow('예약 번호', '#${_dispute!['reservationId']}'),
            _buildInfoRow('접수일', createdStr),
            const SizedBox(height: 20),

            // Description
            Text(
              '분쟁 내용',
              style: GoogleFonts.notoSerif(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppColors.border),
              ),
              child: Text(
                description,
                style: GoogleFonts.notoSans(
                  fontSize: 14,
                  height: 1.6,
                ),
              ),
            ),

            // Resolution section (if resolved)
            if (status == 'RESOLVED' || status == 'CLOSED') ...[
              const SizedBox(height: 24),
              Text(
                '처리 결과',
                style: GoogleFonts.notoSerif(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.success.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: AppColors.success.withOpacity(0.3),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (resolutionType != null) ...[
                      Row(
                        children: [
                          const Icon(Icons.check_circle,
                              size: 18, color: AppColors.success),
                          const SizedBox(width: 6),
                          Text(
                            _getResolutionTypeLabel(resolutionType),
                            style: GoogleFonts.notoSans(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: AppColors.success,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                    ],
                    if (resolution != null)
                      Text(
                        resolution,
                        style: GoogleFonts.notoSans(
                          fontSize: 14,
                          height: 1.6,
                        ),
                      ),
                    if (resolutionNote != null) ...[
                      const SizedBox(height: 8),
                      Text(
                        resolutionNote,
                        style: GoogleFonts.notoSans(
                          fontSize: 13,
                          color: AppColors.textSecondary,
                          height: 1.5,
                        ),
                      ),
                    ],
                    if (resolvedAt != null) ...[
                      const SizedBox(height: 8),
                      Text(
                        '처리일: ${_formatDate(resolvedAt)}',
                        style: GoogleFonts.notoSans(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          SizedBox(
            width: 80,
            child: Text(
              label,
              style: GoogleFonts.notoSans(
                fontSize: 13,
                color: AppColors.textSecondary,
              ),
            ),
          ),
          Text(
            value,
            style: GoogleFonts.notoSans(
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(String dateStr) {
    try {
      final dt = DateTime.parse(dateStr);
      return '${dt.year}.${dt.month.toString().padLeft(2, '0')}.${dt.day.toString().padLeft(2, '0')} '
          '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
    } catch (_) {
      return dateStr;
    }
  }
}
