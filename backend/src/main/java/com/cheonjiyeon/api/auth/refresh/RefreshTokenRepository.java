package com.cheonjiyeon.api.auth.refresh;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshTokenEntity, Long> {
    Optional<RefreshTokenEntity> findByTokenHashAndRevokedFalse(String tokenHash);
    Optional<RefreshTokenEntity> findByTokenHash(String tokenHash);
    List<RefreshTokenEntity> findByUserIdOrderByIdDesc(Long userId);
    Optional<RefreshTokenEntity> findByUserIdAndDeviceIdAndRevokedFalse(Long userId, String deviceId);
    List<RefreshTokenEntity> findByUserIdAndRevokedFalse(Long userId);
}
