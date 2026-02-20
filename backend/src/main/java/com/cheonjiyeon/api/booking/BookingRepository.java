package com.cheonjiyeon.api.booking;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<BookingEntity, Long> {
    List<BookingEntity> findByUserIdOrderByIdDesc(Long userId);
    Optional<BookingEntity> findByIdAndUserId(Long id, Long userId);
    long countByStatus(String status);
    List<BookingEntity> findTop200ByOrderByIdDesc();
    List<BookingEntity> findByCounselorIdOrderByIdDesc(Long counselorId);
    long countByCounselorId(Long counselorId);
    List<BookingEntity> findByUserIdAndCounselorIdAndStatusIn(Long userId, Long counselorId, List<String> statuses);
}
