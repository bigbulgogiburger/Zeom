package com.cheonjiyeon.api.ops;

import com.cheonjiyeon.api.audit.AuditLogRepository;
import com.cheonjiyeon.api.auth.AuthService;
import com.cheonjiyeon.api.auth.UserRepository;
import com.cheonjiyeon.api.counselor.CounselorRepository;
import com.cheonjiyeon.api.counselor.SlotRepository;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/ops")
public class OpsController {
    private final UserRepository userRepository;
    private final CounselorRepository counselorRepository;
    private final SlotRepository slotRepository;
    private final AuditLogRepository auditLogRepository;
    private final AuthService authService;

    public OpsController(UserRepository userRepository,
                         CounselorRepository counselorRepository,
                         SlotRepository slotRepository,
                         AuditLogRepository auditLogRepository,
                         AuthService authService) {
        this.userRepository = userRepository;
        this.counselorRepository = counselorRepository;
        this.slotRepository = slotRepository;
        this.auditLogRepository = auditLogRepository;
        this.authService = authService;
    }

    @GetMapping("/summary")
    public Map<String, Long> summary(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to
    ) {
        authService.requireAdmin(authHeader);

        long booked;
        long canceled;
        if (from != null && to != null) {
            booked = auditLogRepository.countByActionAndCreatedAtBetween("BOOKING_CREATED", from, to);
            canceled = auditLogRepository.countByActionAndCreatedAtBetween("BOOKING_CANCELED", from, to);
        } else {
            booked = auditLogRepository.countByAction("BOOKING_CREATED");
            canceled = auditLogRepository.countByAction("BOOKING_CANCELED");
        }

        long authLogin = auditLogRepository.countByAction("AUTH_LOGIN");
        long authFail = auditLogRepository.countByAction("AUTH_LOGIN_FAIL");
        long authReuse = auditLogRepository.countByAction("AUTH_REFRESH_REUSE_DETECTED");

        return Map.of(
                "users", userRepository.count(),
                "counselors", counselorRepository.count(),
                "availableSlots", slotRepository.countByAvailableTrue(),
                "booked", booked,
                "canceled", canceled,
                "authLogin", authLogin,
                "authFail", authFail,
                "authReuse", authReuse
        );
    }
}
