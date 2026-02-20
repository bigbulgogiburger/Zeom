package com.cheonjiyeon.api.consultation;

import com.cheonjiyeon.api.booking.BookingEntity;
import com.cheonjiyeon.api.booking.BookingRepository;
import com.cheonjiyeon.api.booking.BookingSlotEntity;
import com.cheonjiyeon.api.common.ApiException;
import com.cheonjiyeon.api.credit.CreditUsageLogEntity;
import com.cheonjiyeon.api.credit.CreditUsageLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
public class ConsecutiveSessionService {
    private static final Logger log = LoggerFactory.getLogger(ConsecutiveSessionService.class);

    private static final long CONSECUTIVE_GAP_MINUTES = 35;

    private final BookingRepository bookingRepository;
    private final ConsultationSessionRepository sessionRepository;
    private final CreditUsageLogRepository creditUsageLogRepository;

    public ConsecutiveSessionService(
            BookingRepository bookingRepository,
            ConsultationSessionRepository sessionRepository,
            CreditUsageLogRepository creditUsageLogRepository
    ) {
        this.bookingRepository = bookingRepository;
        this.sessionRepository = sessionRepository;
        this.creditUsageLogRepository = creditUsageLogRepository;
    }

    /**
     * Find the next consecutive booking for the same user + same counselor,
     * where a slot starts within 35 minutes of the current booking's last slot end time.
     */
    @Transactional(readOnly = true)
    public ConsultationSessionDtos.NextConsecutiveResponse findNextConsecutiveBooking(Long reservationId) {
        BookingEntity currentBooking = bookingRepository.findById(reservationId)
                .orElseThrow(() -> new ApiException(404, "예약을 찾을 수 없습니다: " + reservationId));

        LocalDateTime currentEndAt = getLastSlotEndAt(currentBooking);
        if (currentEndAt == null) {
            return new ConsultationSessionDtos.NextConsecutiveResponse(false, null, null, null);
        }

        Long userId = currentBooking.getUser().getId();
        Long counselorId = currentBooking.getCounselor().getId();

        List<BookingEntity> candidates = bookingRepository.findByUserIdAndCounselorIdAndStatusIn(
                userId, counselorId, List.of("BOOKED", "PAID")
        );

        for (BookingEntity candidate : candidates) {
            if (candidate.getId().equals(currentBooking.getId())) {
                continue;
            }

            LocalDateTime candidateStartAt = getFirstSlotStartAt(candidate);
            LocalDateTime candidateEndAt = getLastSlotEndAt(candidate);
            if (candidateStartAt == null || candidateEndAt == null) {
                continue;
            }

            long gapMinutes = Duration.between(currentEndAt, candidateStartAt).toMinutes();
            if (gapMinutes >= 0 && gapMinutes <= CONSECUTIVE_GAP_MINUTES) {
                return new ConsultationSessionDtos.NextConsecutiveResponse(
                        true,
                        candidate.getId(),
                        candidateStartAt,
                        candidateEndAt
                );
            }
        }

        return new ConsultationSessionDtos.NextConsecutiveResponse(false, null, null, null);
    }

