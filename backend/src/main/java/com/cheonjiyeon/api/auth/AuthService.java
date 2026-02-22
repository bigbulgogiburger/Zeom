package com.cheonjiyeon.api.auth;

import com.cheonjiyeon.api.audit.AuditLogService;
import com.cheonjiyeon.api.alert.AlertWebhookService;
import com.cheonjiyeon.api.auth.refresh.RefreshTokenEntity;
import com.cheonjiyeon.api.auth.refresh.RefreshTokenRepository;
import com.cheonjiyeon.api.common.ApiException;
import com.cheonjiyeon.api.counselor.CounselorEntity;
import com.cheonjiyeon.api.counselor.CounselorRepository;
import com.cheonjiyeon.api.wallet.WalletService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final TokenStore tokenStore;
    private final RefreshTokenRepository refreshTokenRepository;
    private final AuditLogService auditLogService;
    private final AlertWebhookService alertWebhookService;
    private final WalletService walletService;
    private final CounselorRepository counselorRepository;
    private final EmailVerificationService emailVerificationService;
    private final boolean allowE2eAdminBootstrap;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public AuthService(UserRepository userRepository,
                       TokenStore tokenStore,
                       RefreshTokenRepository refreshTokenRepository,
                       AuditLogService auditLogService,
                       AlertWebhookService alertWebhookService,
                       WalletService walletService,
                       CounselorRepository counselorRepository,
                       EmailVerificationService emailVerificationService,
                       @Value("${auth.allow-e2e-admin-bootstrap:false}") boolean allowE2eAdminBootstrap) {
        this.userRepository = userRepository;
        this.tokenStore = tokenStore;
        this.refreshTokenRepository = refreshTokenRepository;
        this.auditLogService = auditLogService;
        this.alertWebhookService = alertWebhookService;
        this.walletService = walletService;
        this.counselorRepository = counselorRepository;
        this.emailVerificationService = emailVerificationService;
        this.allowE2eAdminBootstrap = allowE2eAdminBootstrap;
    }

    @Transactional
    public AuthDtos.AuthResponse signup(AuthDtos.SignupRequest req) {
        if (Boolean.TRUE.equals(req.termsAgreed())) {
            // termsAgreed is explicitly true — OK
        } else if (req.termsAgreed() != null) {
            // termsAgreed is explicitly false
            throw new ApiException(400, "이용약관에 동의해야 합니다.");
        }
        // if termsAgreed is null, allow for backward compatibility (existing clients/tests)

        userRepository.findByEmail(req.email()).ifPresent(u -> {
            throw new ApiException(409, "이미 가입된 이메일입니다.");
        });

        UserEntity user = new UserEntity();
        user.setEmail(req.email());
        user.setName(req.name());
        user.setPasswordHash(encoder.encode(req.password()));
        boolean e2eAdmin = allowE2eAdminBootstrap && req.email() != null && req.email().startsWith("e2e_admin_");
        boolean e2eCounselor = allowE2eAdminBootstrap && req.email() != null && req.email().startsWith("e2e_counselor_");
        user.setRole(e2eAdmin ? "ADMIN" : e2eCounselor ? "COUNSELOR" : "USER");

        if (req.phone() != null) user.setPhone(req.phone());
        if (req.gender() != null) user.setGender(req.gender());
        if (req.birthDate() != null && !req.birthDate().isBlank()) {
            user.setBirthDate(LocalDate.parse(req.birthDate()));
        }
        if (req.birthHour() != null) user.setBirthHour(req.birthHour());
        if (req.calendarType() != null) {
            user.setCalendarType(req.calendarType());
        }
        if (req.isLeapMonth() != null) user.setIsLeapMonth(req.isLeapMonth());
        if (Boolean.TRUE.equals(req.termsAgreed())) {
            user.setTermsAgreed(true);
            user.setTermsAgreedAt(LocalDateTime.now());
        }

        UserEntity saved = userRepository.save(user);

        // Auto-create CounselorEntity for e2e_counselor_ accounts
        if (e2eCounselor) {
            CounselorEntity counselor = new CounselorEntity();
            counselor.setName(saved.getName());
            counselor.setSpecialty("종합운세");
            counselor.setIntro("E2E 테스트 상담사");
            counselor.setUserId(saved.getId());
            counselorRepository.save(counselor);
        }

        walletService.createWalletForUser(saved.getId());
        auditLogService.log(saved.getId(), "AUTH_SIGNUP", "USER", saved.getId());

        // 이메일 인증 발송 (이메일이 e2e 테스트 계정이 아닌 경우)
        if (!e2eAdmin && !e2eCounselor) {
            try {
                emailVerificationService.sendVerificationEmail(saved);
            } catch (Exception e) {
                // 인증 이메일 발송 실패 시에도 회원가입은 계속 진행
                org.slf4j.LoggerFactory.getLogger(AuthService.class)
                        .warn("Failed to send verification email for userId={}", saved.getId(), e);
            }
        }

        return issueTokens(saved, req.deviceId(), req.deviceName());
    }

    @Transactional
    public AuthDtos.AuthResponse login(AuthDtos.LoginRequest req) {
        UserEntity user = userRepository.findByEmail(req.email())
                .orElseThrow(() -> {
                    alertWebhookService.sendFailureEvent("AUTH_LOGIN_FAIL", "unknown_email_attempt");
                    auditLogService.log(0L, "AUTH_LOGIN_FAIL", "EMAIL", 0L);
                    return new ApiException(401, "이메일 또는 비밀번호가 올바르지 않습니다.");
                });

        if (!encoder.matches(req.password(), user.getPasswordHash())) {
            alertWebhookService.sendFailureEvent("AUTH_LOGIN_FAIL", "userId=" + user.getId());
            auditLogService.log(user.getId(), "AUTH_LOGIN_FAIL", "USER", user.getId());
            throw new ApiException(401, "이메일 또는 비밀번호가 올바르지 않습니다.");
        }

        auditLogService.log(user.getId(), "AUTH_LOGIN", "USER", user.getId());
        return issueTokens(user, req.deviceId(), req.deviceName());
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

        auditLogService.log(user.getId(), "AUTH_ADMIN_LOGIN", "USER", user.getId());
        return issueTokens(user, req.deviceId(), req.deviceName());
    }

    @Transactional
    public AuthDtos.AuthResponse refresh(AuthDtos.RefreshRequest req) {
        String oldHash = sha256(req.refreshToken());
        RefreshTokenEntity old = refreshTokenRepository.findByTokenHashAndRevokedFalse(oldHash).orElse(null);

        if (old == null) {
            // reuse attempt or invalid token: try DB hash first, fallback to JWT subject parsing
            Long suspectedUserId = refreshTokenRepository.findByTokenHash(oldHash)
                    .map(RefreshTokenEntity::getUserId)
                    .orElseGet(() -> tokenStore.resolveRefreshUserId(req.refreshToken()).orElse(null));

            if (suspectedUserId != null) {
                refreshTokenRepository.findByUserIdAndRevokedFalse(suspectedUserId).forEach(t -> {
                    t.setRevoked(true);
                    refreshTokenRepository.save(t);
                });
                auditLogService.log(suspectedUserId, "AUTH_REFRESH_REUSE_DETECTED", "USER", suspectedUserId);
                alertWebhookService.sendFailureEvent("AUTH_REFRESH_REUSE_DETECTED", "userId=" + suspectedUserId);
            }
            throw new ApiException(401, "유효하지 않은 refresh token 입니다.");
        }

        if (old.getExpiresAt().isBefore(LocalDateTime.now())) {
            old.setRevoked(true);
            refreshTokenRepository.save(old);
            auditLogService.log(old.getUserId(), "AUTH_REFRESH_EXPIRED", "USER", old.getUserId());
            throw new ApiException(401, "만료된 refresh token 입니다.");
        }

        Long userId = tokenStore.resolveRefreshUserId(req.refreshToken())
                .orElseThrow(() -> new ApiException(401, "유효하지 않은 refresh token 입니다."));

        old.setRevoked(true);
        refreshTokenRepository.save(old);

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(401, "유효하지 않은 사용자입니다."));

        auditLogService.log(user.getId(), "AUTH_REFRESH", "USER", user.getId());
        return issueTokens(user,
                req.deviceId() != null ? req.deviceId() : old.getDeviceId(),
                req.deviceName() != null ? req.deviceName() : old.getDeviceName());
    }

    @Transactional
    public AuthDtos.MessageResponse logout(AuthDtos.LogoutRequest req) {
        String hash = sha256(req.refreshToken());
        refreshTokenRepository.findByTokenHashAndRevokedFalse(hash).ifPresent(t -> {
            t.setRevoked(true);
            refreshTokenRepository.save(t);
            auditLogService.log(t.getUserId(), "AUTH_LOGOUT", "USER", t.getUserId());
        });
        return new AuthDtos.MessageResponse("로그아웃되었습니다.");
    }

    @Transactional(readOnly = true)
    public AuthDtos.SessionsResponse sessions(String bearerToken) {
        UserEntity user = resolveUser(extractToken(bearerToken));
        List<AuthDtos.SessionItem> items = refreshTokenRepository.findByUserIdOrderByIdDesc(user.getId()).stream()
                .filter(t -> !t.isRevoked() && t.getExpiresAt().isAfter(LocalDateTime.now()))
                .map(t -> new AuthDtos.SessionItem(t.getId(), t.getDeviceId(), t.getDeviceName(), t.getExpiresAt(), t.getCreatedAt()))
                .toList();
        return new AuthDtos.SessionsResponse(items);
    }

    @Transactional
    public AuthDtos.MessageResponse revokeSession(String bearerToken, Long sessionId) {
        UserEntity user = resolveUser(extractToken(bearerToken));
        RefreshTokenEntity token = refreshTokenRepository.findById(sessionId)
                .orElseThrow(() -> new ApiException(404, "세션을 찾을 수 없습니다."));
        if (!token.getUserId().equals(user.getId()) && !"ADMIN".equals(user.getRole())) {
            throw new ApiException(403, "권한이 없습니다.");
        }
        token.setRevoked(true);
        refreshTokenRepository.save(token);
        auditLogService.log(user.getId(), "AUTH_SESSION_REVOKED", "REFRESH_TOKEN", token.getId());
        return new AuthDtos.MessageResponse("세션이 해제되었습니다.");
    }

    public AuthDtos.UserResponse me(String bearerToken) {
        UserEntity user = resolveUser(extractToken(bearerToken));
        return toResponse(user);
    }

    @Transactional
    public AuthDtos.MessageResponse changePassword(String bearerToken, String currentPassword, String newPassword) {
        UserEntity user = resolveUser(extractToken(bearerToken));

        if (!encoder.matches(currentPassword, user.getPasswordHash())) {
            throw new ApiException(400, "현재 비밀번호가 올바르지 않습니다.");
        }

        if (newPassword == null || newPassword.length() < 8) {
            throw new ApiException(400, "새 비밀번호는 8자 이상이어야 합니다.");
        }

        user.setPasswordHash(encoder.encode(newPassword));
        userRepository.save(user);

        auditLogService.log(user.getId(), "PASSWORD_CHANGED", "USER", user.getId());
        return new AuthDtos.MessageResponse("비밀번호가 변경되었습니다.");
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
}
