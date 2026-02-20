package com.cheonjiyeon.api.review;

import com.cheonjiyeon.api.auth.TokenStore;
import com.cheonjiyeon.api.auth.UserEntity;
import com.cheonjiyeon.api.auth.UserRepository;
import com.cheonjiyeon.api.booking.BookingEntity;
import com.cheonjiyeon.api.booking.BookingRepository;
import com.cheonjiyeon.api.common.ApiException;
import com.cheonjiyeon.api.counselor.CounselorEntity;
import com.cheonjiyeon.api.counselor.CounselorRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class ReviewService {
    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final CounselorRepository counselorRepository;
    private final TokenStore tokenStore;
    private final UserRepository userRepository;

    public ReviewService(
            ReviewRepository reviewRepository,
            BookingRepository bookingRepository,
            CounselorRepository counselorRepository,
            TokenStore tokenStore,
            UserRepository userRepository
    ) {
        this.reviewRepository = reviewRepository;
        this.bookingRepository = bookingRepository;
        this.counselorRepository = counselorRepository;
        this.tokenStore = tokenStore;
        this.userRepository = userRepository;
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "counselor-reviews", allEntries = true),
            @CacheEvict(value = "counselor-ratings", allEntries = true),
            @CacheEvict(value = "counselor-detail", allEntries = true),
            @CacheEvict(value = "counselors", allEntries = true)
    })
    public ReviewEntity createReview(String authHeader, Long reservationId, ReviewDtos.CreateReviewRequest req) {
        UserEntity user = resolveUser(authHeader);

        // Check if review already exists
        if (reviewRepository.findByReservationId(reservationId).isPresent()) {
            throw new ApiException(400, "Review already exists for this reservation");
        }

        // Verify booking belongs to user
        BookingEntity booking = bookingRepository.findById(reservationId)
                .orElseThrow(() -> new ApiException(404, "Reservation not found"));

        if (!booking.getUser().getId().equals(user.getId())) {
            throw new ApiException(403, "Not authorized to review this reservation");
        }

        // Create review
        ReviewEntity review = new ReviewEntity();
        review.setReservationId(reservationId);
        review.setUserId(user.getId());
        review.setCounselorId(booking.getCounselor().getId());
        review.setRating(req.rating());
        review.setComment(req.comment());

        ReviewEntity saved = reviewRepository.save(review);

        // Update counselor rating_avg and review_count
        updateCounselorRating(booking.getCounselor().getId());

        return saved;
    }

    private void updateCounselorRating(Long counselorId) {
        CounselorEntity counselor = counselorRepository.findById(counselorId)
                .orElseThrow(() -> new ApiException(404, "Counselor not found"));

        Page<ReviewEntity> reviews = reviewRepository.findByCounselorIdOrderByCreatedAtDesc(
                counselorId,
                PageRequest.of(0, Integer.MAX_VALUE)
        );

        int count = (int) reviews.getTotalElements();
        double avg = reviews.getContent().stream()
                .mapToInt(ReviewEntity::getRating)
                .average()
                .orElse(0.0);

        counselor.setReviewCount(count);
        counselor.setRatingAvg(BigDecimal.valueOf(avg).setScale(2, RoundingMode.HALF_UP));
        counselorRepository.save(counselor);
    }

    @Transactional
    @CacheEvict(value = "counselor-reviews", allEntries = true)
    public ReviewEntity reportReview(String authHeader, Long reviewId, String reason) {
        resolveUser(authHeader);

        ReviewEntity review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ApiException(404, "리뷰를 찾을 수 없습니다."));

        review.setReportedCount(review.getReportedCount() + 1);
        return reviewRepository.save(review);
    }

    @Cacheable(value = "counselor-reviews", key = "#counselorId + ':' + #page + ':' + #size")
    public ReviewDtos.ReviewListResponse getReviewsByCounselor(Long counselorId, int page, int size) {
        Page<ReviewEntity> reviewPage = reviewRepository.findByCounselorIdOrderByCreatedAtDesc(
                counselorId,
                PageRequest.of(page, size)
        );

        return new ReviewDtos.ReviewListResponse(
                reviewPage.getContent().stream()
                        .map(ReviewDtos.ReviewResponse::from)
                        .toList(),
                reviewPage.getTotalPages(),
                reviewPage.getTotalElements()
        );
    }

    private UserEntity resolveUser(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new ApiException(401, "Authorization Bearer 토큰이 필요합니다.");
        }
        String token = authHeader.substring(7);
        Long userId = tokenStore.resolveAccessUserId(token)
                .orElseThrow(() -> new ApiException(401, "로그인이 필요합니다."));

        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(401, "유효하지 않은 토큰입니다."));
    }
}
