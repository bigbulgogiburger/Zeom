package com.cheonjiyeon.api.ops;

import com.cheonjiyeon.api.auth.UserEntity;
import com.cheonjiyeon.api.auth.UserRepository;
import com.cheonjiyeon.api.consultation.ConsultationSessionRepository;
import com.cheonjiyeon.api.counselor.CounselorEntity;
import com.cheonjiyeon.api.counselor.CounselorRepository;
import com.cheonjiyeon.api.review.ReviewEntity;
import com.cheonjiyeon.api.review.ReviewRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/stats")
public class StatsController {
    private final CounselorRepository counselorRepository;
    private final ConsultationSessionRepository sessionRepository;
    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;

    public StatsController(CounselorRepository counselorRepository,
                           ConsultationSessionRepository sessionRepository,
                           ReviewRepository reviewRepository,
                           UserRepository userRepository) {
        this.counselorRepository = counselorRepository;
        this.sessionRepository = sessionRepository;
        this.reviewRepository = reviewRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/public")
    public Map<String, Object> publicStats() {
        long totalCounselors = counselorRepository.count();
        long totalConsultations = sessionRepository.count();
        long totalReviews = reviewRepository.count();

        List<CounselorEntity> allCounselors = counselorRepository.findAll();
        double averageRating = allCounselors.stream()
                .filter(c -> c.getAverageRating() != null && c.getAverageRating() > 0)
                .mapToDouble(CounselorEntity::getAverageRating)
                .average()
                .orElse(0.0);

        return Map.of(
                "totalCounselors", totalCounselors,
                "totalConsultations", totalConsultations,
                "averageRating", Math.round(averageRating * 10) / 10.0,
                "totalReviews", totalReviews
        );
    }

    @GetMapping("/reviews/featured")
    public List<Map<String, Object>> featuredReviews() {
        // Get recent reviews with rating >= 4, moderation status ACTIVE
        List<ReviewEntity> reviews = reviewRepository
                .findByModerationStatusOrderByCreatedAtDesc("ACTIVE", PageRequest.of(0, 20))
                .getContent()
                .stream()
                .filter(r -> r.getRating() != null && r.getRating() >= 4 && r.getComment() != null && !r.getComment().isBlank())
                .limit(5)
                .collect(Collectors.toList());

        // Resolve user names (mask for privacy: e.g. "김**")
        return reviews.stream().map(r -> {
            String authorName = "익명";
            try {
                UserEntity user = userRepository.findById(r.getUserId()).orElse(null);
                if (user != null && user.getName() != null && !user.getName().isEmpty()) {
                    String name = user.getName();
                    if (name.length() >= 2) {
                        authorName = name.charAt(0) + "*".repeat(name.length() - 1);
                    } else {
                        authorName = name;
                    }
                }
            } catch (Exception ignored) {}

            String counselorName = "";
            try {
                CounselorEntity counselor = counselorRepository.findById(r.getCounselorId()).orElse(null);
                if (counselor != null) counselorName = counselor.getName();
            } catch (Exception ignored) {}

            return Map.<String, Object>of(
                    "id", r.getId(),
                    "rating", r.getRating(),
                    "comment", r.getComment(),
                    "authorName", authorName,
                    "counselorName", counselorName,
                    "createdAt", r.getCreatedAt().toString()
            );
        }).collect(Collectors.toList());
    }
}
