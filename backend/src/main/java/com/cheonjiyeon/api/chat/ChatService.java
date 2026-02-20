package com.cheonjiyeon.api.chat;

import com.cheonjiyeon.api.audit.AuditLogService;
import com.cheonjiyeon.api.chat.provider.ChatProvider;
import com.cheonjiyeon.api.common.ApiException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ChatService {
    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatProvider chatProvider;
    private final AuditLogService auditLogService;

    public ChatService(ChatRoomRepository chatRoomRepository,
                       ChatMessageRepository chatMessageRepository,
                       ChatProvider chatProvider,
                       AuditLogService auditLogService) {
        this.chatRoomRepository = chatRoomRepository;
        this.chatMessageRepository = chatMessageRepository;
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

    public ChatRoomEntity getRoomByBookingId(Long bookingId) {
        return chatRoomRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new ApiException(404, "채팅방을 찾을 수 없습니다."));
    }

    @Transactional
    public ChatMessageEntity sendMessage(Long roomId, Long senderId, String senderName, String senderRole, String content) {
        ChatRoomEntity room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new ApiException(404, "채팅방을 찾을 수 없습니다."));

        if ("CLOSED".equals(room.getStatus())) {
            throw new ApiException(400, "종료된 상담방에는 메시지를 보낼 수 없습니다.");
        }

        ChatMessageEntity message = new ChatMessageEntity();
        message.setRoomId(roomId);
        message.setSenderId(senderId);
        message.setSenderName(senderName);
        message.setSenderRole(senderRole);
        message.setContent(content);
        return chatMessageRepository.save(message);
    }

    public List<ChatMessageEntity> getMessages(Long roomId, Long afterId) {
        if (afterId != null && afterId > 0) {
            return chatMessageRepository.findByRoomIdAndIdGreaterThanOrderByCreatedAtAsc(roomId, afterId);
        }
        return chatMessageRepository.findByRoomIdOrderByCreatedAtAsc(roomId);
    }

    @Transactional
    public void closeRoom(Long roomId) {
        ChatRoomEntity room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new ApiException(404, "채팅방을 찾을 수 없습니다."));
        room.setStatus("CLOSED");
        chatRoomRepository.save(room);
    }
}
