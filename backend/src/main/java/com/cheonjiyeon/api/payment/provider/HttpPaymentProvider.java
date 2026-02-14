package com.cheonjiyeon.api.payment.provider;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Component
@ConditionalOnProperty(name = "payment.provider", havingValue = "http")
public class HttpPaymentProvider implements PaymentProvider {
    private static final Logger log = LoggerFactory.getLogger(HttpPaymentProvider.class);

    private final RestClient restClient;
    private final String apiKey;

    public HttpPaymentProvider(
            @Value("${payment.http.base-url:}") String baseUrl,
            @Value("${payment.http.api-key:}") String apiKey
    ) {
        this.restClient = RestClient.builder().baseUrl(baseUrl).build();
        this.apiKey = apiKey;
    }

    @Override
    public String name() {
        return "HTTP";
    }

    @Override
    public String prepare(Long paymentId, Long amount, String currency) {
        try {
            Map<String, Object> res = restClient.post()
                    .uri("/payments/prepare")
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("X-Api-Key", apiKey)
                    .body(Map.of("paymentId", paymentId, "amount", amount, "currency", currency))
                    .retrieve()
                    .body(Map.class);
            Object tx = res == null ? null : res.get("providerTxId");
            if (tx == null) throw new IllegalStateException("providerTxId missing");
            return tx.toString();
        } catch (Exception e) {
            log.error("payment provider prepare failed. paymentId={}", paymentId, e);
            throw new IllegalStateException("실결제 준비 호출에 실패했습니다.");
        }
    }

    @Override
    public boolean confirm(String providerTxId) {
        try {
            Map<String, Object> res = restClient.post()
                    .uri("/payments/confirm")
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("X-Api-Key", apiKey)
                    .body(Map.of("providerTxId", providerTxId))
                    .retrieve()
                    .body(Map.class);
            return Boolean.TRUE.equals(res == null ? null : res.get("ok"));
        } catch (Exception e) {
            log.error("payment provider confirm failed. providerTxId={}", providerTxId, e);
            return false;
        }
    }

    @Override
    public boolean cancel(String providerTxId) {
        try {
            Map<String, Object> res = restClient.post()
                    .uri("/payments/cancel")
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("X-Api-Key", apiKey)
                    .body(Map.of("providerTxId", providerTxId))
                    .retrieve()
                    .body(Map.class);
            return Boolean.TRUE.equals(res == null ? null : res.get("ok"));
        } catch (Exception e) {
            log.error("payment provider cancel failed. providerTxId={}", providerTxId, e);
            return false;
        }
    }
}
