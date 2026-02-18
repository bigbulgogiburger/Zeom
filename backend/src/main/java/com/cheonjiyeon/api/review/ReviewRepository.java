package com.cheonjiyeon.api.review;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ReviewRepository extends JpaRepository<ReviewEntity, Long> {
    Page<ReviewEntity> findByCounselorIdOrderByCreatedAtDesc(Long counselorId, Pageable pageable);
    Optional<ReviewEntity> findByReservationId(Long reservationId);
}
