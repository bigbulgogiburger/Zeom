package com.cheonjiyeon.api.cash;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CashTransactionRepository extends JpaRepository<CashTransactionEntity, Long> {
    Page<CashTransactionEntity> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    boolean existsByIdempotencyKey(String idempotencyKey);
}
