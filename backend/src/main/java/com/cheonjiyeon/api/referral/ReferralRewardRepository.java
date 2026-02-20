package com.cheonjiyeon.api.referral;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReferralRewardRepository extends JpaRepository<ReferralRewardEntity, Long> {
    List<ReferralRewardEntity> findByReferrerId(Long referrerId);
    Optional<ReferralRewardEntity> findByRefereeId(Long refereeId);
    long countByReferrerId(Long referrerId);
    long countByReferrerIdAndReferrerRewardedTrue(Long referrerId);
}
