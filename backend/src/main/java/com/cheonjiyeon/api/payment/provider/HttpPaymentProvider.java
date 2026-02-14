package com.cheonjiyeon.api.payment.provider;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Map;
import java.util.function.Supplier;

@Component
@ConditionalOnProperty(name = "payment.provider", havingValue = "http")
public class HttpPaymentProvider implements PaymentProvider {
    private static final Logger log = LoggerFactory.getLogger(HttpPaymentProvider.class);

    private final RestClient restClient;
    private final String apiKey;
    private final int retryAttempts;
    private final long retryBackoffMs;

    public HttpPaymentProvider(
            @Value("${payment.http.base-url:}") String baseUrl,
            @Value("${payment.http.api-key:}") String apiKey,
            @Value("${payment.http.connect-timeout-ms:2000}") int connectTimeoutMs,
            @Value("${payment.http.read-timeout-ms:4000}") int readTimeoutMs,
            @Value("${payment.http.retry-attempts:3}") int retryAttempts,
            @Value("${payment.http.retry-backoff-ms:200}") long retryBackoffMs
    ) {
        SimpleClientHttpRequestFactory rf = new SimpleClientHttpRequestFactory();
        rf.setConnectTimeout(connectTimeoutMs);
        rf.setReadTimeout(readTimeoutMs);

        this.restClient = RestClient.builder().baseUrl(baseUrl).requestFactory(rf).build();
        this.apiKey = apiKey;
        this.retryAttempts = retryAttempts;
        this.retryBackoffMs = retryBackoffMs;
    }

    @Override
    public String name() {
        return "HTTP";
    }

    @Override
    public String prepare(Long paymentId, Long amount, String currency) {
        return executeWithRetry(() -> {
            Map<String, Object> res = restClient.post()
                    .uri("/payments/prepare")
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("X-Api-Key", apiKey)
                    .body(Map.of("paymentId", paymentId, "amount", amount, "currency", currency))
                    .retrieve()
                    .body(Map.class);
            Object tx = res == null ? null : res.get("providerTxId");
            if (tx == null) throw new IllegalStateException("providerTxId missing");
            return tx.toString();
        }, "prepare", "paymentId=" + paymentId);
    }

    @Override
    public boolean confirm(String providerTxId) {
        try {
            return executeWithRetry(() -> {
                Map<String, Object> res = restClient.post()
                        .uri("/payments/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Api-Key", apiKey)
                        .body(Map.of("providerTxId", providerTxId))
                        .retrieve()
                        .body(Map.class);
                return Boolean.TRUE.equals(res == null ? null : res.get("ok"));
            }, "confirm", "providerTxId=" + providerTxId);
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public boolean cancel(String providerTxId) {
        try {
            return executeWithRetry(() -> {
                Map<String, Object> res = restClient.post()
                        .uri("/payments/cancel")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Api-Key", apiKey)
                        .body(Map.of("providerTxId", providerTxId))
                        .retrieve()
                        .body(Map.class);
                return Boolean.TRUE.equals(res == null ? null : res.get("ok"));
            }, "cancel", "providerTxId=" + providerTxId);
        } catch (Exception e) {
            return false;
        }
    }

    private <T> T executeWithRetry(Supplier<T> action, String op, String context) {
        RuntimeException last = null;
        for (int attempt = 1; attempt <= Math.max(1, retryAttempts); attempt++) {
            try {
                return action.get();
            } catch (RuntimeException e) {
                last = e;
                log.warn("payment provider {} failed. attempt={}/{} {}", op, attempt, retryAttempts, context);
                if (attempt < retryAttempts && retryBackoffMs > 0) {
                    try {
                        Thread.sleep(retryBackoffMs);
                    } catch (InterruptedException ignored) {
                        Thread.currentThread().interrupt();
                    }
                }
            }
        }
        throw last == null ? new IllegalStateException("provider call failed") : last;
    }
}
