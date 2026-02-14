package com.cheonjiyeon.api.chat.provider;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "chat.provider", havingValue = "fake", matchIfMissing = true)
public class FakeChatProvider implements ChatProvider {
    @Override
    public String createRoom(Long bookingId, Long userId, Long counselorId) {
        return "fake_room_" + bookingId;
    }
}
