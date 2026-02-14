package com.cheonjiyeon.api.chat;

import com.cheonjiyeon.api.auth.AuthService;
import com.cheonjiyeon.api.common.ApiException;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/chats")
public class ChatController {
    private final ChatRoomRepository chatRoomRepository;
    private final AuthService authService;

    public ChatController(ChatRoomRepository chatRoomRepository, AuthService authService) {
        this.chatRoomRepository = chatRoomRepository;
        this.authService = authService;
    }

    @GetMapping("/by-booking/{bookingId}")
    public Map<String, Object> byBooking(@RequestHeader(value = "Authorization", required = false) String authHeader,
                                         @PathVariable Long bookingId) {
        authService.me(authHeader);
        ChatRoomEntity room = chatRoomRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new ApiException(404, "상담방을 찾을 수 없습니다."));
        return Map.of(
                "id", room.getId(),
                "bookingId", room.getBookingId(),
                "providerRoomId", room.getProviderRoomId(),
                "status", room.getStatus()
        );
    }
}
