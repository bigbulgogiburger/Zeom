package com.cheonjiyeon.api.notification;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "notification_preferences")
public class NotificationPreferenceEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long userId;

    @Column(nullable = false)
    private boolean bookingConfirmedEmail;

    @Column(nullable = false)
    private boolean consultationReminderEmail;

    @Column(nullable = false)
    private boolean consultationCompletedEmail;

    @Column(nullable = false)
    private boolean refundStatusEmail;

    @Column(nullable = false)
    private boolean settlementPaidEmail;

    @Column(nullable = false)
    private boolean reviewReceivedEmail;

    @Column(nullable = false)
    private boolean newBookingEmail;

    @Column(nullable = false)
    private boolean bookingConfirmedSms;

    @Column(nullable = false)
    private boolean consultationReminderSms;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        // defaults are all true
        bookingConfirmedEmail = true;
        consultationReminderEmail = true;
        consultationCompletedEmail = true;
        refundStatusEmail = true;
        settlementPaidEmail = true;
        reviewReceivedEmail = true;
        newBookingEmail = true;
        bookingConfirmedSms = true;
        consultationReminderSms = true;
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public boolean isBookingConfirmedEmail() { return bookingConfirmedEmail; }
    public void setBookingConfirmedEmail(boolean bookingConfirmedEmail) { this.bookingConfirmedEmail = bookingConfirmedEmail; }
    public boolean isConsultationReminderEmail() { return consultationReminderEmail; }
    public void setConsultationReminderEmail(boolean consultationReminderEmail) { this.consultationReminderEmail = consultationReminderEmail; }
    public boolean isConsultationCompletedEmail() { return consultationCompletedEmail; }
    public void setConsultationCompletedEmail(boolean consultationCompletedEmail) { this.consultationCompletedEmail = consultationCompletedEmail; }
    public boolean isRefundStatusEmail() { return refundStatusEmail; }
    public void setRefundStatusEmail(boolean refundStatusEmail) { this.refundStatusEmail = refundStatusEmail; }
    public boolean isSettlementPaidEmail() { return settlementPaidEmail; }
    public void setSettlementPaidEmail(boolean settlementPaidEmail) { this.settlementPaidEmail = settlementPaidEmail; }
    public boolean isReviewReceivedEmail() { return reviewReceivedEmail; }
    public void setReviewReceivedEmail(boolean reviewReceivedEmail) { this.reviewReceivedEmail = reviewReceivedEmail; }
    public boolean isNewBookingEmail() { return newBookingEmail; }
    public void setNewBookingEmail(boolean newBookingEmail) { this.newBookingEmail = newBookingEmail; }
    public boolean isBookingConfirmedSms() { return bookingConfirmedSms; }
    public void setBookingConfirmedSms(boolean bookingConfirmedSms) { this.bookingConfirmedSms = bookingConfirmedSms; }
    public boolean isConsultationReminderSms() { return consultationReminderSms; }
    public void setConsultationReminderSms(boolean consultationReminderSms) { this.consultationReminderSms = consultationReminderSms; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
