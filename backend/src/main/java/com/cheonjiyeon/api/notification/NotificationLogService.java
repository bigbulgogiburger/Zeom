package com.cheonjiyeon.api.notification;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class NotificationLogService {
    private final NotificationLogRepository logRepository;

    public NotificationLogService(NotificationLogRepository logRepository) {
        this.logRepository = logRepository;
    }

    @Transactional(readOnly = true)
    public Page<NotificationLogEntity> getLogs(Long userId, int page, int size) {
        return logRepository.findByUserIdOrderBySentAtDesc(userId, PageRequest.of(page, size));
    }

    /**
     * Check if a notification of the given type/channel was already sent to this user
     * within the specified time window.
     */
    @Transactional(readOnly = true)
    public boolean wasSentRecently(Long userId, String type, String channel, LocalDateTime after) {
        return logRepository.existsByUserIdAndTypeAndChannelAndSentAtAfter(userId, type, channel, after);
    }
}
