package com.cheonjiyeon.api.chat;

import com.cheonjiyeon.api.auth.AuthService;
import com.cheonjiyeon.api.auth.TokenStore;
import com.cheonjiyeon.api.auth.UserEntity;
import com.cheonjiyeon.api.auth.UserRepository;
import com.cheonjiyeon.api.booking.BookingEntity;
import com.cheonjiyeon.api.booking.BookingRepository;
import com.cheonjiyeon.api.common.ApiException;
import com.cheonjiyeon.api.counselor.CounselorEntity;
import com.cheonjiyeon.api.counselor.CounselorRepository;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/chats")
public class ChatController {
    private final ChatRoomRepository chatRoomRepository;
    private final ChatService chatService;
    private final AuthService authService;
    private final TokenStore tokenStore;
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final CounselorRepository counselorRepository;

    public ChatController(ChatRoomRepository chatRoomRepository,
                          ChatService chatService,
                          AuthService authService,
                          TokenStore tokenStore,
                          UserRepository userRepository,
                          BookingRepository bookingRepository,
                          CounselorRepository counselorRepository) {
        this.chatRoomRepository = chatRoomRepository;
        this.chatService = chatService;
        this.authService = authService;
        this.tokenStore = tokenStore;
        this.userRepository = userRepository;
        this.bookingRepository = bookingRepository;
        this.counselorRepository = counselorRepository;
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

    @GetMapping("/room/{bookingId}")
    public ChatDtos.ChatRoomResponse getRoom(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long bookingId) {
        resolveUser(authHeader);
        ChatRoomEntity room = chatService.getRoomByBookingId(bookingId);
        return ChatDtos.ChatRoomResponse.from(room);
    }

    @PostMapping("/room/{bookingId}/messages")
    public ChatDtos.ChatMessageResponse sendMessage(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long bookingId,
            @Valid @RequestBody ChatDtos.SendMessageRequest req) {
        UserEntity user = resolveUser(authHeader);
        ChatRoomEntity room = chatService.getRoomByBookingId(bookingId);

        BookingEntity booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ApiException(404, "예약을 찾을 수 없습니다."));

        // Determine sender role
        String senderRole;
        CounselorEntity counselor = booking.getCounselor();
        if (counselor.getUserId() != null && counselor.getUserId().equals(user.getId())) {
            senderRole = "COUNSELOR";
        } else if (booking.getUser().getId().equals(user.getId())) {
            senderRole = "USER";
        } else {
            throw new ApiException(403, "이 채팅방에 참여할 수 없습니다.");
        }

        ChatMessageEntity message = chatService.sendMessage(
                room.getId(), user.getId(), user.getName(), senderRole, req.content());
        return ChatDtos.ChatMessageResponse.from(message);
    }

    @GetMapping("/room/{bookingId}/messages")
    public ChatDtos.ChatMessagesResponse getMessages(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long bookingId,
            @RequestParam(required = false) Long afterId) {
        UserEntity user = resolveUser(authHeader);
        ChatRoomEntity room = chatService.getRoomByBookingId(bookingId);

        // Verify the user is a participant
        BookingEntity booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ApiException(404, "예약을 찾을 수 없습니다."));
        CounselorEntity counselor = booking.getCounselor();
        boolean isParticipant = booking.getUser().getId().equals(user.getId())
                || (counselor.getUserId() != null && counselor.getUserId().equals(user.getId()));
        if (!isParticipant) {
            throw new ApiException(403, "이 채팅방에 참여할 수 없습니다.");
        }

        List<ChatMessageEntity> messages = chatService.getMessages(room.getId(), afterId);
        List<ChatDtos.ChatMessageResponse> responses = messages.stream()
                .map(ChatDtos.ChatMessageResponse::from)
                .toList();
        Long lastId = messages.isEmpty() ? (afterId != null ? afterId : 0L) : messages.getLast().getId();
        return new ChatDtos.ChatMessagesResponse(responses, lastId);
    }

    @PostMapping("/room/{bookingId}/close")
    public ChatDtos.ChatRoomResponse closeRoom(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long bookingId) {
        UserEntity user = resolveUser(authHeader);
        ChatRoomEntity room = chatService.getRoomByBookingId(bookingId);

        // Verify the user is a participant
        BookingEntity booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ApiException(404, "예약을 찾을 수 없습니다."));
        CounselorEntity counselor = booking.getCounselor();
        boolean isParticipant = booking.getUser().getId().equals(user.getId())
                || (counselor.getUserId() != null && counselor.getUserId().equals(user.getId()));
        if (!isParticipant) {
            throw new ApiException(403, "이 채팅방에 참여할 수 없습니다.");
        }

        chatService.closeRoom(room.getId());
        ChatRoomEntity closed = chatService.getRoomByBookingId(bookingId);
        return ChatDtos.ChatRoomResponse.from(closed);
    }

    private UserEntity resolveUser(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new ApiException(401, "Authorization Bearer 토큰이 필요합니다.");
        }
        String token = authHeader.substring(7);
        Long userId = tokenStore.resolveAccessUserId(token)
                .orElseThrow(() -> new ApiException(401, "로그인이 필요합니다."));
        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(401, "유효하지 않은 토큰입니다."));
    }
}
