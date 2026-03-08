package com.cheonjiyeon.api.counselor;

import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/counselors")
public class CounselorController {
    private final CounselorService counselorService;

    public CounselorController(CounselorService counselorService) {
        this.counselorService = counselorService;
    }

    @GetMapping
    public List<CounselorDtos.CounselorListItem> list() {
        return counselorService.list();
    }

    @GetMapping("/search")
    public Page<CounselorDtos.CounselorListItem> search(
            @RequestParam(required = false) String specialty,
            @RequestParam(required = false) Boolean isOnline,
            @RequestParam(required = false) Double minRating,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return counselorService.listWithFilters(specialty, isOnline, minRating, search, sort, page, size);
    }

    @GetMapping("/{id}")
    public CounselorDtos.CounselorDetail detail(@PathVariable Long id) {
        return counselorService.detail(id);
    }
}