    /**
     * Continue the current session into the next booking.
     * Links sessions and reuses the same Sendbird channel.
     */
    @Transactional
    public ConsultationSessionDtos.ContinueNextResponse continueToNextSession(Long currentSessionId, Long nextBookingId) {
        ConsultationSessionEntity currentSession = sessionRepository.findById(currentSessionId)
                .orElseThrow(() -> new ApiException(404, "세션을 찾을 수 없습니다: " + currentSessionId));

        BookingEntity nextBooking = bookingRepository.findById(nextBookingId)
                .orElseThrow(() -> new ApiException(404, "다음 예약을 찾을 수 없습니다: " + nextBookingId));

        // Check if a session already exists for the next booking (idempotency)
        Optional<ConsultationSessionEntity> existingNext = sessionRepository.findByReservationId(nextBookingId);
        ConsultationSessionEntity nextSession;

        if (existingNext.isPresent()) {
            nextSession = existingNext.get();
        } else {
            nextSession = new ConsultationSessionEntity();
            nextSession.setReservationId(nextBookingId);
            nextSession.setSendbirdRoomId(currentSession.getSendbirdRoomId()); // reuse same channel
            nextSession.setStartedAt(LocalDateTime.now());
            nextSession.setContinuedFromSessionId(currentSession.getId());
            nextSession = sessionRepository.save(nextSession);
        }

        // Link current session to next
        currentSession.setContinuedToSessionId(nextSession.getId());
        sessionRepository.save(currentSession);

        // Calculate extended duration from the next booking's slots
        int extendedMinutes = calculateDurationMinutes(nextBooking);

        // Count consumed credits for the next booking
        List<CreditUsageLogEntity> nextUsages = creditUsageLogRepository.findByBookingId(nextBookingId);
        int creditsConsumed = nextUsages.stream()
                .mapToInt(CreditUsageLogEntity::getUnitsUsed)
                .sum();

        LocalDateTime newEndTime = nextSession.getStartedAt().plusMinutes(extendedMinutes);

        return new ConsultationSessionDtos.ContinueNextResponse(
                nextSession.getId(),
                extendedMinutes,
                creditsConsumed,
                newEndTime
        );
    }

    /**
     * Consume the next RESERVED credit for a booking at a 30-minute boundary.
     */
    @Transactional
    public ConsultationSessionDtos.ConsumeCreditResponse consumeNextCredit(Long bookingId) {
        List<CreditUsageLogEntity> reservedLogs = creditUsageLogRepository
                .findByBookingIdAndStatusOrderByUsedAtAsc(bookingId, "RESERVED");

        if (reservedLogs.isEmpty()) {
            throw new ApiException(400, "소비할 예약된 크레딧이 없습니다.");
        }

        CreditUsageLogEntity nextReserved = reservedLogs.getFirst();
        nextReserved.setStatus("CONSUMED");
        nextReserved.setConsumedAt(LocalDateTime.now());
        creditUsageLogRepository.save(nextReserved);

        // Calculate credit index: count all consumed + 1 for the one just consumed
        List<CreditUsageLogEntity> allLogs = creditUsageLogRepository.findByBookingId(bookingId);
        int consumedCount = (int) allLogs.stream()
                .filter(l -> "CONSUMED".equals(l.getStatus()))
                .count();
        int totalCredits = allLogs.size();

        return new ConsultationSessionDtos.ConsumeCreditResponse(
                consumedCount,
                totalCredits,
                nextReserved.getConsumedAt()
        );
    }

    private LocalDateTime getLastSlotEndAt(BookingEntity booking) {
        if (booking.getBookingSlots() != null && !booking.getBookingSlots().isEmpty()) {
            return booking.getBookingSlots().stream()
                    .map(bs -> bs.getSlot().getEndAt())
                    .max(Comparator.naturalOrder())
                    .orElse(null);
        }
        if (booking.getSlot() != null) {
            return booking.getSlot().getEndAt();
        }
        return null;
    }

    private LocalDateTime getFirstSlotStartAt(BookingEntity booking) {
        if (booking.getBookingSlots() != null && !booking.getBookingSlots().isEmpty()) {
            return booking.getBookingSlots().stream()
                    .map(bs -> bs.getSlot().getStartAt())
                    .min(Comparator.naturalOrder())
                    .orElse(null);
        }
        if (booking.getSlot() != null) {
            return booking.getSlot().getStartAt();
        }
        return null;
    }

    private int calculateDurationMinutes(BookingEntity booking) {
        if (booking.getBookingSlots() != null && !booking.getBookingSlots().isEmpty()) {
            List<BookingSlotEntity> sorted = booking.getBookingSlots().stream()
                    .sorted(Comparator.comparing(bs -> bs.getSlot().getStartAt()))
                    .toList();
            LocalDateTime start = sorted.getFirst().getSlot().getStartAt();
            LocalDateTime end = sorted.getLast().getSlot().getEndAt();
            return (int) ChronoUnit.MINUTES.between(start, end);
        }
        if (booking.getSlot() != null) {
            return (int) ChronoUnit.MINUTES.between(
                    booking.getSlot().getStartAt(),
                    booking.getSlot().getEndAt()
            );
        }
        return 30; // default
    }
}
