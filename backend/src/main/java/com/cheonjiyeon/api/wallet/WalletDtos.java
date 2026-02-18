package com.cheonjiyeon.api.wallet;

import com.cheonjiyeon.api.cash.CashTransactionEntity;

import java.time.LocalDateTime;
import java.util.List;

public class WalletDtos {
    public record WalletResponse(Long userId, Long balanceCash, LocalDateTime updatedAt) {}

    public record TransactionItem(
            Long id,
            String type,
            Long amount,
            Long balanceAfter,
            String refType,
            Long refId,
            LocalDateTime createdAt
    ) {
        public static TransactionItem from(CashTransactionEntity tx) {
            return new TransactionItem(
                    tx.getId(),
                    tx.getType(),
                    tx.getAmount(),
                    tx.getBalanceAfter(),
                    tx.getRefType(),
                    tx.getRefId(),
                    tx.getCreatedAt()
            );
        }
    }

    public record TransactionHistoryResponse(
            List<TransactionItem> content,
            int totalPages,
            long totalElements,
            int number
    ) {}
}
