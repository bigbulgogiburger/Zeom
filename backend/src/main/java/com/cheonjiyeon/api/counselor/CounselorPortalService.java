package com.cheonjiyeon.api.counselor;

import com.cheonjiyeon.api.auth.TokenStore;
import com.cheonjiyeon.api.auth.UserEntity;
import com.cheonjiyeon.api.auth.UserRepository;
import com.cheonjiyeon.api.booking.BookingEntity;
import com.cheonjiyeon.api.booking.BookingRepository;
import com.cheonjiyeon.api.booking.BookingSlotEntity;
import com.cheonjiyeon.api.common.ApiException;
import com.cheonjiyeon.api.consultation.ConsultationMemoEntity;
import com.cheonjiyeon.api.consultation.ConsultationMemoRepository;
import com.cheonjiyeon.api.consultation.ConsultationSessionEntity;
import com.cheonjiyeon.api.consultation.ConsultationSessionRepository;
import com.cheonjiyeon.api.review.ReviewEntity;
import com.cheonjiyeon.api.review.ReviewRepository;
import com.cheonjiyeon.api.settlement.CounselorSettlementEntity;
import com.cheonjiyeon.api.settlement.CounselorSettlementRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CounselorPortalService {
    private final TokenStore tokenStore;
    private final UserRepository userRepository;
    private final CounselorRepository counselorRepository;
    private final BookingRepository bookingRepository;
    private final SlotRepository slotRepository;
    private final ReviewRepository reviewRepository;
    private final ConsultationSessionRepository sessionRepository;
    private final CounselorSettlementRepository settlementRepository;
    private final ConsultationMemoRepository memoRepository;

    public CounselorPortalService(
            TokenStore tokenStore,
            UserRepository userRepository,
            CounselorRepository counselorRepository,
            BookingRepository bookingRepository,
            SlotRepository slotRepository,
            ReviewRepository reviewRepository,
            ConsultationSessionRepository sessionRepository,
            CounselorSettlementRepository settlementRepository,
            ConsultationMemoRepository memoRepository
    ) {
        this.tokenStore = tokenStore;
        this.userRepository = userRepository;
        this.counselorRepository = counselorRepository;
        this.bookingRepository = bookingRepository;
        this.slotRepository = slotRepository;
        this.reviewRepository = reviewRepository;
        this.sessionRepository = sessionRepository;
        this.settlementRepository = settlementRepository;
        this.memoRepository = memoRepository;
    }

    // 1. Get counselor profile
    public CounselorPortalDtos.CounselorProfileResponse getMe(String authHeader) {
        CounselorEntity counselor = resolveCounselor(authHeader);
        return toProfileResponse(counselor);
    }

    // 2. Get bookings with optional filters
    public CounselorPortalDtos.CounselorBookingListResponse getBookings(
            String authHeader, LocalDate date, String status, int page, int size) {
        CounselorEntity counselor = resolveCounselor(authHeader);
        List<BookingEntity> allBookings = bookingRepository.findByCounselorIdOrderByIdDesc(counselor.getId());

        List<BookingEntity> filtered = allBookings.stream()
                .filter(b -> {
                    if (date != null) {
                        LocalDateTime slotStart = getFirstSlotStart(b);
                        if (slotStart == null || !slotStart.toLocalDate().equals(date)) return false;
                    }
                    if (status != null && !status.isBlank()) {
                        if (!status.equalsIgnoreCase(b.getStatus())) return false;
                    }
                    return true;
                })
                .toList();

        long totalElements = filtered.size();
        int totalPages = (int) Math.ceil((double) totalElements / size);
        int fromIndex = Math.min(page * size, filtered.size());
        int toIndex = Math.min(fromIndex + size, filtered.size());
        List<BookingEntity> pageItems = filtered.subList(fromIndex, toIndex);

        List<CounselorPortalDtos.CounselorBookingItem> items = pageItems.stream()
                .map(this::toBookingItem)
                .toList();

        return new CounselorPortalDtos.CounselorBookingListResponse(items, totalPages, totalElements);
    }

    // 3. Get today's bookings
    public List<CounselorPortalDtos.CounselorBookingItem> getTodayBookings(String authHeader) {
        CounselorEntity counselor = resolveCounselor(authHeader);
        LocalDate today = LocalDate.now();

        return bookingRepository.findByCounselorIdOrderByIdDesc(counselor.getId()).stream()
                .filter(b -> {
                    LocalDateTime slotStart = getFirstSlotStart(b);
                    return slotStart != null && slotStart.toLocalDate().equals(today);
                })
                .map(this::toBookingItem)
                .toList();
    }

    // 4. Get dashboard
    public CounselorPortalDtos.DashboardResponse getDashboard(String authHeader) {
        CounselorEntity counselor = resolveCounselor(authHeader);
        List<BookingEntity> allBookings = bookingRepository.findByCounselorIdOrderByIdDesc(counselor.getId());
        LocalDate today = LocalDate.now();

        int todayBookings = (int) allBookings.stream()
                .filter(b -> {
                    LocalDateTime slotStart = getFirstSlotStart(b);
                    return slotStart != null && slotStart.toLocalDate().equals(today);
                })
                .count();

        int totalBookings = allBookings.size();

        int completedSessions = (int) allBookings.stream()
                .filter(b -> "COMPLETED".equals(b.getStatus()))
                .count();

        BigDecimal ratingAvg = counselor.getRatingAvg() != null ? counselor.getRatingAvg() : BigDecimal.ZERO;
        int reviewCount = counselor.getReviewCount() != null ? counselor.getReviewCount() : 0;

        // Sum net amounts from settlements
        Page<CounselorSettlementEntity> settlements = settlementRepository
                .findByCounselorIdOrderByCreatedAtDesc(counselor.getId(), PageRequest.of(0, 1000));
        long totalEarnings = settlements.getContent().stream()
                .mapToLong(CounselorSettlementEntity::getNetAmount)
                .sum();

        return new CounselorPortalDtos.DashboardResponse(
                todayBookings, totalBookings, completedSessions, ratingAvg, reviewCount, totalEarnings);
    }

    // 5. Get customers
    public CounselorPortalDtos.CustomerListResponse getCustomers(String authHeader) {
        CounselorEntity counselor = resolveCounselor(authHeader);
        List<BookingEntity> allBookings = bookingRepository.findByCounselorIdOrderByIdDesc(counselor.getId());

        // Get reservation IDs for session lookup
        List<Long> reservationIds = allBookings.stream().map(BookingEntity::getId).toList();
        Map<Long, ConsultationSessionEntity> sessionsByReservation = new HashMap<>();
        if (!reservationIds.isEmpty()) {
            sessionRepository.findByReservationIdIn(reservationIds)
                    .forEach(s -> sessionsByReservation.put(s.getReservationId(), s));
        }

        // Group by user
        Map<Long, List<BookingEntity>> byUser = allBookings.stream()
                .collect(Collectors.groupingBy(b -> b.getUser().getId()));

        List<CounselorPortalDtos.CustomerItem> customers = byUser.entrySet().stream()
                .map(entry -> {
                    Long userId = entry.getKey();
                    List<BookingEntity> userBookings = entry.getValue();
                    UserEntity user = userBookings.get(0).getUser();

                    int totalSessions = (int) userBookings.stream()
                            .filter(b -> "COMPLETED".equals(b.getStatus()))
                            .count();

                    LocalDateTime lastSessionAt = userBookings.stream()
                            .map(b -> sessionsByReservation.get(b.getId()))
                            .filter(Objects::nonNull)
                            .map(ConsultationSessionEntity::getEndedAt)
                            .filter(Objects::nonNull)
                            .max(LocalDateTime::compareTo)
                            .orElse(null);

                    return new CounselorPortalDtos.CustomerItem(
                            userId, user.getName(), user.getEmail(), totalSessions, lastSessionAt);
                })
                .sorted(Comparator.comparing(CounselorPortalDtos.CustomerItem::totalSessions).reversed())
                .toList();

        return new CounselorPortalDtos.CustomerListResponse(customers);
    }

    // 6. Get settlements
    public CounselorPortalDtos.SettlementListResponse getSettlement(String authHeader, int page, int size) {
        CounselorEntity counselor = resolveCounselor(authHeader);
        Page<CounselorSettlementEntity> settlementPage = settlementRepository
                .findByCounselorIdOrderByCreatedAtDesc(counselor.getId(), PageRequest.of(page, size));

        List<CounselorPortalDtos.SettlementItem> items = settlementPage.getContent().stream()
                .map(s -> new CounselorPortalDtos.SettlementItem(
                        s.getId(), s.getPeriodStart(), s.getPeriodEnd(),
                        s.getTotalSessions(), s.getTotalAmount(), s.getCommissionRate(),
                        s.getNetAmount(), s.getStatus(), s.getPaidAt(), s.getCreatedAt()))
                .toList();

        return new CounselorPortalDtos.SettlementListResponse(
                items, settlementPage.getTotalPages(), settlementPage.getTotalElements());
    }

    // 7. Request settlement
    @Transactional
    public CounselorPortalDtos.SettlementRequestResponse requestSettlement(String authHeader) {
        CounselorEntity counselor = resolveCounselor(authHeader);

        LocalDate now = LocalDate.now();
        LocalDate periodStart = now.withDayOfMonth(1);
        LocalDate periodEnd = now.withDayOfMonth(now.lengthOfMonth());

        // Count completed sessions this month
        List<BookingEntity> allBookings = bookingRepository.findByCounselorIdOrderByIdDesc(counselor.getId());
        List<BookingEntity> completedThisMonth = allBookings.stream()
                .filter(b -> "COMPLETED".equals(b.getStatus()))
                .filter(b -> {
                    LocalDateTime slotStart = getFirstSlotStart(b);
                    if (slotStart == null) return false;
                    LocalDate slotDate = slotStart.toLocalDate();
                    return !slotDate.isBefore(periodStart) && !slotDate.isAfter(periodEnd);
                })
                .toList();

        int totalSessions = completedThisMonth.size();
        long totalAmount = completedThisMonth.stream().mapToLong(BookingEntity::getCreditsUsed).sum();
        BigDecimal commissionRate = new BigDecimal("20.00");
        long netAmount = totalAmount - (long) (totalAmount * commissionRate.doubleValue() / 100.0);

        CounselorSettlementEntity settlement = new CounselorSettlementEntity();
        settlement.setCounselorId(counselor.getId());
        settlement.setPeriodStart(periodStart);
        settlement.setPeriodEnd(periodEnd);
        settlement.setTotalSessions(totalSessions);
        settlement.setTotalAmount(totalAmount);
        settlement.setCommissionRate(commissionRate);
        settlement.setNetAmount(netAmount);
        settlement.setStatus("REQUESTED");

        CounselorSettlementEntity saved = settlementRepository.save(settlement);

        return new CounselorPortalDtos.SettlementRequestResponse(
                saved.getId(), saved.getStatus(), "정산 요청이 접수되었습니다.");
    }

    // 8. Get consultation records
    public CounselorPortalDtos.ConsultationRecordListResponse getRecords(String authHeader, int page, int size) {
        CounselorEntity counselor = resolveCounselor(authHeader);
        List<BookingEntity> allBookings = bookingRepository.findByCounselorIdOrderByIdDesc(counselor.getId());

        List<Long> reservationIds = allBookings.stream().map(BookingEntity::getId).toList();
        Map<Long, ConsultationSessionEntity> sessionsByReservation = new HashMap<>();
        if (!reservationIds.isEmpty()) {
            sessionRepository.findByReservationIdIn(reservationIds)
                    .forEach(s -> sessionsByReservation.put(s.getReservationId(), s));
        }

        // Only include bookings that have sessions
        List<BookingEntity> withSessions = allBookings.stream()
                .filter(b -> sessionsByReservation.containsKey(b.getId()))
                .toList();

        long totalElements = withSessions.size();
        int totalPages = (int) Math.ceil((double) totalElements / size);
        int fromIndex = Math.min(page * size, withSessions.size());
        int toIndex = Math.min(fromIndex + size, withSessions.size());
        List<BookingEntity> pageItems = withSessions.subList(fromIndex, toIndex);

        // Fetch memos for page items
        List<CounselorPortalDtos.ConsultationRecordItem> items = pageItems.stream()
                .map(b -> {
                    ConsultationSessionEntity session = sessionsByReservation.get(b.getId());
                    String memo = memoRepository.findBySessionIdAndCounselorId(session.getId(), counselor.getId())
                            .map(ConsultationMemoEntity::getContent)
                            .orElse(null);

                    return new CounselorPortalDtos.ConsultationRecordItem(
                            session.getId(), b.getId(), b.getUser().getName(),
                            session.getStartedAt(), session.getEndedAt(),
                            session.getDurationSec(), session.getEndReason(), memo);
                })
                .toList();

        return new CounselorPortalDtos.ConsultationRecordListResponse(items, totalPages, totalElements);
    }

    // 9. Save memo (upsert)
    @Transactional
    public CounselorPortalDtos.MemoResponse saveMemo(String authHeader, Long sessionId, String content) {
        CounselorEntity counselor = resolveCounselor(authHeader);

        // Verify session exists
        sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ApiException(404, "상담 세션을 찾을 수 없습니다."));

        ConsultationMemoEntity memo = memoRepository.findBySessionIdAndCounselorId(sessionId, counselor.getId())
                .orElse(null);

        if (memo == null) {
            memo = new ConsultationMemoEntity();
            memo.setSessionId(sessionId);
            memo.setCounselorId(counselor.getId());
        }
        memo.setContent(content);

        ConsultationMemoEntity saved = memoRepository.save(memo);
        return new CounselorPortalDtos.MemoResponse(
                saved.getId(), saved.getSessionId(), saved.getContent(),
                saved.getCreatedAt(), saved.getUpdatedAt());
    }

    // 9b. Get memo by sessionId
    public CounselorPortalDtos.MemoResponse getMemo(String authHeader, Long sessionId) {
        CounselorEntity counselor = resolveCounselor(authHeader);
        ConsultationMemoEntity memo = memoRepository.findBySessionIdAndCounselorId(sessionId, counselor.getId())
                .orElseThrow(() -> new ApiException(404, "메모를 찾을 수 없습니다."));
        return new CounselorPortalDtos.MemoResponse(
                memo.getId(), memo.getSessionId(), memo.getContent(),
                memo.getCreatedAt(), memo.getUpdatedAt());
    }

    // 9c. Get all memos
    public CounselorPortalDtos.MemoListResponse getMyMemos(String authHeader, int page, int size) {
        CounselorEntity counselor = resolveCounselor(authHeader);
        Page<ConsultationMemoEntity> memoPage = memoRepository
                .findByCounselorIdOrderByCreatedAtDesc(counselor.getId(), PageRequest.of(page, size));

        List<CounselorPortalDtos.MemoResponse> items = memoPage.getContent().stream()
                .map(m -> new CounselorPortalDtos.MemoResponse(
                        m.getId(), m.getSessionId(), m.getContent(),
                        m.getCreatedAt(), m.getUpdatedAt()))
                .toList();

        return new CounselorPortalDtos.MemoListResponse(
                items, memoPage.getTotalPages(), memoPage.getTotalElements());
    }

    // 9d. Delete memo
    @Transactional
    public void deleteMemo(String authHeader, Long sessionId) {
        CounselorEntity counselor = resolveCounselor(authHeader);
        ConsultationMemoEntity memo = memoRepository.findBySessionIdAndCounselorId(sessionId, counselor.getId())
                .orElseThrow(() -> new ApiException(404, "메모를 찾을 수 없습니다."));
        memoRepository.delete(memo);
    }

    // 9e. Get customer sessions
    public CounselorPortalDtos.CustomerSessionListResponse getCustomerSessions(String authHeader, Long userId) {
        CounselorEntity counselor = resolveCounselor(authHeader);
        List<BookingEntity> bookings = bookingRepository.findByCounselorIdOrderByIdDesc(counselor.getId()).stream()
                .filter(b -> b.getUser().getId().equals(userId))
                .toList();

        List<Long> reservationIds = bookings.stream().map(BookingEntity::getId).toList();
        Map<Long, ConsultationSessionEntity> sessionsByReservation = new HashMap<>();
        if (!reservationIds.isEmpty()) {
            sessionRepository.findByReservationIdIn(reservationIds)
                    .forEach(s -> sessionsByReservation.put(s.getReservationId(), s));
        }

        // Get memos for these sessions
        List<Long> sessionIds = sessionsByReservation.values().stream()
                .map(ConsultationSessionEntity::getId).toList();
        Map<Long, ConsultationMemoEntity> memosBySession = new HashMap<>();
        if (!sessionIds.isEmpty()) {
            memoRepository.findByCounselorIdAndSessionIdIn(counselor.getId(), sessionIds)
                    .forEach(m -> memosBySession.put(m.getSessionId(), m));
        }

        List<CounselorPortalDtos.CustomerSessionItem> items = bookings.stream()
                .filter(b -> sessionsByReservation.containsKey(b.getId()))
                .map(b -> {
                    ConsultationSessionEntity session = sessionsByReservation.get(b.getId());
                    ConsultationMemoEntity memo = memosBySession.get(session.getId());
                    String memoSummary = memo != null && memo.getContent() != null
                            ? memo.getContent().length() > 100
                                ? memo.getContent().substring(0, 100) + "..."
                                : memo.getContent()
                            : null;
                    return new CounselorPortalDtos.CustomerSessionItem(
                            session.getId(), b.getId(), session.getStartedAt(),
                            session.getEndedAt(), session.getDurationSec(),
                            session.getEndReason(), memoSummary);
                })
                .toList();

        return new CounselorPortalDtos.CustomerSessionListResponse(items);
    }

    // 9f. Get customer memos
    public CounselorPortalDtos.CustomerMemoListResponse getCustomerMemos(String authHeader, Long userId) {
        CounselorEntity counselor = resolveCounselor(authHeader);
        List<BookingEntity> bookings = bookingRepository.findByCounselorIdOrderByIdDesc(counselor.getId()).stream()
                .filter(b -> b.getUser().getId().equals(userId))
                .toList();

        List<Long> reservationIds = bookings.stream().map(BookingEntity::getId).toList();
        Map<Long, ConsultationSessionEntity> sessionsByReservation = new HashMap<>();
        if (!reservationIds.isEmpty()) {
            sessionRepository.findByReservationIdIn(reservationIds)
                    .forEach(s -> sessionsByReservation.put(s.getReservationId(), s));
        }

        List<Long> sessionIds = sessionsByReservation.values().stream()
                .map(ConsultationSessionEntity::getId).toList();

        List<CounselorPortalDtos.MemoResponse> memos = new ArrayList<>();
        if (!sessionIds.isEmpty()) {
            memos = memoRepository.findByCounselorIdAndSessionIdIn(counselor.getId(), sessionIds).stream()
                    .map(m -> new CounselorPortalDtos.MemoResponse(
                            m.getId(), m.getSessionId(), m.getContent(),
                            m.getCreatedAt(), m.getUpdatedAt()))
                    .toList();
        }

        return new CounselorPortalDtos.CustomerMemoListResponse(memos);
    }

    // 10. Update profile
    @Transactional
    public CounselorPortalDtos.CounselorProfileResponse updateProfile(
            String authHeader, CounselorPortalDtos.UpdateProfileRequest request) {
        CounselorEntity counselor = resolveCounselor(authHeader);

        if (request.name() != null) counselor.setName(request.name());
        if (request.specialty() != null) counselor.setSpecialty(request.specialty());
        if (request.intro() != null) counselor.setIntro(request.intro());

        CounselorEntity saved = counselorRepository.save(counselor);
        return toProfileResponse(saved);
    }

    // 11. Update schedule (replace all future slots)
    @Transactional
    public CounselorPortalDtos.ScheduleResponse updateSchedule(
            String authHeader, CounselorPortalDtos.UpdateScheduleRequest request) {
        CounselorEntity counselor = resolveCounselor(authHeader);

        // Delete future available slots
        List<SlotEntity> existingSlots = slotRepository.findByCounselorIdOrderByStartAtAsc(counselor.getId());
        LocalDateTime now = LocalDateTime.now();
        for (SlotEntity slot : existingSlots) {
            if (slot.getStartAt().isAfter(now) && slot.isAvailable()) {
                slotRepository.delete(slot);
            }
        }

        // Create new slots
        List<SlotEntity> newSlots = new ArrayList<>();
        if (request.slots() != null) {
            for (CounselorPortalDtos.SlotInput input : request.slots()) {
                SlotEntity slot = new SlotEntity();
                slot.setCounselor(counselor);
                slot.setStartAt(input.startAt());
                slot.setEndAt(input.endAt());
                slot.setAvailable(true);
                newSlots.add(slotRepository.save(slot));
            }
        }

        List<CounselorDtos.SlotItem> slotItems = newSlots.stream()
                .map(s -> new CounselorDtos.SlotItem(s.getId(), s.getStartAt(), s.getEndAt()))
                .toList();

        return new CounselorPortalDtos.ScheduleResponse(slotItems);
    }

    // 12. Get reviews
    public CounselorPortalDtos.CounselorReviewListResponse getReviews(String authHeader, int page, int size) {
        CounselorEntity counselor = resolveCounselor(authHeader);
        Page<ReviewEntity> reviewPage = reviewRepository
                .findByCounselorIdOrderByCreatedAtDesc(counselor.getId(), PageRequest.of(page, size));

        List<CounselorPortalDtos.CounselorReviewItem> items = reviewPage.getContent().stream()
                .map(r -> {
                    String customerName = userRepository.findById(r.getUserId())
                            .map(UserEntity::getName)
                            .orElse("Unknown");

                    return new CounselorPortalDtos.CounselorReviewItem(
                            r.getId(), r.getReservationId(), r.getUserId(), customerName,
                            r.getRating(), r.getComment(), r.getReply(), r.getReplyAt(), r.getCreatedAt());
                })
                .toList();

        return new CounselorPortalDtos.CounselorReviewListResponse(
                items, reviewPage.getTotalPages(), reviewPage.getTotalElements());
    }

    // 13. Reply to review
    @Transactional
    public CounselorPortalDtos.ReviewReplyResponse replyToReview(String authHeader, Long reviewId, String reply) {
        CounselorEntity counselor = resolveCounselor(authHeader);

        ReviewEntity review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ApiException(404, "리뷰를 찾을 수 없습니다."));

        if (!review.getCounselorId().equals(counselor.getId())) {
            throw new ApiException(403, "본인의 리뷰에만 답변할 수 있습니다.");
        }

        review.setReply(reply);
        review.setReplyAt(LocalDateTime.now());
        ReviewEntity saved = reviewRepository.save(review);

        return new CounselorPortalDtos.ReviewReplyResponse(saved.getId(), saved.getReply(), saved.getReplyAt());
    }

    // --- Helpers ---

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

    private CounselorEntity resolveCounselor(String authHeader) {
        UserEntity user = resolveUser(authHeader);
        return counselorRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ApiException(403, "상담사 계정이 아닙니다."));
    }

    private CounselorPortalDtos.CounselorProfileResponse toProfileResponse(CounselorEntity c) {
        return new CounselorPortalDtos.CounselorProfileResponse(
                c.getId(), c.getName(), c.getSpecialty(), c.getIntro(),
                c.getRatingAvg(), c.getReviewCount(), c.getIsActive(), c.getSupportedConsultationTypes());
    }

    private CounselorPortalDtos.CounselorBookingItem toBookingItem(BookingEntity b) {
        LocalDateTime startTime = getFirstSlotStart(b);
        LocalDateTime endTime = getLastSlotEnd(b);

        return new CounselorPortalDtos.CounselorBookingItem(
                b.getId(), b.getUser().getName(), b.getUser().getEmail(),
                startTime, endTime, b.getStatus(), b.getCreditsUsed(), b.getCreatedAt());
    }

    private LocalDateTime getFirstSlotStart(BookingEntity b) {
        if (b.getBookingSlots() != null && !b.getBookingSlots().isEmpty()) {
            return b.getBookingSlots().stream()
                    .map(bs -> bs.getSlot().getStartAt())
                    .min(LocalDateTime::compareTo)
                    .orElse(null);
        }
        if (b.getSlot() != null) {
            return b.getSlot().getStartAt();
        }
        return null;
    }

    private LocalDateTime getLastSlotEnd(BookingEntity b) {
        if (b.getBookingSlots() != null && !b.getBookingSlots().isEmpty()) {
            return b.getBookingSlots().stream()
                    .map(bs -> bs.getSlot().getEndAt())
                    .max(LocalDateTime::compareTo)
                    .orElse(null);
        }
        if (b.getSlot() != null) {
            return b.getSlot().getEndAt();
        }
        return null;
    }
}
