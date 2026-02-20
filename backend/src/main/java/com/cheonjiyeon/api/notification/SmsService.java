package com.cheonjiyeon.api.notification;

public interface SmsService {
    void sendSms(String phoneNumber, String message);
}
