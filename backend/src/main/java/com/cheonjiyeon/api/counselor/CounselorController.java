package com.cheonjiyeon.api.counselor;

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

    @GetMapping("/{id}")
    public CounselorDtos.CounselorDetail detail(@PathVariable Long id) {
        return counselorService.detail(id);
    }
}
