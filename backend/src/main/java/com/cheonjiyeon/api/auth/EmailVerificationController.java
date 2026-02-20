package com.cheonjiyeon.api.auth;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class EmailVerificationController {

    private final EmailVerificationService emailVerificationService;
    private final TokenStore tokenStore;

    public EmailVerificationController(EmailVerificationService emailVerificationService,
                                       TokenStore tokenStore) {
        this.emailVerificationService = emailVerificationService;
        this.tokenStore = tokenStore;
    }

    @PostMapping("/verify-email")
    public AuthDtos.MessageResponse verifyEmail(@RequestParam String token) {
        emailVerificationService.verifyEmail(token);
        return new AuthDtos.MessageResponse("이메일이 성공적으로 인증되었습니다.");
    }

    @PostMapping("/resend-verification")
    public AuthDtos.MessageResponse resendVerification(
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        emailVerificationService.resendVerification(authHeader, tokenStore);
        return new AuthDtos.MessageResponse("인증 이메일이 재발송되었습니다.");
    }
}
