package com.cheonjiyeon.api.admin;

import com.cheonjiyeon.api.dispute.DisputeEntity;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/disputes")
public class AdminDisputeController {
    private final AdminDisputeService adminDisputeService;

    public AdminDisputeController(AdminDisputeService adminDisputeService) {
        this.adminDisputeService = adminDisputeService;
    }

    @GetMapping
    public Map<String, Object> listDisputes(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<DisputeEntity> disputePage = adminDisputeService.listDisputes(authHeader, status, page, size);
        return Map.of(
                "content", disputePage.getContent().stream().map(d -> Map.of(
                        "id", d.getId(),
                        "reservationId", d.getReservationId(),
                        "userId", d.getUserId(),
                        "category", d.getCategory(),
                        "status", d.getStatus(),
                        "description", d.getDescription() != null ? d.getDescription() : "",
                        "createdAt", d.getCreatedAt().toString()
                )).toList(),
                "totalPages", disputePage.getTotalPages(),
                "totalElements", disputePage.getTotalElements(),
                "page", disputePage.getNumber()
        );
    }

    @GetMapping("/{id}")
    public Map<String, Object> getDisputeDetail(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id
    ) {
        return adminDisputeService.getDisputeDetail(authHeader, id);
    }

    @PutMapping("/{id}/review")
    public Map<String, Object> reviewDispute(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id
    ) {
        DisputeEntity dispute = adminDisputeService.reviewDispute(authHeader, id);
        return Map.of("status", dispute.getStatus(), "id", dispute.getId());
    }

    @PutMapping("/{id}/resolve")
    public Map<String, Object> resolveDispute(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id,
            @RequestBody Map<String, String> body
    ) {
        String resolutionType = body.get("resolutionType");
        String note = body.get("note");
        DisputeEntity dispute = adminDisputeService.resolveDispute(authHeader, id, resolutionType, note);
        return Map.of("status", dispute.getStatus(), "id", dispute.getId());
    }
}
