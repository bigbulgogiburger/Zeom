package com.cheonjiyeon.api.wallet;

import com.cheonjiyeon.api.auth.TokenStore;
import com.cheonjiyeon.api.auth.UserEntity;
import com.cheonjiyeon.api.auth.UserRepository;
import com.cheonjiyeon.api.cash.CashTransactionEntity;
import com.cheonjiyeon.api.cash.CashTransactionService;
import com.cheonjiyeon.api.common.ApiException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

@Service
public class WalletService {
    private final WalletRepository walletRepository;
    private final CashTransactionService cashTransactionService;
    private final TokenStore tokenStore;
    private final UserRepository userRepository;

    public WalletService(
            WalletRepository walletRepository,
            CashTransactionService cashTransactionService,
            TokenStore tokenStore,
            UserRepository userRepository
    ) {
        this.walletRepository = walletRepository;
        this.cashTransactionService = cashTransactionService;
        this.tokenStore = tokenStore;
        this.userRepository = userRepository;
    }

    @Transactional
    public WalletEntity createWalletForUser(Long userId) {
        if (walletRepository.findByUserId(userId).isPresent()) {
            throw new ApiException(400, "Wallet already exists for user: " + userId);
        }

        WalletEntity wallet = new WalletEntity();
        wallet.setUserId(userId);
        wallet.setBalanceCash(0L);
        return walletRepository.save(wallet);
    }

    public WalletEntity getByUserId(Long userId) {
        return walletRepository.findByUserId(userId)
                .orElseThrow(() -> new ApiException(404, "Wallet not found"));
    }

    @Transactional
    public WalletEntity getOrCreateWallet(Long userId) {
        return walletRepository.findByUserId(userId)
                .orElseGet(() -> {
                    WalletEntity wallet = new WalletEntity();
                    wallet.setUserId(userId);
                    wallet.setBalanceCash(0L);
                    return walletRepository.save(wallet);
                });
    }

    public WalletDtos.WalletResponse getBalance(String authHeader) {
        UserEntity user = resolveUser(authHeader);
        WalletEntity wallet = getByUserId(user.getId());
        return new WalletDtos.WalletResponse(
                wallet.getUserId(),
                wallet.getBalanceCash(),
                wallet.getUpdatedAt()
        );
    }

    @Transactional
    public void charge(Long userId, Long amount, String refType, Long refId) {
        String idempotencyKey = "charge-" + refType + "-" + refId + "-" + UUID.randomUUID();
        cashTransactionService.recordTransaction(userId, "CHARGE", amount, refType, refId, idempotencyKey);
    }

    @Transactional
    public void debit(Long userId, Long amount, String refType, Long refId) {
        String idempotencyKey = "debit-" + refType + "-" + refId + "-" + UUID.randomUUID();
        cashTransactionService.recordTransaction(userId, "CONFIRM", -amount, refType, refId, idempotencyKey);
    }

    @Transactional
    public void refund(Long userId, Long amount, String refType, Long refId) {
        String idempotencyKey = "refund-" + refType + "-" + refId + "-" + UUID.randomUUID();
        cashTransactionService.recordTransaction(userId, "REFUND", amount, refType, refId, idempotencyKey);
    }

    public WalletDtos.TransactionHistoryResponse getTransactionHistory(String authHeader, int page, int size) {
        UserEntity user = resolveUser(authHeader);
        Page<CashTransactionEntity> txPage = cashTransactionService.getTransactionHistory(
                user.getId(),
                PageRequest.of(page, size)
        );

        return new WalletDtos.TransactionHistoryResponse(
                txPage.getContent().stream()
                        .map(WalletDtos.TransactionItem::from)
                        .toList(),
                txPage.getTotalPages(),
                txPage.getTotalElements(),
                txPage.getNumber()
        );
    }

    public WalletDtos.TransactionHistoryResponse getFilteredTransactionHistory(
            String authHeader, String type, LocalDate from, LocalDate to, int page, int size) {
        UserEntity user = resolveUser(authHeader);
        Page<CashTransactionEntity> txPage = cashTransactionService.getFilteredTransactionHistory(
                user.getId(), type, from, to, PageRequest.of(page, size)
        );

        return new WalletDtos.TransactionHistoryResponse(
                txPage.getContent().stream()
                        .map(WalletDtos.TransactionItem::from)
                        .toList(),
                txPage.getTotalPages(),
                txPage.getTotalElements(),
                txPage.getNumber()
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
