package com.cheonjiyeon.api.notification;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnProperty(name = "email.provider", havingValue = "fake", matchIfMissing = true)
public class FakeEmailService implements EmailService {
    private static final Logger log = LoggerFactory.getLogger(FakeEmailService.class);

    @Override
    public void send(String to, String subject, String htmlBody) {
        log.info("[FAKE EMAIL] to={}, subject={}", to, subject);
    }
}
