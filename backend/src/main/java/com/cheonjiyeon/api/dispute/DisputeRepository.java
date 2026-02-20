package com.cheonjiyeon.api.dispute;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DisputeRepository extends JpaRepository<DisputeEntity, Long> {
    Page<DisputeEntity> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    Page<DisputeEntity> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);
}
