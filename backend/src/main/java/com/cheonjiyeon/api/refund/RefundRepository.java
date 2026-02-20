package com.cheonjiyeon.api.refund;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RefundRepository extends JpaRepository<RefundEntity, Long> {
    Page<RefundEntity> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    Optional<RefundEntity> findByReservationIdAndStatus(Long reservationId, String status);
    Page<RefundEntity> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);
}
