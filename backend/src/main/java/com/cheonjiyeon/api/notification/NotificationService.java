package com.cheonjiyeon.api.notification;

import com.cheonjiyeon.api.audit.AuditLogService;
import com.cheonjiyeon.api.auth.UserEntity;
import com.cheonjiyeon.api.auth.UserRepository;
import com.cheonjiyeon.api.notification.provider.NotificationProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
public class NotificationService {
    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationProvider notificationProvider;
    private final AuditLogService auditLogService;
    private final NotificationRepository notificationRepository;
    private final NotificationLogRepository notificationLogRepository;
    private final NotificationPreferenceRepository preferenceRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final EmailTemplateService emailTemplateService;
    private final SseEmitterService sseEmitterService;
    private final SmsService smsService;

    public NotificationService(NotificationProvider notificationProvider,
                               AuditLogService auditLogService,
                               NotificationRepository notificationRepository,
                               NotificationLogRepository notificationLogRepository,
                               NotificationPreferenceRepository preferenceRepository,
                               UserRepository userRepository,
                               EmailService emailService,
                               EmailTemplateService emailTemplateService,
                               SseEmitterService sseEmitterService,
                               SmsService smsService) {
        this.notificationProvider = notificationProvider;
        this.auditLogService = auditLogService;
        this.notificationRepository = notificationRepository;
        this.notificationLogRepository = notificationLogRepository;
        this.preferenceRepository = preferenceRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.emailTemplateService = emailTemplateService;
        this.sseEmitterService = sseEmitterService;
        this.smsService = smsService;
    }

    /**
     * Legacy method — maintains backward compatibility with existing callers.
     */
    public void notifyPaymentConfirmed(Long actorId, String to, Long bookingId) {
        notificationProvider.send(to, "결제 완료", "예약(" + bookingId + ") 결제가 완료되어 상담방이 열렸습니다.");
        auditLogService.log(actorId, "NOTIFICATION_SENT", "BOOKING", bookingId);
    }

    /**
     * Send an in-app notification. Saves to DB, pushes via SSE, and logs the dispatch.
     */
    @Transactional
    public void send(Long userId, NotificationType type, String title, String body, String link) {
        // 1. Save in-app notification
        NotificationEntity entity = new NotificationEntity();
        entity.setUserId(userId);
        entity.setType(type.name());
        entity.setTitle(title);
        entity.setBody(body);
        entity.setLink(link);
        entity.setRead(false);
        NotificationEntity saved = notificationRepository.save(entity);

        // 2. Push via SSE
        try {
            sseEmitterService.pushNotification(userId, saved);
        } catch (Exception e) {
            log.warn("SSE push failed for userId={}: {}", userId, e.getMessage());
        }

        // 3. Log the dispatch
        logNotification(userId, type, "IN_APP", "SUCCESS", null);

        log.info("Notification sent: userId={}, type={}, title={}", userId, type, title);
    }

    /**
     * Send an email notification. Checks user preference before sending.
     */
    @Transactional
    public void sendEmail(Long userId, NotificationType type, Map<String, Object> templateData) {
        // Check preference
        NotificationPreferenceEntity pref = preferenceRepository.findByUserId(userId).orElse(null);
        if (pref != null && !isEmailEnabledForType(pref, type)) {
            log.debug("Email disabled for userId={}, type={}", userId, type);
            return;
        }

        // Find user email
        UserEntity user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            log.warn("User not found for email notification: userId={}", userId);
            logNotification(userId, type, "EMAIL", "FAILED", "User not found");
            return;
        }

        try {
            String subject = emailTemplateService.subject(type);
            String htmlBody = emailTemplateService.render(type, templateData);
            emailService.send(user.getEmail(), subject, htmlBody);
            logNotification(userId, type, "EMAIL", "SUCCESS", null);
            log.info("Email sent: userId={}, type={}, to={}", userId, type, user.getEmail());
        } catch (Exception e) {
            log.error("Email send failed: userId={}, type={}, error={}", userId, type, e.getMessage());
            logNotification(userId, type, "EMAIL", "FAILED", e.getMessage());
        }
    }

    /**
     * Send an SMS notification. Checks user preference and phone number before sending.
     */
    @Transactional
    public void sendSmsNotification(Long userId, NotificationType type, String message) {
        // Check preference
        NotificationPreferenceEntity pref = preferenceRepository.findByUserId(userId).orElse(null);
        if (pref != null && !isSmsEnabledForType(pref, type)) {
            log.debug("SMS disabled for userId={}, type={}", userId, type);
            return;
        }

        // Find user phone
        UserEntity user = userRepository.findById(userId).orElse(null);
        if (user == null || user.getPhone() == null || user.getPhone().isBlank()) {
            log.warn("User phone not available for SMS: userId={}", userId);
            logNotification(userId, type, "SMS", "FAILED", "Phone not available");
            return;
        }

        try {
            smsService.sendSms(user.getPhone(), message);
            logNotification(userId, type, "SMS", "SUCCESS", null);
            log.info("SMS sent: userId={}, type={}, to={}", userId, type, user.getPhone());
        } catch (Exception e) {
            log.error("SMS send failed: userId={}, type={}, error={}", userId, type, e.getMessage());
            logNotification(userId, type, "SMS", "FAILED", e.getMessage());
        }
    }

    /**
     * Convenience: send both in-app and email.
     */
    @Transactional
    public void sendAll(Long userId, NotificationType type, String title, String body, String link,
                        Map<String, Object> templateData) {
        send(userId, type, title, body, link);
        sendEmail(userId, type, templateData);
    }

    private void logNotification(Long userId, NotificationType type, String channel, String status, String errorMessage) {
        NotificationLogEntity logEntity = new NotificationLogEntity();
        logEntity.setUserId(userId);
        logEntity.setType(type.name());
        logEntity.setChannel(channel);
        logEntity.setStatus(status);
        logEntity.setErrorMessage(errorMessage);
        notificationLogRepository.save(logEntity);
    }

    private boolean isSmsEnabledForType(NotificationPreferenceEntity pref, NotificationType type) {
        return switch (type) {
            case BOOKING_CONFIRMED -> pref.isBookingConfirmedSms();
            case CONSULTATION_REMINDER -> pref.isConsultationReminderSms();
            default -> false; // SMS only for booking confirmed and consultation reminder
        };
    }

    private boolean isEmailEnabledForType(NotificationPreferenceEntity pref, NotificationType type) {
        return switch (type) {
            case BOOKING_CONFIRMED -> pref.isBookingConfirmedEmail();
            case CONSULTATION_REMINDER -> pref.isConsultationReminderEmail();
            case CONSULTATION_COMPLETED -> pref.isConsultationCompletedEmail();
            case REFUND_REQUESTED, REFUND_PROCESSED -> pref.isRefundStatusEmail();
            case SETTLEMENT_PAID -> pref.isSettlementPaidEmail();
            case REVIEW_RECEIVED -> pref.isReviewReceivedEmail();
            case NEW_BOOKING -> pref.isNewBookingEmail();
        };
    }
}
