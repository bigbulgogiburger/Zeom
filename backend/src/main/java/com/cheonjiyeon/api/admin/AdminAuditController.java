package com.cheonjiyeon.api.admin;

import com.cheonjiyeon.api.audit.AuditLogEntity;
import com.cheonjiyeon.api.audit.AuditLogRepository;
import com.cheonjiyeon.api.auth.AuthService;
import org.springframework.web.bind.annotation.*;

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
    public List<AuditLogEntity> latest(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        authService.requireAdmin(authHeader);
        return auditLogRepository.findTop50ByOrderByIdDesc();
    }
}
