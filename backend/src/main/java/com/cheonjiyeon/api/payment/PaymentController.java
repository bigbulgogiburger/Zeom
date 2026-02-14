package com.cheonjiyeon.api.payment;

import com.cheonjiyeon.api.auth.AuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {
    private final PaymentService paymentService;
    private final AuthService authService;

    public PaymentController(PaymentService paymentService, AuthService authService) {
        this.paymentService = paymentService;
        this.authService = authService;
    }

    @PostMapping
    public PaymentDtos.PaymentResponse create(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @Valid @RequestBody PaymentDtos.CreatePaymentRequest req
    ) {
        Long actor = authService.me(authHeader).id();
        return paymentService.create(actor, req);
    }

    @PostMapping("/{id}/confirm")
    public PaymentDtos.PaymentResponse confirm(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id
    ) {
        Long actor = authService.me(authHeader).id();
        return paymentService.confirm(actor, id);
    }

    @PostMapping("/{id}/cancel")
    public PaymentDtos.PaymentResponse cancel(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id
    ) {
        Long actor = authService.me(authHeader).id();
        return paymentService.cancel(actor, id);
    }

    @GetMapping("/{id}")
    public PaymentDtos.PaymentResponse get(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id
    ) {
        authService.me(authHeader);
        return paymentService.get(id);
    }
}
