package com.cheonjiyeon.api.chat;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessageEntity, Long> {
    List<ChatMessageEntity> findByRoomIdOrderByCreatedAtAsc(Long roomId);
    List<ChatMessageEntity> findByRoomIdAndIdGreaterThanOrderByCreatedAtAsc(Long roomId, Long afterId);
}
