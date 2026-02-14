package com.cheonjiyeon.api.admin;

import com.cheonjiyeon.api.audit.AuditLogEntity;
import com.cheonjiyeon.api.audit.AuditLogRepository;
import com.cheonjiyeon.api.auth.AuthService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/audit")
public class AdminAuditController {
    private final AuditLogRepository auditLogRepository;
    private final AuthService authService;

    public AdminAuditController(AuditLogRepository auditLogRepository, AuthService authService) {
        this.auditLogRepository = auditLogRepository;
        this.authService = authService;
    }

    @GetMapping
    public List<AuditLogEntity> latest(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to
    ) {
        authService.requireAdmin(authHeader);

        if (action != null && !action.isBlank() && from != null && to != null) {
            return auditLogRepository.findTop50ByActionAndCreatedAtBetweenOrderByIdDesc(action, from, to);
        }
        if (action != null && !action.isBlank()) {
            return auditLogRepository.findTop50ByActionOrderByIdDesc(action);
        }
        if (from != null && to != null) {
            return auditLogRepository.findTop50ByCreatedAtBetweenOrderByIdDesc(from, to);
        }
        return auditLogRepository.findTop50ByOrderByIdDesc();
    }
}
