package com.cheonjiyeon.api.notification.provider;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "notification.provider", havingValue = "fake", matchIfMissing = true)
public class FakeNotificationProvider implements NotificationProvider {
    @Override
    public void send(String to, String title, String body) {
        // noop in fake mode
    }
}
