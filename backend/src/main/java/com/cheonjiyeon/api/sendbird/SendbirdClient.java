package com.cheonjiyeon.api.sendbird;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Component
@ConditionalOnProperty(name = "sendbird.enabled", havingValue = "true")
@ConfigurationProperties(prefix = "sendbird")
public class SendbirdClient implements SendbirdProvider {
    private static final Logger log = LoggerFactory.getLogger(SendbirdClient.class);
    private static final int MAX_RETRY_ATTEMPTS = 3;
    private static final long RETRY_BACKOFF_MS = 200;

    private String appId;
    private String apiToken;
    private String baseUrl;
    private int connectTimeoutMs = 3000;
    private int readTimeoutMs = 5000;

    private RestClient restClient;

    public void setAppId(String appId) {
        this.appId = appId;
    }

    public void setApiToken(String apiToken) {
        this.apiToken = apiToken;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public void setConnectTimeoutMs(int connectTimeoutMs) {
        this.connectTimeoutMs = connectTimeoutMs;
    }

    public void setReadTimeoutMs(int readTimeoutMs) {
        this.readTimeoutMs = readTimeoutMs;
    }

    @PostConstruct
    public void init() {
        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(connectTimeoutMs))
                .build();

        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(Duration.ofMillis(readTimeoutMs));

        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(requestFactory)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader("Api-Token", apiToken)
                .build();
        log.info("SendbirdClient initialized with appId={}, baseUrl={}, connectTimeout={}ms, readTimeout={}ms",
                appId, baseUrl, connectTimeoutMs, readTimeoutMs);
    }

    @Override
    public void createUser(String userId, String nickname) {
        Map<String, Object> request = Map.of(
                "user_id", userId,
                "nickname", nickname,
                "profile_url", ""
        );

        try {
            restClient.post()
                    .uri("/v3/users")
                    .body(request)
                    .retrieve()
                    .toBodilessEntity();
            log.info("Created Sendbird user: {}", userId);
        } catch (Exception e) {
            log.warn("Failed to create Sendbird user {} (may already exist): {}", userId, e.getMessage());
        }
    }

    @Override
    public String issueSessionToken(String userId) {
        Exception lastException = null;

        for (int attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
            try {
                Map<String, Object> response = restClient.post()
                        .uri("/v3/users/{user_id}/token", userId)
                        .body(Map.of())
                        .retrieve()
                        .body(Map.class);

                String token = (String) response.get("token");
                log.info("Issued session token for user: {} (attempt {})", userId, attempt);
                return token;
            } catch (Exception e) {
                lastException = e;
                log.warn("Failed to issue session token for user {} (attempt {}/{}): {}",
                        userId, attempt, MAX_RETRY_ATTEMPTS, e.getMessage());

                if (attempt < MAX_RETRY_ATTEMPTS) {
                    try {
                        Thread.sleep(RETRY_BACKOFF_MS * attempt);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw new RuntimeException("Interrupted during retry backoff", ie);
                    }
                }
            }
        }

        log.error("Failed to issue session token for user {} after {} attempts", userId, MAX_RETRY_ATTEMPTS);
        throw new RuntimeException("Failed to issue Sendbird session token after retries", lastException);
    }

    @Override
    public String createGroupChannel(String channelUrl, List<String> userIds) {
        Map<String, Object> request = Map.of(
                "channel_url", channelUrl,
                "user_ids", userIds,
                "is_distinct", false,
                "name", "Consultation Room",
                "custom_type", "consultation"
        );

        Exception lastException = null;

        for (int attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
            try {
                Map<String, Object> response = restClient.post()
                        .uri("/v3/group_channels")
                        .body(request)
                        .retrieve()
                        .body(Map.class);

                String createdUrl = (String) response.get("channel_url");
                log.info("Created Sendbird group channel: {} (attempt {})", createdUrl, attempt);
                return createdUrl;
            } catch (HttpClientErrorException.BadRequest e) {
                String body = e.getResponseBodyAsString();
                if (body.contains("unique constraint") || body.contains("400202")) {
                    log.info("Sendbird channel {} already exists, reusing", channelUrl);
                    return channelUrl;
                }
                lastException = e;
                log.warn("Failed to create group channel {} (attempt {}/{}): {}",
                        channelUrl, attempt, MAX_RETRY_ATTEMPTS, e.getMessage());

                if (attempt < MAX_RETRY_ATTEMPTS) {
                    try {
                        Thread.sleep(RETRY_BACKOFF_MS * attempt);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw new RuntimeException("Interrupted during retry backoff", ie);
                    }
                }
            } catch (Exception e) {
                lastException = e;
                log.warn("Failed to create group channel {} (attempt {}/{}): {}",
                        channelUrl, attempt, MAX_RETRY_ATTEMPTS, e.getMessage());

                if (attempt < MAX_RETRY_ATTEMPTS) {
                    try {
                        Thread.sleep(RETRY_BACKOFF_MS * attempt);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw new RuntimeException("Interrupted during retry backoff", ie);
                    }
                }
            }
        }

        log.error("Failed to create group channel {} after {} attempts", channelUrl, MAX_RETRY_ATTEMPTS);
        throw new RuntimeException("Failed to create Sendbird channel after retries", lastException);
    }

    @Override
    public void deleteChannel(String channelUrl) {
        try {
            restClient.delete()
                    .uri("/v3/group_channels/{channel_url}", channelUrl)
                    .retrieve()
                    .toBodilessEntity();
            log.info("Deleted Sendbird channel: {}", channelUrl);
        } catch (Exception e) {
            log.warn("Failed to delete Sendbird channel {}: {}", channelUrl, e.getMessage());
        }
    }

    @Override
    public void sendAdminMessage(String channelUrl, String message) {
        Map<String, Object> request = Map.of(
                "message_type", "ADMM",
                "message", message
        );

        try {
            restClient.post()
                    .uri("/v3/group_channels/{channel_url}/messages", channelUrl)
                    .body(request)
                    .retrieve()
                    .toBodilessEntity();
            log.info("Sent admin message to channel {}: {}", channelUrl, message);
        } catch (Exception e) {
            log.warn("Failed to send admin message to channel {}: {}", channelUrl, e.getMessage());
        }
    }

    @Override
    public String getAppId() {
        return appId;
    }
}
