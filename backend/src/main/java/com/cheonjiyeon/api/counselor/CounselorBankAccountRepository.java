package com.cheonjiyeon.api.counselor;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CounselorBankAccountRepository extends JpaRepository<CounselorBankAccountEntity, Long> {
    List<CounselorBankAccountEntity> findByCounselorId(Long counselorId);
    Optional<CounselorBankAccountEntity> findByCounselorIdAndIsPrimary(Long counselorId, boolean isPrimary);
}
