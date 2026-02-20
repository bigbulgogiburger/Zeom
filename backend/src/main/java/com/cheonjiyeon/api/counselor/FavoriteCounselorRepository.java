package com.cheonjiyeon.api.counselor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FavoriteCounselorRepository extends JpaRepository<FavoriteCounselorEntity, Long> {
    Page<FavoriteCounselorEntity> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    Optional<FavoriteCounselorEntity> findByUserIdAndCounselorId(Long userId, Long counselorId);
    boolean existsByUserIdAndCounselorId(Long userId, Long counselorId);
}
