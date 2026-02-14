package com.cheonjiyeon.api.auth;

import com.cheonjiyeon.api.common.ApiException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final TokenStore tokenStore;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public AuthService(UserRepository userRepository, TokenStore tokenStore) {
        this.userRepository = userRepository;
        this.tokenStore = tokenStore;
    }

    public AuthDtos.AuthResponse signup(AuthDtos.SignupRequest req) {
        userRepository.findByEmail(req.email()).ifPresent(u -> {
            throw new ApiException(409, "이미 가입된 이메일입니다.");
        });

        UserEntity user = new UserEntity();
        user.setEmail(req.email());
        user.setName(req.name());
        user.setPasswordHash(encoder.encode(req.password()));
        UserEntity saved = userRepository.save(user);

        String token = tokenStore.issue(saved.getId());
        return new AuthDtos.AuthResponse(token, toResponse(saved));
    }

    public AuthDtos.AuthResponse login(AuthDtos.LoginRequest req) {
        UserEntity user = userRepository.findByEmail(req.email())
                .orElseThrow(() -> new ApiException(401, "이메일 또는 비밀번호가 올바르지 않습니다."));

        if (!encoder.matches(req.password(), user.getPasswordHash())) {
            throw new ApiException(401, "이메일 또는 비밀번호가 올바르지 않습니다.");
        }

        String token = tokenStore.issue(user.getId());
        return new AuthDtos.AuthResponse(token, toResponse(user));
    }

    public AuthDtos.UserResponse me(String bearerToken) {
        Long userId = tokenStore.resolve(extractToken(bearerToken))
                .orElseThrow(() -> new ApiException(401, "로그인이 필요합니다."));

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(401, "유효하지 않은 토큰입니다."));
        return toResponse(user);
    }

    private String extractToken(String bearerToken) {
        if (bearerToken == null || !bearerToken.startsWith("Bearer ")) {
            throw new ApiException(401, "Authorization Bearer 토큰이 필요합니다.");
        }
        return bearerToken.substring(7);
    }

    private AuthDtos.UserResponse toResponse(UserEntity user) {
        return new AuthDtos.UserResponse(user.getId(), user.getEmail(), user.getName());
    }
}
