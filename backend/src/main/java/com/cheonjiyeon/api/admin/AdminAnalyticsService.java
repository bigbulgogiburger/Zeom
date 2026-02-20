package com.cheonjiyeon.api.admin;

import com.cheonjiyeon.api.auth.UserRepository;
import com.cheonjiyeon.api.booking.BookingRepository;
import com.cheonjiyeon.api.consultation.ConsultationSessionRepository;
import com.cheonjiyeon.api.counselor.CounselorRepository;
import com.cheonjiyeon.api.payment.PaymentRepository;
import com.cheonjiyeon.api.refund.RefundRepository;
import com.cheonjiyeon.api.review.ReviewRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class AdminAnalyticsService {

    private final EntityManager em;
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final ConsultationSessionRepository sessionRepository;
    private final PaymentRepository paymentRepository;
    private final RefundRepository refundRepository;
    private final ReviewRepository reviewRepository;
    private final CounselorRepository counselorRepository;

    public AdminAnalyticsService(
            EntityManager em,
            UserRepository userRepository,
            BookingRepository bookingRepository,
            ConsultationSessionRepository sessionRepository,
            PaymentRepository paymentRepository,
            RefundRepository refundRepository,
            ReviewRepository reviewRepository,
            CounselorRepository counselorRepository
    ) {
        this.em = em;
        this.userRepository = userRepository;
        this.bookingRepository = bookingRepository;
        this.sessionRepository = sessionRepository;
        this.paymentRepository = paymentRepository;
        this.refundRepository = refundRepository;
        this.reviewRepository = reviewRepository;
        this.counselorRepository = counselorRepository;
    }

    public KpiSummary getKpiSummary(String period) {
        LocalDateTime since = periodToSince(period);

        // Total revenue
        Query revenueQuery = em.createQuery(
                "SELECT COALESCE(SUM(p.amount), 0) FROM PaymentEntity p WHERE p.status = 'PAID' AND p.createdAt >= :since"
        );
        revenueQuery.setParameter("since", since);
        long totalRevenue = ((Number) revenueQuery.getSingleResult()).longValue();

        // New signups
        Query signupQuery = em.createQuery(
                "SELECT COUNT(u) FROM UserEntity u WHERE u.createdAt >= :since"
        );
        signupQuery.setParameter("since", since);
        long newSignups = ((Number) signupQuery.getSingleResult()).longValue();

        // Booking counts
        Query bookingCompletedQuery = em.createQuery(
                "SELECT COUNT(b) FROM BookingEntity b WHERE b.status = 'COMPLETED' AND b.createdAt >= :since"
        );
        bookingCompletedQuery.setParameter("since", since);
        long bookingCompleted = ((Number) bookingCompletedQuery.getSingleResult()).longValue();

        Query bookingCancelledQuery = em.createQuery(
                "SELECT COUNT(b) FROM BookingEntity b WHERE b.status = 'CANCELLED' AND b.createdAt >= :since"
        );
        bookingCancelledQuery.setParameter("since", since);
        long bookingCancelled = ((Number) bookingCancelledQuery.getSingleResult()).longValue();

        Query bookingTotalQuery = em.createQuery(
                "SELECT COUNT(b) FROM BookingEntity b WHERE b.createdAt >= :since"
        );
        bookingTotalQuery.setParameter("since", since);
        long bookingTotal = ((Number) bookingTotalQuery.getSingleResult()).longValue();

        // Consultation count
        Query consultationQuery = em.createQuery(
                "SELECT COUNT(s) FROM ConsultationSessionEntity s WHERE s.endedAt IS NOT NULL AND s.createdAt >= :since"
        );
        consultationQuery.setParameter("since", since);
        long consultationCount = ((Number) consultationQuery.getSingleResult()).longValue();

        // Avg consultation duration
        Query avgDurationQuery = em.createQuery(
                "SELECT COALESCE(AVG(s.durationSec), 0) FROM ConsultationSessionEntity s WHERE s.durationSec IS NOT NULL AND s.createdAt >= :since"
        );
        avgDurationQuery.setParameter("since", since);
        double avgDurationSec = ((Number) avgDurationQuery.getSingleResult()).doubleValue();

        // Refund count and rate
        Query refundQuery = em.createQuery(
                "SELECT COUNT(r) FROM RefundEntity r WHERE r.createdAt >= :since"
        );
        refundQuery.setParameter("since", since);
        long refundCount = ((Number) refundQuery.getSingleResult()).longValue();

        double refundRate = bookingTotal > 0 ? (double) refundCount / bookingTotal * 100 : 0;

        return new KpiSummary(
                totalRevenue, newSignups,
                bookingTotal, bookingCompleted, bookingCancelled,
                consultationCount, (int) Math.round(avgDurationSec),
                refundCount, Math.round(refundRate * 100.0) / 100.0
        );
    }

    @SuppressWarnings("unchecked")
    public List<RevenueDataPoint> getRevenueTimeSeries(LocalDate startDate, LocalDate endDate, String groupBy) {
        // Use native query for date grouping
        String dateExpr;
        switch (groupBy) {
            case "weekly":
                // Group by ISO week start (Monday)
                dateExpr = "CAST(DATEADD('DAY', -(DAYOFWEEK(p.created_at) - 2 + 7) % 7, p.created_at) AS DATE)";
                break;
            case "monthly":
                dateExpr = "FORMATDATETIME(p.created_at, 'yyyy-MM-01')";
                break;
            default: // daily
                dateExpr = "CAST(p.created_at AS DATE)";
                break;
        }

        String sql = "SELECT " + dateExpr + " AS period_date, " +
                "COALESCE(SUM(p.amount), 0) AS revenue, " +
                "COUNT(*) AS booking_count " +
                "FROM payments p " +
                "WHERE p.status = 'PAID' " +
                "AND p.created_at >= ? AND p.created_at < ? " +
                "GROUP BY " + dateExpr + " " +
                "ORDER BY period_date ASC";

        Query query = em.createNativeQuery(sql);
        query.setParameter(1, startDate.atStartOfDay());
        query.setParameter(2, endDate.plusDays(1).atStartOfDay());

        List<Object[]> results = query.getResultList();
        List<RevenueDataPoint> dataPoints = new ArrayList<>();
        for (Object[] row : results) {
            String date = row[0].toString();
            long revenue = ((Number) row[1]).longValue();
            long count = ((Number) row[2]).longValue();
            dataPoints.add(new RevenueDataPoint(date, revenue, count));
        }
        return dataPoints;
    }

    @SuppressWarnings("unchecked")
    public List<CounselorRankingEntry> getCounselorRanking(String period, int limit) {
        LocalDateTime since = periodToSince(period);

        String jpql = "SELECT b.counselor.id, b.counselor.name, " +
                "COALESCE(SUM(p.amount), 0), " +
                "COUNT(DISTINCT b.id), " +
                "b.counselor.ratingAvg " +
                "FROM BookingEntity b " +
                "JOIN PaymentEntity p ON p.bookingId = b.id " +
                "WHERE p.status = 'PAID' AND b.createdAt >= :since " +
                "GROUP BY b.counselor.id, b.counselor.name, b.counselor.ratingAvg " +
                "ORDER BY COALESCE(SUM(p.amount), 0) DESC";

        Query query = em.createQuery(jpql);
        query.setParameter("since", since);
        query.setMaxResults(limit);

        List<Object[]> results = query.getResultList();
        List<CounselorRankingEntry> entries = new ArrayList<>();
        for (Object[] row : results) {
            long counselorId = ((Number) row[0]).longValue();
            String name = (String) row[1];
            long revenue = ((Number) row[2]).longValue();
            long sessionCount = ((Number) row[3]).longValue();
            BigDecimal avgRating = row[4] != null ? (BigDecimal) row[4] : BigDecimal.ZERO;
            entries.add(new CounselorRankingEntry(counselorId, name, revenue, sessionCount, avgRating.doubleValue()));
        }
        return entries;
    }

    private LocalDateTime periodToSince(String period) {
        return switch (period) {
            case "7d" -> LocalDate.now().minusDays(7).atStartOfDay();
            case "90d" -> LocalDate.now().minusDays(90).atStartOfDay();
            default -> LocalDate.now().minusDays(30).atStartOfDay(); // 30d default
        };
    }

    public record KpiSummary(
            long totalRevenue,
            long newSignups,
            long bookingTotal,
            long bookingCompleted,
            long bookingCancelled,
            long consultationCount,
            int avgDurationSec,
            long refundCount,
            double refundRate
    ) {}

    public record RevenueDataPoint(String date, long revenue, long bookingCount) {}

    public record CounselorRankingEntry(long counselorId, String name, long revenue, long sessionCount, double avgRating) {}
}
