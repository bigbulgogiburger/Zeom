package com.cheonjiyeon.api.credit;

import org.springframework.data.jpa.repository.JpaRepository;

public interface SignupBonusRepository extends JpaRepository<SignupBonusEntity, Long> {
    boolean existsByUserId(Long userId);
}
