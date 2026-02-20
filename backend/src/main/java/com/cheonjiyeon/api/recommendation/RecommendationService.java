package com.cheonjiyeon.api.recommendation;

import com.cheonjiyeon.api.booking.BookingRepository;
import com.cheonjiyeon.api.consultation.ConsultationSessionRepository;
import com.cheonjiyeon.api.counselor.CounselorEntity;
import com.cheonjiyeon.api.counselor.CounselorRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RecommendationService {

    private final CounselorRepository counselorRepository;
    private final BookingRepository bookingRepository;
    private final ConsultationSessionRepository sessionRepository;

    public RecommendationService(CounselorRepository counselorRepository,
                                  BookingRepository bookingRepository,
                                  ConsultationSessionRepository sessionRepository) {
        this.counselorRepository = counselorRepository;
        this.bookingRepository = bookingRepository;
        this.sessionRepository = sessionRepository;
    }

    public List<RecommendationDtos.RecommendedCounselorResponse> getTodayRecommendations(int limit) {
        List<CounselorEntity> activeCounselors = counselorRepository.findAll().stream()
                .filter(c -> Boolean.TRUE.equals(c.getIsActive()))
                .toList();

        return activeCounselors.stream()
                .map(c -> {
                    double score = computeScore(c);
                    return new RecommendationDtos.RecommendedCounselorResponse(
                            c.getId(),
                            c.getName(),
                            c.getSpecialty(),
                            c.getIntro(),
                            c.getRatingAvg() != null ? c.getRatingAvg().doubleValue() : 0.0,
                            bookingRepository.countByCounselorId(c.getId()),
                            Math.round(score * 100.0) / 100.0,
                            generateTodayReason(c)
                    );
                })
                .sorted(Comparator.comparingDouble(RecommendationDtos.RecommendedCounselorResponse::matchScore).reversed())
                .limit(limit)
                .toList();
    }

    public List<RecommendationDtos.RecommendedCounselorResponse> matchByConcerns(List<String> concerns, String preferredStyle) {
        List<CounselorEntity> activeCounselors = counselorRepository.findAll().stream()
                .filter(c -> Boolean.TRUE.equals(c.getIsActive()))
                .toList();

        return activeCounselors.stream()
                .filter(c -> concerns.stream().anyMatch(concern ->
                        c.getSpecialty().contains(concern) || c.getIntro().contains(concern)))
                .map(c -> {
                    double score = computeScore(c);
                    // Boost for style match in intro
                    if (preferredStyle != null && !"any".equals(preferredStyle)) {
                        boolean styleMatch = matchesStyle(c, preferredStyle);
                        if (styleMatch) {
                            score += 0.5;
                        }
                    }
                    List<String> matchedConcerns = concerns.stream()
                            .filter(concern -> c.getSpecialty().contains(concern) || c.getIntro().contains(concern))
                            .toList();

                    return new RecommendationDtos.RecommendedCounselorResponse(
                            c.getId(),
                            c.getName(),
                            c.getSpecialty(),
                            c.getIntro(),
                            c.getRatingAvg() != null ? c.getRatingAvg().doubleValue() : 0.0,
                            bookingRepository.countByCounselorId(c.getId()),
                            Math.round(score * 100.0) / 100.0,
                            generateMatchReason(c, matchedConcerns, preferredStyle)
                    );
                })
                .sorted(Comparator.comparingDouble(RecommendationDtos.RecommendedCounselorResponse::matchScore).reversed())
                .toList();
    }

    public List<RecommendationDtos.RecommendedCounselorResponse> getPersonalized(Long userId) {
        // Find counselor IDs the user has booked with before
        var userBookings = bookingRepository.findByUserIdOrderByIdDesc(userId);
        Set<Long> bookedCounselorIds = userBookings.stream()
                .map(b -> b.getCounselor().getId())
                .collect(Collectors.toSet());

        // Collect specialties the user has engaged with
        Set<String> preferredSpecialties = userBookings.stream()
                .map(b -> b.getCounselor().getSpecialty())
                .collect(Collectors.toSet());

        if (preferredSpecialties.isEmpty()) {
            // No booking history - return top recommendations
            return getTodayRecommendations(5);
        }

        List<CounselorEntity> activeCounselors = counselorRepository.findAll().stream()
                .filter(c -> Boolean.TRUE.equals(c.getIsActive()))
                .toList();

        return activeCounselors.stream()
                .filter(c -> !bookedCounselorIds.contains(c.getId())) // Exclude already-booked counselors
                .filter(c -> preferredSpecialties.stream().anyMatch(spec ->
                        c.getSpecialty().contains(spec) || spec.contains(c.getSpecialty())))
                .map(c -> {
                    double score = computeScore(c);
                    // Boost for matching user's preferred specialty
                    score += 0.3;

                    return new RecommendationDtos.RecommendedCounselorResponse(
                            c.getId(),
                            c.getName(),
                            c.getSpecialty(),
                            c.getIntro(),
                            c.getRatingAvg() != null ? c.getRatingAvg().doubleValue() : 0.0,
                            bookingRepository.countByCounselorId(c.getId()),
                            Math.round(score * 100.0) / 100.0,
                            generatePersonalizedReason(c, preferredSpecialties)
                    );
                })
                .sorted(Comparator.comparingDouble(RecommendationDtos.RecommendedCounselorResponse::matchScore).reversed())
                .limit(5)
                .toList();
    }

    private double computeScore(CounselorEntity counselor) {
        // Score = (avgRating * 0.4) + (completionRate * 0.3) + (totalSessions * 0.2) + (recentActivityBonus * 0.1)
        double avgRating = counselor.getRatingAvg() != null
                ? counselor.getRatingAvg().doubleValue() / 5.0 // normalize to 0-1
                : 0.0;

        long totalBookings = bookingRepository.countByCounselorId(counselor.getId());
        var counselorBookings = bookingRepository.findByCounselorIdOrderByIdDesc(counselor.getId());
        long completedSessions = counselorBookings.stream()
                .filter(b -> "COMPLETED".equals(b.getStatus()) || "PAID".equals(b.getStatus()))
                .count();
        double completionRate = totalBookings > 0 ? (double) completedSessions / totalBookings : 0.5;

        // Normalize totalSessions (cap at 50 for normalization)
        double sessionScore = Math.min(totalBookings / 50.0, 1.0);

        // Recent activity bonus
        double recentActivityBonus = 0.0;
        if (!counselorBookings.isEmpty()) {
            LocalDateTime lastBooking = counselorBookings.get(0).getCreatedAt();
            if (lastBooking != null) {
                long daysSinceLastBooking = java.time.Duration.between(lastBooking, LocalDateTime.now()).toDays();
                if (daysSinceLastBooking <= 7) {
                    recentActivityBonus = 1.0;
                } else if (daysSinceLastBooking <= 30) {
                    recentActivityBonus = 0.5;
                }
            }
        }

        return (avgRating * 0.4) + (completionRate * 0.3) + (sessionScore * 0.2) + (recentActivityBonus * 0.1);
    }

    private boolean matchesStyle(CounselorEntity counselor, String preferredStyle) {
        String intro = counselor.getIntro().toLowerCase();
        if ("warm".equals(preferredStyle)) {
            return intro.contains("따뜻") || intro.contains("공감") || intro.contains("편안")
                    || intro.contains("위로") || intro.contains("포근");
        } else if ("direct".equals(preferredStyle)) {
            return intro.contains("직설") || intro.contains("명쾌") || intro.contains("정확")
                    || intro.contains("솔직") || intro.contains("확실");
        }
        return false;
    }

    private String generateTodayReason(CounselorEntity counselor) {
        BigDecimal rating = counselor.getRatingAvg();
        if (rating != null && rating.doubleValue() >= 4.5) {
            return "높은 평점의 인기 상담사입니다";
        } else if (rating != null && rating.doubleValue() >= 4.0) {
            return "만족도가 높은 상담사입니다";
        }
        return counselor.getSpecialty() + " 분야의 전문 상담사입니다";
    }

    private String generateMatchReason(CounselorEntity counselor, List<String> matchedConcerns, String preferredStyle) {
        StringBuilder reason = new StringBuilder();
        if (!matchedConcerns.isEmpty()) {
            reason.append(String.join(", ", matchedConcerns)).append(" 분야 전문");
        }
        if (preferredStyle != null && !"any".equals(preferredStyle) && matchesStyle(counselor, preferredStyle)) {
            if (!reason.isEmpty()) reason.append(" | ");
            reason.append("warm".equals(preferredStyle) ? "따뜻하고 공감적인 상담 스타일" : "직설적이고 명쾌한 상담 스타일");
        }
        BigDecimal rating = counselor.getRatingAvg();
        if (rating != null && rating.doubleValue() >= 4.0) {
            if (!reason.isEmpty()) reason.append(" | ");
            reason.append("평점 ").append(rating).append("점");
        }
        return reason.isEmpty() ? counselor.getSpecialty() + " 전문 상담사" : reason.toString();
    }

    private String generatePersonalizedReason(CounselorEntity counselor, Set<String> preferredSpecialties) {
        String matchingSpec = preferredSpecialties.stream()
                .filter(spec -> counselor.getSpecialty().contains(spec) || spec.contains(counselor.getSpecialty()))
                .findFirst()
                .orElse(counselor.getSpecialty());
        return "이전에 " + matchingSpec + " 상담을 받으셨기에 추천드려요";
    }
}
