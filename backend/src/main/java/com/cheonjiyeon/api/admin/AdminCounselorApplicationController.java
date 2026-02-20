package com.cheonjiyeon.api.admin;

import com.cheonjiyeon.api.counselor.CounselorApplicationEntity;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/counselor-applications")
public class AdminCounselorApplicationController {
    private final AdminCounselorApplicationService service;

    public AdminCounselorApplicationController(AdminCounselorApplicationService service) {
        this.service = service;
    }

    @GetMapping
    public Map<String, Object> listApplications(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<CounselorApplicationEntity> appPage = service.listApplications(authHeader, status, page, size);
        return Map.of(
                "content", appPage.getContent().stream().map(a -> Map.of(
                        "id", a.getId(),
                        "userId", a.getUserId(),
                        "specialty", a.getSpecialty(),
                        "experience", a.getExperience() != null ? a.getExperience() : "",
                        "intro", a.getIntro() != null ? a.getIntro() : "",
                        "status", a.getStatus(),
                        "createdAt", a.getCreatedAt().toString()
                )).toList(),
                "totalPages", appPage.getTotalPages(),
                "totalElements", appPage.getTotalElements(),
                "page", appPage.getNumber()
        );
    }

    @GetMapping("/{id}")
    public Map<String, Object> getApplicationDetail(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id
    ) {
        return service.getApplicationDetail(authHeader, id);
    }

    @PutMapping("/{id}/approve")
    public Map<String, Object> approveApplication(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id
    ) {
        CounselorApplicationEntity app = service.approveApplication(authHeader, id);
        return Map.of("status", "APPROVED", "id", app.getId());
    }

    @PutMapping("/{id}/reject")
    public Map<String, Object> rejectApplication(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id,
            @RequestBody Map<String, String> body
    ) {
        String reason = body.get("reason");
        CounselorApplicationEntity app = service.rejectApplication(authHeader, id, reason);
        return Map.of("status", "REJECTED", "id", app.getId());
    }
}
