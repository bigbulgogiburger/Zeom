package com.cheonjiyeon.api.admin;

import com.cheonjiyeon.api.auth.AuthService;
import com.cheonjiyeon.api.auth.UserEntity;
import com.cheonjiyeon.api.auth.UserRepository;
import com.cheonjiyeon.api.audit.AuditLogService;
import com.cheonjiyeon.api.booking.BookingEntity;
import com.cheonjiyeon.api.booking.BookingRepository;
import com.cheonjiyeon.api.common.ApiException;
import com.cheonjiyeon.api.dispute.DisputeEntity;
import com.cheonjiyeon.api.dispute.DisputeRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

@Service
public class AdminDisputeService {
    private final DisputeRepository disputeRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final AuthService authService;
    private final AuditLogService auditLogService;

    public AdminDisputeService(
            DisputeRepository disputeRepository,
            BookingRepository bookingRepository,
            UserRepository userRepository,
            AuthService authService,
            AuditLogService auditLogService
    ) {
        this.disputeRepository = disputeRepository;
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.authService = authService;
        this.auditLogService = auditLogService;
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

        dispute.setStatus("RESOLVED");
        dispute.setResolutionType(resolutionType);
        dispute.setResolutionNote(note);
        dispute.setResolvedBy(admin.getId());
        dispute.setResolvedAt(LocalDateTime.now());

        auditLogService.log(admin.getId(), "ADMIN_DISPUTE_RESOLVE", "DISPUTE", id);
        return disputeRepository.save(dispute);
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
