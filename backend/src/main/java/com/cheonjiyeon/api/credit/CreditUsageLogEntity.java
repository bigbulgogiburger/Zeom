package com.cheonjiyeon.api.credit;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "credit_usage_log")
public class CreditUsageLogEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long creditId;

    @Column(nullable = false)
    private Long bookingId;

    @Column(nullable = false)
    private Integer unitsUsed;

    @Column(nullable = false)
    private LocalDateTime usedAt;

    @Column(length = 20)
    private String status; // RESERVED, CONSUMED, RELEASED, PARTIAL_REFUND

    private LocalDateTime consumedAt;

    private Integer actualMinutes;

    @Column(nullable = false)
    private Integer refundedUnits;

    @PrePersist
    void onCreate() {
        if (usedAt == null) usedAt = LocalDateTime.now();
        if (status == null) status = "RESERVED";
        if (refundedUnits == null) refundedUnits = 0;
    }

    public Long getId() { return id; }
    public Long getCreditId() { return creditId; }
    public void setCreditId(Long creditId) { this.creditId = creditId; }
    public Long getBookingId() { return bookingId; }
    public void setBookingId(Long bookingId) { this.bookingId = bookingId; }
    public Integer getUnitsUsed() { return unitsUsed; }
    public void setUnitsUsed(Integer unitsUsed) { this.unitsUsed = unitsUsed; }
    public LocalDateTime getUsedAt() { return usedAt; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getConsumedAt() { return consumedAt; }
    public void setConsumedAt(LocalDateTime consumedAt) { this.consumedAt = consumedAt; }
    public Integer getActualMinutes() { return actualMinutes; }
    public void setActualMinutes(Integer actualMinutes) { this.actualMinutes = actualMinutes; }
    public Integer getRefundedUnits() { return refundedUnits; }
    public void setRefundedUnits(Integer refundedUnits) { this.refundedUnits = refundedUnits; }
}
