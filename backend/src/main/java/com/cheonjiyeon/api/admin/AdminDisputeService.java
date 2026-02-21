package com.cheonjiyeon.api.admin;

import com.cheonjiyeon.api.auth.AuthService;
import com.cheonjiyeon.api.auth.UserEntity;
import com.cheonjiyeon.api.auth.UserRepository;
import com.cheonjiyeon.api.audit.AuditLogService;
import com.cheonjiyeon.api.booking.BookingEntity;
import com.cheonjiyeon.api.booking.BookingRepository;
import com.cheonjiyeon.api.common.ApiException;
import com.cheonjiyeon.api.credit.CreditEntity;
import com.cheonjiyeon.api.credit.CreditRepository;
import com.cheonjiyeon.api.dispute.DisputeEntity;
import com.cheonjiyeon.api.dispute.DisputeRepository;
import com.cheonjiyeon.api.refund.RefundEntity;
import com.cheonjiyeon.api.refund.RefundRepository;
import com.cheonjiyeon.api.payment.PaymentEntity;
import com.cheonjiyeon.api.payment.PaymentRepository;
import com.cheonjiyeon.api.wallet.WalletService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;

@Service
public class AdminDisputeService {
    private static final Logger log = LoggerFactory.getLogger(AdminDisputeService.class);
    private static final Set<String> VALID_RESOLUTION_TYPES = Set.of("REFUND", "CREDIT", "WARNING", "DISMISS");

    private final DisputeRepository disputeRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final AuthService authService;
    private final AuditLogService auditLogService;
    private final RefundRepository refundRepository;
    private final PaymentRepository paymentRepository;
    private final WalletService walletService;
    private final CreditRepository creditRepository;

    public AdminDisputeService(
            DisputeRepository disputeRepository,
            BookingRepository bookingRepository,
            UserRepository userRepository,
            AuthService authService,
            AuditLogService auditLogService,
            RefundRepository refundRepository,
            PaymentRepository paymentRepository,
            WalletService walletService,
            CreditRepository creditRepository
    ) {
        this.disputeRepository = disputeRepository;
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.authService = authService;
        this.auditLogService = auditLogService;
        this.refundRepository = refundRepository;
        this.paymentRepository = paymentRepository;
        this.walletService = walletService;
        this.creditRepository = creditRepository;
    }

    public Page<DisputeEntity> listDisputes(String authHeader, String status, int page, int size) {
        authService.requireAdmin(authHeader);
        if (status != null && !status.isBlank()) {
            return disputeRepository.findByStatusOrderByCreatedAtDesc(status, PageRequest.of(page, size));
        }
        return disputeRepository.findAll(PageRequest.of(page, size));
    }

    public Map<String, Object> getDisputeDetail(String authHeader, Long id) {
        authService.requireAdmin(authHeader);

        DisputeEntity dispute = disputeRepository.findById(id)
                .orElseThrow(() -> new ApiException(404, "분쟁을 찾을 수 없습니다."));

        UserEntity user = userRepository.findById(dispute.getUserId()).orElse(null);
        BookingEntity booking = bookingRepository.findById(dispute.getReservationId()).orElse(null);

        return Map.of(
                "dispute", toDisputeMap(dispute),
                "customer", user != null ? Map.of(
                        "id", user.getId(),
                        "name", user.getName(),
                        "email", user.getEmail()
                ) : Map.of(),
                "booking", booking != null ? Map.of(
                        "id", booking.getId(),
                        "status", booking.getStatus(),
                        "creditsUsed", booking.getCreditsUsed(),
                        "createdAt", booking.getCreatedAt().toString()
                ) : Map.of()
        );
    }

    @Transactional
    public DisputeEntity reviewDispute(String authHeader, Long id) {
        UserEntity admin = authService.requireAdmin(authHeader);

        DisputeEntity dispute = disputeRepository.findById(id)
                .orElseThrow(() -> new ApiException(404, "분쟁을 찾을 수 없습니다."));

        if (!"OPEN".equals(dispute.getStatus())) {
            throw new ApiException(400, "OPEN 상태의 분쟁만 검토할 수 있습니다.");
        }

        dispute.setStatus("IN_REVIEW");
        auditLogService.log(admin.getId(), "ADMIN_DISPUTE_REVIEW", "DISPUTE", id);
        return disputeRepository.save(dispute);
    }

