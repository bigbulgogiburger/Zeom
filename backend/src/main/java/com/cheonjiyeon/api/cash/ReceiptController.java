package com.cheonjiyeon.api.cash;

import com.cheonjiyeon.api.auth.TokenStore;
import com.cheonjiyeon.api.auth.UserEntity;
import com.cheonjiyeon.api.auth.UserRepository;
import com.cheonjiyeon.api.common.ApiException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/receipts")
public class ReceiptController {

    private final ReceiptPdfService receiptPdfService;
    private final TokenStore tokenStore;
    private final UserRepository userRepository;

    public ReceiptController(
            ReceiptPdfService receiptPdfService,
            TokenStore tokenStore,
            UserRepository userRepository
    ) {
        this.receiptPdfService = receiptPdfService;
        this.tokenStore = tokenStore;
        this.userRepository = userRepository;
    }

    @GetMapping("/transactions/{transactionId}/pdf")
    public ResponseEntity<byte[]> downloadTransactionReceipt(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long transactionId
    ) {
        UserEntity user = resolveUser(authHeader);
        byte[] pdf = receiptPdfService.generateTransactionReceiptPdf(transactionId, user.getId());

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=receipt_" + transactionId + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .contentLength(pdf.length)
                .body(pdf);
    }

    private UserEntity resolveUser(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new ApiException(401, "Authorization Bearer 토큰이 필요합니다.");
        }
        String token = authHeader.substring(7);
        Long userId = tokenStore.resolveAccessUserId(token)
                .orElseThrow(() -> new ApiException(401, "로그인이 필요합니다."));
        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(401, "유효하지 않은 토큰입니다."));
    }
}
