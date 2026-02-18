package com.cheonjiyeon.api.consultation;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ConsultationMemoRepository extends JpaRepository<ConsultationMemoEntity, Long> {
    Optional<ConsultationMemoEntity> findBySessionId(Long sessionId);
    Optional<ConsultationMemoEntity> findBySessionIdAndCounselorId(Long sessionId, Long counselorId);
    Page<ConsultationMemoEntity> findByCounselorIdOrderByCreatedAtDesc(Long counselorId, Pageable pageable);
    List<ConsultationMemoEntity> findByCounselorIdAndSessionIdIn(Long counselorId, List<Long> sessionIds);
}
