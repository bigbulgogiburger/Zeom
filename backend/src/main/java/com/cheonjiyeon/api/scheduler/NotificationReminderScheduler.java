package com.cheonjiyeon.api.scheduler;

import com.cheonjiyeon.api.booking.BookingEntity;
import com.cheonjiyeon.api.booking.BookingRepository;
import com.cheonjiyeon.api.booking.BookingSlotEntity;
import com.cheonjiyeon.api.notification.NotificationLogService;
import com.cheonjiyeon.api.notification.NotificationService;
import com.cheonjiyeon.api.notification.NotificationType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

/**
 * Sends consultation reminders at 1 hour and 10 minutes before booking start time.
 * Runs every 5 minutes.
 */
@Component
public class NotificationReminderScheduler {
    private static final Logger log = LoggerFactory.getLogger(NotificationReminderScheduler.class);

    private final BookingRepository bookingRepository;
    private final NotificationService notificationService;
    private final NotificationLogService notificationLogService;

    public NotificationReminderScheduler(BookingRepository bookingRepository,
                                         NotificationService notificationService,
                                         NotificationLogService notificationLogService) {
        this.bookingRepository = bookingRepository;
        this.notificationService = notificationService;
        this.notificationLogService = notificationLogService;
    }

    @Scheduled(fixedRate = 300_000) // 5 minutes
    public void sendReminders() {
        LocalDateTime now = LocalDateTime.now();

        // 1-hour reminder: bookings starting between 55-65 minutes from now
        sendRemindersForWindow(now, 55, 65, 60);

        // 10-minute reminder: bookings starting between 5-15 minutes from now
        sendRemindersForWindow(now, 5, 15, 10);
    }

    private void sendRemindersForWindow(LocalDateTime now, int minMinutes, int maxMinutes, int reminderMinutes) {
        LocalDateTime windowStart = now.plusMinutes(minMinutes);
        LocalDateTime windowEnd = now.plusMinutes(maxMinutes);

        // Get all BOOKED bookings (limited for performance)
        List<BookingEntity> bookings = bookingRepository.findTop200ByOrderByIdDesc();

        for (BookingEntity booking : bookings) {
            if (!"BOOKED".equals(booking.getStatus())) continue;

            // Find the earliest slot start time
            LocalDateTime slotStart = getEarliestSlotStart(booking);
            if (slotStart == null) continue;

            if (slotStart.isAfter(windowStart) && slotStart.isBefore(windowEnd)) {
                Long userId = booking.getUser().getId();
                String counselorName = booking.getCounselor().getName();

                // Duplicate prevention: check if already sent for this type within the last 2 hours
                String reminderType = NotificationType.CONSULTATION_REMINDER.name();
                LocalDateTime cutoff = now.minusHours(2);
                if (notificationLogService.wasSentRecently(userId, reminderType, "IN_APP", cutoff)) {
                    log.debug("Skipping duplicate reminder for userId={}, bookingId={}", userId, booking.getId());
                    continue;
                }

                try {
                    String title = "상담 시작 " + reminderMinutes + "분 전";
                    String body = counselorName + " 상담사와의 상담이 곧 시작됩니다.";
                    String link = "/sessions";

                    notificationService.send(userId, NotificationType.CONSULTATION_REMINDER, title, body, link);
                    notificationService.sendEmail(userId, NotificationType.CONSULTATION_REMINDER,
                            Map.of("counselorName", counselorName, "minutesBefore", String.valueOf(reminderMinutes)));

                    // SMS reminder (only for 10-minute window)
                    if (reminderMinutes == 10) {
                        String smsMessage = "상담 시작 10분 전입니다. " + counselorName;
                        notificationService.sendSmsNotification(userId, NotificationType.CONSULTATION_REMINDER, smsMessage);
                    }

                    log.info("Sent {}min reminder: userId={}, bookingId={}", reminderMinutes, userId, booking.getId());
                } catch (Exception e) {
                    log.error("Failed to send reminder: bookingId={}, error={}", booking.getId(), e.getMessage());
                }
            }
        }
    }

    private LocalDateTime getEarliestSlotStart(BookingEntity booking) {
        List<BookingSlotEntity> bookingSlots = booking.getBookingSlots();
        if (bookingSlots != null && !bookingSlots.isEmpty()) {
            return bookingSlots.stream()
                    .map(bs -> bs.getSlot().getStartAt())
                    .min(Comparator.naturalOrder())
                    .orElse(null);
        }
        // Fallback to legacy slot field
        if (booking.getSlot() != null) {
            return booking.getSlot().getStartAt();
        }
        return null;
    }
}
