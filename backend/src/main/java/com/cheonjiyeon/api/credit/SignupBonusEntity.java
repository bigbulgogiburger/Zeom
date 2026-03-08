package com.cheonjiyeon.api.credit;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "signup_bonuses")
public class SignupBonusEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long userId;

    @Column(nullable = false)
    private Long bonusAmount;

    @Column(nullable = false)
    private LocalDateTime grantedAt;

    @PrePersist
    void onCreate() {
        if (grantedAt == null) grantedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Long getBonusAmount() { return bonusAmount; }
    public void setBonusAmount(Long bonusAmount) { this.bonusAmount = bonusAmount; }
    public LocalDateTime getGrantedAt() { return grantedAt; }
}
