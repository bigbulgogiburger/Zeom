package com.cheonjiyeon.api.wallet;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

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
            @RequestParam(required = false) String type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        boolean hasFilter = (type != null && !type.isBlank()) || from != null || to != null;
        if (hasFilter) {
            return walletService.getFilteredTransactionHistory(authHeader, type, from, to, page, size);
        }
        return walletService.getTransactionHistory(authHeader, page, size);
    }
}
