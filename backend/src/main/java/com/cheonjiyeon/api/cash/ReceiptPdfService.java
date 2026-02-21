package com.cheonjiyeon.api.cash;

import com.cheonjiyeon.api.common.ApiException;
import com.cheonjiyeon.api.settlement.CounselorSettlementEntity;
import com.cheonjiyeon.api.settlement.SettlementTransactionEntity;
import com.cheonjiyeon.api.settlement.SettlementTransactionRepository;
import com.cheonjiyeon.api.settlement.CounselorSettlementRepository;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class ReceiptPdfService {

    private final ReceiptService receiptService;
    private final CounselorSettlementRepository counselorSettlementRepository;
    private final SettlementTransactionRepository settlementTransactionRepository;

    public ReceiptPdfService(
            ReceiptService receiptService,
            CounselorSettlementRepository counselorSettlementRepository,
            SettlementTransactionRepository settlementTransactionRepository
    ) {
        this.receiptService = receiptService;
        this.counselorSettlementRepository = counselorSettlementRepository;
        this.settlementTransactionRepository = settlementTransactionRepository;
    }

    /**
     * 거래 영수증 PDF 생성
     */
    public byte[] generateTransactionReceiptPdf(Long txId, Long userId) {
        String html = receiptService.generateHtmlReceipt(txId, userId);
        return renderHtmlToPdf(toXhtml(html));
    }

    /**
     * 정산 명세서 PDF 생성
     */
    public byte[] generateSettlementPdf(Long settlementId) {
        CounselorSettlementEntity settlement = counselorSettlementRepository.findById(settlementId)
                .orElseThrow(() -> new ApiException(404, "정산 내역을 찾을 수 없습니다."));

        List<SettlementTransactionEntity> txs = settlementTransactionRepository
                .findByCounselorIdOrderByCreatedAtDesc(settlement.getCounselorId())
                .stream()
                .filter(tx -> {
                    var txDate = tx.getSettledAt().toLocalDate();
                    return !txDate.isBefore(settlement.getPeriodStart()) && !txDate.isAfter(settlement.getPeriodEnd());
                })
                .toList();

        String html = buildSettlementHtml(settlement, txs);
        return renderHtmlToPdf(toXhtml(html));
    }

    private String buildSettlementHtml(CounselorSettlementEntity settlement, List<SettlementTransactionEntity> txs) {
        DateTimeFormatter dateFmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        StringBuilder rows = new StringBuilder();
        for (var tx : txs) {
            rows.append("<tr>")
                    .append("<td>").append(tx.getSettledAt().format(dateFmt)).append("</td>")
                    .append("<td>").append(tx.getSettlementType()).append("</td>")
                    .append("<td style='text-align:right;'>").append(tx.getCreditsConsumed()).append("</td>")
                    .append("<td style='text-align:right;'>").append(String.format("%,d원", tx.getCounselorEarning())).append("</td>")
                    .append("<td style='text-align:right;'>").append(String.format("%,d원", tx.getPlatformFee())).append("</td>")
                    .append("</tr>\n");
        }

        return """
                <!DOCTYPE html>
                <html lang="ko"><head><meta charset="UTF-8"/><title>Settlement Statement</title>
                <style>
                    body { font-family: sans-serif; max-width: 700px; margin: 40px auto; padding: 20px; font-size: 13px; }
                    .header { text-align: center; border-bottom: 3px solid #C9A227; padding-bottom: 16px; margin-bottom: 24px; }
                    .header h1 { color: #C9A227; font-size: 22px; margin: 0 0 8px 0; }
                    .summary { margin-bottom: 24px; }
                    .summary-row { display: inline-block; width: 48%%; padding: 12px; background: #f9f5ed; border-radius: 8px; margin-bottom: 8px; }
                    .label { font-size: 12px; color: #666; }
                    .value { font-size: 16px; font-weight: bold; color: #333; }
                    table { width: 100%%; border-collapse: collapse; }
                    th, td { padding: 8px 12px; border-bottom: 1px solid #eee; text-align: left; font-size: 13px; }
                    th { background: #f9f5ed; color: #C9A227; font-weight: bold; }
                    .footer { text-align: center; margin-top: 24px; font-size: 11px; color: #999; }
                </style></head><body>
                <div class="header">
                    <h1>Settlement Statement</h1>
                    <div>%s ~ %s</div>
                </div>
                <div class="summary">
                    <div class="summary-row"><div class="label">Total Sessions</div><div class="value">%d</div></div>
                    <div class="summary-row"><div class="label">Gross Amount</div><div class="value">%,d KRW</div></div>
                    <div class="summary-row"><div class="label">Commission (%.0f%%)</div><div class="value">%,d KRW</div></div>
                    <div class="summary-row"><div class="label">Net Amount</div><div class="value" style="color:#C9A227;">%,d KRW</div></div>
                </div>
                <table>
                    <thead><tr><th>Date</th><th>Type</th><th style="text-align:right;">Credits</th><th style="text-align:right;">Earning</th><th style="text-align:right;">Fee</th></tr></thead>
                    <tbody>%s</tbody>
                </table>
                <div class="footer">Electronically issued | Status: %s</div>
                </body></html>
                """.formatted(
                settlement.getPeriodStart().format(dateFmt),
                settlement.getPeriodEnd().format(dateFmt),
                settlement.getTotalSessions(),
                settlement.getGrossAmount(),
                settlement.getCommissionRate().doubleValue(),
                settlement.getCommissionAmount(),
                settlement.getNetAmount(),
                rows.toString(),
                settlement.getStatus()
        );
    }

    /**
     * Convert HTML to XHTML for openhtmltopdf compatibility.
     * Fixes self-closing tags and adds XML namespace.
     */
    private String toXhtml(String html) {
        String xhtml = html;
        // Fix self-closing void tags
        xhtml = xhtml.replaceAll("<br>", "<br/>");
        xhtml = xhtml.replaceAll("<meta ([^>]*)>", "<meta $1/>");
        xhtml = xhtml.replaceAll("<link ([^>]*)>", "<link $1/>");
        xhtml = xhtml.replaceAll("<hr>", "<hr/>");
        // Add XHTML namespace if missing
        if (!xhtml.contains("xmlns")) {
            xhtml = xhtml.replace("<html", "<html xmlns=\"http://www.w3.org/1999/xhtml\"");
        }
        // Remove DOCTYPE (openhtmltopdf handles it)
        xhtml = xhtml.replaceAll("<!DOCTYPE[^>]*>", "");
        return xhtml;
    }

    private byte[] renderHtmlToPdf(String html) {
        try (ByteArrayOutputStream os = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();
            builder.withHtmlContent(html, null);
            builder.toStream(os);
            builder.run();
            return os.toByteArray();
        } catch (Exception e) {
            throw new ApiException(500, "PDF 생성에 실패했습니다: " + e.getMessage());
        }
    }
}
