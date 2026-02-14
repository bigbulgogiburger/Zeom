package com.cheonjiyeon.api.auth;

import com.cheonjiyeon.api.auth.refresh.RefreshTokenEntity;
import com.cheonjiyeon.api.auth.refresh.RefreshTokenRepository;
import com.cheonjiyeon.api.common.ApiException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final TokenStore tokenStore;
    private final RefreshTokenRepository refreshTokenRepository;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public AuthService(UserRepository userRepository, TokenStore tokenStore, RefreshTokenRepository refreshTokenRepository) {
        this.userRepository = userRepository;
        this.tokenStore = tokenStore;
        this.refreshTokenRepository = refreshTokenRepository;
    }

    @Transactional
    public AuthDtos.AuthResponse signup(AuthDtos.SignupRequest req) {
        userRepository.findByEmail(req.email()).ifPresent(u -> {
            throw new ApiException(409, "이미 가입된 이메일입니다.");
        });

        UserEntity user = new UserEntity();
        user.setEmail(req.email());
        user.setName(req.name());
        user.setPasswordHash(encoder.encode(req.password()));
        user.setRole(req.email().startsWith("admin") ? "ADMIN" : "USER");
        UserEntity saved = userRepository.save(user);

        return issueTokens(saved);
    }

    @Transactional
    public AuthDtos.AuthResponse login(AuthDtos.LoginRequest req) {
        UserEntity user = userRepository.findByEmail(req.email())
                .orElseThrow(() -> new ApiException(401, "이메일 또는 비밀번호가 올바르지 않습니다."));

        if (!encoder.matches(req.password(), user.getPasswordHash())) {
            throw new ApiException(401, "이메일 또는 비밀번호가 올바르지 않습니다.");
        }

        return issueTokens(user);
    }

    @Transactional
    public AuthDtos.AuthResponse loginAdmin(AuthDtos.LoginRequest req) {
        UserEntity user = userRepository.findByEmail(req.email())
                .orElseThrow(() -> new ApiException(401, "이메일 또는 비밀번호가 올바르지 않습니다."));

        if (!encoder.matches(req.password(), user.getPasswordHash())) {
            throw new ApiException(401, "이메일 또는 비밀번호가 올바르지 않습니다.");
        }
        if (!"ADMIN".equals(user.getRole())) {
            throw new ApiException(403, "관리자 계정이 아닙니다.");
        }

        return issueTokens(user);
    }

    @Transactional
    public AuthDtos.AuthResponse refresh(AuthDtos.RefreshRequest req) {
        RefreshTokenEntity old = refreshTokenRepository.findByTokenAndRevokedFalse(req.refreshToken())
                .orElseThrow(() -> new ApiException(401, "유효하지 않은 refresh token 입니다."));

        if (old.getExpiresAt().isBefore(LocalDateTime.now())) {
            old.setRevoked(true);
            refreshTokenRepository.save(old);
            throw new ApiException(401, "만료된 refresh token 입니다.");
        }

        Long userId = tokenStore.resolveRefreshUserId(req.refreshToken())
                .orElseThrow(() -> new ApiException(401, "유효하지 않은 refresh token 입니다."));

        old.setRevoked(true);
        refreshTokenRepository.save(old);

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(401, "유효하지 않은 사용자입니다."));
        return issueTokens(user);
    }

    @Transactional
    public AuthDtos.MessageResponse logout(AuthDtos.LogoutRequest req) {
        refreshTokenRepository.findByTokenAndRevokedFalse(req.refreshToken()).ifPresent(t -> {
            t.setRevoked(true);
            refreshTokenRepository.save(t);
        });
        return new AuthDtos.MessageResponse("로그아웃되었습니다.");
    }

    public AuthDtos.UserResponse me(String bearerToken) {
        UserEntity user = resolveUser(extractToken(bearerToken));
        return toResponse(user);
    }

    public UserEntity requireAdmin(String bearerToken) {
        UserEntity user = resolveUser(extractToken(bearerToken));
        if (!"ADMIN".equals(user.getRole())) throw new ApiException(403, "관리자 권한이 필요합니다.");
        return user;
    }

    private UserEntity resolveUser(String accessToken) {
        Long userId = tokenStore.resolveAccessUserId(accessToken)
                .orElseThrow(() -> new ApiException(401, "로그인이 필요합니다."));

        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(401, "유효하지 않은 토큰입니다."));
    }

    private String extractToken(String bearerToken) {
        if (bearerToken == null || !bearerToken.startsWith("Bearer ")) {
            throw new ApiException(401, "Authorization Bearer 토큰이 필요합니다.");
        }
        return bearerToken.substring(7);
    }

    private AuthDtos.AuthResponse issueTokens(UserEntity user) {
        String access = tokenStore.issueAccess(user.getId(), user.getRole());
        String refresh = tokenStore.issueRefresh(user.getId());

        RefreshTokenEntity rt = new RefreshTokenEntity();
        rt.setUserId(user.getId());
        rt.setToken(refresh);
        rt.setRevoked(false);
        rt.setExpiresAt(tokenStore.refreshExpiry(refresh).orElse(LocalDateTime.now().plusDays(14)));
        refreshTokenRepository.save(rt);

        return new AuthDtos.AuthResponse(access, refresh, toResponse(user));
    }

    private AuthDtos.UserResponse toResponse(UserEntity user) {
        return new AuthDtos.UserResponse(user.getId(), user.getEmail(), user.getName(), user.getRole());
    }
}
