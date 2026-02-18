package com.cheonjiyeon.api.credit;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/credits")
public class CreditController {
    private final CreditService creditService;

    public CreditController(CreditService creditService) {
        this.creditService = creditService;
    }

    @PostMapping("/purchase")
    public CreditDtos.CreditPurchaseResponse purchase(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody CreditDtos.PurchaseCreditRequest req
    ) {
        return creditService.purchaseCredits(authHeader, req);
    }

    @GetMapping("/my")
    public CreditDtos.CreditBalanceResponse getMyBalance(
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        return creditService.getMyBalance(authHeader);
    }

    @GetMapping("/history")
    public CreditDtos.CreditHistoryResponse getHistory(
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        return creditService.getHistory(authHeader);
    }
}
