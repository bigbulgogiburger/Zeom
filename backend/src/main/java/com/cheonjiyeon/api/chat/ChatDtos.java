package com.cheonjiyeon.api.chat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

public class ChatDtos {
    public record SendMessageRequest(
            @NotBlank @Size(max = 2000) String content
    ) {}

    public record ChatMessageResponse(
            Long id,
            Long roomId,
            Long senderId,
            String senderName,
            String senderRole,
            String content,
            LocalDateTime createdAt
    ) {
        public static ChatMessageResponse from(ChatMessageEntity entity) {
            return new ChatMessageResponse(
                    entity.getId(),
                    entity.getRoomId(),
                    entity.getSenderId(),
                    entity.getSenderName(),
                    entity.getSenderRole(),
                    entity.getContent(),
                    entity.getCreatedAt()
            );
        }
    }

    public record ChatRoomResponse(
            Long id,
            Long bookingId,
            String providerRoomId,
            String status
    ) {
        public static ChatRoomResponse from(ChatRoomEntity entity) {
            return new ChatRoomResponse(
                    entity.getId(),
                    entity.getBookingId(),
                    entity.getProviderRoomId(),
                    entity.getStatus()
            );
        }
    }

    public record ChatMessagesResponse(
            List<ChatMessageResponse> messages,
            Long lastMessageId
    ) {}
}
