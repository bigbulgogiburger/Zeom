package com.cheonjiyeon.api.counselor;

import com.cheonjiyeon.api.common.ApiException;
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

    public List<CounselorDtos.CounselorListItem> list() {
        return counselorRepository.findAll().stream()
                .map(c -> new CounselorDtos.CounselorListItem(c.getId(), c.getName(), c.getSpecialty(), c.getIntro()))
                .toList();
    }

    public CounselorDtos.CounselorDetail detail(Long counselorId) {
        CounselorEntity c = counselorRepository.findById(counselorId)
                .orElseThrow(() -> new ApiException(404, "상담사를 찾을 수 없습니다."));

        var slots = slotRepository.findByCounselorIdAndAvailableTrueOrderByStartAtAsc(counselorId)
                .stream()
                .map(s -> new CounselorDtos.SlotItem(s.getId(), s.getStartAt(), s.getEndAt()))
                .toList();

        return new CounselorDtos.CounselorDetail(c.getId(), c.getName(), c.getSpecialty(), c.getIntro(), slots);
    }
}
