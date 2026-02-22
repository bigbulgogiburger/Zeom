package com.cheonjiyeon.api.fortune;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SajuChartRepository extends JpaRepository<SajuChartEntity, Long> {
    Optional<SajuChartEntity> findByUserId(Long userId);
    void deleteByUserId(Long userId);
}
