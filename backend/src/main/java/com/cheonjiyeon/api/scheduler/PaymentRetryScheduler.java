package com.cheonjiyeon.api.scheduler;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "scheduler.enabled", havingValue = "true", matchIfMissing = true)
public class PaymentRetryScheduler {

    private static final Logger log = LoggerFactory.getLogger(PaymentRetryScheduler.class);

    /**
     * Payment retry scheduler
     * Runs every 5 minutes by default
     * Retries failed chat room creation and notification dispatch
     */
    @Scheduled(cron = "${scheduler.payment-retry-cron:0 */5 * * * ?}")
    public void retryFailedPaymentActions() {
        log.debug("Payment retry scheduler triggered");

        // TODO: Implementation pending
        // 1. Query PaymentStatusLog for chat_retry_needed, notification_retry_needed
        // 2. Execute retry logic for each item
        // 3. Update status log on success
        // 4. Dispatch alert webhook on failure
    }
}
