package com.cheonjiyeon.api.booking;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.List;

public class BookingDtos {
    public record CreateBookingRequest(
            @NotNull Long counselorId,
            Long slotId,
            List<Long> slotIds,
            String consultationType
    ) {}

    public record RescheduleRequest(
            @NotNull List<Long> newSlotIds
    ) {}

    public record CancelRequest(
            String reason
    ) {}

    public record SlotInfo(
            Long slotId,
            LocalDateTime startAt,
            LocalDateTime endAt
    ) {}

    public record RetryPaymentResponse(
            Long bookingId,
            String status,
            int retryCount,
            String message
    ) {}

    public record BookingResponse(
            Long id,
            Long counselorId,
            String counselorName,
            Long slotId,
            LocalDateTime startAt,
            LocalDateTime endAt,
            String status,
            List<SlotInfo> slots,
            int creditsUsed,
            String cancelReason,
            int paymentRetryCount,
            String consultationType
    ) {}
}
