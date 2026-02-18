package com.cheonjiyeon.api.credit;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "consultation_credits")
public class CreditEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Integer totalUnits;

    @Column(nullable = false)
    private Integer remainingUnits;

    private Long productId;

    @Column(nullable = false)
    private LocalDateTime purchasedAt;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Integer getTotalUnits() { return totalUnits; }
    public void setTotalUnits(Integer totalUnits) { this.totalUnits = totalUnits; }
    public Integer getRemainingUnits() { return remainingUnits; }
    public void setRemainingUnits(Integer remainingUnits) { this.remainingUnits = remainingUnits; }
    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }
    public LocalDateTime getPurchasedAt() { return purchasedAt; }
    public void setPurchasedAt(LocalDateTime purchasedAt) { this.purchasedAt = purchasedAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
