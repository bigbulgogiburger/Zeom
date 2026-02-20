package com.cheonjiyeon.api.admin;

import com.cheonjiyeon.api.auth.UserEntity;
import com.cheonjiyeon.api.auth.UserRepository;
import com.cheonjiyeon.api.review.ReviewEntity;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/reviews")
public class AdminReviewModerationController {
    private final AdminReviewModerationService service;
    private final UserRepository userRepository;

    public AdminReviewModerationController(AdminReviewModerationService service, UserRepository userRepository) {
        this.service = service;
        this.userRepository = userRepository;
    }

    @GetMapping
    public Map<String, Object> listReportedReviews(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(defaultValue = "REPORTED") String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<ReviewEntity> reviewPage = service.listReportedReviews(authHeader, status, page, size);
        return Map.of(
                "content", reviewPage.getContent().stream().map(r -> {
                    UserEntity author = userRepository.findById(r.getUserId()).orElse(null);
                    return Map.of(
                            "id", r.getId(),
                            "userId", r.getUserId(),
                            "authorName", author != null ? author.getName() : "Unknown",
                            "counselorId", r.getCounselorId(),
                            "rating", r.getRating(),
                            "comment", r.getComment() != null ? r.getComment() : "",
                            "reportedCount", r.getReportedCount(),
                            "moderationStatus", r.getModerationStatus(),
                            "createdAt", r.getCreatedAt().toString()
                    );
                }).toList(),
                "totalPages", reviewPage.getTotalPages(),
                "totalElements", reviewPage.getTotalElements(),
                "page", reviewPage.getNumber()
        );
    }

    @PutMapping("/{id}/moderate")
    public Map<String, Object> moderateReview(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id,
            @RequestBody Map<String, String> body
    ) {
        String action = body.get("action");
        ReviewEntity review = service.moderateReview(authHeader, id, action);
        return Map.of(
                "id", review.getId(),
                "moderationStatus", review.getModerationStatus()
        );
    }
}
