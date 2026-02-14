package com.cheonjiyeon.api.chat;

import com.cheonjiyeon.api.audit.AuditLogService;
import com.cheonjiyeon.api.chat.provider.ChatProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ChatService {
    private final ChatRoomRepository chatRoomRepository;
    private final ChatProvider chatProvider;
    private final AuditLogService auditLogService;

    public ChatService(ChatRoomRepository chatRoomRepository, ChatProvider chatProvider, AuditLogService auditLogService) {
        this.chatRoomRepository = chatRoomRepository;
        this.chatProvider = chatProvider;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public ChatRoomEntity ensureRoom(Long actorId, Long bookingId, Long userId, Long counselorId) {
        return chatRoomRepository.findByBookingId(bookingId).orElseGet(() -> {
            String roomId = chatProvider.createRoom(bookingId, userId, counselorId);
            ChatRoomEntity room = new ChatRoomEntity();
            room.setBookingId(bookingId);
            room.setProviderRoomId(roomId);
            room.setStatus("OPEN");
            ChatRoomEntity saved = chatRoomRepository.save(room);
            auditLogService.log(actorId, "CHAT_ROOM_CREATED", "CHAT_ROOM", saved.getId());
            return saved;
        });
    }
}
