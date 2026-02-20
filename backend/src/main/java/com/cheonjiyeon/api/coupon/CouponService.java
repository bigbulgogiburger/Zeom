package com.cheonjiyeon.api.coupon;

import com.cheonjiyeon.api.auth.AuthService;
import com.cheonjiyeon.api.auth.TokenStore;
import com.cheonjiyeon.api.auth.UserEntity;
import com.cheonjiyeon.api.auth.UserRepository;
import com.cheonjiyeon.api.common.ApiException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class CouponService {
    private final CouponRepository couponRepository;
    private final CouponUsageRepository couponUsageRepository;
    private final TokenStore tokenStore;
    private final UserRepository userRepository;

    public CouponService(
            CouponRepository couponRepository,
            CouponUsageRepository couponUsageRepository,
            TokenStore tokenStore,
            UserRepository userRepository
    ) {
        this.couponRepository = couponRepository;
        this.couponUsageRepository = couponUsageRepository;
        this.tokenStore = tokenStore;
        this.userRepository = userRepository;
    }

    public Map<String, Object> validateCoupon(String authHeader, String code, Long orderAmount) {
        UserEntity user = resolveUser(authHeader);
        CouponEntity coupon = couponRepository.findByCode(code)
                .orElseThrow(() -> new ApiException(404, "존재하지 않는 쿠폰 코드입니다."));

        validateCouponUsability(coupon, user.getId(), orderAmount);

        long discount = calculateDiscount(coupon, orderAmount);

        return Map.of(
                "valid", true,
                "couponType", coupon.getCouponType(),
                "discountValue", coupon.getDiscountValue(),
                "discountAmount", discount,
                "code", coupon.getCode()
        );
    }

    @Transactional
    public Map<String, Object> applyCoupon(String authHeader, String code) {
        UserEntity user = resolveUser(authHeader);
        CouponEntity coupon = couponRepository.findByCode(code)
                .orElseThrow(() -> new ApiException(404, "존재하지 않는 쿠폰 코드입니다."));

        validateCouponUsability(coupon, user.getId(), 0L);

        // Record usage
        CouponUsageEntity usage = new CouponUsageEntity();
        usage.setCouponId(coupon.getId());
        usage.setUserId(user.getId());
        couponUsageRepository.save(usage);

        // Increment used count
        coupon.setUsedCount(coupon.getUsedCount() + 1);
        couponRepository.save(coupon);

        return Map.of(
                "applied", true,
                "couponType", coupon.getCouponType(),
                "discountValue", coupon.getDiscountValue()
        );
    }

    @Transactional
    public CouponEntity createCoupon(String code, String couponType, Long discountValue,
                                      Long minOrderAmount, Integer maxUses,
                                      LocalDateTime validFrom, LocalDateTime validUntil) {
        couponRepository.findByCode(code).ifPresent(c -> {
            throw new ApiException(409, "이미 존재하는 쿠폰 코드입니다.");
        });

        CouponEntity coupon = new CouponEntity();
        coupon.setCode(code);
        coupon.setCouponType(couponType);
        coupon.setDiscountValue(discountValue);
        coupon.setMinOrderAmount(minOrderAmount != null ? minOrderAmount : 0L);
        coupon.setMaxUses(maxUses);
        coupon.setValidFrom(validFrom);
        coupon.setValidUntil(validUntil);

        return couponRepository.save(coupon);
    }

    @Transactional
    public CouponEntity deactivateCoupon(Long id) {
        CouponEntity coupon = couponRepository.findById(id)
                .orElseThrow(() -> new ApiException(404, "쿠폰을 찾을 수 없습니다."));

        coupon.setActive(false);
        return couponRepository.save(coupon);
    }

    public Page<CouponEntity> listCoupons(String filter, int page, int size) {
        if ("active".equals(filter)) {
            return couponRepository.findByIsActiveOrderByCreatedAtDesc(true, PageRequest.of(page, size));
        } else if ("inactive".equals(filter)) {
            return couponRepository.findByIsActiveOrderByCreatedAtDesc(false, PageRequest.of(page, size));
        }
        return couponRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(page, size));
    }

    public Map<String, Object> getCouponStats(Long id) {
        CouponEntity coupon = couponRepository.findById(id)
                .orElseThrow(() -> new ApiException(404, "쿠폰을 찾을 수 없습니다."));

        long totalUsages = couponUsageRepository.countByCouponId(id);
        List<CouponUsageEntity> recentUsages = couponUsageRepository.findByCouponId(id);

        return Map.of(
                "couponId", coupon.getId(),
                "code", coupon.getCode(),
                "totalUsages", totalUsages,
                "maxUses", coupon.getMaxUses() != null ? coupon.getMaxUses() : "unlimited",
                "isActive", coupon.isActive(),
                "recentUsages", recentUsages.stream().limit(20).map(u -> Map.of(
                        "userId", u.getUserId(),
                        "usedAt", u.getUsedAt().toString()
                )).toList()
        );
    }

    private void validateCouponUsability(CouponEntity coupon, Long userId, Long orderAmount) {
        if (!coupon.isActive()) {
            throw new ApiException(400, "비활성화된 쿠폰입니다.");
        }

        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(coupon.getValidFrom())) {
            throw new ApiException(400, "아직 사용할 수 없는 쿠폰입니다.");
        }
        if (now.isAfter(coupon.getValidUntil())) {
            throw new ApiException(400, "만료된 쿠폰입니다.");
        }

        if (coupon.getMaxUses() != null && coupon.getUsedCount() >= coupon.getMaxUses()) {
            throw new ApiException(400, "사용 횟수가 초과된 쿠폰입니다.");
        }

        // Check if user already used this coupon
        if (couponUsageRepository.findByCouponIdAndUserId(coupon.getId(), userId).isPresent()) {
            throw new ApiException(400, "이미 사용한 쿠폰입니다.");
        }

        if (orderAmount != null && coupon.getMinOrderAmount() != null
                && orderAmount < coupon.getMinOrderAmount()) {
            throw new ApiException(400, "최소 주문 금액이 부족합니다. (최소: " + coupon.getMinOrderAmount() + "원)");
        }
    }

    private long calculateDiscount(CouponEntity coupon, Long orderAmount) {
        return switch (coupon.getCouponType()) {
            case "FIXED" -> coupon.getDiscountValue();
            case "PERCENT" -> orderAmount * coupon.getDiscountValue() / 100;
            case "FREE_FIRST" -> orderAmount != null ? orderAmount : 0L;
            default -> 0L;
        };
    }

    private UserEntity resolveUser(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new ApiException(401, "Authorization Bearer 토큰이 필요합니다.");
        }
        String token = authHeader.substring(7);
        Long userId = tokenStore.resolveAccessUserId(token)
                .orElseThrow(() -> new ApiException(401, "로그인이 필요합니다."));

        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(401, "유효하지 않은 토큰입니다."));
    }
}
