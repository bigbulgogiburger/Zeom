package com.cheonjiyeon.api.counselor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CounselorApplicationRepository extends JpaRepository<CounselorApplicationEntity, Long> {
    List<CounselorApplicationEntity> findByUserId(Long userId);
    Page<CounselorApplicationEntity> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);
}
