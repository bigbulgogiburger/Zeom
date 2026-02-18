package com.cheonjiyeon.api.portone;

import com.cheonjiyeon.api.alert.AlertWebhookService;
import com.cheonjiyeon.api.audit.AuditLogService;
import com.cheonjiyeon.api.common.ApiException;
import com.cheonjiyeon.api.payment.PaymentEntity;
import com.cheonjiyeon.api.payment.PaymentRepository;
import com.cheonjiyeon.api.payment.log.PaymentStatusLogEntity;
import com.cheonjiyeon.api.payment.log.PaymentStatusLogRepository;
import com.cheonjiyeon.api.product.ProductEntity;
import com.cheonjiyeon.api.product.ProductRepository;
import com.cheonjiyeon.api.wallet.WalletService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@ConditionalOnProperty(name = "portone.enabled", havingValue = "true")
public class PortOnePaymentService {

    private static final Logger log = LoggerFactory.getLogger(PortOnePaymentService.class);

    private final PortOneClient portOneClient;
    private final PaymentRepository paymentRepository;
    private final PaymentStatusLogRepository paymentStatusLogRepository;
    private final ProductRepository productRepository;
    private final WalletService walletService;
    private final AuditLogService auditLogService;
    private final AlertWebhookService alertWebhookService;

    public PortOnePaymentService(
            PortOneClient portOneClient,
            PaymentRepository paymentRepository,
            PaymentStatusLogRepository paymentStatusLogRepository,
            ProductRepository productRepository,
            WalletService walletService,
            AuditLogService auditLogService,
            AlertWebhookService alertWebhookService
    ) {
        this.portOneClient = portOneClient;
        this.paymentRepository = paymentRepository;
        this.paymentStatusLogRepository = paymentStatusLogRepository;
        this.productRepository = productRepository;
        this.walletService = walletService;
        this.auditLogService = auditLogService;
        this.alertWebhookService = alertWebhookService;
    }

    /**
     * Prepare payment for product purchase
     */
    @Transactional
    public PortOnePrepareResponse preparePayment(Long userId, Long productId, String customerEmail) {
        ProductEntity product = productRepository.findById(productId)
                .orElseThrow(() -> new ApiException(404, "Product not found"));

        if (!product.getActive()) {
            throw new ApiException(400, "Product is not active");
        }

        // Create payment record
        PaymentEntity payment = new PaymentEntity();
        payment.setBookingId(null); // No booking for cash top-up
        payment.setAmount(product.getPriceKrw());
        payment.setCurrency("KRW");
        payment.setProvider("PORTONE");
        payment.setStatus("PENDING");

        PaymentEntity saved = paymentRepository.save(payment);
        String orderId = "order-" + saved.getId();

        // Call PortOne to prepare payment
        String paymentId = portOneClient.preparePayment(product.getPriceKrw(), orderId, customerEmail);
        saved.setProviderTxId(paymentId);
        paymentRepository.save(saved);

        logTransition(saved.getId(), null, "PENDING", "portone_prepare_ok");
        auditLogService.log(userId, "PORTONE_PAYMENT_PREPARED", "PAYMENT", saved.getId());

        return new PortOnePrepareResponse(
                saved.getId(),
                paymentId,
                orderId,
                product.getPriceKrw(),
                product.getCashAmount()
        );
    }

    /**
     * Confirm payment with PortOne verification
     */
    @Transactional
    public PortOneConfirmResponse confirmPayment(Long userId, Long paymentId) {
        PaymentEntity payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ApiException(404, "Payment not found"));

        if (!"PENDING".equals(payment.getStatus())) {
            throw new ApiException(409, "Payment is not in PENDING status");
        }

        // Verify with PortOne
        PortOneClient.PaymentVerificationResult verification =
                portOneClient.verifyPayment(payment.getProviderTxId());

        if (!"PAID".equals(verification.status())) {
            String prev = payment.getStatus();
            payment.setStatus("FAILED");
            paymentRepository.save(payment);
            logTransition(payment.getId(), prev, "FAILED", "portone_verify_not_paid");
            throw new ApiException(409, "Payment verification failed: status=" + verification.status());
        }

        if (!payment.getAmount().equals(verification.amount())) {
            alertWebhookService.sendFailureEvent(
                    "PORTONE_AMOUNT_MISMATCH",
                    "paymentId=" + paymentId + ", expected=" + payment.getAmount() + ", actual=" + verification.amount()
            );
            throw new ApiException(409, "Payment amount mismatch");
        }

        // Update payment status
        String prev = payment.getStatus();
        payment.setStatus("PAID");
        paymentRepository.save(payment);
        logTransition(payment.getId(), prev, "PAID", "portone_confirm_ok");

        // Credit wallet with cash amount from metadata
        Long productId = extractProductId(verification.metadata());
        if (productId != null) {
            ProductEntity product = productRepository.findById(productId).orElse(null);
            if (product != null) {
                walletService.charge(userId, product.getCashAmount(), "PORTONE_PAYMENT", payment.getId());
                log.info("Wallet charged: userId={}, amount={}, paymentId={}", userId, product.getCashAmount(), payment.getId());
            }
        }

        auditLogService.log(userId, "PORTONE_PAYMENT_CONFIRMED", "PAYMENT", payment.getId());

