package com.cheonjiyeon.api.counselor;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface SlotRepository extends JpaRepository<SlotEntity, Long> {
    List<SlotEntity> findByCounselorIdAndAvailableTrueOrderByStartAtAsc(Long counselorId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from SlotEntity s where s.id = :id")
    Optional<SlotEntity> findByIdForUpdate(Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from SlotEntity s where s.id in :ids order by s.startAt asc")
    List<SlotEntity> findByIdsForUpdate(List<Long> ids);

    long countByAvailableTrue();

    List<SlotEntity> findByCounselorIdOrderByStartAtAsc(Long counselorId);
}
