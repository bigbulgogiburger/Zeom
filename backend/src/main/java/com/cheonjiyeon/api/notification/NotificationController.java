package com.cheonjiyeon.api.notification;

import com.cheonjiyeon.api.auth.AuthService;
import com.cheonjiyeon.api.common.ApiException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {
    private final NotificationRepository notificationRepository;
    private final AuthService authService;
    private final SseEmitterService sseEmitterService;

    public NotificationController(NotificationRepository notificationRepository,
                                  AuthService authService,
                                  SseEmitterService sseEmitterService) {
        this.notificationRepository = notificationRepository;
        this.authService = authService;
        this.sseEmitterService = sseEmitterService;
    }

    @GetMapping
    public Map<String, Object> list(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Long userId = resolveUserId(authHeader);
        Page<NotificationEntity> result = notificationRepository
                .findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(page, Math.min(size, 100)));

        List<Map<String, Object>> items = result.getContent().stream()
                .map(this::toMap)
                .toList();

        return Map.of(
                "content", items,
                "page", result.getNumber(),
                "size", result.getSize(),
                "totalElements", result.getTotalElements(),
                "totalPages", result.getTotalPages()
        );
    }

    @GetMapping("/unread-count")
    public Map<String, Long> unreadCount(
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        Long userId = resolveUserId(authHeader);
        long count = notificationRepository.countByUserIdAndIsRead(userId, false);
        return Map.of("count", count);
    }

    @PutMapping("/{id}/read")
    public Map<String, Object> markAsRead(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id
    ) {
        Long userId = resolveUserId(authHeader);
        NotificationEntity entity = notificationRepository.findById(id)
                .orElseThrow(() -> new ApiException(404, "알림을 찾을 수 없습니다."));

        if (!entity.getUserId().equals(userId)) {
            throw new ApiException(403, "권한이 없습니다.");
        }

        entity.setRead(true);
        notificationRepository.save(entity);
        return toMap(entity);
    }

    @PutMapping("/read-all")
    public Map<String, Object> markAllAsRead(
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        Long userId = resolveUserId(authHeader);
        int updated = notificationRepository.markAllAsReadByUserId(userId);
        return Map.of("updated", updated);
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        Long userId = resolveUserId(authHeader);
        return sseEmitterService.subscribe(userId);
    }

    private Long resolveUserId(String authHeader) {
        return authService.me(authHeader).id();
    }

    private Map<String, Object> toMap(NotificationEntity e) {
        return Map.of(
                "id", e.getId(),
                "type", e.getType(),
                "title", e.getTitle(),
                "body", e.getBody() != null ? e.getBody() : "",
                "link", e.getLink() != null ? e.getLink() : "",
                "isRead", e.isRead(),
                "createdAt", e.getCreatedAt().toString()
        );
    }
}
