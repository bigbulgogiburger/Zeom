package com.cheonjiyeon.api.recommendation;

import java.util.List;

public class RecommendationDtos {

    public record RecommendedCounselorResponse(
            Long counselorId,
            String name,
            String specialty,
            String intro,
            double ratingAvg,
            long totalSessions,
            double matchScore,
            String matchReason
    ) {}

    public record MatchRequest(
            List<String> concerns,
            String preferredStyle
    ) {}
}
