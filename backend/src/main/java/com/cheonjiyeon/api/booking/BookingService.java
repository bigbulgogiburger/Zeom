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

        BookingEntity booking = new BookingEntity();
        booking.setUser(user);
        booking.setCounselor(counselor);
        // Set legacy slot field to first slot for backward compatibility
        booking.setSlot(sortedByTime.get(0));
        booking.setStatus("BOOKED");
        booking.setCreditsUsed(useCredits ? creditsNeeded : 0);

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
    public BookingDtos.BookingResponse cancel(String authHeader, Long bookingId) {
        UserEntity user = resolveUser(authHeader);
        BookingEntity booking = bookingRepository.findByIdAndUserId(bookingId, user.getId())
                .orElseThrow(() -> new ApiException(404, "예약을 찾을 수 없습니다."));

        if ("CANCELED".equals(booking.getStatus())) {
            throw new ApiException(409, "이미 취소된 예약입니다.");
        }

        booking.setStatus("CANCELED");

        // Release reserved credits
        if (booking.getCreditsUsed() > 0) {
            creditService.releaseCredits(booking.getId());
            booking.setCreditsUsed(0);
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
                booking.getCreditsUsed()
        );
    }
}
