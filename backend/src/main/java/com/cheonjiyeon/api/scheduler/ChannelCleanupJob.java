package com.cheonjiyeon.api.scheduler;

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
import java.util.List;

/**
 * 종료된 세션의 Sendbird 채널을 1시간 후 정리.
 * 30분마다 실행하여 endedAt + 1시간이 지난 채널을 삭제.
 */
@Component
@ConditionalOnProperty(name = "scheduler.enabled", havingValue = "true", matchIfMissing = true)
public class ChannelCleanupJob {
    private static final Logger log = LoggerFactory.getLogger(ChannelCleanupJob.class);

    private final ConsultationSessionRepository sessionRepository;
    private final SendbirdService sendbirdService;

    public ChannelCleanupJob(
            ConsultationSessionRepository sessionRepository,
            SendbirdService sendbirdService
    ) {
        this.sessionRepository = sessionRepository;
        this.sendbirdService = sendbirdService;
    }

    @Scheduled(cron = "0 */30 * * * ?")
    @Transactional
    public void cleanupExpiredChannels() {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(1);

        List<ConsultationSessionEntity> sessions =
                sessionRepository.findByEndedAtIsNotNullAndChannelDeletedFalse().stream()
                        .filter(s -> s.getEndedAt().isBefore(cutoff))
                        .toList();

        if (sessions.isEmpty()) {
            log.debug("정리할 채널 없음");
            return;
        }

        log.info("{}개 채널 정리 시작", sessions.size());

        for (ConsultationSessionEntity session : sessions) {
            try {
                if (session.getSendbirdRoomId() != null) {
                    sendbirdService.deleteChannel(session.getSendbirdRoomId());
                }
                session.setChannelDeleted(true);
                sessionRepository.save(session);
                log.info("채널 삭제 완료 (sessionId={}, channelUrl={})",
                        session.getId(), session.getSendbirdRoomId());
            } catch (Exception e) {
                log.error("채널 삭제 실패 (sessionId={}): {}", session.getId(), e.getMessage(), e);
            }
        }
    }
}
