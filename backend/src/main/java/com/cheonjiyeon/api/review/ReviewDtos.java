package com.cheonjiyeon.api.review;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

public class ReviewDtos {
    public record CreateReviewRequest(
            @NotNull @Min(1) @Max(5) Integer rating,
            @Size(max = 2000) String comment
    ) {}

    public record ReviewResponse(
            Long id,
            Long reservationId,
            Long userId,
            Long counselorId,
            Integer rating,
            String comment,
            LocalDateTime createdAt
    ) {
        public static ReviewResponse from(ReviewEntity review) {
            return new ReviewResponse(
                    review.getId(),
                    review.getReservationId(),
                    review.getUserId(),
                    review.getCounselorId(),
                    review.getRating(),
                    review.getComment(),
                    review.getCreatedAt()
            );
        }
    }

    public record ReviewListResponse(List<ReviewResponse> reviews, int totalPages, long totalElements) {}
}
