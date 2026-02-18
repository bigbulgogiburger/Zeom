package com.cheonjiyeon.api.portone;

import com.cheonjiyeon.api.common.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Component
@ConditionalOnProperty(name = "portone.enabled", havingValue = "true")
public class PortOneClient {

    private static final Logger log = LoggerFactory.getLogger(PortOneClient.class);

    private final RestClient restClient;
    private final String apiKey;
    private final String apiSecret;

    public PortOneClient(
            @Value("${portone.base-url:https://api.portone.io}") String baseUrl,
            @Value("${portone.api-key:}") String apiKey,
            @Value("${portone.api-secret:}") String apiSecret,
            @Value("${portone.connect-timeout-ms:3000}") int connectTimeoutMs,
            @Value("${portone.read-timeout-ms:5000}") int readTimeoutMs
    ) {
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;

        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader("Content-Type", MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    /**
     * Prepare payment with PortOne
     * @return paymentId from PortOne
     */
    public String preparePayment(Long amount, String orderId, String customerEmail) {
        log.info("PortOne preparePayment: amount={}, orderId={}, email={}", amount, orderId, customerEmail);

        Map<String, Object> request = Map.of(
                "merchant_uid", orderId,
                "amount", amount,
                "customer_email", customerEmail,
                "api_key", apiKey
        );

        try {
            Map<String, Object> response = restClient.post()
                    .uri("/v1/payments/prepare")
                    .body(request)
                    .retrieve()
                    .onStatus(HttpStatusCode::is4xxClientError, (req, res) -> {
                        log.error("PortOne prepare 4xx error: {}", res.getStatusCode());
                        throw new ApiException(502, "Payment preparation failed: client error");
                    })
                    .onStatus(HttpStatusCode::is5xxServerError, (req, res) -> {
                        log.error("PortOne prepare 5xx error: {}", res.getStatusCode());
                        throw new ApiException(502, "Payment preparation failed: server error");
                    })
                    .body(Map.class);

            if (response == null || !response.containsKey("payment_id")) {
                throw new ApiException(502, "Invalid response from PortOne");
            }

            String paymentId = (String) response.get("payment_id");
            log.info("PortOne payment prepared: paymentId={}", paymentId);
            return paymentId;

        } catch (Exception e) {
            log.error("PortOne preparePayment failed", e);
            throw new ApiException(502, "Failed to prepare payment: " + e.getMessage());
        }
    }

    /**
     * Verify payment status with PortOne
     * @return verification result
     */
    public PaymentVerificationResult verifyPayment(String paymentId) {
        log.info("PortOne verifyPayment: paymentId={}", paymentId);

        try {
            Map<String, Object> response = restClient.get()
                    .uri("/v1/payments/{paymentId}", paymentId)
                    .header("Authorization", "Bearer " + apiSecret)
                    .retrieve()
                    .onStatus(HttpStatusCode::is4xxClientError, (req, res) -> {
                        log.error("PortOne verify 4xx error: {}", res.getStatusCode());
                        throw new ApiException(502, "Payment verification failed: client error");
                    })
                    .onStatus(HttpStatusCode::is5xxServerError, (req, res) -> {
                        log.error("PortOne verify 5xx error: {}", res.getStatusCode());
                        throw new ApiException(502, "Payment verification failed: server error");
                    })
                    .body(Map.class);

            if (response == null) {
                throw new ApiException(502, "Invalid response from PortOne");
            }

            String status = (String) response.getOrDefault("status", "UNKNOWN");
            Long amount = ((Number) response.getOrDefault("amount", 0)).longValue();
            @SuppressWarnings("unchecked")
            Map<String, Object> metadata = (Map<String, Object>) response.getOrDefault("metadata", Map.of());

            log.info("PortOne payment verified: paymentId={}, status={}, amount={}", paymentId, status, amount);
            return new PaymentVerificationResult(paymentId, status, amount, metadata);

        } catch (Exception e) {
            log.error("PortOne verifyPayment failed", e);
            throw new ApiException(502, "Failed to verify payment: " + e.getMessage());
        }
    }

    /**
     * Cancel payment with PortOne
     * @return cancellation result
     */
    public PaymentCancellationResult cancelPayment(String paymentId, String reason) {
        log.info("PortOne cancelPayment: paymentId={}, reason={}", paymentId, reason);

        Map<String, Object> request = Map.of(
                "payment_id", paymentId,
                "reason", reason,
                "api_key", apiKey
        );

        try {
            Map<String, Object> response = restClient.post()
                    .uri("/v1/payments/{paymentId}/cancel", paymentId)
                    .header("Authorization", "Bearer " + apiSecret)
                    .body(request)
                    .retrieve()
                    .onStatus(HttpStatusCode::is4xxClientError, (req, res) -> {
                        log.error("PortOne cancel 4xx error: {}", res.getStatusCode());
                        throw new ApiException(502, "Payment cancellation failed: client error");
                    })
                    .onStatus(HttpStatusCode::is5xxServerError, (req, res) -> {
                        log.error("PortOne cancel 5xx error: {}", res.getStatusCode());
                        throw new ApiException(502, "Payment cancellation failed: server error");
                    })
                    .body(Map.class);

            if (response == null) {
                throw new ApiException(502, "Invalid response from PortOne");
            }

            boolean success = Boolean.TRUE.equals(response.getOrDefault("success", false));
            String message = (String) response.getOrDefault("message", "");

            log.info("PortOne payment cancelled: paymentId={}, success={}", paymentId, success);
            return new PaymentCancellationResult(success, message);

        } catch (Exception e) {
            log.error("PortOne cancelPayment failed", e);
            throw new ApiException(502, "Failed to cancel payment: " + e.getMessage());
        }
    }

    public record PaymentVerificationResult(String paymentId, String status, Long amount, Map<String, Object> metadata) {}
    public record PaymentCancellationResult(boolean success, String message) {}
}
