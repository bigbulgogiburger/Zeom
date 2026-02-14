package com.cheonjiyeon.api.ops;

import com.cheonjiyeon.api.auth.AuthService;
import com.cheonjiyeon.api.booking.BookingEntity;
import com.cheonjiyeon.api.booking.BookingRepository;
import com.cheonjiyeon.api.chat.ChatRoomRepository;
import com.cheonjiyeon.api.payment.PaymentRepository;
import com.cheonjiyeon.api.payment.log.PaymentStatusLogRepository;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/ops")
public class OpsTimelineController {
    private final AuthService authService;
    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final PaymentStatusLogRepository paymentStatusLogRepository;

    public OpsTimelineController(AuthService authService,
                                 BookingRepository bookingRepository,
                                 PaymentRepository paymentRepository,
                                 ChatRoomRepository chatRoomRepository,
                                 PaymentStatusLogRepository paymentStatusLogRepository) {
        this.authService = authService;
        this.bookingRepository = bookingRepository;
        this.paymentRepository = paymentRepository;
        this.chatRoomRepository = chatRoomRepository;
        this.paymentStatusLogRepository = paymentStatusLogRepository;
    }

    @GetMapping("/timeline")
    public List<Map<String, Object>> timeline(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(required = false) Long bookingId,
            @RequestParam(required = false) String bookingStatus,
            @RequestParam(required = false) String paymentStatus,
            @RequestParam(required = false) String chatStatus,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to
    ) {
        authService.requireAdmin(authHeader);

        List<BookingEntity> bookings = bookingId != null
                ? bookingRepository.findById(bookingId).map(List::of).orElse(List.of())
                : bookingRepository.findTop200ByOrderByIdDesc();

        return bookings.stream()
                .filter(b -> bookingStatus == null || bookingStatus.isBlank() || bookingStatus.equals(b.getStatus()))
                .filter(b -> from == null || !b.getCreatedAt().isBefore(from))
                .filter(b -> to == null || !b.getCreatedAt().isAfter(to))
                .map(b -> {
                    var paymentOpt = paymentRepository.findByBookingId(b.getId());
                    var chatOpt = chatRoomRepository.findByBookingId(b.getId());

                    String pStatus = paymentOpt.map(p -> p.getStatus()).orElse("NONE");
                    String cStatus = chatOpt.map(c -> c.getStatus()).orElse("NONE");

                    java.util.Map<String, Object> row = new java.util.LinkedHashMap<>();
                    row.put("bookingId", b.getId());
                    row.put("bookingStatus", b.getStatus());
                    row.put("bookingCreatedAt", b.getCreatedAt().toString());
                    row.put("userId", b.getUser().getId());
                    row.put("counselorId", b.getCounselor().getId());
                    row.put("counselorName", b.getCounselor().getName());
                    Long pId = paymentOpt.map(p -> p.getId()).orElse(null);
                    boolean postActionRetryNeeded = pId != null && paymentStatusLogRepository.existsByPaymentIdAndReasonIn(
                            pId,
                            java.util.List.of("chat_open_retry_needed", "notification_retry_needed")
                    );

                    row.put("paymentStatus", pStatus);
                    row.put("paymentId", pId);
                    row.put("chatStatus", cStatus);
                    row.put("chatRoomId", chatOpt.map(c -> c.getProviderRoomId()).orElse(null));
                    row.put("postActionRetryNeeded", postActionRetryNeeded);
                    return row;
                })
                .filter(row -> paymentStatus == null || paymentStatus.isBlank() || paymentStatus.equals(row.get("paymentStatus")))
                .filter(row -> chatStatus == null || chatStatus.isBlank() || chatStatus.equals(row.get("chatStatus")))
                .toList();
    }
}
