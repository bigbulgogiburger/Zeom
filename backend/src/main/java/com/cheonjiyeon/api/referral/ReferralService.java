package com.cheonjiyeon.api.referral;

import com.cheonjiyeon.api.audit.AuditLogService;
import com.cheonjiyeon.api.auth.TokenStore;
import com.cheonjiyeon.api.auth.UserEntity;
import com.cheonjiyeon.api.auth.UserRepository;
import com.cheonjiyeon.api.common.ApiException;
import com.cheonjiyeon.api.wallet.WalletService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class ReferralService {
    private final ReferralCodeRepository referralCodeRepository;
    private final ReferralRewardRepository referralRewardRepository;
    private final TokenStore tokenStore;
    private final UserRepository userRepository;
    private final WalletService walletService;
    private final AuditLogService auditLogService;

    public ReferralService(
            ReferralCodeRepository referralCodeRepository,
            ReferralRewardRepository referralRewardRepository,
            TokenStore tokenStore,
            UserRepository userRepository,
            WalletService walletService,
            AuditLogService auditLogService
    ) {
        this.referralCodeRepository = referralCodeRepository;
        this.referralRewardRepository = referralRewardRepository;
        this.tokenStore = tokenStore;
        this.userRepository = userRepository;
        this.walletService = walletService;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public Map<String, Object> getOrCreateCode(String authHeader) {
        UserEntity user = resolveUser(authHeader);

        ReferralCodeEntity codeEntity = referralCodeRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    ReferralCodeEntity newCode = new ReferralCodeEntity();
                    newCode.setUserId(user.getId());
                    newCode.setCode(generateCode());
                    return referralCodeRepository.save(newCode);
                });

        return Map.of(
                "code", codeEntity.getCode(),
                "userId", user.getId()
        );
    }

    @Transactional
    public Map<String, Object> applyReferralCode(String authHeader, String code) {
        UserEntity referee = resolveUser(authHeader);

        // Cannot refer yourself
        ReferralCodeEntity referralCode = referralCodeRepository.findByCode(code)
                .orElseThrow(() -> new ApiException(404, "존재하지 않는 추천 코드입니다."));

        if (referralCode.getUserId().equals(referee.getId())) {
            throw new ApiException(400, "자신의 추천 코드는 사용할 수 없습니다.");
        }

        // Check if already referred
        if (referralRewardRepository.findByRefereeId(referee.getId()).isPresent()) {
            throw new ApiException(400, "이미 추천 코드를 사용하셨습니다.");
        }

        // Create reward record
        ReferralRewardEntity reward = new ReferralRewardEntity();
        reward.setReferrerId(referralCode.getUserId());
        reward.setRefereeId(referee.getId());
        reward.setRewardAmount(2000L);
        referralRewardRepository.save(reward);

        // Credit referrer's wallet
        walletService.charge(referralCode.getUserId(), 2000L, "REFERRAL", reward.getId());
        reward.setReferrerRewarded(true);
        referralRewardRepository.save(reward);

        auditLogService.log(referralCode.getUserId(), "REFERRAL_REWARD_PAID", "REFERRAL_REWARD", reward.getId());

        return Map.of(
                "applied", true,
                "rewardAmount", 2000L,
                "message", "추천 코드가 적용되었습니다. 보상이 지급되었습니다."
        );
    }

    public Map<String, Object> getMyStats(String authHeader) {
        UserEntity user = resolveUser(authHeader);

        long totalReferrals = referralRewardRepository.countByReferrerId(user.getId());
        long rewardedCount = referralRewardRepository.countByReferrerIdAndReferrerRewardedTrue(user.getId());

        List<ReferralRewardEntity> rewards = referralRewardRepository.findByReferrerId(user.getId());
        long totalRewardAmount = rewards.stream()
                .filter(ReferralRewardEntity::isReferrerRewarded)
                .mapToLong(ReferralRewardEntity::getRewardAmount)
                .sum();

        String myCode = referralCodeRepository.findByUserId(user.getId())
                .map(ReferralCodeEntity::getCode)
                .orElse(null);

        return Map.of(
                "myCode", myCode != null ? myCode : "",
                "totalReferrals", totalReferrals,
                "rewardedCount", rewardedCount,
                "totalRewardAmount", totalRewardAmount,
                "rewards", rewards.stream().map(r -> Map.of(
                        "refereeId", r.getRefereeId(),
                        "rewardAmount", r.getRewardAmount(),
                        "referrerRewarded", r.isReferrerRewarded(),
                        "createdAt", r.getCreatedAt().toString()
                )).toList()
        );
    }

    private String generateCode() {
        String code = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        while (referralCodeRepository.findByCode(code).isPresent()) {
            code = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }
        return code;
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
