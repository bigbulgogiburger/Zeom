package com.cheonjiyeon.api.notification;

import com.cheonjiyeon.api.audit.AuditLogService;
import com.cheonjiyeon.api.notification.provider.NotificationProvider;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {
    private final NotificationProvider notificationProvider;
    private final AuditLogService auditLogService;

    public NotificationService(NotificationProvider notificationProvider, AuditLogService auditLogService) {
        this.notificationProvider = notificationProvider;
        this.auditLogService = auditLogService;
    }

    public void notifyPaymentConfirmed(Long actorId, String to, Long bookingId) {
        notificationProvider.send(to, "결제 완료", "예약(" + bookingId + ") 결제가 완료되어 상담방이 열렸습니다.");
        auditLogService.log(actorId, "NOTIFICATION_SENT", "BOOKING", bookingId);
    }
}
