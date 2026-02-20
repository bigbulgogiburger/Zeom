package com.cheonjiyeon.api.auth;

import com.cheonjiyeon.api.audit.AuditLogService;
import com.cheonjiyeon.api.auth.refresh.RefreshTokenRepository;
import com.cheonjiyeon.api.common.ApiException;
import com.cheonjiyeon.api.notification.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.UUID;

@Service
public class PasswordResetService {
    private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);
    private static final int TOKEN_EXPIRY_MINUTES = 30;

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final EmailService emailService;
    private final AuditLogService auditLogService;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public PasswordResetService(UserRepository userRepository,
                                PasswordResetTokenRepository tokenRepository,
                                RefreshTokenRepository refreshTokenRepository,
                                EmailService emailService,
                                AuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.emailService = emailService;
        this.auditLogService = auditLogService;
    }

    /**
     * 비밀번호 재설정 요청. 미등록 이메일도 200 OK 반환 (이메일 열거 방지).
     */
    @Transactional
    public void forgotPassword(String email) {
        var userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            log.info("Password reset requested for unregistered email: {}", email);
            return;
        }

        UserEntity user = userOpt.get();
        String rawToken = UUID.randomUUID().toString();
        String tokenHash = sha256(rawToken);

        PasswordResetTokenEntity tokenEntity = new PasswordResetTokenEntity();
        tokenEntity.setUserId(user.getId());
        tokenEntity.setTokenHash(tokenHash);
        tokenEntity.setExpiresAt(LocalDateTime.now().plusMinutes(TOKEN_EXPIRY_MINUTES));
        tokenEntity.setUsed(false);
        tokenRepository.save(tokenEntity);

        String resetLink = "http://localhost:3000/reset-password?token=" + rawToken;
        String htmlBody = """
                <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
                    <h2 style="color: #C9A227;">천지연꽃신당 비밀번호 재설정</h2>
                    <p>안녕하세요, %s님.</p>
                    <p>비밀번호 재설정을 요청하셨습니다. 아래 링크를 클릭하여 새 비밀번호를 설정해주세요.</p>
                    <p><a href="%s" style="display: inline-block; padding: 12px 24px; background: #C9A227; color: #0f0d0a; text-decoration: none; border-radius: 24px; font-weight: bold;">비밀번호 재설정</a></p>
                    <p style="color: #888; font-size: 12px;">이 링크는 %d분 동안 유효합니다.</p>
                    <p style="color: #888; font-size: 12px;">본인이 요청하지 않은 경우 이 이메일을 무시하셔도 됩니다.</p>
                </div>
                """.formatted(user.getName(), resetLink, TOKEN_EXPIRY_MINUTES);

        emailService.send(user.getEmail(), "[천지연꽃신당] 비밀번호 재설정", htmlBody);
        auditLogService.log(user.getId(), "PASSWORD_RESET_REQUESTED", "USER", user.getId());
    }

    /**
     * 토큰 검증 후 비밀번호 재설정 + 모든 세션 무효화.
     */
    @Transactional
    public void resetPassword(String token, String newPassword) {
        if (newPassword == null || newPassword.length() < 8) {
            throw new ApiException(400, "비밀번호는 8자 이상이어야 합니다.");
        }

        String tokenHash = sha256(token);
        PasswordResetTokenEntity tokenEntity = tokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new ApiException(400, "유효하지 않거나 만료된 토큰입니다."));

        if (tokenEntity.isUsed()) {
            throw new ApiException(400, "이미 사용된 토큰입니다.");
        }

        if (tokenEntity.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ApiException(400, "유효하지 않거나 만료된 토큰입니다.");
        }

        UserEntity user = userRepository.findById(tokenEntity.getUserId())
                .orElseThrow(() -> new ApiException(400, "사용자를 찾을 수 없습니다."));

        user.setPasswordHash(encoder.encode(newPassword));
        userRepository.save(user);

        tokenEntity.setUsed(true);
        tokenRepository.save(tokenEntity);

        // 모든 세션 무효화
        refreshTokenRepository.findByUserIdAndRevokedFalse(user.getId()).forEach(rt -> {
            rt.setRevoked(true);
            refreshTokenRepository.save(rt);
        });

        auditLogService.log(user.getId(), "PASSWORD_RESET_COMPLETED", "USER", user.getId());
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
