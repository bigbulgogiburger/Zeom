package com.cheonjiyeon.api.sendbird;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Component
@ConditionalOnProperty(name = "sendbird.enabled", havingValue = "false", matchIfMissing = true)
public class FakeSendbirdClient implements SendbirdProvider {
    private static final Logger log = LoggerFactory.getLogger(FakeSendbirdClient.class);

    public void createUser(String userId, String nickname) {
        log.info("[FAKE] Created Sendbird user: {} ({})", userId, nickname);
    }

    public String issueSessionToken(String userId) {
        String fakeToken = "fake-sendbird-token-" + UUID.randomUUID();
        log.info("[FAKE] Issued session token for user {}: {}", userId, fakeToken);
        return fakeToken;
    }

    public String createGroupChannel(String channelUrl, List<String> userIds) {
        log.info("[FAKE] Created group channel: {} with users: {}", channelUrl, userIds);
        return channelUrl;
    }

    public void deleteChannel(String channelUrl) {
        log.info("[FAKE] Deleted channel: {}", channelUrl);
    }

    @Override
    public String getAppId() {
        return "fake-sendbird-app-id";
    }
}