        return new PortOneConfirmResponse(
                payment.getId(),
                payment.getProviderTxId(),
                payment.getAmount(),
                payment.getStatus()
        );
    }

    /**
     * Handle PAID webhook event (idempotent with confirm)
     */
    @Transactional
    public void handlePaymentPaid(String merchantUid, String paymentId, Map<String, Object> payload) {
        log.info("Handling PAID webhook: merchantUid={}, paymentId={}", merchantUid, paymentId);

        PaymentEntity payment = paymentRepository.findByProviderTxId(paymentId)
                .orElseThrow(() -> new ApiException(404, "Payment not found for paymentId=" + paymentId));

        if ("PAID".equals(payment.getStatus())) {
            log.info("Payment already PAID (idempotent): paymentId={}", payment.getId());
            return;
        }

        String prev = payment.getStatus();
        payment.setStatus("PAID");
        paymentRepository.save(payment);
        logTransition(payment.getId(), prev, "PAID", "webhook_paid");

        // Extract userId and productId from payload or metadata
        Long userId = extractUserId(payload);
        Long productId = extractProductId(payload);

        if (userId != null && productId != null) {
            ProductEntity product = productRepository.findById(productId).orElse(null);
            if (product != null) {
                walletService.charge(userId, product.getCashAmount(), "PORTONE_WEBHOOK", payment.getId());
                log.info("Wallet charged via webhook: userId={}, amount={}, paymentId={}",
                        userId, product.getCashAmount(), payment.getId());
            }
        }
    }

    /**
     * Handle FAILED webhook event
     */
    @Transactional
    public void handlePaymentFailed(String merchantUid, String paymentId, Map<String, Object> payload) {
        log.info("Handling FAILED webhook: merchantUid={}, paymentId={}", merchantUid, paymentId);

        PaymentEntity payment = paymentRepository.findByProviderTxId(paymentId)
                .orElseThrow(() -> new ApiException(404, "Payment not found for paymentId=" + paymentId));

        String prev = payment.getStatus();
        payment.setStatus("FAILED");
        paymentRepository.save(payment);
        logTransition(payment.getId(), prev, "FAILED", "webhook_failed");

        alertWebhookService.sendFailureEvent("PORTONE_PAYMENT_FAILED", "paymentId=" + payment.getId());
    }

    /**
     * Handle CANCELED webhook event - refund wallet if already charged
     */
    @Transactional
    public void handlePaymentCanceled(String merchantUid, String paymentId, Map<String, Object> payload) {
        log.info("Handling CANCELED webhook: merchantUid={}, paymentId={}", merchantUid, paymentId);

        PaymentEntity payment = paymentRepository.findByProviderTxId(paymentId)
                .orElseThrow(() -> new ApiException(404, "Payment not found for paymentId=" + paymentId));

        String prev = payment.getStatus();
        if ("PAID".equals(prev)) {
            // Refund wallet
            Long userId = extractUserId(payload);
            Long productId = extractProductId(payload);

            if (userId != null && productId != null) {
                ProductEntity product = productRepository.findById(productId).orElse(null);
                if (product != null) {
                    walletService.refund(userId, product.getCashAmount(), "PORTONE_CANCEL", payment.getId());
                    log.info("Wallet refunded: userId={}, amount={}, paymentId={}",
                            userId, product.getCashAmount(), payment.getId());
                }
            }
        }

        payment.setStatus("CANCELED");
        paymentRepository.save(payment);
        logTransition(payment.getId(), prev, "CANCELED", "webhook_canceled");
    }

    /**
     * Check if webhook already processed (idempotency)
     */
    public boolean isWebhookAlreadyProcessed(String merchantUid, String eventType) {
        // Parse payment ID from merchantUid (format: "order-{paymentId}")
        if (merchantUid == null || !merchantUid.startsWith("order-")) {
            return false;
        }

        try {
            Long paymentId = Long.parseLong(merchantUid.substring(6));
            PaymentEntity payment = paymentRepository.findById(paymentId).orElse(null);
            if (payment == null) {
                return false;
            }

            String reason = "webhook_" + eventType.toLowerCase();
            List<PaymentStatusLogEntity> logs = paymentStatusLogRepository
                    .findByPaymentIdOrderByIdAsc(paymentId);

            return logs.stream().anyMatch(log -> reason.equals(log.getReason()));

        } catch (NumberFormatException e) {
            log.warn("Invalid merchantUid format: {}", merchantUid);
            return false;
        }
    }

    private void logTransition(Long paymentId, String from, String to, String reason) {
        PaymentStatusLogEntity log = new PaymentStatusLogEntity();
        log.setPaymentId(paymentId);
        log.setFromStatus(from);
        log.setToStatus(to);
        log.setReason(reason);
        paymentStatusLogRepository.save(log);
    }

    private Long extractUserId(Map<String, Object> payload) {
        Object metadata = payload.get("metadata");
        if (metadata instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> meta = (Map<String, Object>) metadata;
            Object userId = meta.get("user_id");
            if (userId instanceof Number) {
                return ((Number) userId).longValue();
            }
        }
        return null;
    }

    private Long extractProductId(Map<String, Object> payload) {
        Object metadata = payload.get("metadata");
        if (metadata instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> meta = (Map<String, Object>) metadata;
            Object productId = meta.get("product_id");
            if (productId instanceof Number) {
                return ((Number) productId).longValue();
            }
        }
        return null;
    }

    public record PortOnePrepareResponse(Long paymentId, String portonePaymentId, String orderId, Long amount, Long cashAmount) {}
    public record PortOneConfirmResponse(Long paymentId, String portonePaymentId, Long amount, String status) {}
}
