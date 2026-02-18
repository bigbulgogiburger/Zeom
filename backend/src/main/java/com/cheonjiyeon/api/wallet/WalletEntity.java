package com.cheonjiyeon.api.wallet;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "wallets")
public class WalletEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long userId;

    @Column(nullable = false)
    private Long balanceCash;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        if (balanceCash == null) balanceCash = 0L;
        if (updatedAt == null) updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Long getBalanceCash() { return balanceCash; }
    public void setBalanceCash(Long balanceCash) { this.balanceCash = balanceCash; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
