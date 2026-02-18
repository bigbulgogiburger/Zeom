package com.cheonjiyeon.api.counselor;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CounselorRepository extends JpaRepository<CounselorEntity, Long> {
    Optional<CounselorEntity> findByUserId(Long userId);
}
