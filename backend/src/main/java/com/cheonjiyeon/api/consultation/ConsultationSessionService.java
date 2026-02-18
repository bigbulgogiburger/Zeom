package com.cheonjiyeon.api.consultation;

import com.cheonjiyeon.api.auth.TokenStore;
import com.cheonjiyeon.api.auth.UserRepository;
import com.cheonjiyeon.api.auth.UserEntity;
import com.cheonjiyeon.api.booking.BookingEntity;
import com.cheonjiyeon.api.booking.BookingRepository;
import com.cheonjiyeon.api.booking.BookingSlotEntity;
import com.cheonjiyeon.api.common.ApiException;
import com.cheonjiyeon.api.counselor.CounselorEntity;
import com.cheonjiyeon.api.counselor.CounselorRepository;
import com.cheonjiyeon.api.sendbird.SendbirdService;
import com.cheonjiyeon.api.settlement.SettlementService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
public class ConsultationSessionService {
    private static final Logger log = LoggerFactory.getLogger(ConsultationSessionService.class);

    private final ConsultationSessionRepository sessionRepository;
    private final BookingRepository bookingRepository;
    private final SendbirdService sendbirdService;
    private final CounselorRepository counselorRepository;
    private final TokenStore tokenStore;
    private final UserRepository userRepository;
    private final SettlementService settlementService;

    public ConsultationSessionService(
            ConsultationSessionRepository sessionRepository,
            BookingRepository bookingRepository,
            SendbirdService sendbirdService,
            CounselorRepository counselorRepository,
            TokenStore tokenStore,
            UserRepository userRepository,
            SettlementService settlementService
    ) {
        this.sessionRepository = sessionRepository;
        this.bookingRepository = bookingRepository;
        this.sendbirdService = sendbirdService;
        this.counselorRepository = counselorRepository;
        this.tokenStore = tokenStore;
        this.userRepository = userRepository;
        this.settlementService = settlementService;
    }

    @Transactional
    public ConsultationSessionEntity startSession(Long reservationId) {
        // Idempotency: return existing session if already started
        Optional<ConsultationSessionEntity> existing = sessionRepository.findByReservationId(reservationId);
        if (existing.isPresent()) {
            return existing.get();
        }

        BookingEntity booking = bookingRepository.findById(reservationId)
                .orElseThrow(() -> new ApiException(404, "Reservation not found: " + reservationId));

        // Create Sendbird users with prefix
        String userSendbirdId = "user_" + booking.getUser().getId();
        String counselorSendbirdId = "counselor_" + booking.getCounselor().getId();
        sendbirdService.createUser(userSendbirdId, booking.getUser().getName());
        sendbirdService.createUser(counselorSendbirdId, booking.getCounselor().getName());

        // Create Sendbird group channel with prefixed user IDs
        String channelUrl = "consultation-" + reservationId;
        String sendbirdRoomId = sendbirdService.createGroupChannel(
                channelUrl,
                List.of(userSendbirdId, counselorSendbirdId)
        );

        ConsultationSessionEntity session = new ConsultationSessionEntity();
        session.setReservationId(reservationId);
        session.setSendbirdRoomId(sendbirdRoomId);
        session.setStartedAt(LocalDateTime.now());

        return sessionRepository.save(session);
    }

    @Transactional
    public ConsultationSessionEntity endSession(Long sessionId, String endReason) {
        ConsultationSessionEntity session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ApiException(404, "Session not found: " + sessionId));

        if (session.getEndedAt() != null) {
            throw new ApiException(400, "Session already ended");
        }

        LocalDateTime endTime = LocalDateTime.now();
        int durationSec = (int) Duration.between(session.getStartedAt(), endTime).getSeconds();

        session.setEndedAt(endTime);
        session.setEndReason(endReason);
        session.setDurationSec(durationSec);

        if (session.getSendbirdRoomId() != null) {
            sendbirdService.deleteChannel(session.getSendbirdRoomId());
        }

        ConsultationSessionEntity saved = sessionRepository.save(session);

        // Settle credits (failure must not roll back session end)
        try {
            settlementService.settleSession(saved);
        } catch (Exception e) {
            log.error("정산 실패 (sessionId={}): {}", saved.getId(), e.getMessage(), e);
        }

