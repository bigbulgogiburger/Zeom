package com.cheonjiyeon.api.settlement;

import com.cheonjiyeon.api.auth.AuthService;
import com.cheonjiyeon.api.auth.TokenStore;
import com.cheonjiyeon.api.auth.UserEntity;
import com.cheonjiyeon.api.auth.UserRepository;
import com.cheonjiyeon.api.common.ApiException;
import com.cheonjiyeon.api.counselor.CounselorEntity;
import com.cheonjiyeon.api.counselor.CounselorRepository;
import org.springframework.web.bind.annotation.*;

@RestController
public class SettlementController {
    private final SettlementService settlementService;
    private final AuthService authService;
    private final TokenStore tokenStore;
    private final UserRepository userRepository;
    private final CounselorRepository counselorRepository;
    private final CounselorSettlementRepository counselorSettlementRepository;

    public SettlementController(
            SettlementService settlementService,
            AuthService authService,
            TokenStore tokenStore,
            UserRepository userRepository,
            CounselorRepository counselorRepository,
            CounselorSettlementRepository counselorSettlementRepository
    ) {
        this.settlementService = settlementService;
        this.authService = authService;
        this.tokenStore = tokenStore;
        this.userRepository = userRepository;
        this.counselorRepository = counselorRepository;
        this.counselorSettlementRepository = counselorSettlementRepository;
    }

    @GetMapping("/api/v1/settlements/my")
    public SettlementDtos.CustomerSettlementListResponse getMySettlements(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        UserEntity user = resolveUser(authHeader);
        return settlementService.getCustomerSettlements(user.getId());
    }

    @GetMapping("/api/v1/settlements/session/{sessionId}")
    public SettlementDtos.SettlementResponse getBySession(
            @PathVariable Long sessionId) {
        return settlementService.getSettlementBySessionId(sessionId);
    }

    @GetMapping("/api/v1/counselor/settlements")
    public SettlementDtos.CounselorSettlementListResponse getCounselorSettlements(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        CounselorEntity counselor = resolveCounselor(authHeader);
        return settlementService.getCounselorSettlements(counselor.getId());
    }

    @GetMapping("/api/v1/counselor/settlements/{id}")
    public SettlementDtos.CounselorSettlementDetailResponse getCounselorSettlementDetail(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id) {
        resolveCounselor(authHeader); // verify counselor access
        return settlementService.getCounselorSettlementDetail(id);
    }

    @GetMapping("/api/v1/admin/settlements")
    public SettlementDtos.CounselorSettlementListResponse getAllSettlements(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        authService.requireAdmin(authHeader);
        return new SettlementDtos.CounselorSettlementListResponse(
                counselorSettlementRepository.findAll().stream()
                        .map(SettlementDtos.CounselorSettlementSummary::from)
                        .toList()
        );
    }

    @PostMapping("/api/v1/admin/settlements/{id}/confirm")
    public SettlementDtos.CounselorSettlementSummary confirmSettlement(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id) {
        var admin = authService.requireAdmin(authHeader);
        return settlementService.confirmSettlement(admin.getId(), id);
    }

    @PostMapping("/api/v1/admin/settlements/{id}/pay")
    public SettlementDtos.CounselorSettlementSummary paySettlement(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id) {
        var admin = authService.requireAdmin(authHeader);
        return settlementService.paySettlement(admin.getId(), id);
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

    private CounselorEntity resolveCounselor(String authHeader) {
        UserEntity user = resolveUser(authHeader);
        return counselorRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ApiException(403, "상담사 계정이 아닙니다."));
    }
}
