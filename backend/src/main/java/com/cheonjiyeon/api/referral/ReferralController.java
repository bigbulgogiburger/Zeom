package com.cheonjiyeon.api.referral;

import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/referral")
public class ReferralController {
    private final ReferralService referralService;

    public ReferralController(ReferralService referralService) {
        this.referralService = referralService;
    }

    @GetMapping("/my-code")
    public Map<String, Object> getMyCode(
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        return referralService.getOrCreateCode(authHeader);
    }

    @PostMapping("/apply")
    public Map<String, Object> applyReferralCode(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Map<String, String> body
    ) {
        String code = body.get("code");
        return referralService.applyReferralCode(authHeader, code);
    }

    @GetMapping("/stats")
    public Map<String, Object> getStats(
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        return referralService.getMyStats(authHeader);
    }
}
