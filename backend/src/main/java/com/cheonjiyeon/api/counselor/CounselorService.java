package com.cheonjiyeon.api.counselor;

import com.cheonjiyeon.api.common.ApiException;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CounselorService {
    private final CounselorRepository counselorRepository;
    private final SlotRepository slotRepository;

    public CounselorService(CounselorRepository counselorRepository, SlotRepository slotRepository) {
        this.counselorRepository = counselorRepository;
        this.slotRepository = slotRepository;
    }

    @Cacheable(value = "counselors", key = "'all'")
    public List<CounselorDtos.CounselorListItem> list() {
        return counselorRepository.findAll().stream()
                .map(this::toListItem)
                .toList();
    }

    public Page<CounselorDtos.CounselorListItem> listWithFilters(
            String specialty, Boolean isOnline, Double minRating,
            String search, String sort, int page, int size) {

        Sort sorting = resolveSort(sort);
        Pageable pageable = PageRequest.of(page, size, sorting);

        return counselorRepository.findWithFilters(specialty, isOnline, minRating, search, pageable)
                .map(this::toListItem);
    }

    @Cacheable(value = "counselor-detail", key = "#counselorId")
    public CounselorDtos.CounselorDetail detail(Long counselorId) {
        CounselorEntity c = counselorRepository.findById(counselorId)
                .orElseThrow(() -> new ApiException(404, "상담사를 찾을 수 없습니다."));

        var slots = slotRepository.findByCounselorIdAndAvailableTrueOrderByStartAtAsc(counselorId)
                .stream()
                .map(s -> new CounselorDtos.SlotItem(s.getId(), s.getStartAt(), s.getEndAt()))
                .toList();

        return new CounselorDtos.CounselorDetail(
                c.getId(), c.getName(), c.getSpecialty(), c.getIntro(), slots,
                c.getSupportedConsultationTypes(),
                c.getProfileImageUrl(), c.getCareerYears(), c.getCertifications(),
                c.getAverageRating(), c.getTotalReviews(), c.getTotalConsultations(),
                c.getResponseRate(), c.getPricePerMinute(), c.getIsOnline(),
                c.getTags(), c.getShortVideoUrl()
        );
    }

    @Caching(evict = {
            @CacheEvict(value = "counselors", allEntries = true),
            @CacheEvict(value = "counselor-detail", allEntries = true)
    })
    public void evictCounselorCaches() {
        // Cache eviction only — called when counselor profiles are updated
    }

    private CounselorDtos.CounselorListItem toListItem(CounselorEntity c) {
        return new CounselorDtos.CounselorListItem(
                c.getId(), c.getName(), c.getSpecialty(), c.getIntro(),
                c.getSupportedConsultationTypes(),
                c.getProfileImageUrl(), c.getCareerYears(), c.getCertifications(),
                c.getAverageRating(), c.getTotalReviews(), c.getTotalConsultations(),
                c.getResponseRate(), c.getPricePerMinute(), c.getIsOnline(),
                c.getTags(), c.getShortVideoUrl()
        );
    }

    private Sort resolveSort(String sort) {
        if (sort == null) return Sort.by(Sort.Direction.DESC, "averageRating");
        return switch (sort) {
            case "rating" -> Sort.by(Sort.Direction.DESC, "averageRating");
            case "reviews" -> Sort.by(Sort.Direction.DESC, "totalReviews");
            case "price_asc" -> Sort.by(Sort.Direction.ASC, "pricePerMinute");
            case "price_desc" -> Sort.by(Sort.Direction.DESC, "pricePerMinute");
            case "career" -> Sort.by(Sort.Direction.DESC, "careerYears");
            default -> Sort.by(Sort.Direction.DESC, "averageRating");
        };
    }
}
