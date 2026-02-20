package com.cheonjiyeon.api.admin;

import com.cheonjiyeon.api.auth.AuthService;
import com.cheonjiyeon.api.auth.UserEntity;
import com.cheonjiyeon.api.auth.UserRepository;
import com.cheonjiyeon.api.auth.refresh.RefreshTokenRepository;
import com.cheonjiyeon.api.audit.AuditLogService;
import com.cheonjiyeon.api.booking.BookingEntity;
import com.cheonjiyeon.api.booking.BookingRepository;
import com.cheonjiyeon.api.common.ApiException;
import com.cheonjiyeon.api.wallet.WalletEntity;
import com.cheonjiyeon.api.wallet.WalletRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class AdminUserService {
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final WalletRepository walletRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final AuditLogService auditLogService;
    private final AuthService authService;

    public AdminUserService(
            UserRepository userRepository,
            BookingRepository bookingRepository,
            WalletRepository walletRepository,
            RefreshTokenRepository refreshTokenRepository,
            AuditLogService auditLogService,
            AuthService authService
    ) {
        this.userRepository = userRepository;
        this.bookingRepository = bookingRepository;
        this.walletRepository = walletRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.auditLogService = auditLogService;
        this.authService = authService;
    }

    public Page<UserEntity> listUsers(String authHeader, String search, String status, String role, int page, int size) {
        authService.requireAdmin(authHeader);
        return userRepository.findAll(PageRequest.of(page, size));
    }

    public Map<String, Object> getUserDetail(String authHeader, Long userId) {
        authService.requireAdmin(authHeader);

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(404, "사용자를 찾을 수 없습니다."));

        List<BookingEntity> recentBookings = bookingRepository.findByUserIdOrderByIdDesc(userId);
        List<BookingEntity> limitedBookings = recentBookings.size() > 10
                ? recentBookings.subList(0, 10) : recentBookings;

        Long walletBalance = 0L;
        try {
            WalletEntity wallet = walletRepository.findByUserId(userId).orElse(null);
            if (wallet != null) {
                walletBalance = wallet.getBalanceCash();
            }
        } catch (Exception ignored) {
        }

        return Map.of(
                "user", toUserMap(user),
                "recentBookings", limitedBookings.stream().map(b -> Map.of(
                        "id", b.getId(),
                        "status", b.getStatus(),
                        "creditsUsed", b.getCreditsUsed(),
                        "createdAt", b.getCreatedAt().toString()
                )).toList(),
                "walletBalance", walletBalance
        );
    }

    @Transactional
    public UserEntity suspendUser(String authHeader, Long userId, String reason) {
        UserEntity admin = authService.requireAdmin(authHeader);

        if (reason == null || reason.isBlank()) {
            throw new ApiException(400, "정지 사유를 입력해주세요.");
        }

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(404, "사용자를 찾을 수 없습니다."));

        if ("SUSPENDED".equals(user.getStatus())) {
            throw new ApiException(400, "이미 정지된 사용자입니다.");
        }

        user.setStatus("SUSPENDED");
        user.setSuspendedAt(LocalDateTime.now());
        user.setSuspendedReason(reason);

        // Invalidate all sessions
        refreshTokenRepository.findByUserIdAndRevokedFalse(userId).forEach(t -> {
            t.setRevoked(true);
            refreshTokenRepository.save(t);
        });

        auditLogService.log(admin.getId(), "ADMIN_USER_SUSPEND", "USER", userId);
        return userRepository.save(user);
    }

    @Transactional
    public UserEntity unsuspendUser(String authHeader, Long userId) {
        UserEntity admin = authService.requireAdmin(authHeader);

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(404, "사용자를 찾을 수 없습니다."));

        if (!"SUSPENDED".equals(user.getStatus())) {
            throw new ApiException(400, "정지 상태가 아닌 사용자입니다.");
        }

        user.setStatus("ACTIVE");
        user.setSuspendedAt(null);
        user.setSuspendedReason(null);

        auditLogService.log(admin.getId(), "ADMIN_USER_UNSUSPEND", "USER", userId);
        return userRepository.save(user);
    }

    private Map<String, Object> toUserMap(UserEntity user) {
        return Map.ofEntries(
                Map.entry("id", user.getId()),
                Map.entry("email", user.getEmail()),
                Map.entry("name", user.getName()),
                Map.entry("role", user.getRole()),
                Map.entry("status", user.getStatus() != null ? user.getStatus() : "ACTIVE"),
                Map.entry("phone", user.getPhone() != null ? user.getPhone() : ""),
                Map.entry("gender", user.getGender() != null ? user.getGender() : ""),
                Map.entry("suspendedAt", user.getSuspendedAt() != null ? user.getSuspendedAt().toString() : ""),
                Map.entry("suspendedReason", user.getSuspendedReason() != null ? user.getSuspendedReason() : "")
        );
    }
}
