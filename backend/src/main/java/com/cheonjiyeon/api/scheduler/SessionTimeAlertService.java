package com.cheonjiyeon.api.scheduler;

import com.cheonjiyeon.api.booking.BookingEntity;
import com.cheonjiyeon.api.booking.BookingRepository;
import com.cheonjiyeon.api.booking.BookingSlotEntity;
import com.cheonjiyeon.api.consultation.ConsultationSessionEntity;
import com.cheonjiyeon.api.consultation.ConsultationSessionRepository;
import com.cheonjiyeon.api.sendbird.SendbirdService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;

/**
 * 세션 시간 알림 서비스.
 * 매 1분마다 활성 세션을 확인하여 종료 5분/3분/1분 전 알림을 Sendbird 채널에 전송.
 */
@Component
@ConditionalOnProperty(name = "scheduler.enabled", havingValue = "true", matchIfMissing = true)
public class SessionTimeAlertService {
    private static final Logger log = LoggerFactory.getLogger(SessionTimeAlertService.class);

    private final ConsultationSessionRepository sessionRepository;
    private final BookingRepository bookingRepository;
    private final SendbirdService sendbirdService;

    public SessionTimeAlertService(
            ConsultationSessionRepository sessionRepository,
            BookingRepository bookingRepository,
            SendbirdService sendbirdService
    ) {
        this.sessionRepository = sessionRepository;
        this.bookingRepository = bookingRepository;
        this.sendbirdService = sendbirdService;
    }

    @Scheduled(fixedRate = 60000)
    @Transactional
    public void checkAndSendAlerts() {
        List<ConsultationSessionEntity> activeSessions =
                sessionRepository.findByStartedAtIsNotNullAndEndedAtIsNull();

        if (activeSessions.isEmpty()) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();

        for (ConsultationSessionEntity session : activeSessions) {
            try {
                processSession(session, now);
            } catch (Exception e) {
                log.error("세션 {} 알림 처리 실패: {}", session.getId(), e.getMessage(), e);
            }
        }
    }

    private void processSession(ConsultationSessionEntity session, LocalDateTime now) {
        BookingEntity booking = bookingRepository.findById(session.getReservationId()).orElse(null);
        if (booking == null) {
            log.warn("예약을 찾을 수 없음 (reservationId={})", session.getReservationId());
            return;
        }

        LocalDateTime endTime = calculateSessionEndTime(booking);
        if (endTime == null) {
            return;
        }

        long remainingMinutes = ChronoUnit.MINUTES.between(now, endTime);
        String channelUrl = session.getSendbirdRoomId();
        if (channelUrl == null) {
            return;
        }

        boolean updated = false;

        if (remainingMinutes > 4 && remainingMinutes <= 5 && !Boolean.TRUE.equals(session.getAlert5minSent())) {
            sendbirdService.sendAdminMessage(channelUrl, "상담 종료 5분 전입니다");
            session.setAlert5minSent(true);
            updated = true;
            log.info("세션 {} 5분 전 알림 전송", session.getId());
        }

        if (remainingMinutes > 2 && remainingMinutes <= 3 && !Boolean.TRUE.equals(session.getAlert3minSent())) {
            sendbirdService.sendAdminMessage(channelUrl, "상담 종료 3분 전입니다");
            session.setAlert3minSent(true);
            updated = true;
            log.info("세션 {} 3분 전 알림 전송", session.getId());
        }

        if (remainingMinutes > 0 && remainingMinutes <= 1 && !Boolean.TRUE.equals(session.getAlert1minSent())) {
            sendbirdService.sendAdminMessage(channelUrl, "상담 종료 1분 전입니다");
            session.setAlert1minSent(true);
            updated = true;
            log.info("세션 {} 1분 전 알림 전송", session.getId());
        }

        if (updated) {
            sessionRepository.save(session);
        }
    }

    private LocalDateTime calculateSessionEndTime(BookingEntity booking) {
        if (booking.getBookingSlots() != null && !booking.getBookingSlots().isEmpty()) {
            return booking.getBookingSlots().stream()
                    .sorted(Comparator.comparing(bs -> bs.getSlot().getStartAt()))
                    .reduce((first, second) -> second) // last element
                    .map(bs -> bs.getSlot().getEndAt())
                    .orElse(null);
        }
        if (booking.getSlot() != null) {
            return booking.getSlot().getEndAt();
        }
        return null;
    }
}
