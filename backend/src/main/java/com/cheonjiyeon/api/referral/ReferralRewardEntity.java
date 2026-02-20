package com.cheonjiyeon.api.referral;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "referral_rewards")
public class ReferralRewardEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "referrer_id", nullable = false)
    private Long referrerId;

    @Column(name = "referee_id", nullable = false)
    private Long refereeId;

    @Column(name = "reward_amount", nullable = false)
    private Long rewardAmount;

    @Column(name = "referrer_rewarded", nullable = false)
    private boolean referrerRewarded;

    @Column(name = "referee_rewarded", nullable = false)
    private boolean refereeRewarded;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (rewardAmount == null) rewardAmount = 2000L;
    }

    public Long getId() { return id; }
    public Long getReferrerId() { return referrerId; }
    public void setReferrerId(Long referrerId) { this.referrerId = referrerId; }
    public Long getRefereeId() { return refereeId; }
    public void setRefereeId(Long refereeId) { this.refereeId = refereeId; }
    public Long getRewardAmount() { return rewardAmount; }
    public void setRewardAmount(Long rewardAmount) { this.rewardAmount = rewardAmount; }
    public boolean isReferrerRewarded() { return referrerRewarded; }
    public void setReferrerRewarded(boolean referrerRewarded) { this.referrerRewarded = referrerRewarded; }
    public boolean isRefereeRewarded() { return refereeRewarded; }
    public void setRefereeRewarded(boolean refereeRewarded) { this.refereeRewarded = refereeRewarded; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