        return saved;
    }

    public ConsultationSessionEntity getSessionByReservationId(Long reservationId) {
        return sessionRepository.findByReservationId(reservationId)
                .orElseThrow(() -> new ApiException(404, "Session not found for reservation: " + reservationId));
    }

    public ConsultationSessionDtos.SessionTokenResponse getSessionToken(Long reservationId) {
        ConsultationSessionEntity session = getSessionByReservationId(reservationId);

        BookingEntity booking = bookingRepository.findById(reservationId)
                .orElseThrow(() -> new ApiException(404, "Reservation not found: " + reservationId));

        String userSendbirdId = "user_" + booking.getUser().getId();
        String counselorSendbirdId = "counselor_" + booking.getCounselor().getId();

        String sendbirdToken = sendbirdService.issueSessionToken(userSendbirdId);
        String sendbirdAppId = sendbirdService.getAppId();

        Integer durationMinutes = calculateDurationMinutes(booking);

        return new ConsultationSessionDtos.SessionTokenResponse(
                sendbirdToken,          // token (legacy)
                sendbirdToken,          // sendbirdToken
                userSendbirdId,         // sendbirdUserId
                sendbirdAppId,          // sendbirdAppId
                counselorSendbirdId,    // calleeId (상담사)
                session.getSendbirdRoomId(), // channelUrl
                booking.getCounselor().getName(), // calleeName
                durationMinutes         // durationMinutes
        );
    }

    public ConsultationSessionDtos.SessionTokenResponse getCounselorToken(Long reservationId, String authHeader) {
        UserEntity currentUser = resolveUser(authHeader);

        ConsultationSessionEntity session = getSessionByReservationId(reservationId);

        BookingEntity booking = bookingRepository.findById(reservationId)
                .orElseThrow(() -> new ApiException(404, "Reservation not found: " + reservationId));

        CounselorEntity counselor = booking.getCounselor();

        // Verify the current user is the counselor for this booking
        if (counselor.getUserId() == null || !counselor.getUserId().equals(currentUser.getId())) {
            throw new ApiException(403, "이 예약의 상담사가 아닙니다.");
        }

        String userSendbirdId = "user_" + booking.getUser().getId();
        String counselorSendbirdId = "counselor_" + counselor.getId();

        String sendbirdToken = sendbirdService.issueSessionToken(counselorSendbirdId);
        String sendbirdAppId = sendbirdService.getAppId();

        Integer durationMinutes = calculateDurationMinutes(booking);

        return new ConsultationSessionDtos.SessionTokenResponse(
                sendbirdToken,          // token (legacy)
                sendbirdToken,          // sendbirdToken
                counselorSendbirdId,    // sendbirdUserId
                sendbirdAppId,          // sendbirdAppId
                userSendbirdId,         // calleeId (고객)
                session.getSendbirdRoomId(), // channelUrl
                booking.getUser().getName(), // calleeName (고객 이름)
                durationMinutes         // durationMinutes
        );
    }

    public List<BookingEntity> getCounselorTodayBookings(String authHeader) {
        UserEntity currentUser = resolveUser(authHeader);

        CounselorEntity counselor = counselorRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new ApiException(403, "상담사 계정이 아닙니다."));

        LocalDate today = LocalDate.now();

        return bookingRepository.findByCounselorIdOrderByIdDesc(counselor.getId()).stream()
                .filter(b -> {
                    // Filter bookings that have slots today
                    if (b.getBookingSlots() != null && !b.getBookingSlots().isEmpty()) {
                        return b.getBookingSlots().stream()
                                .anyMatch(bs -> bs.getSlot().getStartAt().toLocalDate().equals(today));
                    }
                    if (b.getSlot() != null) {
                        return b.getSlot().getStartAt().toLocalDate().equals(today);
                    }
                    return false;
                })
                .toList();
    }

    public ConsultationSessionDtos.CounselorAuthResponse getCounselorAuth(String authHeader) {
        UserEntity currentUser = resolveUser(authHeader);

        CounselorEntity counselor = counselorRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new ApiException(403, "상담사 계정이 아닙니다."));

        String counselorSendbirdId = "counselor_" + counselor.getId();
        sendbirdService.createUser(counselorSendbirdId, counselor.getName());
        String sendbirdToken = sendbirdService.issueSessionToken(counselorSendbirdId);
        String sendbirdAppId = sendbirdService.getAppId();

        return new ConsultationSessionDtos.CounselorAuthResponse(sendbirdToken, counselorSendbirdId, sendbirdAppId);
    }

    private Integer calculateDurationMinutes(BookingEntity booking) {
        if (booking.getBookingSlots() != null && !booking.getBookingSlots().isEmpty()) {
            List<BookingSlotEntity> sorted = booking.getBookingSlots().stream()
                    .sorted(Comparator.comparing(bs -> bs.getSlot().getStartAt()))
                    .toList();
            LocalDateTime start = sorted.getFirst().getSlot().getStartAt();
            LocalDateTime end = sorted.getLast().getSlot().getEndAt();
            return (int) ChronoUnit.MINUTES.between(start, end);
        }
        if (booking.getSlot() != null) {
            return (int) ChronoUnit.MINUTES.between(
                    booking.getSlot().getStartAt(),
                    booking.getSlot().getEndAt()
            );
        }
        return 30; // default
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
