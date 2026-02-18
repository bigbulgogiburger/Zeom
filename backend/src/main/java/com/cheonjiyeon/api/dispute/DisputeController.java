package com.cheonjiyeon.api.dispute;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/disputes")
public class DisputeController {
    private final DisputeService disputeService;

    public DisputeController(DisputeService disputeService) {
        this.disputeService = disputeService;
    }

    @PostMapping
    public DisputeDtos.DisputeResponse createDispute(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @Valid @RequestBody DisputeDtos.CreateDisputeRequest req
    ) {
        DisputeEntity dispute = disputeService.createDispute(authHeader, req);
        return DisputeDtos.DisputeResponse.from(dispute);
    }

    @GetMapping("/me")
    public DisputeDtos.DisputeListResponse getMyDisputes(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return disputeService.getMyDisputes(authHeader, page, size);
    }
}
