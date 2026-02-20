package com.cheonjiyeon.api.notification;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
public class NotificationPreferenceService {
    private final NotificationPreferenceRepository preferenceRepository;

    public NotificationPreferenceService(NotificationPreferenceRepository preferenceRepository) {
        this.preferenceRepository = preferenceRepository;
    }

    @Transactional
    public NotificationPreferenceEntity getOrCreate(Long userId) {
        return preferenceRepository.findByUserId(userId)
                .orElseGet(() -> {
                    NotificationPreferenceEntity pref = new NotificationPreferenceEntity();
                    pref.setUserId(userId);
                    return preferenceRepository.save(pref);
                });
    }

    @Transactional
    public NotificationPreferenceEntity update(Long userId, Map<String, Boolean> preferences) {
        NotificationPreferenceEntity pref = getOrCreate(userId);

        if (preferences.containsKey("bookingConfirmedEmail")) {
            pref.setBookingConfirmedEmail(preferences.get("bookingConfirmedEmail"));
        }
        if (preferences.containsKey("consultationReminderEmail")) {
            pref.setConsultationReminderEmail(preferences.get("consultationReminderEmail"));
        }
        if (preferences.containsKey("consultationCompletedEmail")) {
            pref.setConsultationCompletedEmail(preferences.get("consultationCompletedEmail"));
        }
        if (preferences.containsKey("refundStatusEmail")) {
            pref.setRefundStatusEmail(preferences.get("refundStatusEmail"));
        }
        if (preferences.containsKey("settlementPaidEmail")) {
            pref.setSettlementPaidEmail(preferences.get("settlementPaidEmail"));
        }
        if (preferences.containsKey("reviewReceivedEmail")) {
            pref.setReviewReceivedEmail(preferences.get("reviewReceivedEmail"));
        }
        if (preferences.containsKey("newBookingEmail")) {
            pref.setNewBookingEmail(preferences.get("newBookingEmail"));
        }
        if (preferences.containsKey("bookingConfirmedSms")) {
            pref.setBookingConfirmedSms(preferences.get("bookingConfirmedSms"));
        }
        if (preferences.containsKey("consultationReminderSms")) {
            pref.setConsultationReminderSms(preferences.get("consultationReminderSms"));
        }

        return preferenceRepository.save(pref);
    }
}
