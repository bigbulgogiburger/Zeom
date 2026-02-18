package com.cheonjiyeon.api.credit;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CreditRepository extends JpaRepository<CreditEntity, Long> {
    List<CreditEntity> findByUserIdOrderByCreatedAtDesc(Long userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM CreditEntity c WHERE c.userId = :userId AND c.remainingUnits > 0 ORDER BY c.createdAt ASC")
    List<CreditEntity> findAvailableCreditsWithLock(@Param("userId") Long userId);

    @Query("SELECT COALESCE(SUM(c.remainingUnits), 0) FROM CreditEntity c WHERE c.userId = :userId")
    int sumRemainingUnitsByUserId(@Param("userId") Long userId);

    @Query("SELECT COALESCE(SUM(c.totalUnits), 0) FROM CreditEntity c WHERE c.userId = :userId")
    int sumTotalUnitsByUserId(@Param("userId") Long userId);
}
