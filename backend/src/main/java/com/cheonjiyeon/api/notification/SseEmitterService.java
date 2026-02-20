package com.cheonjiyeon.api.notification;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SseEmitterService {
    private static final Logger log = LoggerFactory.getLogger(SseEmitterService.class);
    private static final long SSE_TIMEOUT = 30 * 60 * 1000L; // 30 minutes

    private final Map<Long, SseEmitter> emitters = new ConcurrentHashMap<>();

    public SseEmitter subscribe(Long userId) {
        // Remove existing emitter for this user if present
        SseEmitter existing = emitters.remove(userId);
        if (existing != null) {
            existing.complete();
        }

        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT);

        emitter.onCompletion(() -> {
            log.debug("SSE connection completed for userId={}", userId);
            emitters.remove(userId);
        });
        emitter.onTimeout(() -> {
            log.debug("SSE connection timed out for userId={}", userId);
            emitters.remove(userId);
            emitter.complete();
        });
        emitter.onError(e -> {
            log.debug("SSE connection error for userId={}: {}", userId, e.getMessage());
            emitters.remove(userId);
        });

        emitters.put(userId, emitter);

        // Send initial connection event
        try {
            emitter.send(SseEmitter.event()
                    .name("connect")
                    .data("connected"));
        } catch (IOException e) {
            log.warn("Failed to send initial SSE event for userId={}", userId);
            emitters.remove(userId);
        }

        return emitter;
    }

    public void pushNotification(Long userId, NotificationEntity notification) {
        SseEmitter emitter = emitters.get(userId);
        if (emitter == null) {
            return;
        }

        try {
            emitter.send(SseEmitter.event()
                    .name("notification")
                    .data(Map.of(
                            "id", notification.getId(),
                            "type", notification.getType(),
                            "title", notification.getTitle(),
                            "body", notification.getBody() != null ? notification.getBody() : "",
                            "link", notification.getLink() != null ? notification.getLink() : "",
                            "createdAt", notification.getCreatedAt().toString()
                    )));
        } catch (IOException e) {
            log.debug("Failed to push SSE notification to userId={}, removing emitter", userId);
            emitters.remove(userId);
        }
    }
}
