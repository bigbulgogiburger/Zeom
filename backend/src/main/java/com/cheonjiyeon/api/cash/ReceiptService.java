package com.cheonjiyeon.api.cash;

import com.cheonjiyeon.api.common.ApiException;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class ReceiptService {

    private final CashTransactionService cashTransactionService;

    public ReceiptService(CashTransactionService cashTransactionService) {
        this.cashTransactionService = cashTransactionService;
    }

    /**
     * 거래 ID로 영수증 데이터 생성 (JSON)
     */
    public Map<String, Object> generateReceipt(Long txId, Long userId) {
        CashTransactionEntity tx = cashTransactionService.getById(txId);
        if (!tx.getUserId().equals(userId)) {
            throw new ApiException(403, "본인의 거래만 영수증을 조회할 수 있습니다.");
        }

        Map<String, Object> receipt = new LinkedHashMap<>();
        receipt.put("receiptId", "RCP-" + tx.getId());
        receipt.put("transactionId", tx.getId());
        receipt.put("type", tx.getType());
        receipt.put("typeLabel", getTypeLabel(tx.getType()));
        receipt.put("amount", tx.getAmount());
        receipt.put("balanceAfter", tx.getBalanceAfter());
        receipt.put("refType", tx.getRefType());
        receipt.put("refId", tx.getRefId());
        receipt.put("date", tx.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        receipt.put("issuer", "천지연꽃신당");
        receipt.put("notice", "이 영수증은 전자적으로 발행되었습니다.");
        return receipt;
    }

    /**
     * 간단한 HTML 영수증 반환
     */
    public String generateHtmlReceipt(Long txId, Long userId) {
        Map<String, Object> data = generateReceipt(txId, userId);

        return """
                <!DOCTYPE html>
                <html lang="ko">
                <head><meta charset="UTF-8"><title>영수증 - 천지연꽃신당</title>
                <style>
                    body { font-family: 'Noto Sans KR', sans-serif; max-width: 420px; margin: 40px auto; padding: 24px; background: #faf8f2; }
                    .receipt { background: #fff; border: 1px solid #e5e0d5; border-radius: 12px; padding: 28px; }
                    .header { text-align: center; border-bottom: 2px solid #C9A227; padding-bottom: 16px; margin-bottom: 20px; }
                    .header h1 { color: #C9A227; font-size: 20px; margin: 0 0 4px; }
                    .header .sub { font-size: 13px; color: #888; }
                    .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f0ece3; }
                    .label { color: #777; font-size: 14px; }
                    .value { font-weight: bold; font-size: 14px; }
                    .amount { font-size: 24px; font-weight: bold; color: #C9A227; text-align: center; margin: 20px 0; }
                    .biz-info { margin-top: 20px; padding-top: 16px; border-top: 1px dashed #d5cfc3; font-size: 12px; color: #999; text-align: center; line-height: 1.8; }
                    .footer { text-align: center; margin-top: 16px; font-size: 11px; color: #bbb; }
                    @media print { body { margin: 0; background: #fff; } .receipt { border: none; } }
                </style></head>
                <body>
                <div class="receipt">
                    <div class="header"><h1>%s</h1><div class="sub">거래 영수증</div></div>
                    <div class="row"><span class="label">영수증 번호</span><span class="value">%s</span></div>
                    <div class="row"><span class="label">결제일시</span><span class="value">%s</span></div>
                    <div class="row"><span class="label">거래 유형</span><span class="value">%s</span></div>
                    <div class="amount">%s%,d원</div>
                    <div class="row"><span class="label">거래 후 잔액</span><span class="value">%,d원</span></div>
                    <div class="biz-info">
                        상호: 천지연꽃신당<br>
                        사업자등록번호: 000-00-00000<br>
                        대표: 천지연<br>
                        소재지: 서울특별시
                    </div>
                    <div class="footer">%s</div>
                </div>
                </body></html>
                """.formatted(
                data.get("issuer"),
                data.get("receiptId"),
                data.get("date"),
                data.get("typeLabel"),
                (Long) data.get("amount") >= 0 ? "+" : "",
                data.get("amount"),
                data.get("balanceAfter"),
                data.get("notice")
        );
    }

    private String getTypeLabel(String type) {
        return switch (type) {
            case "CHARGE" -> "충전";
            case "CONFIRM" -> "사용";
            case "REFUND" -> "환불";
            case "HOLD" -> "보류";
            case "ADJUST" -> "조정";
            default -> type;
        };
    }
}
