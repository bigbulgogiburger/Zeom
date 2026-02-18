package com.cheonjiyeon.api.wallet;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/wallet")
public class WalletController {
    private final WalletService walletService;

    public WalletController(WalletService walletService) {
        this.walletService = walletService;
    }

    @GetMapping
    public WalletDtos.WalletResponse getMyBalance(
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        return walletService.getBalance(authHeader);
    }

    @GetMapping("/transactions")
    public WalletDtos.TransactionHistoryResponse getMyTransactions(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return walletService.getTransactionHistory(authHeader, page, size);
    }
}
