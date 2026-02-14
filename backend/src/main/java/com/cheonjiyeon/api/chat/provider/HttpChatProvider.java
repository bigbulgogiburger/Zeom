package com.cheonjiyeon.api.chat.provider;

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
@ConditionalOnProperty(name = "chat.provider", havingValue = "http")
public class HttpChatProvider implements ChatProvider {
    private static final Logger log = LoggerFactory.getLogger(HttpChatProvider.class);

    private final RestClient restClient;
    private final String apiKey;
    private final int retryAttempts;
    private final long retryBackoffMs;

    public HttpChatProvider(
            @Value("${chat.http.base-url:}") String baseUrl,
            @Value("${chat.http.api-key:}") String apiKey,
            @Value("${chat.http.connect-timeout-ms:2000}") int connectTimeoutMs,
            @Value("${chat.http.read-timeout-ms:4000}") int readTimeoutMs,
            @Value("${chat.http.retry-attempts:3}") int retryAttempts,
            @Value("${chat.http.retry-backoff-ms:200}") long retryBackoffMs
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
    public String createRoom(Long bookingId, Long userId, Long counselorId) {
        return executeWithRetry(() -> {
            Map<String, Object> res = restClient.post()
                    .uri("/chat/rooms")
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("X-Api-Key", apiKey)
                    .body(Map.of("bookingId", bookingId, "userId", userId, "counselorId", counselorId))
                    .retrieve()
                    .body(Map.class);
            Object roomId = res == null ? null : res.get("roomId");
            if (roomId == null) throw new IllegalStateException("roomId missing");
            return roomId.toString();
        }, "createRoom", "bookingId=" + bookingId);
    }

    private <T> T executeWithRetry(Supplier<T> action, String op, String context) {
        RuntimeException last = null;
        for (int attempt = 1; attempt <= Math.max(1, retryAttempts); attempt++) {
            try {
                return action.get();
            } catch (RuntimeException e) {
                last = e;
                log.warn("chat provider {} failed. attempt={}/{} {}", op, attempt, retryAttempts, context);
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
