package com.cheonjiyeon.api.payment;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class PaymentDtos {
    public record CreatePaymentRequest(
            @NotNull Long bookingId,
            @NotNull @Min(1000) Long amount,
            @NotBlank @Size(min = 3, max = 3) @Pattern(regexp = "^[A-Z]{3}$") String currency
    ) {}
    public record PaymentResponse(Long id, Long bookingId, Long amount, String currency, String provider, String providerTxId, String status) {}
}
