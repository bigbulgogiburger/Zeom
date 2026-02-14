package com.cheonjiyeon.api.audit;

import org.springframework.stereotype.Service;

@Service
public class AuditLogService {
    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void log(Long userId, String action, String targetType, Long targetId) {
        AuditLogEntity e = new AuditLogEntity();
        e.setUserId(userId);
        e.setAction(action);
        e.setTargetType(targetType);
        e.setTargetId(targetId);
        auditLogRepository.save(e);
    }
}
