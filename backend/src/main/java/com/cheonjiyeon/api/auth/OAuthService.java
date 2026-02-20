package com.cheonjiyeon.api.auth;

import com.cheonjiyeon.api.auth.refresh.RefreshTokenEntity;
import com.cheonjiyeon.api.auth.refresh.RefreshTokenRepository;
import com.cheonjiyeon.api.common.ApiException;
import com.cheonjiyeon.api.wallet.WalletService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;

@Service
public class OAuthService {
    private final SocialAccountRepository socialAccountRepository;
    private final UserRepository userRepository;
    private final TokenStore tokenStore;
    private final RefreshTokenRepository refreshTokenRepository;
    private final WalletService walletService;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public OAuthService(
            SocialAccountRepository socialAccountRepository,
            UserRepository userRepository,
            TokenStore tokenStore,
            RefreshTokenRepository refreshTokenRepository,
            WalletService walletService
    ) {
        this.socialAccountRepository = socialAccountRepository;
        this.userRepository = userRepository;
        this.tokenStore = tokenStore;
        this.refreshTokenRepository = refreshTokenRepository;
        this.walletService = walletService;
    }

    @Transactional
    public AuthDtos.AuthResponse kakaoLogin(String accessToken, String deviceId, String deviceName) {
        // In dev/fake mode: mock the Kakao API response
        // In production: call Kakao API to verify token and get user info
        Map<String, String> socialProfile = fetchKakaoProfile(accessToken);
        return socialLogin("KAKAO", socialProfile.get("id"), socialProfile.get("email"),
                socialProfile.get("name"), accessToken, deviceId, deviceName);
    }

    @Transactional
    public AuthDtos.AuthResponse naverLogin(String accessToken, String deviceId, String deviceName) {
        // In dev/fake mode: mock the Naver API response
        // In production: call Naver API to verify token and get user info
        Map<String, String> socialProfile = fetchNaverProfile(accessToken);
        return socialLogin("NAVER", socialProfile.get("id"), socialProfile.get("email"),
                socialProfile.get("name"), accessToken, deviceId, deviceName);
    }

    @Transactional
    public Map<String, Object> linkSocialAccount(String authHeader, String provider, String accessToken) {
        UserEntity user = resolveUser(authHeader);
        String providerUpper = provider.toUpperCase();

        // Check if already linked
        if (socialAccountRepository.findByUserIdAndProvider(user.getId(), providerUpper).isPresent()) {
            throw new ApiException(400, "이미 연동된 소셜 계정입니다.");
        }

        Map<String, String> profile = "KAKAO".equals(providerUpper)
                ? fetchKakaoProfile(accessToken)
                : fetchNaverProfile(accessToken);

        // Check if this social account is already linked to another user
        if (socialAccountRepository.findByProviderAndProviderUserId(providerUpper, profile.get("id")).isPresent()) {
            throw new ApiException(409, "이미 다른 계정에 연동된 소셜 계정입니다.");
        }

        SocialAccountEntity social = new SocialAccountEntity();
        social.setUserId(user.getId());
        social.setProvider(providerUpper);
        social.setProviderUserId(profile.get("id"));
        social.setAccessToken(accessToken);
        socialAccountRepository.save(social);

        return Map.of("linked", true, "provider", providerUpper);
    }

    @Transactional
    public Map<String, Object> unlinkSocialAccount(String authHeader, String provider) {
        UserEntity user = resolveUser(authHeader);
        String providerUpper = provider.toUpperCase();

        SocialAccountEntity social = socialAccountRepository.findByUserIdAndProvider(user.getId(), providerUpper)
                .orElseThrow(() -> new ApiException(404, "연동된 소셜 계정을 찾을 수 없습니다."));

        socialAccountRepository.delete(social);
        return Map.of("unlinked", true, "provider", providerUpper);
    }

