package com.cheonjiyeon.api.payment;

import com.cheonjiyeon.api.audit.AuditLogService;
import com.cheonjiyeon.api.booking.BookingEntity;
import com.cheonjiyeon.api.booking.BookingRepository;
import com.cheonjiyeon.api.chat.ChatRoomRepository;
import com.cheonjiyeon.api.chat.ChatService;
import com.cheonjiyeon.api.common.ApiException;
import com.cheonjiyeon.api.notification.NotificationService;
import com.cheonjiyeon.api.payment.log.PaymentStatusLogEntity;
import com.cheonjiyeon.api.payment.log.PaymentStatusLogRepository;
import com.cheonjiyeon.api.payment.provider.PaymentProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class PaymentService {
    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final PaymentProvider paymentProvider;
    private final ChatService chatService;
    private final ChatRoomRepository chatRoomRepository;
    private final NotificationService notificationService;
    private final PaymentStatusLogRepository paymentStatusLogRepository;
    private final AuditLogService auditLogService;

    public PaymentService(PaymentRepository paymentRepository,
                          BookingRepository bookingRepository,
                          PaymentProvider paymentProvider,
                          ChatService chatService,
                          ChatRoomRepository chatRoomRepository,
                          NotificationService notificationService,
                          PaymentStatusLogRepository paymentStatusLogRepository,
                          AuditLogService auditLogService) {
        this.paymentRepository = paymentRepository;
        this.bookingRepository = bookingRepository;
        this.paymentProvider = paymentProvider;
        this.chatService = chatService;
        this.chatRoomRepository = chatRoomRepository;
        this.notificationService = notificationService;
        this.paymentStatusLogRepository = paymentStatusLogRepository;
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
        logTransition(saved.getId(), null, "PENDING", "create");
        auditLogService.log(actorId, "PAYMENT_CREATED", "PAYMENT", saved.getId());
        return toResponse(saved);
    }

    @Transactional
    public PaymentDtos.PaymentResponse confirm(Long actorId, Long paymentId) {
        PaymentEntity p = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ApiException(404, "결제를 찾을 수 없습니다."));
        ensureConfirmable(p.getStatus());
        boolean ok = paymentProvider.confirm(p.getProviderTxId());

        String prev = p.getStatus();
        p.setStatus(ok ? "PAID" : "FAILED");
        PaymentEntity saved = paymentRepository.save(p);
        logTransition(saved.getId(), prev, saved.getStatus(), ok ? "provider_confirm_ok" : "provider_confirm_fail");

        BookingEntity booking = bookingRepository.findById(saved.getBookingId())
                .orElseThrow(() -> new ApiException(404, "예약을 찾을 수 없습니다."));

        if (ok) {
            booking.setStatus("PAID");
            bookingRepository.save(booking);
            chatService.ensureRoom(actorId, booking.getId(), booking.getUser().getId(), booking.getCounselor().getId());
            notificationService.notifyPaymentConfirmed(actorId, booking.getUser().getEmail(), booking.getId());
        } else {
            booking.setStatus("PAYMENT_FAILED");
            bookingRepository.save(booking);
            chatRoomRepository.findByBookingId(booking.getId()).ifPresent(room -> {
                room.setStatus("CLOSED");
                chatRoomRepository.save(room);
            });
        }

        auditLogService.log(actorId, ok ? "PAYMENT_CONFIRMED" : "PAYMENT_FAILED", "PAYMENT", saved.getId());
        return toResponse(saved);
    }

    @Transactional
    public PaymentDtos.PaymentResponse cancel(Long actorId, Long paymentId) {
        PaymentEntity p = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ApiException(404, "결제를 찾을 수 없습니다."));
        ensureCancelable(p.getStatus());
        boolean ok = paymentProvider.cancel(p.getProviderTxId());
        if (!ok) throw new ApiException(409, "결제 취소에 실패했습니다.");

        String prev = p.getStatus();
        p.setStatus("CANCELED");
        PaymentEntity saved = paymentRepository.save(p);
        logTransition(saved.getId(), prev, "CANCELED", "cancel");

        BookingEntity booking = bookingRepository.findById(saved.getBookingId())
                .orElseThrow(() -> new ApiException(404, "예약을 찾을 수 없습니다."));
        booking.setStatus("PAYMENT_CANCELED");
        bookingRepository.save(booking);

        chatRoomRepository.findByBookingId(booking.getId()).ifPresent(room -> {
            room.setStatus("CLOSED");
            chatRoomRepository.save(room);
        });

        auditLogService.log(actorId, "PAYMENT_CANCELED", "PAYMENT", saved.getId());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public PaymentDtos.PaymentResponse get(Long paymentId) {
        PaymentEntity p = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ApiException(404, "결제를 찾을 수 없습니다."));
        return toResponse(p);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> logs(Long paymentId) {
        paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ApiException(404, "결제를 찾을 수 없습니다."));
        return paymentStatusLogRepository.findByPaymentIdOrderByIdAsc(paymentId)
                .stream()
                .map(l -> {
                    java.util.Map<String, Object> m = new java.util.LinkedHashMap<>();
                    m.put("id", l.getId());
                    m.put("fromStatus", l.getFromStatus() == null ? "" : l.getFromStatus());
                    m.put("toStatus", l.getToStatus());
                    m.put("reason", l.getReason());
                    m.put("createdAt", l.getCreatedAt().toString());
                    return m;
                })
                .toList();
    }

    @Transactional
    public void handleWebhook(String providerTxId, String eventType) {
        PaymentEntity p = paymentRepository.findByProviderTxId(providerTxId)
                .orElseThrow(() -> new ApiException(404, "결제를 찾을 수 없습니다."));

        String type = eventType == null ? "" : eventType.trim().toUpperCase();
        if ("PAID".equals(p.getStatus()) || "CANCELED".equals(p.getStatus())) {
            log.info("payment webhook ignored (already terminal). paymentId={} status={} eventType={}", p.getId(), p.getStatus(), type);
            return;
        }

        if ("PAID".equals(type) || "CONFIRMED".equals(type)) {
            confirm(0L, p.getId());
            return;
        }
        if ("CANCELED".equals(type) || "FAILED".equals(type)) {
            if ("FAILED".equals(type)) {
                String prev = p.getStatus();
                p.setStatus("FAILED");
                paymentRepository.save(p);
                logTransition(p.getId(), prev, "FAILED", "webhook_failed");
            } else {
                cancel(0L, p.getId());
            }
            return;
        }

        throw new ApiException(400, "지원하지 않는 webhook eventType 입니다.");
    }

    private void ensureConfirmable(String from) {
        if ("PAID".equals(from) || "CANCELED".equals(from)) {
            throw new ApiException(409, "이미 종료된 결제 상태입니다.");
        }
    }

    private void ensureCancelable(String from) {
        if ("CANCELED".equals(from)) {
            throw new ApiException(409, "이미 취소된 결제입니다.");
        }
    }

    private void logTransition(Long paymentId, String from, String to, String reason) {
        PaymentStatusLogEntity l = new PaymentStatusLogEntity();
        l.setPaymentId(paymentId);
        l.setFromStatus(from);
        l.setToStatus(to);
        l.setReason(reason);
        paymentStatusLogRepository.save(l);
    }

    private PaymentDtos.PaymentResponse toResponse(PaymentEntity p) {
        return new PaymentDtos.PaymentResponse(p.getId(), p.getBookingId(), p.getAmount(), p.getCurrency(), p.getProvider(), p.getProviderTxId(), p.getStatus());
    }
}
