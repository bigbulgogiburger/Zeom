package com.cheonjiyeon.api.cash;

import com.cheonjiyeon.api.auth.TokenStore;
import com.cheonjiyeon.api.auth.UserEntity;
import com.cheonjiyeon.api.auth.UserRepository;
import com.cheonjiyeon.api.common.ApiException;
import com.cheonjiyeon.api.wallet.WalletEntity;
import com.cheonjiyeon.api.wallet.WalletService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/cash")
public class CashChargeController {

    private final WalletService walletService;
    private final CashTransactionService cashTransactionService;
    private final TokenStore tokenStore;
    private final UserRepository userRepository;

    public CashChargeController(
            WalletService walletService,
            CashTransactionService cashTransactionService,
            TokenStore tokenStore,
            UserRepository userRepository
    ) {
        this.walletService = walletService;
        this.cashTransactionService = cashTransactionService;
        this.tokenStore = tokenStore;
        this.userRepository = userRepository;
    }

    @PostMapping("/charge")
    public Map<String, Object> charge(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Map<String, Object> body
    ) {
        UserEntity user = resolveUser(authHeader);

        Long amount = ((Number) body.get("amount")).longValue();
        String paymentMethod = (String) body.getOrDefault("paymentMethod", "TEST");

        if (amount == null || amount <= 0) {
            throw new ApiException(400, "충전 금액은 0보다 커야 합니다.");
        }

        WalletEntity wallet = walletService.getOrCreateWallet(user.getId());

        String idempotencyKey = "charge-" + paymentMethod + "-" + UUID.randomUUID();
        CashTransactionEntity tx = cashTransactionService.recordTransaction(
                user.getId(), "CHARGE", amount, "TEST_CHARGE", null, idempotencyKey
        );

        return Map.of(
                "walletId", wallet.getId(),
                "newBalance", tx.getBalanceAfter(),
                "transactionId", tx.getId()
        );
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
