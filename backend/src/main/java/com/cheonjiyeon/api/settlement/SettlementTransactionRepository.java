package com.cheonjiyeon.api.settlement;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SettlementTransactionRepository extends JpaRepository<SettlementTransactionEntity, Long> {
    Optional<SettlementTransactionEntity> findBySessionId(Long sessionId);
    Optional<SettlementTransactionEntity> findByBookingId(Long bookingId);
    List<SettlementTransactionEntity> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
    List<SettlementTransactionEntity> findByCounselorIdOrderByCreatedAtDesc(Long counselorId);
    boolean existsBySessionId(Long sessionId);
}
