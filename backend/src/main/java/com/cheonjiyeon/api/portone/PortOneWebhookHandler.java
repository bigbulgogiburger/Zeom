package com.cheonjiyeon.api.portone;

import com.cheonjiyeon.api.alert.AlertWebhookService;
import com.cheonjiyeon.api.common.ApiException;
import com.cheonjiyeon.api.wallet.WalletService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/payments/webhooks/portone")
@ConditionalOnProperty(name = "portone.enabled", havingValue = "true")
public class PortOneWebhookHandler {

    private static final Logger log = LoggerFactory.getLogger(PortOneWebhookHandler.class);

    private final String webhookSecret;
    private final WalletService walletService;
    private final PortOnePaymentService portOnePaymentService;
    private final AlertWebhookService alertWebhookService;

    public PortOneWebhookHandler(
            @Value("${portone.webhook-secret:}") String webhookSecret,
            WalletService walletService,
            PortOnePaymentService portOnePaymentService,
            AlertWebhookService alertWebhookService
    ) {
        this.webhookSecret = webhookSecret;
        this.walletService = walletService;
        this.portOnePaymentService = portOnePaymentService;
        this.alertWebhookService = alertWebhookService;
    }

    @PostMapping
    public Map<String, Object> handleWebhook(
            @RequestHeader(value = "X-Portone-Signature", required = false) String signature,
            @RequestBody Map<String, Object> payload
    ) {
        log.info("Received PortOne webhook: {}", payload);

        // Verify webhook signature
        if (webhookSecret != null && !webhookSecret.isBlank()) {
            if (!verifySignature(signature, payload)) {
                log.error("Invalid webhook signature");
                throw new ApiException(401, "Invalid webhook signature");
            }
        }

        String eventType = (String) payload.getOrDefault("event_type", "");
        String paymentId = (String) payload.getOrDefault("payment_id", "");
        String merchantUid = (String) payload.getOrDefault("merchant_uid", "");

        log.info("Processing webhook: eventType={}, paymentId={}, merchantUid={}", eventType, paymentId, merchantUid);

        // Idempotency check - query payment status logs
        if (portOnePaymentService.isWebhookAlreadyProcessed(merchantUid, eventType)) {
            log.info("Webhook already processed (idempotent): merchantUid={}, eventType={}", merchantUid, eventType);
            return Map.of("status", "already_processed");
        }

        try {
            switch (eventType.toUpperCase()) {
                case "PAID":
                case "PAYMENT_COMPLETE":
                    portOnePaymentService.handlePaymentPaid(merchantUid, paymentId, payload);
                    break;

                case "FAILED":
                case "PAYMENT_FAILED":
                    portOnePaymentService.handlePaymentFailed(merchantUid, paymentId, payload);
                    break;

                case "CANCELED":
                case "PAYMENT_CANCELED":
                    portOnePaymentService.handlePaymentCanceled(merchantUid, paymentId, payload);
                    break;

                default:
                    log.warn("Unknown webhook event type: {}", eventType);
                    return Map.of("status", "ignored", "reason", "unknown_event_type");
            }

            return Map.of("status", "processed");

        } catch (Exception e) {
            log.error("Webhook processing failed: merchantUid={}, eventType={}", merchantUid, eventType, e);
            alertWebhookService.sendFailureEvent(
                    "PORTONE_WEBHOOK_FAIL",
                    "merchantUid=" + merchantUid + ", eventType=" + eventType + ", error=" + e.getMessage()
            );
            throw new ApiException(500, "Webhook processing failed");
        }
    }

    private boolean verifySignature(String signature, Map<String, Object> payload) {
        if (signature == null || signature.isBlank()) {
            return false;
        }

        try {
            String payloadStr = payload.toString();
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(
                    webhookSecret.getBytes(StandardCharsets.UTF_8),
                    "HmacSHA256"
            );
            mac.init(secretKeySpec);
            byte[] hash = mac.doFinal(payloadStr.getBytes(StandardCharsets.UTF_8));
            String computed = Base64.getEncoder().encodeToString(hash);

            return signature.equals(computed);

        } catch (Exception e) {
            log.error("Signature verification failed", e);
            return false;
        }
    }
}
