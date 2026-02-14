package com.cheonjiyeon.api.notification.provider;

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
@ConditionalOnProperty(name = "notification.provider", havingValue = "http")
public class HttpNotificationProvider implements NotificationProvider {
    private static final Logger log = LoggerFactory.getLogger(HttpNotificationProvider.class);

    private final RestClient restClient;
    private final String apiKey;
    private final int retryAttempts;
    private final long retryBackoffMs;

    public HttpNotificationProvider(
            @Value("${notification.http.base-url:}") String baseUrl,
            @Value("${notification.http.api-key:}") String apiKey,
            @Value("${notification.http.connect-timeout-ms:2000}") int connectTimeoutMs,
            @Value("${notification.http.read-timeout-ms:4000}") int readTimeoutMs,
            @Value("${notification.http.retry-attempts:3}") int retryAttempts,
            @Value("${notification.http.retry-backoff-ms:200}") long retryBackoffMs
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
    public void send(String to, String title, String body) {
        executeWithRetry(() -> {
            restClient.post()
                    .uri("/notifications/send")
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("X-Api-Key", apiKey)
                    .body(Map.of("to", to, "title", title, "body", body))
                    .retrieve()
                    .toBodilessEntity();
            return null;
        }, "send", "to=" + to);
    }

    private <T> T executeWithRetry(Supplier<T> action, String op, String context) {
        RuntimeException last = null;
        for (int attempt = 1; attempt <= Math.max(1, retryAttempts); attempt++) {
            try {
                return action.get();
            } catch (RuntimeException e) {
                last = e;
                log.warn("notification provider {} failed. attempt={}/{} {}", op, attempt, retryAttempts, context);
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
