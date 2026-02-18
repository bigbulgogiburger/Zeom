package com.cheonjiyeon.api.admin;

import com.cheonjiyeon.api.auth.AuthService;
import com.cheonjiyeon.api.booking.BookingEntity;
import com.cheonjiyeon.api.booking.BookingRepository;
import com.cheonjiyeon.api.consultation.ConsultationSessionEntity;
import com.cheonjiyeon.api.consultation.ConsultationSessionRepository;
import com.cheonjiyeon.api.consultation.ConsultationSessionService;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/admin/sessions")
public class AdminSessionController {

    private final ConsultationSessionRepository sessionRepository;
    private final ConsultationSessionService sessionService;
    private final BookingRepository bookingRepository;
    private final AuthService authService;

    public AdminSessionController(
            ConsultationSessionRepository sessionRepository,
            ConsultationSessionService sessionService,
            BookingRepository bookingRepository,
            AuthService authService
    ) {
        this.sessionRepository = sessionRepository;
        this.sessionService = sessionService;
        this.bookingRepository = bookingRepository;
        this.authService = authService;
    }

    @GetMapping("/active")
    public List<ActiveSessionResponse> getActiveSessions(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        authService.requireAdmin(authHeader);
        List<ConsultationSessionEntity> active = sessionRepository.findByStartedAtIsNotNullAndEndedAtIsNull();

        List<Long> reservationIds = active.stream().map(ConsultationSessionEntity::getReservationId).toList();
        Map<Long, BookingEntity> bookingMap = bookingRepository.findAllById(reservationIds).stream()
                .collect(Collectors.toMap(BookingEntity::getId, b -> b));

        return active.stream().map(session -> {
            BookingEntity booking = bookingMap.get(session.getReservationId());
            String counselorName = booking != null ? booking.getCounselor().getName() : "Unknown";
            String customerName = booking != null ? booking.getUser().getName() : "Unknown";
            long elapsedSec = Duration.between(session.getStartedAt(), LocalDateTime.now()).getSeconds();
            return new ActiveSessionResponse(
                    session.getId(), session.getReservationId(),
                    counselorName, customerName,
                    session.getStartedAt(), elapsedSec
            );
        }).toList();
    }

    @GetMapping("/stats")
    public SessionStatsResponse getStats(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        authService.requireAdmin(authHeader);
        LocalDate today = LocalDate.now();
        LocalDateTime todayStart = today.atStartOfDay();
        LocalDateTime weekStart = today.minusDays(today.getDayOfWeek().getValue() - 1L).atStartOfDay();
        LocalDateTime monthStart = today.withDayOfMonth(1).atStartOfDay();

        List<ConsultationSessionEntity> allCompleted = sessionRepository.findByEndedAtIsNotNull();

        long todayCount = allCompleted.stream()
                .filter(s -> s.getEndedAt().isAfter(todayStart))
                .count();
        long weekCount = allCompleted.stream()
                .filter(s -> s.getEndedAt().isAfter(weekStart))
                .count();
        long monthCount = allCompleted.stream()
                .filter(s -> s.getEndedAt().isAfter(monthStart))
                .count();

        double avgDurationSec = allCompleted.stream()
                .filter(s -> s.getDurationSec() != null)
                .mapToInt(ConsultationSessionEntity::getDurationSec)
                .average()
                .orElse(0.0);

        int activeCount = sessionRepository.findByStartedAtIsNotNullAndEndedAtIsNull().size();

        return new SessionStatsResponse(
                todayCount, weekCount, monthCount,
                (int) Math.round(avgDurationSec),
                activeCount
        );
    }

    @PostMapping("/{id}/force-end")
    public Map<String, String> forceEnd(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id) {
        authService.requireAdmin(authHeader);
        sessionService.endSession(id, "ADMIN");
        return Map.of("status", "ended", "endReason", "ADMIN");
    }

    public record ActiveSessionResponse(
            Long sessionId, Long bookingId,
            String counselorName, String customerName,
            LocalDateTime startedAt, long elapsedSec
    ) {}

    public record SessionStatsResponse(
            long todayCompleted, long weekCompleted, long monthCompleted,
            int avgDurationSec, int activeSessions
    ) {}
}
