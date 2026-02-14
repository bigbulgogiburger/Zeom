package com.cheonjiyeon.api.audit;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLogEntity, Long> {
    long countByAction(String action);
    long countByActionAndCreatedAtBetween(String action, LocalDateTime from, LocalDateTime to);
    List<AuditLogEntity> findTop50ByOrderByIdDesc();
    List<AuditLogEntity> findTop50ByActionOrderByIdDesc(String action);
    List<AuditLogEntity> findTop50ByCreatedAtBetweenOrderByIdDesc(LocalDateTime from, LocalDateTime to);
    List<AuditLogEntity> findTop50ByActionAndCreatedAtBetweenOrderByIdDesc(String action, LocalDateTime from, LocalDateTime to);
}
