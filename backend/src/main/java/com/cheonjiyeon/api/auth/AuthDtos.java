package com.cheonjiyeon.api.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

public class AuthDtos {
    public record SignupRequest(
            @NotBlank @Email @Size(max = 120) String email,
            @NotBlank @Size(min = 8, max = 50) String password,
            @NotBlank @Size(min = 2, max = 30) String name,
            @Size(max = 100) String deviceId,
            @Size(max = 150) String deviceName
    ) {}

    public record LoginRequest(
            @NotBlank @Email @Size(max = 120) String email,
            @NotBlank @Size(max = 50) String password,
            @Size(max = 100) String deviceId,
            @Size(max = 150) String deviceName
    ) {}

    public record RefreshRequest(
            @NotBlank @Size(max = 2000) String refreshToken,
            @Size(max = 100) String deviceId,
            @Size(max = 150) String deviceName
    ) {}
    public record LogoutRequest(@NotBlank String refreshToken) {}

    public record UserResponse(Long id, String email, String name, String role) {}

    public record SessionItem(Long id, String deviceId, String deviceName, LocalDateTime expiresAt, LocalDateTime createdAt) {}
    public record SessionsResponse(List<SessionItem> sessions) {}

    public record AuthResponse(String accessToken, String refreshToken, UserResponse user) {}
    public record MessageResponse(String message) {}
}