    @Transactional
    public DisputeEntity resolveDispute(String authHeader, Long id, String resolutionType, String note) {
        UserEntity admin = authService.requireAdmin(authHeader);

        DisputeEntity dispute = disputeRepository.findById(id)
                .orElseThrow(() -> new ApiException(404, "분쟁을 찾을 수 없습니다."));

        if (!"IN_REVIEW".equals(dispute.getStatus())) {
            throw new ApiException(400, "검토 중인 분쟁만 해결할 수 있습니다.");
        }

        if (resolutionType == null || resolutionType.isBlank()) {
            throw new ApiException(400, "중재 유형을 선택해주세요.");
        }

        if (!VALID_RESOLUTION_TYPES.contains(resolutionType)) {
            throw new ApiException(400, "유효하지 않은 중재 유형입니다. (REFUND, CREDIT, WARNING, DISMISS 중 선택)");
        }

        dispute.setStatus("RESOLVED");
        dispute.setResolutionType(resolutionType);
        dispute.setResolutionNote(note);
        dispute.setResolvedBy(admin.getId());
        dispute.setResolvedAt(LocalDateTime.now());

        executeResolution(dispute, resolutionType, admin);

        auditLogService.log(admin.getId(), "ADMIN_DISPUTE_RESOLVE", "DISPUTE", id);
        return disputeRepository.save(dispute);
    }

    private void executeResolution(DisputeEntity dispute, String resolutionType, UserEntity admin) {
        switch (resolutionType) {
            case "REFUND" -> executeRefund(dispute, admin);
            case "CREDIT" -> executeCredit(dispute, admin);
            case "WARNING" -> executeWarning(dispute, admin);
            case "DISMISS" -> log.info("분쟁 기각 처리: disputeId={}", dispute.getId());
        }
    }

    private void executeRefund(DisputeEntity dispute, UserEntity admin) {
        PaymentEntity payment = paymentRepository.findByBookingId(dispute.getReservationId()).orElse(null);
        if (payment == null || !"PAID".equals(payment.getStatus())) {
            log.warn("분쟁 환불 처리 불가 - 결제 정보 없음 또는 미결제: disputeId={}, reservationId={}",
                    dispute.getId(), dispute.getReservationId());
            return;
        }

        // Check for existing refund
        if (refundRepository.findByReservationIdAndStatus(dispute.getReservationId(), "APPROVED").isPresent()) {
            log.info("이미 환불 승인된 예약: reservationId={}", dispute.getReservationId());
            return;
        }

        // Create and auto-approve refund
        RefundEntity refund = new RefundEntity();
        refund.setReservationId(dispute.getReservationId());
        refund.setPaymentId(payment.getId());
        refund.setUserId(dispute.getUserId());
        refund.setAmount(payment.getAmount());
        refund.setReason("분쟁 판정에 의한 자동 환불 (분쟁 ID: " + dispute.getId() + ")");
        refund.setStatus("APPROVED");
        refund.setAdminNote("분쟁 해결 자동 처리");
        refund.setProcessedAt(LocalDateTime.now());
        refundRepository.save(refund);

        // Credit wallet
        walletService.refund(dispute.getUserId(), payment.getAmount(), "DISPUTE_REFUND", dispute.getId());
        log.info("분쟁 환불 처리 완료: disputeId={}, amount={}", dispute.getId(), payment.getAmount());
    }

    private void executeCredit(DisputeEntity dispute, UserEntity admin) {
        // Grant 1 bonus credit (1 unit = 30 minutes)
        CreditEntity credit = new CreditEntity();
        credit.setUserId(dispute.getUserId());
        credit.setTotalUnits(1);
        credit.setRemainingUnits(1);
        credit.setProductId(null);
        credit.setPurchasedAt(LocalDateTime.now());
        creditRepository.save(credit);

        auditLogService.log(admin.getId(), "DISPUTE_BONUS_CREDIT", "DISPUTE", dispute.getId());
        log.info("분쟁 보상 크레딧 지급 완료: disputeId={}, userId={}, units=1", dispute.getId(), dispute.getUserId());
    }

    private void executeWarning(DisputeEntity dispute, UserEntity admin) {
        auditLogService.log(admin.getId(), "COUNSELOR_WARNING", "DISPUTE", dispute.getId());
        log.info("상담사 경고 기록 완료: disputeId={}, reservationId={}", dispute.getId(), dispute.getReservationId());
    }

    private Map<String, Object> toDisputeMap(DisputeEntity d) {
        return Map.ofEntries(
                Map.entry("id", d.getId()),
                Map.entry("reservationId", d.getReservationId()),
                Map.entry("userId", d.getUserId()),
                Map.entry("category", d.getCategory()),
                Map.entry("description", d.getDescription() != null ? d.getDescription() : ""),
                Map.entry("status", d.getStatus()),
                Map.entry("resolutionType", d.getResolutionType() != null ? d.getResolutionType() : ""),
                Map.entry("resolutionNote", d.getResolutionNote() != null ? d.getResolutionNote() : ""),
                Map.entry("resolvedBy", d.getResolvedBy() != null ? d.getResolvedBy() : 0L),
                Map.entry("resolvedAt", d.getResolvedAt() != null ? d.getResolvedAt().toString() : ""),
                Map.entry("createdAt", d.getCreatedAt().toString()),
                Map.entry("updatedAt", d.getUpdatedAt().toString())
        );
    }
}
