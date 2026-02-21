package com.cheonjiyeon.api.scheduler;

import com.cheonjiyeon.api.audit.AuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Component
@ConditionalOnProperty(name = "scheduler.enabled", havingValue = "true", matchIfMissing = true)
public class AuditLogArchiveScheduler {

    private static final Logger log = LoggerFactory.getLogger(AuditLogArchiveScheduler.class);
    private final AuditLogRepository auditLogRepository;

    public AuditLogArchiveScheduler(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Scheduled(cron = "${scheduler.audit-archive-cron:0 0 3 1 * ?}")
    @Transactional
    public void archiveOldAuditLogs() {
        LocalDateTime cutoff = LocalDateTime.now().minusMonths(6);
        long deletedCount = auditLogRepository.deleteByCreatedAtBefore(cutoff);
        log.info("Archived {} audit logs older than {}", deletedCount, cutoff);
    }
}
