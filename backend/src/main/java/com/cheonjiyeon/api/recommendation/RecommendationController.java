package com.cheonjiyeon.api.recommendation;

import com.cheonjiyeon.api.auth.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/recommendations")
public class RecommendationController {

    private final RecommendationService recommendationService;
    private final AuthService authService;

    public RecommendationController(RecommendationService recommendationService, AuthService authService) {
        this.recommendationService = recommendationService;
        this.authService = authService;
    }

    @GetMapping("/today")
    public List<RecommendationDtos.RecommendedCounselorResponse> todayRecommendations(
            @RequestParam(defaultValue = "5") int limit) {
        return recommendationService.getTodayRecommendations(limit);
    }

    @PostMapping("/match")
    public List<RecommendationDtos.RecommendedCounselorResponse> matchByConcerns(
            @RequestBody RecommendationDtos.MatchRequest request) {
        return recommendationService.matchByConcerns(
                request.concerns() != null ? request.concerns() : List.of(),
                request.preferredStyle()
        );
    }

    @GetMapping("/personalized")
    public ResponseEntity<List<RecommendationDtos.RecommendedCounselorResponse>> personalized(
            @RequestHeader("Authorization") String auth) {
        Long userId = authService.me(auth).id();
        List<RecommendationDtos.RecommendedCounselorResponse> result = recommendationService.getPersonalized(userId);
        return ResponseEntity.ok(result);
    }
}
