package com.cheonjiyeon.api.settlement;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "counselor_settlement")
public class CounselorSettlementEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long counselorId;

    @Column(nullable = false)
    private LocalDate periodStart;

    @Column(nullable = false)
    private LocalDate periodEnd;

    @Column(nullable = false)
    private int totalSessions;

    private int totalDurationMin;

    @Column(nullable = false)
    private long totalAmount;

    private long grossAmount;

    private long commissionAmount;

    @Column(precision = 5, scale = 2)
    private BigDecimal commissionRate;

    @Column(nullable = false)
    private long netAmount;

    @Column(length = 20)
    private String status;

    private LocalDateTime confirmedAt;

    private LocalDateTime paidAt;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (commissionRate == null) commissionRate = new BigDecimal("20.00");
        if (status == null) status = "PENDING";
    }

    public Long getId() { return id; }
    public Long getCounselorId() { return counselorId; }
    public void setCounselorId(Long counselorId) { this.counselorId = counselorId; }
    public LocalDate getPeriodStart() { return periodStart; }
    public void setPeriodStart(LocalDate periodStart) { this.periodStart = periodStart; }
    public LocalDate getPeriodEnd() { return periodEnd; }
    public void setPeriodEnd(LocalDate periodEnd) { this.periodEnd = periodEnd; }
    public int getTotalSessions() { return totalSessions; }
    public void setTotalSessions(int totalSessions) { this.totalSessions = totalSessions; }
    public int getTotalDurationMin() { return totalDurationMin; }
    public void setTotalDurationMin(int totalDurationMin) { this.totalDurationMin = totalDurationMin; }
    public long getTotalAmount() { return totalAmount; }
    public void setTotalAmount(long totalAmount) { this.totalAmount = totalAmount; }
    public long getGrossAmount() { return grossAmount; }
    public void setGrossAmount(long grossAmount) { this.grossAmount = grossAmount; }
    public long getCommissionAmount() { return commissionAmount; }
    public void setCommissionAmount(long commissionAmount) { this.commissionAmount = commissionAmount; }
    public BigDecimal getCommissionRate() { return commissionRate; }
    public void setCommissionRate(BigDecimal commissionRate) { this.commissionRate = commissionRate; }
    public long getNetAmount() { return netAmount; }
    public void setNetAmount(long netAmount) { this.netAmount = netAmount; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getConfirmedAt() { return confirmedAt; }
    public void setConfirmedAt(LocalDateTime confirmedAt) { this.confirmedAt = confirmedAt; }
    public LocalDateTime getPaidAt() { return paidAt; }
    public void setPaidAt(LocalDateTime paidAt) { this.paidAt = paidAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
