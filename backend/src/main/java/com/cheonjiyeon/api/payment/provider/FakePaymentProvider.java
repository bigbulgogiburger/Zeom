package com.cheonjiyeon.api.payment.provider;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "payment.provider", havingValue = "fake", matchIfMissing = true)
public class FakePaymentProvider implements PaymentProvider {
    @Override
    public String name() { return "FAKE"; }

    @Override
    public String prepare(Long paymentId, Long amount, String currency) {
        return "fake_tx_" + paymentId;
    }

    @Override
    public boolean confirm(String providerTxId) { return providerTxId != null && providerTxId.startsWith("fake_tx_"); }

    @Override
    public boolean cancel(String providerTxId) { return providerTxId != null && providerTxId.startsWith("fake_tx_"); }
}
