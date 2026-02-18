package com.cheonjiyeon.api.consultation;

import com.cheonjiyeon.api.booking.BookingDtos;
import com.cheonjiyeon.api.booking.BookingEntity;
import com.cheonjiyeon.api.booking.BookingSlotEntity;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api/v1/sessions")
public class ConsultationSessionController {
    private final ConsultationSessionService sessionService;

    public ConsultationSessionController(ConsultationSessionService sessionService) {
        this.sessionService = sessionService;
    }

    @PostMapping("/{reservationId}/start")
    public ConsultationSessionDtos.SessionResponse startSession(@PathVariable Long reservationId) {
        ConsultationSessionEntity session = sessionService.startSession(reservationId);
        return ConsultationSessionDtos.SessionResponse.from(session);
    }

    @PostMapping("/{id}/end")
    public ConsultationSessionDtos.SessionResponse endSession(
            @PathVariable Long id,
            @Valid @RequestBody ConsultationSessionDtos.EndSessionRequest req
    ) {
        ConsultationSessionEntity session = sessionService.endSession(id, req.endReason());
        return ConsultationSessionDtos.SessionResponse.from(session);
    }

    @GetMapping("/{reservationId}")
    public ConsultationSessionDtos.SessionResponse getSession(@PathVariable Long reservationId) {
        ConsultationSessionEntity session = sessionService.getSessionByReservationId(reservationId);
        return ConsultationSessionDtos.SessionResponse.from(session);
    }

    @PostMapping("/{reservationId}/token")
    public ConsultationSessionDtos.SessionTokenResponse getSessionToken(@PathVariable Long reservationId) {
        return sessionService.getSessionToken(reservationId);
    }

    @PostMapping("/{reservationId}/counselor-token")
    public ConsultationSessionDtos.SessionTokenResponse getCounselorToken(
            @PathVariable Long reservationId,
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        return sessionService.getCounselorToken(reservationId, authHeader);
    }

    @PostMapping("/counselor-auth")
    public ConsultationSessionDtos.CounselorAuthResponse getCounselorAuth(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        return sessionService.getCounselorAuth(authHeader);
    }

    @GetMapping("/counselor/bookings/today")
    public List<BookingDtos.BookingResponse> getCounselorTodayBookings(
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        List<BookingEntity> bookings = sessionService.getCounselorTodayBookings(authHeader);
        return bookings.stream().map(this::toBookingResponse).toList();
    }

    private BookingDtos.BookingResponse toBookingResponse(BookingEntity booking) {
        List<BookingSlotEntity> bookingSlots = booking.getBookingSlots();
        List<BookingDtos.SlotInfo> slotInfos = new ArrayList<>();

        if (bookingSlots != null && !bookingSlots.isEmpty()) {
            slotInfos = bookingSlots.stream()
                    .sorted(Comparator.comparing(bs -> bs.getSlot().getStartAt()))
                    .map(bs -> new BookingDtos.SlotInfo(
                            bs.getSlot().getId(),
                            bs.getSlot().getStartAt(),
                            bs.getSlot().getEndAt()))
                    .toList();
        }

        return new BookingDtos.BookingResponse(
                booking.getId(),
                booking.getCounselor().getId(),
                booking.getCounselor().getName(),
                booking.getSlot() != null ? booking.getSlot().getId() : null,
                booking.getSlot() != null ? booking.getSlot().getStartAt() : null,
                booking.getSlot() != null ? booking.getSlot().getEndAt() : null,
                booking.getStatus(),
                slotInfos,
                booking.getCreditsUsed()
        );
    }
}
