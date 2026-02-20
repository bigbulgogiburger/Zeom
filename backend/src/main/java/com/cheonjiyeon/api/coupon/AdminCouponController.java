package com.cheonjiyeon.api.coupon;

import com.cheonjiyeon.api.auth.AuthService;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/coupons")
public class AdminCouponController {
    private final CouponService couponService;
    private final AuthService authService;

    public AdminCouponController(CouponService couponService, AuthService authService) {
        this.couponService = couponService;
        this.authService = authService;
    }

    @GetMapping
    public Map<String, Object> listCoupons(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(required = false) String filter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        authService.requireAdmin(authHeader);
        Page<CouponEntity> couponPage = couponService.listCoupons(filter, page, size);

        return Map.of(
                "content", couponPage.getContent().stream().map(c -> Map.ofEntries(
                        Map.entry("id", c.getId()),
                        Map.entry("code", c.getCode()),
                        Map.entry("couponType", c.getCouponType()),
                        Map.entry("discountValue", c.getDiscountValue()),
                        Map.entry("minOrderAmount", c.getMinOrderAmount() != null ? c.getMinOrderAmount() : 0),
                        Map.entry("maxUses", c.getMaxUses() != null ? c.getMaxUses() : -1),
                        Map.entry("usedCount", c.getUsedCount()),
                        Map.entry("validFrom", c.getValidFrom().toString()),
                        Map.entry("validUntil", c.getValidUntil().toString()),
                        Map.entry("isActive", c.isActive()),
                        Map.entry("createdAt", c.getCreatedAt().toString())
                )).toList(),
                "totalPages", couponPage.getTotalPages(),
                "totalElements", couponPage.getTotalElements(),
                "page", couponPage.getNumber()
        );
    }

    @PostMapping
    public Map<String, Object> createCoupon(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Map<String, Object> body
    ) {
        authService.requireAdmin(authHeader);

        String code = (String) body.get("code");
        String couponType = (String) body.get("couponType");
        Long discountValue = ((Number) body.get("discountValue")).longValue();
        Long minOrderAmount = body.get("minOrderAmount") != null
                ? ((Number) body.get("minOrderAmount")).longValue() : 0L;
        Integer maxUses = body.get("maxUses") != null
                ? ((Number) body.get("maxUses")).intValue() : null;
        LocalDateTime validFrom = LocalDateTime.parse((String) body.get("validFrom"));
        LocalDateTime validUntil = LocalDateTime.parse((String) body.get("validUntil"));

        CouponEntity coupon = couponService.createCoupon(
                code, couponType, discountValue, minOrderAmount, maxUses, validFrom, validUntil
        );

        return Map.of("id", coupon.getId(), "code", coupon.getCode());
    }

    @PutMapping("/{id}/deactivate")
    public Map<String, Object> deactivateCoupon(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id
    ) {
        authService.requireAdmin(authHeader);
        CouponEntity coupon = couponService.deactivateCoupon(id);
        return Map.of("id", coupon.getId(), "isActive", coupon.isActive());
    }

    @GetMapping("/{id}/stats")
    public Map<String, Object> getCouponStats(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id
    ) {
        authService.requireAdmin(authHeader);
        return couponService.getCouponStats(id);
    }
}
