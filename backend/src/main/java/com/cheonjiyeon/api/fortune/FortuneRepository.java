package com.cheonjiyeon.api.fortune;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;

public interface FortuneRepository extends JpaRepository<FortuneEntity, Long> {
    Optional<FortuneEntity> findByUserIdAndFortuneDate(Long userId, LocalDate date);
    Page<FortuneEntity> findByUserIdOrderByFortuneDateDesc(Long userId, Pageable pageable);
}
