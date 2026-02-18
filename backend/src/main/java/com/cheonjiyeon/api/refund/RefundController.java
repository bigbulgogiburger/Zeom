package com.cheonjiyeon.api.refund;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class RefundController {
    private final RefundService refundService;

    public RefundController(RefundService refundService) {
        this.refundService = refundService;
    }

    @PostMapping("/refunds")
    public RefundDtos.RefundResponse requestRefund(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @Valid @RequestBody RefundDtos.CreateRefundRequest req
    ) {
        RefundEntity refund = refundService.requestRefund(authHeader, req);
        return RefundDtos.RefundResponse.from(refund);
    }

    @GetMapping("/refunds/me")
    public RefundDtos.RefundListResponse getMyRefunds(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return refundService.getMyRefunds(authHeader, page, size);
    }

    @PostMapping("/admin/refunds/{id}/approve")
    public RefundDtos.RefundResponse approveRefund(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id,
            @Valid @RequestBody RefundDtos.ProcessRefundRequest req
    ) {
        RefundEntity refund = refundService.approveRefund(authHeader, id, req.adminNote());
        return RefundDtos.RefundResponse.from(refund);
    }

    @PostMapping("/admin/refunds/{id}/reject")
    public RefundDtos.RefundResponse rejectRefund(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id,
            @Valid @RequestBody RefundDtos.ProcessRefundRequest req
    ) {
        RefundEntity refund = refundService.rejectRefund(authHeader, id, req.adminNote());
        return RefundDtos.RefundResponse.from(refund);
    }
}
