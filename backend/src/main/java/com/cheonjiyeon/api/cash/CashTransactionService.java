package com.cheonjiyeon.api.cash;

import com.cheonjiyeon.api.common.ApiException;
import com.cheonjiyeon.api.wallet.WalletEntity;
import com.cheonjiyeon.api.wallet.WalletRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

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

    public Page<CashTransactionEntity> getFilteredTransactionHistory(
            Long userId, String type, LocalDate from, LocalDate to, Pageable pageable) {
        boolean hasType = type != null && !type.isBlank();
        boolean hasDateRange = from != null && to != null;
        LocalDateTime fromDt = from != null ? from.atStartOfDay() : null;
        LocalDateTime toDt = to != null ? to.plusDays(1).atStartOfDay() : null;

        if (hasType && hasDateRange) {
            return cashTransactionRepository.findByUserIdAndTypeAndDateRange(userId, type, fromDt, toDt, pageable);
        } else if (hasType) {
            return cashTransactionRepository.findByUserIdAndTypeOrderByCreatedAtDesc(userId, type, pageable);
        } else if (hasDateRange) {
            return cashTransactionRepository.findByUserIdAndDateRange(userId, fromDt, toDt, pageable);
        } else {
            return cashTransactionRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        }
    }

    public List<CashTransactionEntity> getTransactionsForCsv(
            Long userId, String type, LocalDate from, LocalDate to) {
        boolean hasType = type != null && !type.isBlank();
        boolean hasDateRange = from != null && to != null;
        LocalDateTime fromDt = from != null ? from.atStartOfDay() : null;
        LocalDateTime toDt = to != null ? to.plusDays(1).atStartOfDay() : null;

        if (hasType && hasDateRange) {
            return cashTransactionRepository.findAllByUserIdAndTypeAndDateRange(userId, type, fromDt, toDt);
        } else if (hasDateRange) {
            return cashTransactionRepository.findAllByUserIdAndDateRange(userId, fromDt, toDt);
        } else {
            return cashTransactionRepository.findByUserIdOrderByCreatedAtDesc(userId);
        }
    }

    public CashTransactionEntity getById(Long txId) {
        return cashTransactionRepository.findById(txId)
                .orElseThrow(() -> new ApiException(404, "거래를 찾을 수 없습니다."));
    }
}
