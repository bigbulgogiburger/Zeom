package com.cheonjiyeon.api.user;

import com.cheonjiyeon.api.audit.AuditLogService;
import com.cheonjiyeon.api.auth.TokenStore;
import com.cheonjiyeon.api.auth.UserEntity;
import com.cheonjiyeon.api.auth.UserRepository;
import com.cheonjiyeon.api.common.ApiException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final TokenStore tokenStore;
    private final AuditLogService auditLogService;

    public UserService(UserRepository userRepository,
                       TokenStore tokenStore,
                       AuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.tokenStore = tokenStore;
        this.auditLogService = auditLogService;
    }

    /**
     * 프로필 업데이트 (이름, 전화번호, 생년월일).
     */
    @Transactional
    public UserProfileResponse updateProfile(String bearerToken, UpdateProfileRequest req) {
        UserEntity user = resolveUser(bearerToken);

        if (req.name() != null && !req.name().isBlank()) {
            if (req.name().trim().length() < 2) {
                throw new ApiException(400, "이름은 2자 이상이어야 합니다.");
            }
            user.setName(req.name().trim());
        }

        if (req.phone() != null) {
            user.setPhone(req.phone().isBlank() ? null : req.phone());
        }

        if (req.birthDate() != null) {
            if (req.birthDate().isBlank()) {
                user.setBirthDate(null);
            } else {
                user.setBirthDate(LocalDate.parse(req.birthDate()));
            }
        }

        userRepository.save(user);
        auditLogService.log(user.getId(), "PROFILE_UPDATED", "USER", user.getId());
        return toProfileResponse(user);
    }

    /**
     * 프로필 조회.
     */
    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(String bearerToken) {
        UserEntity user = resolveUser(bearerToken);
        return toProfileResponse(user);
    }

    /**
     * 계정 탈퇴 요청 (30일 유예 후 삭제).
     */
    @Transactional
    public void requestDeletion(String bearerToken) {
        UserEntity user = resolveUser(bearerToken);

        if (user.getDeletionRequestedAt() != null) {
            throw new ApiException(400, "이미 탈퇴가 요청되었습니다.");
        }

        user.setDeletionRequestedAt(LocalDateTime.now());
        user.setStatus("DELETION_REQUESTED");
        userRepository.save(user);

        auditLogService.log(user.getId(), "ACCOUNT_DELETION_REQUESTED", "USER", user.getId());
    }

    private UserEntity resolveUser(String bearerToken) {
        String accessToken = extractToken(bearerToken);
        Long userId = tokenStore.resolveAccessUserId(accessToken)
                .orElseThrow(() -> new ApiException(401, "로그인이 필요합니다."));
        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(401, "사용자를 찾을 수 없습니다."));
    }

    private String extractToken(String bearerToken) {
        if (bearerToken == null || !bearerToken.startsWith("Bearer ")) {
            throw new ApiException(401, "Authorization Bearer 토큰이 필요합니다.");
        }
        return bearerToken.substring(7);
    }

    private UserProfileResponse toProfileResponse(UserEntity user) {
        return new UserProfileResponse(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getRole(),
                user.getPhone(),
                user.getBirthDate() != null ? user.getBirthDate().toString() : null,
                user.getGender(),
                user.isEmailVerified(),
                user.getDeletionRequestedAt()
        );
    }

    public record UpdateProfileRequest(
            String name,
            String phone,
            String birthDate
    ) {}

    public record UserProfileResponse(
            Long id,
            String email,
            String name,
            String role,
            String phone,
            String birthDate,
            String gender,
            boolean emailVerified,
            LocalDateTime deletionRequestedAt
    ) {}
}
