package com.cheonjiyeon.api.auth;

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
    public AuthDtos.AuthResponse signup(@Valid @RequestBody AuthDtos.SignupRequest req) {
        return authService.signup(req);
    }

    @PostMapping("/login")
    public AuthDtos.AuthResponse login(@Valid @RequestBody AuthDtos.LoginRequest req) {
        return authService.login(req);
    }

    @PostMapping("/admin/login")
    public AuthDtos.AuthResponse loginAdmin(@Valid @RequestBody AuthDtos.LoginRequest req) {
        return authService.loginAdmin(req);
    }

    @PostMapping("/refresh")
    public AuthDtos.AuthResponse refresh(@Valid @RequestBody AuthDtos.RefreshRequest req) {
        return authService.refresh(req);
    }

    @PostMapping("/logout")
    public AuthDtos.MessageResponse logout(@Valid @RequestBody AuthDtos.LogoutRequest req) {
        return authService.logout(req);
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
}
