package com.cheonjiyeon.api.scheduler;

import com.cheonjiyeon.api.alert.AlertWebhookService;
import com.cheonjiyeon.api.booking.BookingEntity;
import com.cheonjiyeon.api.booking.BookingRepository;
import com.cheonjiyeon.api.chat.ChatService;
import com.cheonjiyeon.api.notification.NotificationService;
import com.cheonjiyeon.api.payment.PaymentEntity;
import com.cheonjiyeon.api.payment.PaymentRepository;
import com.cheonjiyeon.api.payment.log.PaymentStatusLogEntity;
import com.cheonjiyeon.api.payment.log.PaymentStatusLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

@Component
@ConditionalOnProperty(name = "scheduler.enabled", havingValue = "true", matchIfMissing = true)
public class PaymentRetryScheduler {

    private static final Logger log = LoggerFactory.getLogger(PaymentRetryScheduler.class);
    private static final int MAX_RETRY_COUNT = 3;
    private static final List<String> RETRY_REASONS = List.of("chat_open_retry_needed", "notification_retry_needed");

    private final PaymentStatusLogRepository paymentStatusLogRepository;
    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final ChatService chatService;
    private final NotificationService notificationService;
    private final AlertWebhookService alertWebhookService;

    public PaymentRetryScheduler(
            PaymentStatusLogRepository paymentStatusLogRepository,
            PaymentRepository paymentRepository,
            BookingRepository bookingRepository,
            ChatService chatService,
            NotificationService notificationService,
            AlertWebhookService alertWebhookService
    ) {
        this.paymentStatusLogRepository = paymentStatusLogRepository;
        this.paymentRepository = paymentRepository;
        this.bookingRepository = bookingRepository;
        this.chatService = chatService;
        this.notificationService = notificationService;
        this.alertWebhookService = alertWebhookService;
    }

    /**
     * Payment retry scheduler
     * Runs every 5 minutes by default
     * Retries failed chat room creation and notification dispatch
     */
    @Scheduled(cron = "${scheduler.payment-retry-cron:0 */5 * * * ?}")
    public void retryFailedPaymentActions() {
        log.debug("Payment retry scheduler triggered");

        List<PaymentStatusLogEntity> retryLogs = paymentStatusLogRepository.findByReasonIn(RETRY_REASONS);
        if (retryLogs.isEmpty()) {
            return;
        }

        // Group by paymentId and reason to count retries and process each
        Map<Long, Map<String, List<PaymentStatusLogEntity>>> grouped = retryLogs.stream()
                .collect(Collectors.groupingBy(
                        PaymentStatusLogEntity::getPaymentId,
                        Collectors.groupingBy(PaymentStatusLogEntity::getReason)
                ));

        for (Map.Entry<Long, Map<String, List<PaymentStatusLogEntity>>> entry : grouped.entrySet()) {
            Long paymentId = entry.getKey();
            Map<String, List<PaymentStatusLogEntity>> reasonMap = entry.getValue();

            Optional<PaymentEntity> paymentOpt = paymentRepository.findById(paymentId);
            if (paymentOpt.isEmpty()) continue;

            PaymentEntity payment = paymentOpt.get();
            if (!"PAID".equals(payment.getStatus())) continue;

            Optional<BookingEntity> bookingOpt = bookingRepository.findById(payment.getBookingId());
            if (bookingOpt.isEmpty()) continue;

            BookingEntity booking = bookingOpt.get();

            // Chat room retry
            if (reasonMap.containsKey("chat_open_retry_needed")) {
                int retryCount = reasonMap.get("chat_open_retry_needed").size();
                if (retryCount >= MAX_RETRY_COUNT) {
                    // Exhausted: log and alert
                    logTransition(paymentId, "PAID", "PAID", "chat_open_retry_exhausted");
                    alertWebhookService.sendFailureEvent("CHAT_OPEN_RETRY_EXHAUSTED",
                            "paymentId=" + paymentId + ", retries=" + retryCount);
                    // Remove the retry-needed logs by replacing them
                    removeRetryLogs(reasonMap.get("chat_open_retry_needed"));
                } else {
                    try {
                        chatService.ensureRoom(0L, booking.getId(), booking.getUser().getId(), booking.getCounselor().getId());
                        logTransition(paymentId, "PAID", "PAID", "chat_open_retried_ok");
                        removeRetryLogs(reasonMap.get("chat_open_retry_needed"));
                        log.info("Chat room retry succeeded for paymentId={}", paymentId);
                    } catch (Exception e) {
                        log.warn("Chat room retry failed for paymentId={}, attempt={}", paymentId, retryCount + 1, e);
                    }
                }
            }

            // Notification retry
            if (reasonMap.containsKey("notification_retry_needed")) {
                int retryCount = reasonMap.get("notification_retry_needed").size();
                if (retryCount >= MAX_RETRY_COUNT) {
                    logTransition(paymentId, "PAID", "PAID", "notification_retry_exhausted");
                    alertWebhookService.sendFailureEvent("NOTIFICATION_RETRY_EXHAUSTED",
                            "paymentId=" + paymentId + ", retries=" + retryCount);
                    removeRetryLogs(reasonMap.get("notification_retry_needed"));
                } else {
                    try {
                        notificationService.notifyPaymentConfirmed(0L, booking.getUser().getEmail(), booking.getId());
                        logTransition(paymentId, "PAID", "PAID", "notification_retried_ok");
                        removeRetryLogs(reasonMap.get("notification_retry_needed"));
                        log.info("Notification retry succeeded for paymentId={}", paymentId);
                    } catch (Exception e) {
                        log.warn("Notification retry failed for paymentId={}, attempt={}", paymentId, retryCount + 1, e);
                    }
                }
            }
        }
    }

    private void logTransition(Long paymentId, String from, String to, String reason) {
        PaymentStatusLogEntity l = new PaymentStatusLogEntity();
        l.setPaymentId(paymentId);
        l.setFromStatus(from);
        l.setToStatus(to);
        l.setReason(reason);
        paymentStatusLogRepository.save(l);
    }

    private void removeRetryLogs(List<PaymentStatusLogEntity> logs) {
        // Update reason to mark as processed so they don't get picked up again
        for (PaymentStatusLogEntity logEntry : logs) {
            logEntry.setReason(logEntry.getReason().replace("_needed", "_processed"));
            paymentStatusLogRepository.save(logEntry);
        }
    }
}
