package com.cheonjiyeon.api.fortune;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

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
            LocalDateTime createdAt,
            // 사주 기반 확장 필드
            Integer dailyGanIndex,
            Integer dailyJiIndex,
            String twelveUnseong,
            String sipseong,
            String harmonyType,
            Integer careerScore,
            String careerText,
            Integer studyScore,
            String studyText,
            String luckyTime,
            String warningTime,
            String sajuInsight,
            String counselorCtaMessage
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
                    entity.getCreatedAt(),
                    entity.getDailyGanIndex(),
                    entity.getDailyJiIndex(),
                    entity.getTwelveUnseong(),
                    entity.getSipseong(),
                    entity.getHarmonyType(),
                    entity.getCareerScore(),
                    entity.getCareerText(),
                    entity.getStudyScore(),
                    entity.getStudyText(),
                    entity.getLuckyTime(),
                    entity.getWarningTime(),
                    entity.getSajuInsight(),
                    entity.getCounselorCtaMessage()
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

    // 사주 명식 응답
    public record SajuChartResponse(
            PillarDto yearPillar,
            PillarDto monthPillar,
            PillarDto dayPillar,
            PillarDto hourPillar,
            Map<String, Integer> ohaengBalance,
            String dominantElement,
            String weakElement
    ) {}

    public record PillarDto(
            String gan,
            String ji,
            String ganHanja,
            String jiHanja,
            String ganOhaeng,
            String jiOhaeng
    ) {}

    // 생년월일시 수정 요청
    public record BirthInfoRequest(
            String birthDate,
            String birthHour,
            String calendarType,
            Boolean isLeapMonth,
            String gender
    ) {}
}
