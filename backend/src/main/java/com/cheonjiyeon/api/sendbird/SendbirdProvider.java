package com.cheonjiyeon.api.sendbird;

import java.util.List;

/**
 * Interface for Sendbird chat provider operations.
 * Implementations: SendbirdClient (real), FakeSendbirdClient (test/dev)
 */
public interface SendbirdProvider {
    /**
     * Create a user in Sendbird
     */
    void createUser(String userId, String nickname);

    /**
     * Issue a session token for a user
     */
    String issueSessionToken(String userId);

    /**
     * Create a group channel
     */
    String createGroupChannel(String channelUrl, List<String> userIds);

    /**
     * Delete a channel
     */
    void deleteChannel(String channelUrl);

    /**
     * Get the Sendbird app ID
     */
    String getAppId();
}
