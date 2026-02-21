package com.cheonjiyeon.api.oauth;

import com.cheonjiyeon.api.audit.AuditLogService;
import com.cheonjiyeon.api.auth.AuthDtos;
import com.cheonjiyeon.api.auth.TokenStore;
import com.cheonjiyeon.api.auth.UserEntity;
import com.cheonjiyeon.api.auth.UserRepository;
import com.cheonjiyeon.api.auth.refresh.RefreshTokenEntity;
import com.cheonjiyeon.api.auth.refresh.RefreshTokenRepository;
import com.cheonjiyeon.api.wallet.WalletService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.UUID;

@Service
public class OAuthLoginService {

    private static final Logger log = LoggerFactory.getLogger(OAuthLoginService.class);

    private final OAuthProvider oAuthProvider;
    private final UserRepository userRepository;
    private final TokenStore tokenStore;
    private final RefreshTokenRepository refreshTokenRepository;
    private final AuditLogService auditLogService;
    private final WalletService walletService;

    public OAuthLoginService(OAuthProvider oAuthProvider,
                             UserRepository userRepository,
                             TokenStore tokenStore,
                             RefreshTokenRepository refreshTokenRepository,
                             AuditLogService auditLogService,
                             WalletService walletService) {
        this.oAuthProvider = oAuthProvider;
        this.userRepository = userRepository;
        this.tokenStore = tokenStore;
        this.refreshTokenRepository = refreshTokenRepository;
        this.auditLogService = auditLogService;
        this.walletService = walletService;
    }

    @Transactional
    public AuthDtos.AuthResponse authenticateWithOAuth(String provider, String code,
                                                        String redirectUri,
                                                        String deviceId, String deviceName) {
        OAuthUserInfo userInfo = oAuthProvider.authenticate(code, redirectUri);

        String effectiveProvider = provider;

        // 1. Check if this OAuth account already exists (by oauth_provider + oauth_id on UserEntity)
        return userRepository.findByOauthProviderAndOauthId(effectiveProvider, userInfo.oauthId())
                .map(existingUser -> {
                    log.info("OAuth login: existing user found userId={}, provider={}", existingUser.getId(), effectiveProvider);
                    auditLogService.log(existingUser.getId(), "AUTH_OAUTH_LOGIN", "USER", existingUser.getId());
                    return issueTokens(existingUser, deviceId, deviceName);
                })
                .orElseGet(() -> {
                    // 2. Check if a user with the same email exists -> merge
                    if (userInfo.email() != null) {
                        return userRepository.findByEmail(userInfo.email())
                                .map(emailUser -> {
                                    log.info("OAuth merge: linking provider={} to existing email account userId={}",
                                            effectiveProvider, emailUser.getId());
                                    emailUser.setOauthProvider(effectiveProvider);
                                    emailUser.setOauthId(userInfo.oauthId());
                                    userRepository.save(emailUser);
                                    auditLogService.log(emailUser.getId(), "AUTH_OAUTH_MERGE", "USER", emailUser.getId());
                                    return issueTokens(emailUser, deviceId, deviceName);
                                })
                                .orElseGet(() -> createNewOAuthUser(userInfo, effectiveProvider, deviceId, deviceName));
                    }
                    return createNewOAuthUser(userInfo, effectiveProvider, deviceId, deviceName);
                });
    }

    private AuthDtos.AuthResponse createNewOAuthUser(OAuthUserInfo userInfo, String provider,
                                                      String deviceId, String deviceName) {
        UserEntity user = new UserEntity();
        user.setEmail(userInfo.email() != null ? userInfo.email() : provider + "_" + userInfo.oauthId() + "@oauth.local");
        user.setName(userInfo.name() != null ? userInfo.name() : "사용자");
        user.setPasswordHash("");
        user.setOauthProvider(provider);
        user.setOauthId(userInfo.oauthId());
        user.setEmailVerified(true);

        if (userInfo.phone() != null) user.setPhone(userInfo.phone());
        if (userInfo.gender() != null) user.setGender(userInfo.gender());
        if (userInfo.birthDate() != null) {
            try {
                user.setBirthDate(LocalDate.parse(userInfo.birthDate()));
            } catch (Exception e) {
                // birthDate format may vary by provider
            }
        }

        UserEntity saved = userRepository.save(user);
        walletService.createWalletForUser(saved.getId());

        log.info("OAuth signup: new user created userId={}, provider={}", saved.getId(), provider);
        auditLogService.log(saved.getId(), "AUTH_OAUTH_SIGNUP", "USER", saved.getId());

        return issueTokens(saved, deviceId, deviceName);
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

        AuthDtos.UserResponse userResponse = new AuthDtos.UserResponse(
                user.getId(), user.getEmail(), user.getName(), user.getRole(),
                user.getPhone(),
                user.getBirthDate() != null ? user.getBirthDate().toString() : null,
                user.getGender(),
                user.isEmailVerified());

        return new AuthDtos.AuthResponse(access, refresh, userResponse);
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
}
