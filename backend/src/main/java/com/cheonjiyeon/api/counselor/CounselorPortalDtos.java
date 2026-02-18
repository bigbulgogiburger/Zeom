package com.cheonjiyeon.api.counselor;

import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class CounselorPortalDtos {

    // Dashboard
    public record DashboardResponse(int todayBookings, int totalBookings, int completedSessions,
                                     BigDecimal ratingAvg, int reviewCount, long totalEarnings) {}

    // Booking list
    public record CounselorBookingItem(Long id, String customerName, String customerEmail,
                                        LocalDateTime startTime, LocalDateTime endTime,
                                        String status, int creditsUsed, LocalDateTime createdAt) {}

    public record CounselorBookingListResponse(List<CounselorBookingItem> bookings,
                                                int totalPages, long totalElements) {}

    // Customer
    public record CustomerItem(Long userId, String name, String email,
                                int totalSessions, LocalDateTime lastSessionAt) {}

    public record CustomerListResponse(List<CustomerItem> customers) {}

    // Settlement
    public record SettlementItem(Long id, LocalDate periodStart, LocalDate periodEnd,
                                  int totalSessions, long totalAmount, BigDecimal commissionRate,
                                  long netAmount, String status, LocalDateTime paidAt,
                                  LocalDateTime createdAt) {}

    public record SettlementListResponse(List<SettlementItem> settlements,
                                          int totalPages, long totalElements) {}

    public record SettlementRequestResponse(Long id, String status, String message) {}

    // Consultation records
    public record ConsultationRecordItem(Long sessionId, Long bookingId, String customerName,
                                          LocalDateTime startedAt, LocalDateTime endedAt,
                                          Integer durationSec, String endReason, String memo) {}

    public record ConsultationRecordListResponse(List<ConsultationRecordItem> records,
                                                  int totalPages, long totalElements) {}

    // Memo
    public record SaveMemoRequest(Long sessionId, @Size(max = 5000) String content) {}

    public record MemoResponse(Long id, Long sessionId, String content,
                                LocalDateTime createdAt, LocalDateTime updatedAt) {}

    // Profile
    public record UpdateProfileRequest(@Size(max = 80) String name,
                                        @Size(max = 60) String specialty,
                                        @Size(max = 400) String intro) {}

    public record CounselorProfileResponse(Long id, String name, String specialty, String intro,
                                            BigDecimal ratingAvg, Integer reviewCount,
                                            Boolean isActive) {}

    // Schedule
    public record UpdateScheduleRequest(List<SlotInput> slots) {}

    public record SlotInput(LocalDateTime startAt, LocalDateTime endAt) {}

    public record ScheduleResponse(List<CounselorDtos.SlotItem> slots) {}

    // Review
    public record CounselorReviewItem(Long id, Long reservationId, Long userId, String customerName,
                                       Integer rating, String comment, String reply,
                                       LocalDateTime replyAt, LocalDateTime createdAt) {}

    public record CounselorReviewListResponse(List<CounselorReviewItem> reviews,
                                               int totalPages, long totalElements) {}

    public record ReplyRequest(@Size(max = 2000) String reply) {}

    public record ReviewReplyResponse(Long id, String reply, LocalDateTime replyAt) {}

    // Memo list
    public record MemoListResponse(List<MemoResponse> memos, int totalPages, long totalElements) {}

    // Customer sessions
    public record CustomerSessionItem(Long sessionId, Long bookingId, LocalDateTime startedAt,
                                       LocalDateTime endedAt, Integer durationSec, String endReason,
                                       String memoSummary) {}

    public record CustomerSessionListResponse(List<CustomerSessionItem> sessions) {}

    // Customer memos
    public record CustomerMemoListResponse(List<MemoResponse> memos) {}
}
