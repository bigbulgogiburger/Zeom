package com.cheonjiyeon.api.notification;

import com.cheonjiyeon.api.auth.AuthService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/notification-preferences")
public class NotificationPreferenceController {
    private final NotificationPreferenceService preferenceService;
    private final AuthService authService;

    public NotificationPreferenceController(NotificationPreferenceService preferenceService,
                                            AuthService authService) {
        this.preferenceService = preferenceService;
        this.authService = authService;
    }

    @GetMapping
    public Map<String, Object> get(
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        Long userId = resolveUserId(authHeader);
        NotificationPreferenceEntity pref = preferenceService.getOrCreate(userId);
        return toMap(pref);
    }

    @PutMapping
    public Map<String, Object> update(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Map<String, Boolean> preferences
    ) {
        Long userId = resolveUserId(authHeader);
        NotificationPreferenceEntity updated = preferenceService.update(userId, preferences);
        return toMap(updated);
    }

    private Long resolveUserId(String authHeader) {
        return authService.me(authHeader).id();
    }

    private Map<String, Object> toMap(NotificationPreferenceEntity p) {
        return Map.of(
                "bookingConfirmedEmail", p.isBookingConfirmedEmail(),
                "consultationReminderEmail", p.isConsultationReminderEmail(),
                "consultationCompletedEmail", p.isConsultationCompletedEmail(),
                "refundStatusEmail", p.isRefundStatusEmail(),
                "settlementPaidEmail", p.isSettlementPaidEmail(),
                "reviewReceivedEmail", p.isReviewReceivedEmail(),
                "newBookingEmail", p.isNewBookingEmail()
        );
    }
}
