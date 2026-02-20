package com.cheonjiyeon.api.admin;

import com.cheonjiyeon.api.auth.AuthService;
import com.cheonjiyeon.api.auth.UserEntity;
import com.cheonjiyeon.api.auth.UserRepository;
import com.cheonjiyeon.api.audit.AuditLogService;
import com.cheonjiyeon.api.common.ApiException;
import com.cheonjiyeon.api.counselor.CounselorEntity;
import com.cheonjiyeon.api.counselor.CounselorRepository;
import com.cheonjiyeon.api.review.ReviewEntity;
import com.cheonjiyeon.api.review.ReviewRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Map;

@Service
public class AdminReviewModerationService {
    private final ReviewRepository reviewRepository;
    private final CounselorRepository counselorRepository;
    private final UserRepository userRepository;
    private final AuthService authService;
    private final AuditLogService auditLogService;

    public AdminReviewModerationService(
            ReviewRepository reviewRepository,
            CounselorRepository counselorRepository,
            UserRepository userRepository,
            AuthService authService,
            AuditLogService auditLogService
    ) {
        this.reviewRepository = reviewRepository;
        this.counselorRepository = counselorRepository;
        this.userRepository = userRepository;
        this.authService = authService;
        this.auditLogService = auditLogService;
    }

    public Page<ReviewEntity> listReportedReviews(String authHeader, String status, int page, int size) {
        authService.requireAdmin(authHeader);
        if ("REPORTED".equals(status)) {
            return reviewRepository.findByReportedCountGreaterThanOrderByReportedCountDesc(0, PageRequest.of(page, size));
        }
        if (status != null && !status.isBlank()) {
            return reviewRepository.findByModerationStatusOrderByCreatedAtDesc(status, PageRequest.of(page, size));
        }
        // Default: show reported reviews
        return reviewRepository.findByReportedCountGreaterThanOrderByReportedCountDesc(0, PageRequest.of(page, size));
    }

    @Transactional
    public ReviewEntity moderateReview(String authHeader, Long reviewId, String action) {
        UserEntity admin = authService.requireAdmin(authHeader);

        ReviewEntity review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ApiException(404, "리뷰를 찾을 수 없습니다."));

        switch (action) {
            case "KEEP" -> {
                review.setModerationStatus("ACTIVE");
                review.setReportedCount(0);
            }
            case "HIDE" -> {
                review.setModerationStatus("HIDDEN");
            }
            case "DELETE" -> {
                review.setModerationStatus("DELETED");
                // Recalculate counselor rating
                recalculateCounselorRating(review.getCounselorId());
            }
            default -> throw new ApiException(400, "유효하지 않은 액션입니다. (KEEP, HIDE, DELETE)");
        }

        review.setModeratedAt(LocalDateTime.now());
        review.setModeratedBy(admin.getId());

        auditLogService.log(admin.getId(), "ADMIN_REVIEW_MODERATE_" + action, "REVIEW", reviewId);
        return reviewRepository.save(review);
    }

    private void recalculateCounselorRating(Long counselorId) {
        CounselorEntity counselor = counselorRepository.findById(counselorId).orElse(null);
        if (counselor == null) return;

        Page<ReviewEntity> activeReviews = reviewRepository.findByCounselorIdAndModerationStatusOrderByCreatedAtDesc(
                counselorId, "ACTIVE", PageRequest.of(0, Integer.MAX_VALUE));

        int count = (int) activeReviews.getTotalElements();
        double avg = activeReviews.getContent().stream()
                .mapToInt(ReviewEntity::getRating)
                .average()
                .orElse(0.0);

        counselor.setReviewCount(count);
        counselor.setRatingAvg(BigDecimal.valueOf(avg).setScale(2, RoundingMode.HALF_UP));
        counselorRepository.save(counselor);
    }
}
