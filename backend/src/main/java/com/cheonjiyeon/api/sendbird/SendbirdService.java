package com.cheonjiyeon.api.sendbird;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SendbirdService {
    private final SendbirdProvider provider;

    public SendbirdService(
            @Autowired(required = false) SendbirdClient realClient,
            @Autowired(required = false) FakeSendbirdClient fakeClient
    ) {
        if (realClient != null) {
            this.provider = realClient;
        } else if (fakeClient != null) {
            this.provider = fakeClient;
        } else {
            throw new IllegalStateException("No Sendbird provider available");
        }
    }

    public void createUser(String userId, String nickname) {
        provider.createUser(userId, nickname);
    }

    public String issueSessionToken(String userId) {
        return provider.issueSessionToken(userId);
    }

    public String createGroupChannel(String channelUrl, List<String> userIds) {
        return provider.createGroupChannel(channelUrl, userIds);
    }

    public void deleteChannel(String channelUrl) {
        provider.deleteChannel(channelUrl);
    }

    public void sendAdminMessage(String channelUrl, String message) {
        provider.sendAdminMessage(channelUrl, message);
    }

    public String getAppId() {
        return provider.getAppId();
    }
}
