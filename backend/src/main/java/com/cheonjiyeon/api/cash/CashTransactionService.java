package com.cheonjiyeon.api.cash;

import com.cheonjiyeon.api.common.ApiException;
import com.cheonjiyeon.api.wallet.WalletEntity;
import com.cheonjiyeon.api.wallet.WalletRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CashTransactionService {
    private final CashTransactionRepository cashTransactionRepository;
    private final WalletRepository walletRepository;

    public CashTransactionService(
            CashTransactionRepository cashTransactionRepository,
            WalletRepository walletRepository
    ) {
        this.cashTransactionRepository = cashTransactionRepository;
        this.walletRepository = walletRepository;
    }

    @Transactional
    public CashTransactionEntity recordTransaction(
            Long userId,
            String type,
            Long amount,
            String refType,
            Long refId,
            String idempotencyKey
    ) {
        // Check idempotency
        if (cashTransactionRepository.existsByIdempotencyKey(idempotencyKey)) {
            throw new ApiException(400, "Duplicate transaction: " + idempotencyKey);
        }

        // Lock wallet and update balance
        WalletEntity wallet = walletRepository.findByUserIdWithLock(userId)
                .orElseThrow(() -> new ApiException(404, "Wallet not found for user: " + userId));

        long currentBalance = wallet.getBalanceCash();
        long newBalance = currentBalance + amount;

        if (newBalance < 0) {
            throw new ApiException(400, "Insufficient balance");
        }

        wallet.setBalanceCash(newBalance);
        walletRepository.save(wallet);

        // Append transaction log
        CashTransactionEntity tx = new CashTransactionEntity();
        tx.setUserId(userId);
        tx.setType(type);
        tx.setAmount(amount);
        tx.setBalanceAfter(newBalance);
        tx.setRefType(refType);
        tx.setRefId(refId);
        tx.setIdempotencyKey(idempotencyKey);

        return cashTransactionRepository.save(tx);
    }

    public Page<CashTransactionEntity> getTransactionHistory(Long userId, Pageable pageable) {
        return cashTransactionRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }
}
