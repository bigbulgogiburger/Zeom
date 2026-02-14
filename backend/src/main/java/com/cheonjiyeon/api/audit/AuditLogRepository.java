package com.cheonjiyeon.api.audit;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;

public interface AuditLogRepository extends JpaRepository<AuditLogEntity, Long> {
    long countByAction(String action);
    long countByActionAndCreatedAtBetween(String action, LocalDateTime from, LocalDateTime to);
    java.util.List<AuditLogEntity> findTop50ByOrderByIdDesc();
}
