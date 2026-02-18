package com.cheonjiyeon.api.review;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class ReviewController {
    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping("/reservations/{id}/reviews")
    public ReviewDtos.ReviewResponse createReview(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id,
            @Valid @RequestBody ReviewDtos.CreateReviewRequest req
    ) {
        ReviewEntity review = reviewService.createReview(authHeader, id, req);
        return ReviewDtos.ReviewResponse.from(review);
    }

    @GetMapping("/counselors/{id}/reviews")
    public ReviewDtos.ReviewListResponse getCounselorReviews(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return reviewService.getReviewsByCounselor(id, page, size);
    }
}
