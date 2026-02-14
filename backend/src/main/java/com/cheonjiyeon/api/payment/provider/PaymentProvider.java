package com.cheonjiyeon.api.payment.provider;

public interface PaymentProvider {
    String name();
    String prepare(Long paymentId, Long amount, String currency);
    boolean confirm(String providerTxId);
    boolean cancel(String providerTxId);
}
