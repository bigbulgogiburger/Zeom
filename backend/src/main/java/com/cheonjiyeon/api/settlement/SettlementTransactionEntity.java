package com.cheonjiyeon.api.settlement;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "settlement_transactions")
public class SettlementTransactionEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long sessionId;

    @Column(nullable = false)
    private Long bookingId;

    @Column(nullable = false)
    private Long customerId;

    @Column(nullable = false)
    private Long counselorId;

    @Column(nullable = false)
    private int creditsReserved;

    @Column(nullable = false)
    private int creditsConsumed;

    @Column(nullable = false)
    private int creditsRefunded;

    @Column(nullable = false)
    private int actualDurationSec;

    @Column(nullable = false, length = 20)
    private String settlementType; // NORMAL, TIMEOUT, NETWORK_SHORT, NETWORK_PARTIAL, ADMIN_REFUND

    @Column(nullable = false)
    private long counselorEarning;

    @Column(nullable = false)
    private long platformFee;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal commissionRate;

    @Column(nullable = false)
    private LocalDateTime settledAt;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (settledAt == null) settledAt = LocalDateTime.now();
        if (createdAt == null) createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Long getSessionId() { return sessionId; }
    public void setSessionId(Long sessionId) { this.sessionId = sessionId; }
    public Long getBookingId() { return bookingId; }
    public void setBookingId(Long bookingId) { this.bookingId = bookingId; }
    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }
    public Long getCounselorId() { return counselorId; }
    public void setCounselorId(Long counselorId) { this.counselorId = counselorId; }
    public int getCreditsReserved() { return creditsReserved; }
    public void setCreditsReserved(int creditsReserved) { this.creditsReserved = creditsReserved; }
    public int getCreditsConsumed() { return creditsConsumed; }
    public void setCreditsConsumed(int creditsConsumed) { this.creditsConsumed = creditsConsumed; }
    public int getCreditsRefunded() { return creditsRefunded; }
    public void setCreditsRefunded(int creditsRefunded) { this.creditsRefunded = creditsRefunded; }
    public int getActualDurationSec() { return actualDurationSec; }
    public void setActualDurationSec(int actualDurationSec) { this.actualDurationSec = actualDurationSec; }
    public String getSettlementType() { return settlementType; }
    public void setSettlementType(String settlementType) { this.settlementType = settlementType; }
    public long getCounselorEarning() { return counselorEarning; }
    public void setCounselorEarning(long counselorEarning) { this.counselorEarning = counselorEarning; }
    public long getPlatformFee() { return platformFee; }
    public void setPlatformFee(long platformFee) { this.platformFee = platformFee; }
    public BigDecimal getCommissionRate() { return commissionRate; }
    public void setCommissionRate(BigDecimal commissionRate) { this.commissionRate = commissionRate; }
    public LocalDateTime getSettledAt() { return settledAt; }
    public void setSettledAt(LocalDateTime settledAt) { this.settledAt = settledAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
