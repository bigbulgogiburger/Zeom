package com.cheonjiyeon.api.auth;

import com.cheonjiyeon.api.audit.AuditLogService;
import com.cheonjiyeon.api.common.ApiException;
import com.cheonjiyeon.api.notification.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.UUID;

@Service
public class EmailVerificationService {
    private static final Logger log = LoggerFactory.getLogger(EmailVerificationService.class);
    private static final int RESEND_COOLDOWN_SECONDS = 60;

    private final UserRepository userRepository;
    private final EmailService emailService;
    private final AuditLogService auditLogService;

    public EmailVerificationService(UserRepository userRepository,
                                    EmailService emailService,
                                    AuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.auditLogService = auditLogService;
    }

    /**
     * 회원가입 시 호출 - 인증 토큰 생성 및 이메일 발송.
     */
    @Transactional
    public void sendVerificationEmail(UserEntity user) {
        String rawToken = UUID.randomUUID().toString();
        String tokenHash = sha256(rawToken);

        user.setEmailVerified(false);
        user.setEmailVerificationToken(tokenHash);
        user.setEmailVerificationSentAt(LocalDateTime.now());
        userRepository.save(user);

        String verifyLink = "http://localhost:3000/verify-email?token=" + rawToken;
        String htmlBody = """
                <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
                    <h2 style="color: #C9A227;">천지연꽃신당 이메일 인증</h2>
                    <p>안녕하세요, %s님.</p>
                    <p>회원가입을 완료하려면 아래 버튼을 클릭하여 이메일을 인증해주세요.</p>
                    <p><a href="%s" style="display: inline-block; padding: 12px 24px; background: #C9A227; color: #0f0d0a; text-decoration: none; border-radius: 24px; font-weight: bold;">이메일 인증하기</a></p>
                    <p style="color: #888; font-size: 12px;">본인이 요청하지 않은 경우 이 이메일을 무시하셔도 됩니다.</p>
                </div>
                """.formatted(user.getName(), verifyLink);

        emailService.send(user.getEmail(), "[천지연꽃신당] 이메일 인증", htmlBody);
        log.info("Verification email sent to userId={}", user.getId());
    }

    /**
     * 이메일 인증 토큰 검증.
     */
    @Transactional
    public void verifyEmail(String token) {
        String tokenHash = sha256(token);

        UserEntity user = userRepository.findAll().stream()
                .filter(u -> tokenHash.equals(u.getEmailVerificationToken()))
                .findFirst()
                .orElseThrow(() -> new ApiException(400, "유효하지 않은 인증 토큰입니다."));

        if (user.isEmailVerified()) {
            throw new ApiException(400, "이미 인증된 이메일입니다.");
        }

        user.setEmailVerified(true);
        user.setEmailVerificationToken(null);
        userRepository.save(user);

        auditLogService.log(user.getId(), "EMAIL_VERIFIED", "USER", user.getId());
    }

    /**
     * 인증 이메일 재발송 (1분 쿨다운).
     */
    @Transactional
    public void resendVerification(String bearerToken, TokenStore tokenStore) {
        String accessToken = extractToken(bearerToken);
        Long userId = tokenStore.resolveAccessUserId(accessToken)
                .orElseThrow(() -> new ApiException(401, "로그인이 필요합니다."));

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(401, "사용자를 찾을 수 없습니다."));

        if (user.isEmailVerified()) {
            throw new ApiException(400, "이미 인증된 이메일입니다.");
        }

        if (user.getEmailVerificationSentAt() != null
                && user.getEmailVerificationSentAt().plusSeconds(RESEND_COOLDOWN_SECONDS).isAfter(LocalDateTime.now())) {
            throw new ApiException(429, "잠시 후 다시 시도해주세요. (1분 쿨다운)");
        }

        sendVerificationEmail(user);
    }

    private String extractToken(String bearerToken) {
        if (bearerToken == null || !bearerToken.startsWith("Bearer ")) {
            throw new ApiException(401, "Authorization Bearer 토큰이 필요합니다.");
        }
        return bearerToken.substring(7);
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
