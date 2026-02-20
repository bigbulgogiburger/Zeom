package com.cheonjiyeon.api.booking;

import com.cheonjiyeon.api.auth.UserEntity;
import com.cheonjiyeon.api.counselor.CounselorEntity;
import com.cheonjiyeon.api.counselor.SlotEntity;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "bookings")
public class BookingEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "counselor_id", nullable = false)
    private CounselorEntity counselor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "slot_id")
    private SlotEntity slot;

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BookingSlotEntity> bookingSlots = new ArrayList<>();

    @Column(nullable = false, length = 30)
    private String status;

    @Column(nullable = false)
    private int creditsUsed;

    @Column(name = "cancel_reason")
    private String cancelReason;

    @Column(name = "payment_retry_count", nullable = false)
    private int paymentRetryCount = 0;

    @Column(name = "consultation_type", length = 20)
    private String consultationType = "VIDEO";

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public UserEntity getUser() { return user; }
    public void setUser(UserEntity user) { this.user = user; }
    public CounselorEntity getCounselor() { return counselor; }
    public void setCounselor(CounselorEntity counselor) { this.counselor = counselor; }
    public SlotEntity getSlot() { return slot; }
    public void setSlot(SlotEntity slot) { this.slot = slot; }
    public List<BookingSlotEntity> getBookingSlots() { return bookingSlots; }
    public void setBookingSlots(List<BookingSlotEntity> bookingSlots) { this.bookingSlots = bookingSlots; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public int getCreditsUsed() { return creditsUsed; }
    public void setCreditsUsed(int creditsUsed) { this.creditsUsed = creditsUsed; }
    public String getCancelReason() { return cancelReason; }
    public void setCancelReason(String cancelReason) { this.cancelReason = cancelReason; }
    public int getPaymentRetryCount() { return paymentRetryCount; }
    public void setPaymentRetryCount(int paymentRetryCount) { this.paymentRetryCount = paymentRetryCount; }
    public String getConsultationType() { return consultationType; }
    public void setConsultationType(String consultationType) { this.consultationType = consultationType; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
