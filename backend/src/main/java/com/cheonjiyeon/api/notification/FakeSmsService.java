package com.cheonjiyeon.api.notification;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnProperty(name = "sms.provider", havingValue = "fake", matchIfMissing = true)
public class FakeSmsService implements SmsService {
    private static final Logger log = LoggerFactory.getLogger(FakeSmsService.class);

    @Override
    public void sendSms(String phoneNumber, String message) {
        log.info("[FAKE SMS] to={}, message={}", phoneNumber, message);
    }
}
