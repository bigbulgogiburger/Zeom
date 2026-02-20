package com.cheonjiyeon.api.credit;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CreditUsageLogRepository extends JpaRepository<CreditUsageLogEntity, Long> {
    List<CreditUsageLogEntity> findByCreditIdOrderByUsedAtDesc(Long creditId);
    List<CreditUsageLogEntity> findByBookingId(Long bookingId);
    List<CreditUsageLogEntity> findByBookingIdAndStatusOrderByUsedAtAsc(Long bookingId, String status);
}
