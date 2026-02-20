package com.cheonjiyeon.api.notification;

public interface EmailService {
    void send(String to, String subject, String htmlBody);
}
