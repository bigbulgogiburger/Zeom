package com.cheonjiyeon.api.booking;

import com.cheonjiyeon.api.audit.AuditLogService;
import com.cheonjiyeon.api.auth.TokenStore;
import com.cheonjiyeon.api.auth.UserEntity;
import com.cheonjiyeon.api.auth.UserRepository;
import com.cheonjiyeon.api.common.ApiException;
import com.cheonjiyeon.api.counselor.CounselorEntity;
import com.cheonjiyeon.api.counselor.CounselorRepository;
import com.cheonjiyeon.api.counselor.SlotEntity;
import com.cheonjiyeon.api.counselor.SlotRepository;
import com.cheonjiyeon.api.credit.CreditRepository;
import com.cheonjiyeon.api.credit.CreditService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class BookingService {
    private final BookingRepository bookingRepository;
    private final BookingSlotRepository bookingSlotRepository;
    private final UserRepository userRepository;
    private final CounselorRepository counselorRepository;
    private final SlotRepository slotRepository;
    private final TokenStore tokenStore;
    private final AuditLogService auditLogService;
    private final CreditService creditService;
    private final CreditRepository creditRepository;

    public BookingService(BookingRepository bookingRepository,
                          BookingSlotRepository bookingSlotRepository,
                          UserRepository userRepository,
                          CounselorRepository counselorRepository,
                          SlotRepository slotRepository,
                          TokenStore tokenStore,
                          AuditLogService auditLogService,
                          CreditService creditService,
                          CreditRepository creditRepository) {
        this.bookingRepository = bookingRepository;
        this.bookingSlotRepository = bookingSlotRepository;
        this.userRepository = userRepository;
        this.counselorRepository = counselorRepository;
        this.slotRepository = slotRepository;
        this.tokenStore = tokenStore;
        this.auditLogService = auditLogService;
        this.creditService = creditService;
        this.creditRepository = creditRepository;
    }

    @Transactional
    public BookingDtos.BookingResponse create(String authHeader, BookingDtos.CreateBookingRequest req) {
        UserEntity user = resolveUser(authHeader);
        CounselorEntity counselor = counselorRepository.findById(req.counselorId())
                .orElseThrow(() -> new ApiException(404, "상담사를 찾을 수 없습니다."));

        List<Long> resolvedSlotIds = resolveSlotIds(req);

        if (resolvedSlotIds.isEmpty()) {
            throw new ApiException(400, "최소 1개의 슬롯을 선택해야 합니다.");
        }
        if (resolvedSlotIds.size() > 3) {
            throw new ApiException(400, "최대 3개의 슬롯까지 예약할 수 있습니다.");
        }

        // Lock all slots with pessimistic write lock (ordered by ID to prevent deadlock)
        List<Long> sortedIds = resolvedSlotIds.stream().sorted().toList();
        List<SlotEntity> slots = slotRepository.findByIdsForUpdate(sortedIds);

        if (slots.size() != resolvedSlotIds.size()) {
            throw new ApiException(404, "슬롯을 찾을 수 없습니다.");
        }

        // Validate all slots belong to the same counselor
        for (SlotEntity slot : slots) {
            if (!slot.getCounselor().getId().equals(counselor.getId())) {
                throw new ApiException(400, "상담사와 슬롯 정보가 일치하지 않습니다.");
            }
            if (!slot.isAvailable()) {
                throw new ApiException(409, "이미 예약된 슬롯입니다.");
            }
        }

        // Mark all slots as unavailable
        for (SlotEntity slot : slots) {
            slot.setAvailable(false);
            slotRepository.save(slot);
        }

        // Sort slots by startAt for response
        List<SlotEntity> sortedByTime = slots.stream()
                .sorted(Comparator.comparing(SlotEntity::getStartAt))
                .toList();

        int creditsNeeded = resolvedSlotIds.size();
        boolean useCredits = creditRepository.sumTotalUnitsByUserId(user.getId()) > 0;

        // Validate consultation type
        String consultationType = req.consultationType() != null ? req.consultationType() : "VIDEO";
        if (!"VIDEO".equals(consultationType) && !"CHAT".equals(consultationType)) {
            throw new ApiException(400, "상담 유형은 VIDEO 또는 CHAT만 가능합니다.");
        }
        if ("CHAT".equals(consultationType)) {
            String supportedTypes = counselor.getSupportedConsultationTypes();
            if (supportedTypes == null || !supportedTypes.contains("CHAT")) {
                throw new ApiException(400, "이 상담사는 채팅 상담을 지원하지 않습니다.");
            }
        }

        BookingEntity booking = new BookingEntity();
        booking.setUser(user);
        booking.setCounselor(counselor);
        // Set legacy slot field to first slot for backward compatibility
        booking.setSlot(sortedByTime.get(0));
        booking.setStatus("BOOKED");
        booking.setCreditsUsed(useCredits ? creditsNeeded : 0);
        booking.setConsultationType(consultationType);

        try {
            BookingEntity saved = bookingRepository.save(booking);

            // Reserve credits if user has credit balance
            if (useCredits) {
                creditService.reserveCredits(user.getId(), saved.getId(), creditsNeeded);
            }

            // Create booking_slots join entries
            for (SlotEntity slot : sortedByTime) {
                BookingSlotEntity bs = new BookingSlotEntity(saved, slot);
                bookingSlotRepository.save(bs);
                saved.getBookingSlots().add(bs);
            }

            auditLogService.log(user.getId(), "BOOKING_CREATED", "BOOKING", saved.getId());
            return toResponse(saved);
        } catch (DataIntegrityViolationException ex) {
            throw new ApiException(409, "이미 예약된 슬롯입니다.");
        }
    }

    @Transactional(readOnly = true)
    public List<BookingDtos.BookingResponse> mine(String authHeader) {
        UserEntity user = resolveUser(authHeader);
        return bookingRepository.findByUserIdOrderByIdDesc(user.getId()).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public BookingDtos.BookingResponse cancel(String authHeader, Long bookingId, String reason) {
        UserEntity user = resolveUser(authHeader);
        BookingEntity booking = bookingRepository.findByIdAndUserId(bookingId, user.getId())
                .orElseThrow(() -> new ApiException(404, "예약을 찾을 수 없습니다."));

        if ("CANCELED".equals(booking.getStatus())) {
            throw new ApiException(409, "이미 취소된 예약입니다.");
        }

        if ("PAID".equals(booking.getStatus())) {
            throw new ApiException(400, "결제 완료된 예약은 환불 요청을 이용해주세요.");
        }

        // Determine earliest slot start time
        LocalDateTime earliestStart = getEarliestSlotStart(booking);

        // Apply cancellation policy based on time until earliest slot
        String cancelType;
        int refundedCredits = 0;
        int originalCredits = booking.getCreditsUsed();

        if (earliestStart != null) {
            long hoursUntilStart = Duration.between(LocalDateTime.now(), earliestStart).toHours();

            if (hoursUntilStart < 1) {
                throw new ApiException(400, "상담 시작 1시간 전까지만 취소 가능합니다.");
            } else if (hoursUntilStart >= 24) {
                cancelType = "FREE_CANCEL";
                refundedCredits = originalCredits;
            } else {
                cancelType = "PARTIAL_CANCEL";
                refundedCredits = originalCredits / 2;
            }
        } else {
            // No slot time info — default to free cancel
            cancelType = "FREE_CANCEL";
            refundedCredits = originalCredits;
        }

        booking.setStatus("CANCELED");

        if (reason != null && !reason.isBlank()) {
            booking.setCancelReason(reason);
        }

        // Handle credit refund based on policy
        if (originalCredits > 0) {
            // Release all reserved credits first
            creditService.releaseCredits(booking.getId());

            if ("PARTIAL_CANCEL".equals(cancelType)) {
                // Re-reserve the penalty portion (credits NOT refunded)
                int penaltyCredits = originalCredits - refundedCredits;
                if (penaltyCredits > 0) {
                    creditService.reserveCredits(user.getId(), booking.getId(), penaltyCredits);
                }
            }

            booking.setCreditsUsed(originalCredits - refundedCredits);
        }

        // Release all associated slots
        List<BookingSlotEntity> bookingSlots = booking.getBookingSlots();
        if (bookingSlots != null && !bookingSlots.isEmpty()) {
            for (BookingSlotEntity bs : bookingSlots) {
                bs.getSlot().setAvailable(true);
                slotRepository.save(bs.getSlot());
            }
        } else if (booking.getSlot() != null) {
            // Fallback for legacy bookings without booking_slots entries
            booking.getSlot().setAvailable(true);
            slotRepository.save(booking.getSlot());
        }

        BookingEntity saved = bookingRepository.save(booking);
        auditLogService.log(user.getId(), "BOOKING_CANCELED", "BOOKING", saved.getId());
        return toResponse(saved, cancelType, refundedCredits);
    }

    private LocalDateTime getEarliestSlotStart(BookingEntity booking) {
        List<BookingSlotEntity> bookingSlots = booking.getBookingSlots();
        if (bookingSlots != null && !bookingSlots.isEmpty()) {
            return bookingSlots.stream()
                    .map(bs -> bs.getSlot().getStartAt())
                    .min(Comparator.naturalOrder())
                    .orElse(null);
        } else if (booking.getSlot() != null) {
            return booking.getSlot().getStartAt();
        }
        return null;
    }

    @Transactional
    public BookingDtos.RetryPaymentResponse retryPayment(String authHeader, Long bookingId) {
        UserEntity user = resolveUser(authHeader);
        BookingEntity booking = bookingRepository.findByIdAndUserId(bookingId, user.getId())
                .orElseThrow(() -> new ApiException(404, "예약을 찾을 수 없습니다."));

        if (!"PAYMENT_FAILED".equals(booking.getStatus())) {
            throw new ApiException(400, "결제 실패 상태의 예약만 재시도할 수 있습니다.");
        }

        if (booking.getPaymentRetryCount() >= 3) {
            throw new ApiException(400, "결제 재시도 횟수를 초과했습니다. 고객센터에 문의해주세요.");
        }

        booking.setPaymentRetryCount(booking.getPaymentRetryCount() + 1);
        booking.setStatus("BOOKED");
        BookingEntity saved = bookingRepository.save(booking);

        auditLogService.log(user.getId(), "BOOKING_PAYMENT_RETRY", "BOOKING", saved.getId());

        return new BookingDtos.RetryPaymentResponse(
                saved.getId(),
                saved.getStatus(),
                saved.getPaymentRetryCount(),
                "결제를 다시 시도할 수 있습니다."
        );
    }

    @Transactional
    public BookingDtos.BookingResponse reschedule(String authHeader, Long bookingId, BookingDtos.RescheduleRequest req) {
        UserEntity user = resolveUser(authHeader);
        BookingEntity booking = bookingRepository.findByIdAndUserId(bookingId, user.getId())
                .orElseThrow(() -> new ApiException(404, "예약을 찾을 수 없습니다."));

        if (!"BOOKED".equals(booking.getStatus())) {
            throw new ApiException(400, "예약 상태가 BOOKED일 때만 변경할 수 있습니다.");
        }

        // Check 24-hour restriction: earliest slot must be at least 24h in the future
        List<BookingSlotEntity> currentBookingSlots = booking.getBookingSlots();
        if (currentBookingSlots != null && !currentBookingSlots.isEmpty()) {
            LocalDateTime earliestStart = currentBookingSlots.stream()
                    .map(bs -> bs.getSlot().getStartAt())
                    .min(Comparator.naturalOrder())
                    .orElseThrow();
            if (earliestStart.isBefore(LocalDateTime.now().plusHours(24))) {
                throw new ApiException(400, "상담 시작 24시간 전까지만 변경할 수 있습니다.");
            }
        } else if (booking.getSlot() != null) {
            if (booking.getSlot().getStartAt().isBefore(LocalDateTime.now().plusHours(24))) {
                throw new ApiException(400, "상담 시작 24시간 전까지만 변경할 수 있습니다.");
            }
        }

        List<Long> newSlotIds = req.newSlotIds();
        if (newSlotIds == null || newSlotIds.isEmpty()) {
            throw new ApiException(400, "최소 1개의 새 슬롯을 선택해야 합니다.");
        }
        if (newSlotIds.size() > 3) {
            throw new ApiException(400, "최대 3개의 슬롯까지 예약할 수 있습니다.");
        }

        // Release old slots
        if (currentBookingSlots != null && !currentBookingSlots.isEmpty()) {
            for (BookingSlotEntity bs : currentBookingSlots) {
                bs.getSlot().setAvailable(true);
                slotRepository.save(bs.getSlot());
            }
            currentBookingSlots.clear();
        } else if (booking.getSlot() != null) {
            booking.getSlot().setAvailable(true);
            slotRepository.save(booking.getSlot());
        }

        // Lock and acquire new slots
        List<Long> sortedIds = newSlotIds.stream().sorted().toList();
        List<SlotEntity> newSlots = slotRepository.findByIdsForUpdate(sortedIds);

        if (newSlots.size() != newSlotIds.size()) {
            throw new ApiException(404, "슬롯을 찾을 수 없습니다.");
        }

        CounselorEntity counselor = booking.getCounselor();
        for (SlotEntity slot : newSlots) {
            if (!slot.getCounselor().getId().equals(counselor.getId())) {
                throw new ApiException(400, "상담사와 슬롯 정보가 일치하지 않습니다.");
            }
            if (!slot.isAvailable()) {
                throw new ApiException(409, "이미 예약된 슬롯입니다.");
            }
        }

        // Mark new slots as unavailable
        for (SlotEntity slot : newSlots) {
            slot.setAvailable(false);
            slotRepository.save(slot);
        }

        // Sort by time
        List<SlotEntity> sortedByTime = newSlots.stream()
                .sorted(Comparator.comparing(SlotEntity::getStartAt))
                .toList();

        // Update booking slot reference
        booking.setSlot(sortedByTime.get(0));

        // Create new booking_slots join entries
        for (SlotEntity slot : sortedByTime) {
            BookingSlotEntity bs = new BookingSlotEntity(booking, slot);
            bookingSlotRepository.save(bs);
            booking.getBookingSlots().add(bs);
        }

        BookingEntity saved = bookingRepository.save(booking);
        auditLogService.log(user.getId(), "BOOKING_RESCHEDULED", "BOOKING", saved.getId());
        return toResponse(saved);
    }

    private List<Long> resolveSlotIds(BookingDtos.CreateBookingRequest req) {
        if (req.slotIds() != null && !req.slotIds().isEmpty()) {
            return req.slotIds();
        }
        if (req.slotId() != null) {
            return List.of(req.slotId());
        }
        return List.of();
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

    private BookingDtos.BookingResponse toResponse(BookingEntity booking) {
        return toResponse(booking, null, null);
    }

    private BookingDtos.BookingResponse toResponse(BookingEntity booking, String cancelType, Integer refundedCredits) {
        List<BookingSlotEntity> bookingSlots = booking.getBookingSlots();
        List<BookingDtos.SlotInfo> slotInfos = new ArrayList<>();

        if (bookingSlots != null && !bookingSlots.isEmpty()) {
            slotInfos = bookingSlots.stream()
                    .sorted(Comparator.comparing(bs -> bs.getSlot().getStartAt()))
                    .map(bs -> new BookingDtos.SlotInfo(
                            bs.getSlot().getId(),
                            bs.getSlot().getStartAt(),
                            bs.getSlot().getEndAt()))
                    .toList();
        } else if (booking.getSlot() != null) {
            // Fallback for legacy bookings
            slotInfos = List.of(new BookingDtos.SlotInfo(
                    booking.getSlot().getId(),
                    booking.getSlot().getStartAt(),
                    booking.getSlot().getEndAt()));
        }

        // slotId/startAt/endAt: first slot for backward compat
        Long slotId = slotInfos.isEmpty() ? null : slotInfos.get(0).slotId();
        var startAt = slotInfos.isEmpty() ? null : slotInfos.get(0).startAt();
        var endAt = slotInfos.isEmpty() ? null : slotInfos.get(slotInfos.size() - 1).endAt();

        return new BookingDtos.BookingResponse(
                booking.getId(),
                booking.getCounselor().getId(),
                booking.getCounselor().getName(),
                slotId,
                startAt,
                endAt,
                booking.getStatus(),
                slotInfos,
                booking.getCreditsUsed(),
                booking.getCancelReason(),
                booking.getPaymentRetryCount(),
                booking.getConsultationType(),
                cancelType,
                refundedCredits
        );
    }
}
