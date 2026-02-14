package com.cheonjiyeon.api.notification.provider;

public interface NotificationProvider {
    void send(String to, String title, String body);
}
