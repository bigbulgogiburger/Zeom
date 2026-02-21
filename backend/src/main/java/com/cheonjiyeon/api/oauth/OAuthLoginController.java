package com.cheonjiyeon.api.oauth;

import com.cheonjiyeon.api.auth.AuthDtos;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth/oauth")
public class OAuthLoginController {

    private final OAuthLoginService oAuthLoginService;

    public OAuthLoginController(OAuthLoginService oAuthLoginService) {
        this.oAuthLoginService = oAuthLoginService;
    }

    public record OAuthLoginRequest(
            @NotBlank String provider,
            @NotBlank String code,
            String redirectUri,
            String deviceId,
            String deviceName
    ) {}

    @PostMapping("/login")
    public AuthDtos.AuthResponse oauthLogin(@Valid @RequestBody OAuthLoginRequest req) {
        return oAuthLoginService.authenticateWithOAuth(
                req.provider(), req.code(), req.redirectUri(),
                req.deviceId(), req.deviceName());
    }
}
