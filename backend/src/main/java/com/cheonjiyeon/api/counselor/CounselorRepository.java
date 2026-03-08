package com.cheonjiyeon.api.counselor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CounselorRepository extends JpaRepository<CounselorEntity, Long> {
    Optional<CounselorEntity> findByUserId(Long userId);

    @Query("SELECT c FROM CounselorEntity c WHERE c.isActive = true" +
           " AND (:specialty IS NULL OR c.specialty = :specialty)" +
           " AND (:isOnline IS NULL OR c.isOnline = :isOnline)" +
           " AND (:minRating IS NULL OR c.averageRating >= :minRating)" +
           " AND (:search IS NULL OR LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<CounselorEntity> findWithFilters(
            @Param("specialty") String specialty,
            @Param("isOnline") Boolean isOnline,
            @Param("minRating") Double minRating,
            @Param("search") String search,
            Pageable pageable
    );
}
