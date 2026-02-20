package com.cheonjiyeon.api.coupon;

import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/coupons")
public class CouponController {
    private final CouponService couponService;

    public CouponController(CouponService couponService) {
        this.couponService = couponService;
    }

    @PostMapping("/validate")
    public Map<String, Object> validateCoupon(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Map<String, Object> body
    ) {
        String code = (String) body.get("code");
        Long orderAmount = body.get("orderAmount") != null
                ? ((Number) body.get("orderAmount")).longValue() : 0L;

        return couponService.validateCoupon(authHeader, code, orderAmount);
    }

    @PostMapping("/apply")
    public Map<String, Object> applyCoupon(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Map<String, String> body
    ) {
        String code = body.get("code");
        return couponService.applyCoupon(authHeader, code);
    }
}
