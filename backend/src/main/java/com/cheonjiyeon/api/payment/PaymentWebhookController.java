package com.cheonjiyeon.api.payment;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/payments/webhooks")
public class PaymentWebhookController {
    private final PaymentService paymentService;
    private final String webhookSecret;

    public PaymentWebhookController(PaymentService paymentService,
                                    @Value("${payment.webhook-secret:}") String webhookSecret) {
        this.paymentService = paymentService;
        this.webhookSecret = webhookSecret;
    }

    public record PaymentWebhookRequest(
            @NotBlank String providerTxId,
            @NotBlank String eventType
    ) {}

    @PostMapping("/provider")
    public ResponseEntity<Void> receive(
            @RequestHeader(value = "X-Webhook-Secret", required = false) String secret,
            @Valid @RequestBody PaymentWebhookRequest req
    ) {
        if (webhookSecret != null && !webhookSecret.isBlank() && !webhookSecret.equals(secret)) {
            return ResponseEntity.status(401).build();
        }
        paymentService.handleWebhook(req.providerTxId(), req.eventType());
        return ResponseEntity.accepted().build();
    }
}
