package com.cheonjiyeon.api.review;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface HelpfulVoteRepository extends JpaRepository<HelpfulVoteEntity, Long> {
    Optional<HelpfulVoteEntity> findByUserIdAndReviewId(Long userId, Long reviewId);
    boolean existsByUserIdAndReviewId(Long userId, Long reviewId);
    long countByReviewId(Long reviewId);
}
