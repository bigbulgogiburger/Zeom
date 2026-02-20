package com.cheonjiyeon.api.cash;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface CashTransactionRepository extends JpaRepository<CashTransactionEntity, Long> {
    Page<CashTransactionEntity> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    boolean existsByIdempotencyKey(String idempotencyKey);

    Page<CashTransactionEntity> findByUserIdAndTypeOrderByCreatedAtDesc(Long userId, String type, Pageable pageable);

    @Query("SELECT t FROM CashTransactionEntity t WHERE t.userId = :userId AND t.createdAt >= :from AND t.createdAt < :to ORDER BY t.createdAt DESC")
    Page<CashTransactionEntity> findByUserIdAndDateRange(@Param("userId") Long userId, @Param("from") LocalDateTime from, @Param("to") LocalDateTime to, Pageable pageable);

    @Query("SELECT t FROM CashTransactionEntity t WHERE t.userId = :userId AND t.type = :type AND t.createdAt >= :from AND t.createdAt < :to ORDER BY t.createdAt DESC")
    Page<CashTransactionEntity> findByUserIdAndTypeAndDateRange(@Param("userId") Long userId, @Param("type") String type, @Param("from") LocalDateTime from, @Param("to") LocalDateTime to, Pageable pageable);

    // For CSV export (no pagination)
    List<CashTransactionEntity> findByUserIdOrderByCreatedAtDesc(Long userId);

    @Query("SELECT t FROM CashTransactionEntity t WHERE t.userId = :userId AND t.type = :type AND t.createdAt >= :from AND t.createdAt < :to ORDER BY t.createdAt DESC")
    List<CashTransactionEntity> findAllByUserIdAndTypeAndDateRange(@Param("userId") Long userId, @Param("type") String type, @Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT t FROM CashTransactionEntity t WHERE t.userId = :userId AND t.createdAt >= :from AND t.createdAt < :to ORDER BY t.createdAt DESC")
    List<CashTransactionEntity> findAllByUserIdAndDateRange(@Param("userId") Long userId, @Param("from") LocalDateTime from, @Param("to") LocalDateTime to);
}
