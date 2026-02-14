package com.cheonjiyeon.api.alert;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.LocalDateTime;
import java.util.Map;

@Service
public class AlertWebhookService {
    private final String webhookUrl;
    private final RestClient restClient = RestClient.create();

    public AlertWebhookService(@Value("${alerts.webhook-url:}") String webhookUrl) {
        this.webhookUrl = webhookUrl;
    }

    public void sendFailureEvent(String event, String message) {
        if (webhookUrl == null || webhookUrl.isBlank()) return;
        try {
            restClient.post()
                    .uri(webhookUrl)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "text", "[ZEOM ALERT] " + event + "\n" + message + "\n" + LocalDateTime.now()
                    ))
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception ignored) {
        }
    }
}
