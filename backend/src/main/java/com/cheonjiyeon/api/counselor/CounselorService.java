package com.cheonjiyeon.api.counselor;

import com.cheonjiyeon.api.common.ApiException;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
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
                .map(c -> new CounselorDtos.CounselorListItem(c.getId(), c.getName(), c.getSpecialty(), c.getIntro(), c.getSupportedConsultationTypes()))
                .toList();
    }

    @Cacheable(value = "counselor-detail", key = "#counselorId")
    public CounselorDtos.CounselorDetail detail(Long counselorId) {
        CounselorEntity c = counselorRepository.findById(counselorId)
                .orElseThrow(() -> new ApiException(404, "상담사를 찾을 수 없습니다."));

        var slots = slotRepository.findByCounselorIdAndAvailableTrueOrderByStartAtAsc(counselorId)
                .stream()
                .map(s -> new CounselorDtos.SlotItem(s.getId(), s.getStartAt(), s.getEndAt()))
                .toList();

        return new CounselorDtos.CounselorDetail(c.getId(), c.getName(), c.getSpecialty(), c.getIntro(), slots, c.getSupportedConsultationTypes());
    }

    @Caching(evict = {
            @CacheEvict(value = "counselors", allEntries = true),
            @CacheEvict(value = "counselor-detail", allEntries = true)
    })
    public void evictCounselorCaches() {
        // Cache eviction only — called when counselor profiles are updated
    }
}
