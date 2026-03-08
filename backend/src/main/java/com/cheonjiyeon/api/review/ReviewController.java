package com.cheonjiyeon.api.review;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

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

    @PostMapping("/reviews/{id}/report")
    public Map<String, Object> reportReview(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id,
            @RequestBody Map<String, String> body
    ) {
        String reason = body.get("reason");
        ReviewEntity review = reviewService.reportReview(authHeader, id, reason);
        return Map.of("id", review.getId(), "reportedCount", review.getReportedCount());
    }

    @GetMapping("/counselors/{id}/reviews")
    public ReviewDtos.ReviewListResponse getCounselorReviews(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id,
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "latest") String sort,
            @RequestParam(defaultValue = "0") int minRating,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return reviewService.listWithFilters(authHeader, id, type, sort, minRating, page, size);
    }

    @PostMapping("/reviews/{id}/helpful")
    public ReviewDtos.HelpfulResponse toggleHelpful(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id
    ) {
        return reviewService.toggleHelpful(authHeader, id);
    }
}
