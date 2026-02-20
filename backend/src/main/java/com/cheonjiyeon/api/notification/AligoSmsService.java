package com.cheonjiyeon.api.notification;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

@Service
@ConditionalOnProperty(name = "sms.provider", havingValue = "aligo")
public class AligoSmsService implements SmsService {
    private static final Logger log = LoggerFactory.getLogger(AligoSmsService.class);
    private static final String ALIGO_SEND_URL = "https://apis.aligo.in/send/";

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${sms.aligo.api-key}")
    private String apiKey;

    @Value("${sms.aligo.user-id}")
    private String userId;

    @Value("${sms.aligo.sender}")
    private String sender;

    @Override
    public void sendSms(String phoneNumber, String message) {
        try {
            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("key", apiKey);
            params.add("user_id", userId);
            params.add("sender", sender);
            params.add("receiver", phoneNumber);
            params.add("msg", message);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(ALIGO_SEND_URL, request, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("SMS sent successfully: to={}", phoneNumber);
            } else {
                log.error("SMS send failed: to={}, status={}, body={}", phoneNumber, response.getStatusCode(), response.getBody());
            }
        } catch (Exception e) {
            log.error("SMS send error: to={}, error={}", phoneNumber, e.getMessage());
            throw new RuntimeException("SMS 발송 실패: " + e.getMessage(), e);
        }
    }
}
