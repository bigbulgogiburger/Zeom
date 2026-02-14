package com.cheonjiyeon.api.counselor;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SlotRepository extends JpaRepository<SlotEntity, Long> {
    List<SlotEntity> findByCounselorIdAndAvailableTrueOrderByStartAtAsc(Long counselorId);
}
