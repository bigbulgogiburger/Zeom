package com.cheonjiyeon.api.review;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ReviewRepository extends JpaRepository<ReviewEntity, Long> {
    Page<ReviewEntity> findByCounselorIdOrderByCreatedAtDesc(Long counselorId, Pageable pageable);
    Optional<ReviewEntity> findByReservationId(Long reservationId);
    Page<ReviewEntity> findByReportedCountGreaterThanOrderByReportedCountDesc(int minCount, Pageable pageable);
    Page<ReviewEntity> findByModerationStatusOrderByCreatedAtDesc(String moderationStatus, Pageable pageable);
    Page<ReviewEntity> findByCounselorIdAndModerationStatusOrderByCreatedAtDesc(Long counselorId, String moderationStatus, Pageable pageable);

    // Filter by consultation type
    Page<ReviewEntity> findByCounselorIdAndConsultationTypeOrderByCreatedAtDesc(Long counselorId, String consultationType, Pageable pageable);

    // Filter by consultation type + min rating
    @Query("SELECT r FROM ReviewEntity r WHERE r.counselorId = :counselorId " +
            "AND (:consultationType IS NULL OR r.consultationType = :consultationType) " +
            "AND r.rating >= :minRating " +
            "ORDER BY r.createdAt DESC")
    Page<ReviewEntity> findWithFiltersLatest(
            @Param("counselorId") Long counselorId,
            @Param("consultationType") String consultationType,
            @Param("minRating") int minRating,
            Pageable pageable);

    @Query("SELECT r FROM ReviewEntity r WHERE r.counselorId = :counselorId " +
            "AND (:consultationType IS NULL OR r.consultationType = :consultationType) " +
            "AND r.rating >= :minRating " +
            "ORDER BY r.helpfulCount DESC, r.createdAt DESC")
    Page<ReviewEntity> findWithFiltersHelpful(
            @Param("counselorId") Long counselorId,
            @Param("consultationType") String consultationType,
            @Param("minRating") int minRating,
            Pageable pageable);

    @Query("SELECT r FROM ReviewEntity r WHERE r.counselorId = :counselorId " +
            "AND (:consultationType IS NULL OR r.consultationType = :consultationType) " +
            "AND r.rating >= :minRating " +
            "ORDER BY r.rating DESC, r.createdAt DESC")
    Page<ReviewEntity> findWithFiltersHighRating(
            @Param("counselorId") Long counselorId,
            @Param("consultationType") String consultationType,
            @Param("minRating") int minRating,
            Pageable pageable);
}
