package com.cheonjiyeon.api.settlement;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface CounselorSettlementRepository extends JpaRepository<CounselorSettlementEntity, Long> {
    Page<CounselorSettlementEntity> findByCounselorIdOrderByCreatedAtDesc(Long counselorId, Pageable pageable);
    Optional<CounselorSettlementEntity> findByCounselorIdAndPeriodStartAndPeriodEnd(Long counselorId, LocalDate periodStart, LocalDate periodEnd);
    List<CounselorSettlementEntity> findByCounselorIdOrderByPeriodStartDesc(Long counselorId);
}
