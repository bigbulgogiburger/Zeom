package com.cheonjiyeon.api.admin;

import com.cheonjiyeon.api.auth.AuthService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/analytics")
public class AdminAnalyticsController {

    private final AdminAnalyticsService analyticsService;
    private final AuthService authService;

    public AdminAnalyticsController(AdminAnalyticsService analyticsService, AuthService authService) {
        this.analyticsService = analyticsService;
        this.authService = authService;
    }

    @GetMapping("/kpi")
    public AdminAnalyticsService.KpiSummary getKpi(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(defaultValue = "30d") String period
    ) {
        authService.requireAdmin(authHeader);
        return analyticsService.getKpiSummary(period);
    }

    @GetMapping("/revenue")
    public List<AdminAnalyticsService.RevenueDataPoint> getRevenue(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "daily") String groupBy
    ) {
        authService.requireAdmin(authHeader);
        return analyticsService.getRevenueTimeSeries(startDate, endDate, groupBy);
    }

    @GetMapping("/counselor-ranking")
    public List<AdminAnalyticsService.CounselorRankingEntry> getCounselorRanking(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(defaultValue = "30d") String period,
            @RequestParam(defaultValue = "10") int limit
    ) {
        authService.requireAdmin(authHeader);
        return analyticsService.getCounselorRanking(period, limit);
    }

    @GetMapping(value = "/kpi/csv", produces = "text/csv")
    public ResponseEntity<String> getKpiCsv(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(defaultValue = "30d") String period
    ) {
        authService.requireAdmin(authHeader);
        AdminAnalyticsService.KpiSummary kpi = analyticsService.getKpiSummary(period);

        StringBuilder sb = new StringBuilder();
        sb.append("항목,값\n");
        sb.append("총 매출,").append(kpi.totalRevenue()).append("\n");
        sb.append("신규 가입,").append(kpi.newSignups()).append("\n");
        sb.append("예약 건수,").append(kpi.bookingTotal()).append("\n");
        sb.append("예약 완료,").append(kpi.bookingCompleted()).append("\n");
        sb.append("예약 취소,").append(kpi.bookingCancelled()).append("\n");
        sb.append("상담 완료,").append(kpi.consultationCount()).append("\n");
        sb.append("평균 상담 시간(초),").append(kpi.avgDurationSec()).append("\n");
        sb.append("환불 건수,").append(kpi.refundCount()).append("\n");
        sb.append("환불률(%),").append(kpi.refundRate()).append("\n");

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=kpi_" + period + ".csv")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(sb.toString());
    }

    @GetMapping(value = "/revenue/csv", produces = "text/csv")
    public ResponseEntity<String> getRevenueCsv(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "daily") String groupBy
    ) {
        authService.requireAdmin(authHeader);
        List<AdminAnalyticsService.RevenueDataPoint> data = analyticsService.getRevenueTimeSeries(startDate, endDate, groupBy);

        StringBuilder sb = new StringBuilder();
        sb.append("날짜,매출,예약건수\n");
        for (AdminAnalyticsService.RevenueDataPoint dp : data) {
            sb.append(dp.date()).append(",").append(dp.revenue()).append(",").append(dp.bookingCount()).append("\n");
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=revenue.csv")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(sb.toString());
    }
}
