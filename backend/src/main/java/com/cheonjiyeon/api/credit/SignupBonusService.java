package com.cheonjiyeon.api.credit;

import com.cheonjiyeon.api.wallet.WalletEntity;
import com.cheonjiyeon.api.wallet.WalletRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SignupBonusService {
    private static final Logger log = LoggerFactory.getLogger(SignupBonusService.class);

    // 3분 × 3000원/분 = 9000원
    private static final long SIGNUP_BONUS_AMOUNT = 9000L;

    private final SignupBonusRepository signupBonusRepository;
    private final WalletRepository walletRepository;

    public SignupBonusService(
            SignupBonusRepository signupBonusRepository,
            WalletRepository walletRepository
    ) {
        this.signupBonusRepository = signupBonusRepository;
        this.walletRepository = walletRepository;
    }

    @Transactional
    public void grantSignupBonus(Long userId) {
        // 중복 지급 방지
        if (signupBonusRepository.existsByUserId(userId)) {
            log.info("Signup bonus already granted for userId={}", userId);
            return;
        }

        // 보너스 지급 기록
        SignupBonusEntity bonus = new SignupBonusEntity();
        bonus.setUserId(userId);
        bonus.setBonusAmount(SIGNUP_BONUS_AMOUNT);
        signupBonusRepository.save(bonus);

        // 지갑 보너스 잔액 증가
        WalletEntity wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalStateException("Wallet not found for userId=" + userId));
        wallet.setBonusBalance(wallet.getBonusBalance() + SIGNUP_BONUS_AMOUNT);
        walletRepository.save(wallet);

        log.info("Signup bonus granted: userId={}, amount={}", userId, SIGNUP_BONUS_AMOUNT);
    }
}
