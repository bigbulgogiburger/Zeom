package com.cheonjiyeon.api.cash;

import com.cheonjiyeon.api.auth.TokenStore;
import com.cheonjiyeon.api.auth.UserEntity;
import com.cheonjiyeon.api.auth.UserRepository;
import com.cheonjiyeon.api.common.ApiException;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/cash/transactions")
public class CashTransactionController {

    private final CashTransactionService cashTransactionService;
    private final ReceiptService receiptService;
    private final TokenStore tokenStore;
    private final UserRepository userRepository;

    public CashTransactionController(
            CashTransactionService cashTransactionService,
            ReceiptService receiptService,
            TokenStore tokenStore,
            UserRepository userRepository
    ) {
        this.cashTransactionService = cashTransactionService;
        this.receiptService = receiptService;
        this.tokenStore = tokenStore;
        this.userRepository = userRepository;
    }

    @GetMapping("/csv")
    public ResponseEntity<byte[]> exportCsv(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        UserEntity user = resolveUser(authHeader);
        List<CashTransactionEntity> transactions = cashTransactionService.getTransactionsForCsv(
                user.getId(), type, from, to
        );

        StringBuilder csv = new StringBuilder();
        csv.append("거래번호,유형,금액,거래후잔액,참조유형,참조번호,거래일시\n");

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        for (CashTransactionEntity tx : transactions) {
            csv.append(tx.getId()).append(",");
            csv.append(tx.getType()).append(",");
            csv.append(tx.getAmount()).append(",");
            csv.append(tx.getBalanceAfter()).append(",");
            csv.append(tx.getRefType() != null ? tx.getRefType() : "").append(",");
            csv.append(tx.getRefId() != null ? tx.getRefId() : "").append(",");
            csv.append(tx.getCreatedAt().format(fmt)).append("\n");
        }

        byte[] bytes = csv.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
        // Add BOM for Excel compatibility
        byte[] bom = new byte[]{(byte) 0xEF, (byte) 0xBB, (byte) 0xBF};
        byte[] result = new byte[bom.length + bytes.length];
        System.arraycopy(bom, 0, result, 0, bom.length);
        System.arraycopy(bytes, 0, result, bom.length, bytes.length);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=transactions.csv")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(result);
    }

    @GetMapping("/{id}/receipt")
    public Map<String, Object> getReceipt(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id
    ) {
        UserEntity user = resolveUser(authHeader);
        return receiptService.generateReceipt(id, user.getId());
    }

    @GetMapping(value = "/{id}/receipt/html", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> getHtmlReceipt(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id
    ) {
        UserEntity user = resolveUser(authHeader);
        String html = receiptService.generateHtmlReceipt(id, user.getId());
        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_HTML)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=receipt-" + id + ".html")
                .body(html);
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
