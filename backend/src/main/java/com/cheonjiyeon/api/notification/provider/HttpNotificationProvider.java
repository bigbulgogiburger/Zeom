package com.cheonjiyeon.api.notification.provider;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Component
@ConditionalOnProperty(name = "notification.provider", havingValue = "http")
public class HttpNotificationProvider implements NotificationProvider {
    private static final Logger log = LoggerFactory.getLogger(HttpNotificationProvider.class);

    private final RestClient restClient;
    private final String apiKey;

    public HttpNotificationProvider(
            @Value("${notification.http.base-url:}") String baseUrl,
            @Value("${notification.http.api-key:}") String apiKey
    ) {
        this.restClient = RestClient.builder().baseUrl(baseUrl).build();
        this.apiKey = apiKey;
    }

    @Override
    public void send(String to, String title, String body) {
        try {
            restClient.post()
                    .uri("/notifications/send")
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("X-Api-Key", apiKey)
                    .body(Map.of("to", to, "title", title, "body", body))
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception e) {
            log.error("notification provider send failed. to={}", to, e);
            throw new IllegalStateException("알림 발송 호출에 실패했습니다.");
        }
    }
}
