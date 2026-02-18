package com.cheonjiyeon.api.portone;

import com.cheonjiyeon.api.auth.AuthService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/portone/payments")
@ConditionalOnProperty(name = "portone.enabled", havingValue = "true")
public class PortOnePaymentController {

    private final PortOnePaymentService portOnePaymentService;
    private final AuthService authService;

    public PortOnePaymentController(
            PortOnePaymentService portOnePaymentService,
            AuthService authService
    ) {
        this.portOnePaymentService = portOnePaymentService;
        this.authService = authService;
    }

    @PostMapping("/prepare")
    public PortOnePaymentService.PortOnePrepareResponse preparePayment(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @Valid @RequestBody PreparePaymentRequest request
    ) {
        Long userId = authService.me(authHeader).id();
        return portOnePaymentService.preparePayment(userId, request.productId(), request.customerEmail());
    }

    @PostMapping("/{id}/confirm")
    public PortOnePaymentService.PortOneConfirmResponse confirmPayment(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id
    ) {
        Long userId = authService.me(authHeader).id();
        return portOnePaymentService.confirmPayment(userId, id);
    }

    public record PreparePaymentRequest(
            @NotNull Long productId,
            @NotNull @Email String customerEmail
    ) {}
}
