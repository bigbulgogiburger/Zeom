package com.cheonjiyeon.api.chat.provider;

public interface ChatProvider {
    String createRoom(Long bookingId, Long userId, Long counselorId);
}
