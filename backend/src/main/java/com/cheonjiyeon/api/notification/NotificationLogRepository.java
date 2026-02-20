package com.cheonjiyeon.api.notification;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;

public interface NotificationLogRepository extends JpaRepository<NotificationLogEntity, Long> {
    Page<NotificationLogEntity> findByUserIdOrderBySentAtDesc(Long userId, Pageable pageable);
    boolean existsByUserIdAndTypeAndChannelAndSentAtAfter(Long userId, String type, String channel, LocalDateTime after);
}
