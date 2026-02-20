package com.cheonjiyeon.api.referral;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ReferralCodeRepository extends JpaRepository<ReferralCodeEntity, Long> {
    Optional<ReferralCodeEntity> findByUserId(Long userId);
    Optional<ReferralCodeEntity> findByCode(String code);
}
