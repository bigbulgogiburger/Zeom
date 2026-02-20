package com.cheonjiyeon.api.coupon;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CouponUsageRepository extends JpaRepository<CouponUsageEntity, Long> {
    Optional<CouponUsageEntity> findByCouponIdAndUserId(Long couponId, Long userId);
    List<CouponUsageEntity> findByCouponId(Long couponId);
    long countByCouponId(Long couponId);
}