    private AuthDtos.AuthResponse socialLogin(String provider, String providerUserId,
                                               String email, String name,
                                               String accessToken, String deviceId, String deviceName) {
        // Check if social account already exists
        var existingSocial = socialAccountRepository.findByProviderAndProviderUserId(provider, providerUserId);

        UserEntity user;
        if (existingSocial.isPresent()) {
            // Existing user - update access token
            SocialAccountEntity social = existingSocial.get();
            social.setAccessToken(accessToken);
            socialAccountRepository.save(social);

            user = userRepository.findById(social.getUserId())
                    .orElseThrow(() -> new ApiException(500, "소셜 계정에 연결된 사용자를 찾을 수 없습니다."));
        } else {
            // Check if user with same email exists
            var existingUser = userRepository.findByEmail(email);
            if (existingUser.isPresent()) {
                user = existingUser.get();
            } else {
                // Create new user
                user = new UserEntity();
                user.setEmail(email);
                user.setName(name != null ? name : email.split("@")[0]);
                user.setPasswordHash(encoder.encode(UUID.randomUUID().toString()));
                user.setRole("USER");
                user = userRepository.save(user);
                walletService.createWalletForUser(user.getId());
            }

            // Link social account
            SocialAccountEntity social = new SocialAccountEntity();
            social.setUserId(user.getId());
            social.setProvider(provider);
            social.setProviderUserId(providerUserId);
            social.setAccessToken(accessToken);
            socialAccountRepository.save(social);
        }

        return issueTokens(user, deviceId, deviceName);
    }

    /**
     * Dev/fake mode: generate mock profile from token.
     * Production: call Kakao REST API /v2/user/me with the access token.
     */
    private Map<String, String> fetchKakaoProfile(String accessToken) {
        // Fake implementation for dev mode
        String mockId = "kakao_" + Math.abs(accessToken.hashCode());
        String mockEmail = "kakao_user_" + Math.abs(accessToken.hashCode()) % 10000 + "@kakao.com";
        String mockName = "카카오사용자";

        return Map.of("id", mockId, "email", mockEmail, "name", mockName);
    }

    /**
     * Dev/fake mode: generate mock profile from token.
     * Production: call Naver REST API /v1/nid/me with the access token.
     */
    private Map<String, String> fetchNaverProfile(String accessToken) {
        // Fake implementation for dev mode
        String mockId = "naver_" + Math.abs(accessToken.hashCode());
        String mockEmail = "naver_user_" + Math.abs(accessToken.hashCode()) % 10000 + "@naver.com";
        String mockName = "네이버사용자";

        return Map.of("id", mockId, "email", mockEmail, "name", mockName);
    }

    private AuthDtos.AuthResponse issueTokens(UserEntity user, String deviceIdIn, String deviceNameIn) {
        String deviceId = (deviceIdIn == null || deviceIdIn.isBlank()) ? UUID.randomUUID().toString() : deviceIdIn;
        String deviceName = (deviceNameIn == null || deviceNameIn.isBlank()) ? "unknown-device" : deviceNameIn;

        refreshTokenRepository.findByUserIdAndDeviceIdAndRevokedFalse(user.getId(), deviceId).ifPresent(t -> {
            t.setRevoked(true);
            refreshTokenRepository.save(t);
        });

        String access = tokenStore.issueAccess(user.getId(), user.getRole());
        String refresh = tokenStore.issueRefresh(user.getId());

        RefreshTokenEntity rt = new RefreshTokenEntity();
        rt.setUserId(user.getId());
        rt.setTokenHash(sha256(refresh));
        rt.setDeviceId(deviceId);
        rt.setDeviceName(deviceName);
        rt.setRevoked(false);
        rt.setExpiresAt(tokenStore.refreshExpiry(refresh).orElse(LocalDateTime.now().plusDays(14)));
        refreshTokenRepository.save(rt);

        return new AuthDtos.AuthResponse(access, refresh, toResponse(user));
    }

    private String sha256(String value) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (Exception e) {
            throw new IllegalStateException("hash failed", e);
        }
    }

    private AuthDtos.UserResponse toResponse(UserEntity user) {
        return new AuthDtos.UserResponse(
                user.getId(), user.getEmail(), user.getName(), user.getRole(),
                user.getPhone(),
                user.getBirthDate() != null ? user.getBirthDate().toString() : null,
                user.getGender(),
                user.isEmailVerified());
    }

    private UserEntity resolveUser(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new ApiException(401, "Authorization Bearer 토큰이 필요합니다.");
        }
        String token = authHeader.substring(7);
        Long userId = tokenStore.resolveAccessUserId(token)
                .orElseThrow(() -> new ApiException(401, "로그인이 필요합니다."));

        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(401, "유효하지 않은 토큰입니다."));
    }
}
