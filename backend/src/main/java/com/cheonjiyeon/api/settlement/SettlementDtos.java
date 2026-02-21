package com.cheonjiyeon.api.settlement;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class SettlementDtos {

    public record SettlementResponse(
            Long id,
            Long sessionId,
            Long bookingId,
            int creditsReserved,
            int creditsConsumed,
            int creditsRefunded,
            int actualDurationSec,
            String settlementType,
            long counselorEarning,
            long platformFee,
            BigDecimal commissionRate,
            LocalDateTime settledAt
    ) {
        public static SettlementResponse from(SettlementTransactionEntity e) {
            return new SettlementResponse(
                    e.getId(), e.getSessionId(), e.getBookingId(),
                    e.getCreditsReserved(), e.getCreditsConsumed(), e.getCreditsRefunded(),
                    e.getActualDurationSec(), e.getSettlementType(),
                    e.getCounselorEarning(), e.getPlatformFee(),
                    e.getCommissionRate(), e.getSettledAt()
            );
        }
    }

    public record CounselorSettlementSummary(
            Long id,
            LocalDate periodStart,
            LocalDate periodEnd,
            int totalSessions,
            int totalDurationMin,
            long grossAmount,
            long commissionAmount,
            long netAmount,
            BigDecimal commissionRate,
            String status,
            LocalDateTime confirmedAt,
            LocalDateTime paidAt,
            LocalDateTime requestedAt,
            String transferNote
    ) {
        public static CounselorSettlementSummary from(CounselorSettlementEntity e) {
            return new CounselorSettlementSummary(
                    e.getId(), e.getPeriodStart(), e.getPeriodEnd(),
                    e.getTotalSessions(), e.getTotalDurationMin(),
                    e.getGrossAmount(), e.getCommissionAmount(), e.getNetAmount(),
                    e.getCommissionRate(), e.getStatus(),
                    e.getConfirmedAt(), e.getPaidAt(),
                    e.getRequestedAt(), e.getTransferNote()
            );
        }
    }

    public record CounselorSettlementDetailResponse(
            CounselorSettlementSummary summary,
            List<SettlementResponse> transactions
    ) {}

    public record CustomerSettlementListResponse(List<SettlementResponse> settlements) {}

    public record CounselorSettlementListResponse(List<CounselorSettlementSummary> settlements) {}

    public record WithdrawalResponse(String message, int requestedCount, long totalRequestedAmount) {}

    public record PaySettlementRequest(String transferNote) {}
}
