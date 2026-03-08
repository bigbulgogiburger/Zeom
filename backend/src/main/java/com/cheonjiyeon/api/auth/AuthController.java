package com.cheonjiyeon.api.auth;

import com.cheonjiyeon.api.config.CookieUtils;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/signup")
    public AuthDtos.AuthResponse signup(@Valid @RequestBody AuthDtos.SignupRequest req,
                                        HttpServletResponse response) {
        AuthDtos.AuthResponse result = authService.signup(req);
        CookieUtils.setTokenCookies(response, result.accessToken(), result.refreshToken());
        return result;
    }

    @PostMapping("/login")
    public AuthDtos.AuthResponse login(@Valid @RequestBody AuthDtos.LoginRequest req,
                                       HttpServletResponse response) {
        AuthDtos.AuthResponse result = authService.login(req);
        CookieUtils.setTokenCookies(response, result.accessToken(), result.refreshToken());
        return result;
    }

    @PostMapping("/admin/login")
    public AuthDtos.AuthResponse loginAdmin(@Valid @RequestBody AuthDtos.LoginRequest req,
                                             HttpServletResponse response) {
        AuthDtos.AuthResponse result = authService.loginAdmin(req);
        CookieUtils.setTokenCookies(response, result.accessToken(), result.refreshToken());
        return result;
    }

    @PostMapping("/refresh")
    public AuthDtos.AuthResponse refresh(@Valid @RequestBody AuthDtos.RefreshRequest req,
                                          HttpServletRequest httpRequest,
                                          HttpServletResponse response) {
        // Cookie에서 refresh_token 가져오기 (body에 없으면)
        AuthDtos.RefreshRequest effectiveReq = req;
        if (req.refreshToken() == null || req.refreshToken().isBlank()) {
            String cookieRefresh = extractCookie(httpRequest, "refresh_token");
            if (cookieRefresh != null) {
                effectiveReq = new AuthDtos.RefreshRequest(cookieRefresh, req.deviceId(), req.deviceName());
            }
        }

        AuthDtos.AuthResponse result = authService.refresh(effectiveReq);
        CookieUtils.setTokenCookies(response, result.accessToken(), result.refreshToken());
        return result;
    }

    @PostMapping("/logout")
    public AuthDtos.MessageResponse logout(@Valid @RequestBody(required = false) AuthDtos.LogoutRequest req,
                                            HttpServletRequest httpRequest,
                                            HttpServletResponse response) {
        // Cookie에서 refresh_token 가져오기 (body에 없으면)
        String refreshToken = (req != null && req.refreshToken() != null && !req.refreshToken().isBlank())
                ? req.refreshToken()
                : extractCookie(httpRequest, "refresh_token");

        AuthDtos.MessageResponse result;
        if (refreshToken != null && !refreshToken.isBlank()) {
            result = authService.logout(new AuthDtos.LogoutRequest(refreshToken));
        } else {
            result = new AuthDtos.MessageResponse("로그아웃되었습니다.");
        }

        CookieUtils.clearTokenCookies(response);
        return result;
    }

    @GetMapping("/me")
    public AuthDtos.UserResponse me(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        return authService.me(authHeader);
    }

    @GetMapping("/sessions")
    public AuthDtos.SessionsResponse sessions(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        return authService.sessions(authHeader);
    }

    @PostMapping("/sessions/{id}/revoke")
    public AuthDtos.MessageResponse revokeSession(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id
    ) {
        return authService.revokeSession(authHeader, id);
    }

    public record ChangePasswordRequest(
            @jakarta.validation.constraints.NotBlank String currentPassword,
            @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Size(min = 8, max = 50) String newPassword
    ) {}

    @PutMapping("/change-password")
    public AuthDtos.MessageResponse changePassword(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @Valid @RequestBody ChangePasswordRequest req
    ) {
        return authService.changePassword(authHeader, req.currentPassword(), req.newPassword());
    }

    private String extractCookie(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) return null;
        for (Cookie cookie : cookies) {
            if (name.equals(cookie.getName()) && cookie.getValue() != null && !cookie.getValue().isBlank()) {
                return cookie.getValue();
            }
        }
        return null;
    }
}
