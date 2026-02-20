package com.cheonjiyeon.api.settlement;

import com.cheonjiyeon.api.common.ApiException;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;

/**
 * 정산 명세서 PDF/HTML 생성 서비스
 * 향후 PDF 라이브러리 통합 시 확장 예정
 */
@Service
public class SettlementPdfService {

    private final CounselorSettlementRepository counselorSettlementRepository;
    private final SettlementTransactionRepository settlementTransactionRepository;

    public SettlementPdfService(
            CounselorSettlementRepository counselorSettlementRepository,
            SettlementTransactionRepository settlementTransactionRepository
    ) {
        this.counselorSettlementRepository = counselorSettlementRepository;
        this.settlementTransactionRepository = settlementTransactionRepository;
    }

    /**
     * 정산 명세서를 HTML 형태로 생성
     */
    public String generateSettlementHtml(Long settlementId) {
        CounselorSettlementEntity settlement = counselorSettlementRepository.findById(settlementId)
                .orElseThrow(() -> new ApiException(404, "정산 내역을 찾을 수 없습니다."));

        var txs = settlementTransactionRepository.findByCounselorIdOrderByCreatedAtDesc(settlement.getCounselorId())
                .stream()
                .filter(tx -> {
                    var txDate = tx.getSettledAt().toLocalDate();
                    return !txDate.isBefore(settlement.getPeriodStart()) && !txDate.isAfter(settlement.getPeriodEnd());
                })
                .toList();

        DateTimeFormatter dateFmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        StringBuilder rows = new StringBuilder();
        for (var tx : txs) {
            rows.append("<tr>")
                    .append("<td>").append(tx.getSettledAt().format(dateFmt)).append("</td>")
                    .append("<td>").append(tx.getSettlementType()).append("</td>")
                    .append("<td class='right'>").append(tx.getCreditsConsumed()).append("</td>")
                    .append("<td class='right'>").append(String.format("%,d원", tx.getCounselorEarning())).append("</td>")
                    .append("<td class='right'>").append(String.format("%,d원", tx.getPlatformFee())).append("</td>")
                    .append("</tr>\n");
        }

        return """
                <!DOCTYPE html>
                <html lang="ko"><head><meta charset="UTF-8"><title>정산 명세서</title>
                <style>
                    body { font-family: 'Noto Sans KR', sans-serif; max-width: 700px; margin: 40px auto; padding: 20px; }
                    .header { text-align: center; border-bottom: 3px solid #C9A227; padding-bottom: 16px; margin-bottom: 24px; }
                    .header h1 { color: #C9A227; font-size: 22px; margin: 0 0 8px 0; }
                    .summary { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
                    .summary .item { padding: 12px; background: #f9f5ed; border-radius: 8px; }
                    .summary .label { font-size: 12px; color: #666; }
                    .summary .value { font-size: 18px; font-weight: bold; color: #333; }
                    table { width: 100%%; border-collapse: collapse; }
                    th, td { padding: 8px 12px; border-bottom: 1px solid #eee; text-align: left; font-size: 13px; }
                    th { background: #f9f5ed; color: #C9A227; font-weight: bold; }
                    .right { text-align: right; }
                    .footer { text-align: center; margin-top: 24px; font-size: 11px; color: #999; }
                </style></head><body>
                <div class="header">
                    <h1>천지연꽃신당</h1>
                    <div>정산 명세서</div>
                    <div style="font-size:13px;color:#666;margin-top:8px;">%s ~ %s</div>
                </div>
                <div class="summary">
                    <div class="item"><div class="label">총 상담 건수</div><div class="value">%d건</div></div>
                    <div class="item"><div class="label">총 금액</div><div class="value">%,d원</div></div>
                    <div class="item"><div class="label">수수료 (%.0f%%)</div><div class="value">%,d원</div></div>
                    <div class="item"><div class="label">정산액</div><div class="value" style="color:#C9A227;">%,d원</div></div>
                </div>
                <table>
                    <thead><tr><th>날짜</th><th>유형</th><th class="right">사용 크레딧</th><th class="right">상담사 수입</th><th class="right">수수료</th></tr></thead>
                    <tbody>%s</tbody>
                </table>
                <div class="footer">이 명세서는 전자적으로 발행되었습니다. | 상태: %s</div>
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
}
