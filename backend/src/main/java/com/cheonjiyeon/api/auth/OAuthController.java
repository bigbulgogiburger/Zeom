package com.cheonjiyeon.api.auth;

import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth/oauth")
public class OAuthController {
    private final OAuthService oAuthService;

    public OAuthController(OAuthService oAuthService) {
        this.oAuthService = oAuthService;
    }

    @PostMapping("/kakao")
    public AuthDtos.AuthResponse kakaoLogin(@RequestBody Map<String, String> body) {
        String accessToken = body.get("accessToken");
        String deviceId = body.getOrDefault("deviceId", "web-main");
        String deviceName = body.getOrDefault("deviceName", "unknown-device");
        return oAuthService.kakaoLogin(accessToken, deviceId, deviceName);
    }

    @PostMapping("/naver")
    public AuthDtos.AuthResponse naverLogin(@RequestBody Map<String, String> body) {
        String accessToken = body.get("accessToken");
        String deviceId = body.getOrDefault("deviceId", "web-main");
        String deviceName = body.getOrDefault("deviceName", "unknown-device");
        return oAuthService.naverLogin(accessToken, deviceId, deviceName);
    }

    @PostMapping("/link")
    public Map<String, Object> linkSocialAccount(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Map<String, String> body
    ) {
        String provider = body.get("provider");
        String accessToken = body.get("accessToken");
        return oAuthService.linkSocialAccount(authHeader, provider, accessToken);
    }

    @DeleteMapping("/unlink")
    public Map<String, Object> unlinkSocialAccount(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Map<String, String> body
    ) {
        String provider = body.get("provider");
        return oAuthService.unlinkSocialAccount(authHeader, provider);
    }
}
