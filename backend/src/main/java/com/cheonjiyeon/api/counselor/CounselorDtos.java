package com.cheonjiyeon.api.counselor;

import java.time.LocalDateTime;
import java.util.List;

public class CounselorDtos {
    public record CounselorListItem(
            Long id,
            String name,
            String specialty,
            String intro,
            String supportedConsultationTypes,
            String profileImageUrl,
            Integer careerYears,
            String certifications,
            Double averageRating,
            Integer totalReviews,
            Integer totalConsultations,
            Integer responseRate,
            Integer pricePerMinute,
            Boolean isOnline,
            String tags,
            String shortVideoUrl
    ) {}

    public record SlotItem(Long id, LocalDateTime startAt, LocalDateTime endAt) {}

    public record CounselorDetail(
            Long id,
            String name,
            String specialty,
            String intro,
            List<SlotItem> slots,
            String supportedConsultationTypes,
            String profileImageUrl,
            Integer careerYears,
            String certifications,
            Double averageRating,
            Integer totalReviews,
            Integer totalConsultations,
            Integer responseRate,
            Integer pricePerMinute,
            Boolean isOnline,
            String tags,
            String shortVideoUrl
    ) {}
}
