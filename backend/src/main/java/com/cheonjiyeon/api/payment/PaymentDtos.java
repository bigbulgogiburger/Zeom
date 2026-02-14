package com.cheonjiyeon.api.payment;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class PaymentDtos {
    public record CreatePaymentRequest(@NotNull Long bookingId, @NotNull @Min(1000) Long amount, @NotBlank String currency) {}
    public record PaymentResponse(Long id, Long bookingId, Long amount, String currency, String provider, String providerTxId, String status) {}
}
