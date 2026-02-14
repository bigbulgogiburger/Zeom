package com.cheonjiyeon.api.payment;

import com.cheonjiyeon.api.audit.AuditLogService;
import com.cheonjiyeon.api.booking.BookingRepository;
import com.cheonjiyeon.api.common.ApiException;
import com.cheonjiyeon.api.payment.provider.PaymentProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaymentService {
    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final PaymentProvider paymentProvider;
    private final AuditLogService auditLogService;

    public PaymentService(PaymentRepository paymentRepository,
                          BookingRepository bookingRepository,
                          PaymentProvider paymentProvider,
                          AuditLogService auditLogService) {
        this.paymentRepository = paymentRepository;
        this.bookingRepository = bookingRepository;
        this.paymentProvider = paymentProvider;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public PaymentDtos.PaymentResponse create(Long actorId, PaymentDtos.CreatePaymentRequest req) {
        bookingRepository.findById(req.bookingId())
                .orElseThrow(() -> new ApiException(404, "예약을 찾을 수 없습니다."));
        paymentRepository.findByBookingId(req.bookingId()).ifPresent(p -> { throw new ApiException(409, "이미 결제가 생성되었습니다."); });

        PaymentEntity p = new PaymentEntity();
        p.setBookingId(req.bookingId());
        p.setAmount(req.amount());
        p.setCurrency(req.currency());
        p.setProvider(paymentProvider.name());
        p.setStatus("PENDING");
        PaymentEntity saved = paymentRepository.save(p);

        String tx = paymentProvider.prepare(saved.getId(), saved.getAmount(), saved.getCurrency());
        saved.setProviderTxId(tx);
        paymentRepository.save(saved);
        auditLogService.log(actorId, "PAYMENT_CREATED", "PAYMENT", saved.getId());
        return toResponse(saved);
    }

    @Transactional
    public PaymentDtos.PaymentResponse confirm(Long actorId, Long paymentId) {
        PaymentEntity p = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ApiException(404, "결제를 찾을 수 없습니다."));
        ensureTransition(p.getStatus(), "PAID");
        boolean ok = paymentProvider.confirm(p.getProviderTxId());
        p.setStatus(ok ? "PAID" : "FAILED");
        PaymentEntity saved = paymentRepository.save(p);
        auditLogService.log(actorId, ok ? "PAYMENT_CONFIRMED" : "PAYMENT_FAILED", "PAYMENT", saved.getId());
        return toResponse(saved);
    }

    @Transactional
    public PaymentDtos.PaymentResponse cancel(Long actorId, Long paymentId) {
        PaymentEntity p = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ApiException(404, "결제를 찾을 수 없습니다."));
        ensureTransition(p.getStatus(), "CANCELED");
        boolean ok = paymentProvider.cancel(p.getProviderTxId());
        if (!ok) throw new ApiException(409, "결제 취소에 실패했습니다.");
        p.setStatus("CANCELED");
        PaymentEntity saved = paymentRepository.save(p);
        auditLogService.log(actorId, "PAYMENT_CANCELED", "PAYMENT", saved.getId());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public PaymentDtos.PaymentResponse get(Long paymentId) {
        PaymentEntity p = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ApiException(404, "결제를 찾을 수 없습니다."));
        return toResponse(p);
    }

    private void ensureTransition(String from, String to) {
        if ("PAID".equals(from) || "CANCELED".equals(from)) {
            throw new ApiException(409, "이미 종료된 결제 상태입니다.");
        }
        if ("FAILED".equals(from) && "PAID".equals(to)) {
            throw new ApiException(409, "실패 결제는 승인할 수 없습니다.");
        }
    }

    private PaymentDtos.PaymentResponse toResponse(PaymentEntity p) {
        return new PaymentDtos.PaymentResponse(p.getId(), p.getBookingId(), p.getAmount(), p.getCurrency(), p.getProvider(), p.getProviderTxId(), p.getStatus());
    }
}
