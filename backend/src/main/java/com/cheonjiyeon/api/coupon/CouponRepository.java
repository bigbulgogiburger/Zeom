package com.cheonjiyeon.api.coupon;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CouponRepository extends JpaRepository<CouponEntity, Long> {
    Optional<CouponEntity> findByCode(String code);
    Page<CouponEntity> findByIsActiveOrderByCreatedAtDesc(boolean isActive, Pageable pageable);
    Page<CouponEntity> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
