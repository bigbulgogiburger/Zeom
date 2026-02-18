package com.cheonjiyeon.api.credit;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CreditUsageLogRepository extends JpaRepository<CreditUsageLogEntity, Long> {
    List<CreditUsageLogEntity> findByCreditIdOrderByUsedAtDesc(Long creditId);
    List<CreditUsageLogEntity> findByBookingId(Long bookingId);
}
