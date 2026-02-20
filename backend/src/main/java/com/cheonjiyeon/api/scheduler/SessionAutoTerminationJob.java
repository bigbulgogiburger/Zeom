package com.cheonjiyeon.api.scheduler;

import com.cheonjiyeon.api.consultation.ConsultationSessionEntity;
import com.cheonjiyeon.api.consultation.ConsultationSessionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Auto-terminate consultation sessions that exceed 65 minutes (60min + 5min grace).
 *
 * Runs every 5 minutes. Finds sessions where startedAt + 65min < now AND endedAt IS NULL.
 * Auto-ends them with reason TIMEOUT. Channel deletion is handled by ChannelCleanupJob.
 */
@Component
@ConditionalOnProperty(name = "scheduler.enabled", havingValue = "true", matchIfMissing = true)
public class SessionAutoTerminationJob {
    private static final Logger log = LoggerFactory.getLogger(SessionAutoTerminationJob.class);
    private static final int MAX_SESSION_MINUTES = 65; // 60min + 5min grace period

    private final ConsultationSessionRepository sessionRepository;

    public SessionAutoTerminationJob(ConsultationSessionRepository sessionRepository) {
        this.sessionRepository = sessionRepository;
    }

    @Scheduled(cron = "${scheduler.session-auto-terminate-cron:0 */5 * * * ?}")
    @Transactional
    public void terminateExpiredSessions() {
        LocalDateTime cutoffTime = LocalDateTime.now().minusMinutes(MAX_SESSION_MINUTES);

        List<ConsultationSessionEntity> expiredSessions = sessionRepository.findAll().stream()
                .filter(session -> session.getEndedAt() == null)
                .filter(session -> session.getStartedAt().isBefore(cutoffTime))
                .toList();

        if (expiredSessions.isEmpty()) {
            log.debug("No expired sessions found");
            return;
        }

        log.info("Found {} expired sessions to terminate", expiredSessions.size());

        for (ConsultationSessionEntity session : expiredSessions) {
            try {
                LocalDateTime endTime = LocalDateTime.now();
                int durationSec = (int) Duration.between(session.getStartedAt(), endTime).getSeconds();

                session.setEndedAt(endTime);
                session.setEndReason("TIMEOUT");
                session.setDurationSec(durationSec);

                sessionRepository.save(session);

                // Channel deletion is now handled by ChannelCleanupJob (1 hour after session end)

                log.info("Auto-terminated session {} (reservation: {}, duration: {}s)",
                        session.getId(), session.getReservationId(), durationSec);

            } catch (Exception e) {
                log.error("Failed to terminate session {}: {}", session.getId(), e.getMessage(), e);
            }
        }
    }
}
