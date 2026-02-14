package com.cheonjiyeon.api.chat.provider;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Component
@ConditionalOnProperty(name = "chat.provider", havingValue = "http")
public class HttpChatProvider implements ChatProvider {
    private static final Logger log = LoggerFactory.getLogger(HttpChatProvider.class);

    private final RestClient restClient;
    private final String apiKey;

    public HttpChatProvider(
            @Value("${chat.http.base-url:}") String baseUrl,
            @Value("${chat.http.api-key:}") String apiKey
    ) {
        this.restClient = RestClient.builder().baseUrl(baseUrl).build();
        this.apiKey = apiKey;
    }

    @Override
    public String createRoom(Long bookingId, Long userId, Long counselorId) {
        try {
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
        } catch (Exception e) {
            log.error("chat provider createRoom failed. bookingId={}", bookingId, e);
            throw new IllegalStateException("채팅방 생성 호출에 실패했습니다.");
        }
    }
}
