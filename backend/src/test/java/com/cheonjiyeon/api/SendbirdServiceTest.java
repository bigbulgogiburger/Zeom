package com.cheonjiyeon.api;

import com.cheonjiyeon.api.sendbird.FakeSendbirdClient;
import com.cheonjiyeon.api.sendbird.SendbirdClient;
import com.cheonjiyeon.api.sendbird.SendbirdProvider;
import com.cheonjiyeon.api.sendbird.SendbirdService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * SendbirdService 단위 테스트
 * SendbirdProvider 인터페이스를 mock으로 사용하여 서비스 레이어 로직 검증
 */
@ExtendWith(MockitoExtension.class)
class SendbirdServiceTest {

    @Mock
    private FakeSendbirdClient fakeClient;

    @Mock
    private SendbirdClient realClient;

    @Test
    void createUser_delegates_to_provider() {
        // Given
        SendbirdService serviceWithFake = new SendbirdService(null, fakeClient);
        String userId = "user123";
        String nickname = "테스트유저";

        // When
        serviceWithFake.createUser(userId, nickname);

        // Then
        verify(fakeClient, times(1)).createUser(userId, nickname);
    }

    @Test
    void issueSessionToken_returns_token() {
        // Given
        SendbirdService serviceWithFake = new SendbirdService(null, fakeClient);
        String userId = "user123";
        String expectedToken = "fake-sendbird-token-xyz";
        when(fakeClient.issueSessionToken(userId)).thenReturn(expectedToken);

        // When
        String token = serviceWithFake.issueSessionToken(userId);

        // Then
        assertNotNull(token);
        assertEquals(expectedToken, token);
        verify(fakeClient, times(1)).issueSessionToken(userId);
    }

    @Test
    void createGroupChannel_returns_channel_url() {
        // Given
        SendbirdService serviceWithFake = new SendbirdService(null, fakeClient);
        String channelUrl = "sendbird_group_channel_123_456";
        List<String> userIds = List.of("user123", "counselor456");
        when(fakeClient.createGroupChannel(channelUrl, userIds)).thenReturn(channelUrl);

        // When
        String result = serviceWithFake.createGroupChannel(channelUrl, userIds);

        // Then
        assertNotNull(result);
        assertEquals(channelUrl, result);
        verify(fakeClient, times(1)).createGroupChannel(channelUrl, userIds);
    }

    @Test
    void deleteChannel_delegates_to_provider() {
        // Given
        SendbirdService serviceWithFake = new SendbirdService(null, fakeClient);
        String channelUrl = "sendbird_group_channel_123_456";

        // When
        serviceWithFake.deleteChannel(channelUrl);

        // Then
        verify(fakeClient, times(1)).deleteChannel(channelUrl);
    }

    @Test
    void issueSessionToken_throws_when_provider_fails() {
        // Given
        SendbirdService serviceWithFake = new SendbirdService(null, fakeClient);
        String userId = "user123";
        when(fakeClient.issueSessionToken(userId)).thenThrow(new RuntimeException("Sendbird API error"));

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            serviceWithFake.issueSessionToken(userId);
        });
        assertTrue(exception.getMessage().contains("Sendbird API error"));
    }

    @Test
    void createGroupChannel_throws_when_provider_fails() {
        // Given
        SendbirdService serviceWithFake = new SendbirdService(null, fakeClient);
        String channelUrl = "sendbird_group_channel_123_456";
        List<String> userIds = List.of("user123", "counselor456");
        when(fakeClient.createGroupChannel(channelUrl, userIds))
                .thenThrow(new RuntimeException("Failed to create channel"));

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            serviceWithFake.createGroupChannel(channelUrl, userIds);
        });
        assertTrue(exception.getMessage().contains("Failed to create channel"));
    }

    @Test
    void constructor_throws_when_no_provider_available() {
        // When & Then
        IllegalStateException exception = assertThrows(IllegalStateException.class, () -> {
            new SendbirdService(null, null);
        });
        assertEquals("No Sendbird provider available", exception.getMessage());
    }

    @Test
    void realClient_takes_precedence_over_fakeClient() {
        // Given
        SendbirdService serviceWithBoth = new SendbirdService(realClient, fakeClient);
        String userId = "user123";
        String expectedToken = "real-sendbird-token";
        when(realClient.issueSessionToken(userId)).thenReturn(expectedToken);

        // When
        String token = serviceWithBoth.issueSessionToken(userId);

        // Then
        assertEquals(expectedToken, token);
        verify(realClient, times(1)).issueSessionToken(userId);
        verify(fakeClient, never()).issueSessionToken(anyString());
    }
}
