package com.cheonjiyeon.api.admin;

import com.cheonjiyeon.api.auth.AuthService;
import com.cheonjiyeon.api.auth.UserEntity;
import com.cheonjiyeon.api.auth.UserRepository;
import com.cheonjiyeon.api.refund.RefundEntity;
import com.cheonjiyeon.api.refund.RefundRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/refunds")
public class AdminRefundPageController {
    private final RefundRepository refundRepository;
    private final UserRepository userRepository;
    private final AuthService authService;

    public AdminRefundPageController(
            RefundRepository refundRepository,
            UserRepository userRepository,
            AuthService authService
    ) {
        this.refundRepository = refundRepository;
        this.userRepository = userRepository;
        this.authService = authService;
    }

    @GetMapping
    public Map<String, Object> listRefunds(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        authService.requireAdmin(authHeader);

        Page<RefundEntity> refundPage;
        if (status != null && !status.isBlank()) {
            refundPage = refundRepository.findByStatusOrderByCreatedAtDesc(status, PageRequest.of(page, size));
        } else {
            refundPage = refundRepository.findAll(PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        }

        return Map.of(
                "content", refundPage.getContent().stream().map(r -> {
                    UserEntity user = userRepository.findById(r.getUserId()).orElse(null);
                    return Map.of(
                            "id", r.getId(),
                            "reservationId", r.getReservationId(),
                            "userId", r.getUserId(),
                            "customerName", user != null ? user.getName() : "Unknown",
                            "amount", r.getAmount(),
                            "reason", r.getReason() != null ? r.getReason() : "",
                            "status", r.getStatus(),
                            "adminNote", r.getAdminNote() != null ? r.getAdminNote() : "",
                            "createdAt", r.getCreatedAt().toString()
                    );
                }).toList(),
                "totalPages", refundPage.getTotalPages(),
                "totalElements", refundPage.getTotalElements(),
                "page", refundPage.getNumber()
        );
    }
}
