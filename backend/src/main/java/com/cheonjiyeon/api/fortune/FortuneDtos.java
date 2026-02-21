package com.cheonjiyeon.api.fortune;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class FortuneDtos {

    public record FortuneResponse(
            Long id,
            Long userId,
            LocalDate fortuneDate,
            int overallScore,
            int wealthScore,
            int loveScore,
            int healthScore,
            String overallText,
            String wealthText,
            String loveText,
            String healthText,
            String luckyColor,
            Integer luckyNumber,
            String luckyDirection,
            LocalDateTime createdAt
    ) {
        public static FortuneResponse from(FortuneEntity entity) {
            return new FortuneResponse(
                    entity.getId(),
                    entity.getUserId(),
                    entity.getFortuneDate(),
                    entity.getOverallScore(),
                    entity.getWealthScore(),
                    entity.getLoveScore(),
                    entity.getHealthScore(),
                    entity.getOverallText(),
                    entity.getWealthText(),
                    entity.getLoveText(),
                    entity.getHealthText(),
                    entity.getLuckyColor(),
                    entity.getLuckyNumber(),
                    entity.getLuckyDirection(),
                    entity.getCreatedAt()
            );
        }
    }

    public record FortuneSummaryResponse(
            LocalDate fortuneDate,
            int overallScore,
            String overallText
    ) {
        public static FortuneSummaryResponse from(FortuneEntity entity) {
            return new FortuneSummaryResponse(
                    entity.getFortuneDate(),
                    entity.getOverallScore(),
                    entity.getOverallText()
            );
        }
    }

    public record FortuneHistoryResponse(
            List<FortuneResponse> fortunes,
            int totalDays
    ) {}
}
