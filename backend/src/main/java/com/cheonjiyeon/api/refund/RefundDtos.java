package com.cheonjiyeon.api.refund;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.List;

public class RefundDtos {
    public record CreateRefundRequest(
            @NotNull Long reservationId,
            @NotBlank String reason
    ) {}

    public record ProcessRefundRequest(String adminNote) {}

    public record RefundResponse(
            Long id,
            Long reservationId,
            Long paymentId,
            Long userId,
            Long amount,
            String reason,
            String status,
            String adminNote,
            LocalDateTime processedAt,
            LocalDateTime createdAt
    ) {
        public static RefundResponse from(RefundEntity refund) {
            return new RefundResponse(
                    refund.getId(),
                    refund.getReservationId(),
                    refund.getPaymentId(),
                    refund.getUserId(),
                    refund.getAmount(),
                    refund.getReason(),
                    refund.getStatus(),
                    refund.getAdminNote(),
                    refund.getProcessedAt(),
                    refund.getCreatedAt()
            );
        }
    }

    public record RefundListResponse(List<RefundResponse> refunds, int totalPages, long totalElements) {}
}
