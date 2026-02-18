package com.cheonjiyeon.api.refund;

import com.cheonjiyeon.api.auth.AuthService;
import com.cheonjiyeon.api.auth.TokenStore;
import com.cheonjiyeon.api.auth.UserEntity;
import com.cheonjiyeon.api.auth.UserRepository;
import com.cheonjiyeon.api.booking.BookingRepository;
import com.cheonjiyeon.api.common.ApiException;
import com.cheonjiyeon.api.payment.PaymentEntity;
import com.cheonjiyeon.api.payment.PaymentRepository;
import com.cheonjiyeon.api.wallet.WalletService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class RefundService {
    private final RefundRepository refundRepository;
    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final WalletService walletService;
    private final AuthService authService;
    private final TokenStore tokenStore;
    private final UserRepository userRepository;

    public RefundService(
            RefundRepository refundRepository,
            BookingRepository bookingRepository,
            PaymentRepository paymentRepository,
            WalletService walletService,
            AuthService authService,
            TokenStore tokenStore,
            UserRepository userRepository
    ) {
        this.refundRepository = refundRepository;
        this.bookingRepository = bookingRepository;
        this.paymentRepository = paymentRepository;
        this.walletService = walletService;
        this.authService = authService;
        this.tokenStore = tokenStore;
        this.userRepository = userRepository;
    }

    @Transactional
    public RefundEntity requestRefund(String authHeader, RefundDtos.CreateRefundRequest req) {
        UserEntity user = resolveUser(authHeader);

        // Validate booking exists
        bookingRepository.findById(req.reservationId())
                .orElseThrow(() -> new ApiException(404, "Reservation not found"));

        // Find the payment for this booking
        PaymentEntity payment = paymentRepository.findByBookingId(req.reservationId())
                .orElseThrow(() -> new ApiException(404, "Payment not found for this reservation"));

        if (!"PAID".equals(payment.getStatus())) {
            throw new ApiException(400, "Only paid payments can be refunded");
        }

        // Check for duplicate refund request
        if (refundRepository.findByReservationIdAndStatus(req.reservationId(), "REQUESTED").isPresent()) {
            throw new ApiException(409, "Refund already requested for this reservation");
        }

        RefundEntity refund = new RefundEntity();
        refund.setReservationId(req.reservationId());
        refund.setPaymentId(payment.getId());
        refund.setUserId(user.getId());
        refund.setAmount(payment.getAmount());
        refund.setReason(req.reason());
        refund.setStatus("REQUESTED");

        return refundRepository.save(refund);
    }

    @Transactional
    public RefundEntity approveRefund(String authHeader, Long refundId, String adminNote) {
        authService.requireAdmin(authHeader);

        RefundEntity refund = refundRepository.findById(refundId)
                .orElseThrow(() -> new ApiException(404, "Refund not found"));

        if (!"REQUESTED".equals(refund.getStatus())) {
            throw new ApiException(400, "Only requested refunds can be approved");
        }

        refund.setStatus("APPROVED");
        refund.setAdminNote(adminNote);
        refund.setProcessedAt(LocalDateTime.now());

        // Credit wallet
        walletService.refund(refund.getUserId(), refund.getAmount(), "REFUND", refund.getId());

        return refundRepository.save(refund);
    }

    @Transactional
    public RefundEntity rejectRefund(String authHeader, Long refundId, String adminNote) {
        authService.requireAdmin(authHeader);

        RefundEntity refund = refundRepository.findById(refundId)
                .orElseThrow(() -> new ApiException(404, "Refund not found"));

        if (!"REQUESTED".equals(refund.getStatus())) {
            throw new ApiException(400, "Only requested refunds can be rejected");
        }

        refund.setStatus("REJECTED");
        refund.setAdminNote(adminNote);
        refund.setProcessedAt(LocalDateTime.now());

        return refundRepository.save(refund);
    }

    public RefundDtos.RefundListResponse getMyRefunds(String authHeader, int page, int size) {
        UserEntity user = resolveUser(authHeader);

        Page<RefundEntity> refundPage = refundRepository.findByUserIdOrderByCreatedAtDesc(
                user.getId(),
                PageRequest.of(page, size)
        );

        return new RefundDtos.RefundListResponse(
                refundPage.getContent().stream()
                        .map(RefundDtos.RefundResponse::from)
                        .toList(),
                refundPage.getTotalPages(),
                refundPage.getTotalElements()
        );
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
