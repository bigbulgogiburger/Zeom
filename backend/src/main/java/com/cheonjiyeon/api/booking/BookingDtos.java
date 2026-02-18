package com.cheonjiyeon.api.booking;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.List;

public class BookingDtos {
    public record CreateBookingRequest(
            @NotNull Long counselorId,
            Long slotId,
            List<Long> slotIds
    ) {}

    public record SlotInfo(
            Long slotId,
            LocalDateTime startAt,
            LocalDateTime endAt
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
            int creditsUsed
    ) {}
}
