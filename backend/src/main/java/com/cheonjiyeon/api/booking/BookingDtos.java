package com.cheonjiyeon.api.booking;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public class BookingDtos {
    public record CreateBookingRequest(@NotNull Long counselorId, @NotNull Long slotId) {}

    public record BookingResponse(
            Long id,
            Long counselorId,
            String counselorName,
            Long slotId,
            LocalDateTime startAt,
            LocalDateTime endAt,
            String status
    ) {}
}
