package com.cheonjiyeon.api.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthDtos {
    public record SignupRequest(
            @NotBlank @Email String email,
            @NotBlank @Size(min = 8, max = 50) String password,
            @NotBlank @Size(min = 2, max = 30) String name
    ) {}

    public record LoginRequest(
            @NotBlank @Email String email,
            @NotBlank String password
    ) {}

    public record RefreshRequest(@NotBlank String refreshToken) {}

    public record UserResponse(Long id, String email, String name, String role) {}

    public record AuthResponse(String accessToken, String refreshToken, UserResponse user) {}
}
