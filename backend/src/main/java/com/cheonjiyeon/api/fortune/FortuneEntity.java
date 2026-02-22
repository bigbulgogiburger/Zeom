package com.cheonjiyeon.api.fortune;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "daily_fortunes")
public class FortuneEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private LocalDate fortuneDate;

    @Column(nullable = false)
    private int overallScore;

    @Column(nullable = false)
    private int wealthScore;

    @Column(nullable = false)
    private int loveScore;

    @Column(nullable = false)
    private int healthScore;

    @Column(length = 500)
    private String overallText;

    @Column(length = 300)
    private String wealthText;

    @Column(length = 300)
    private String loveText;

    @Column(length = 300)
    private String healthText;

    @Column(length = 50)
    private String luckyColor;

    private Integer luckyNumber;

    @Column(length = 50)
    private String luckyDirection;

    private Integer dailyGanIndex;
    private Integer dailyJiIndex;

    @Column(length = 20)
    private String twelveUnseong;

    @Column(length = 20)
    private String sipseong;

    @Column(length = 20)
    private String harmonyType;

    private Integer careerScore;

    @Column(length = 500)
    private String careerText;

    private Integer studyScore;

    @Column(length = 500)
    private String studyText;

    @Column(length = 50)
    private String luckyTime;

    @Column(length = 50)
    private String warningTime;

    @Column(length = 500)
    private String sajuInsight;

    @Column(length = 300)
    private String counselorCtaMessage;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public LocalDate getFortuneDate() { return fortuneDate; }
    public void setFortuneDate(LocalDate fortuneDate) { this.fortuneDate = fortuneDate; }
    public int getOverallScore() { return overallScore; }
    public void setOverallScore(int overallScore) { this.overallScore = overallScore; }
    public int getWealthScore() { return wealthScore; }
    public void setWealthScore(int wealthScore) { this.wealthScore = wealthScore; }
    public int getLoveScore() { return loveScore; }
    public void setLoveScore(int loveScore) { this.loveScore = loveScore; }
    public int getHealthScore() { return healthScore; }
    public void setHealthScore(int healthScore) { this.healthScore = healthScore; }
    public String getOverallText() { return overallText; }
    public void setOverallText(String overallText) { this.overallText = overallText; }
    public String getWealthText() { return wealthText; }
    public void setWealthText(String wealthText) { this.wealthText = wealthText; }
    public String getLoveText() { return loveText; }
    public void setLoveText(String loveText) { this.loveText = loveText; }
    public String getHealthText() { return healthText; }
    public void setHealthText(String healthText) { this.healthText = healthText; }
    public String getLuckyColor() { return luckyColor; }
    public void setLuckyColor(String luckyColor) { this.luckyColor = luckyColor; }
    public Integer getLuckyNumber() { return luckyNumber; }
    public void setLuckyNumber(Integer luckyNumber) { this.luckyNumber = luckyNumber; }
    public String getLuckyDirection() { return luckyDirection; }
    public void setLuckyDirection(String luckyDirection) { this.luckyDirection = luckyDirection; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public Integer getDailyGanIndex() { return dailyGanIndex; }
    public void setDailyGanIndex(Integer dailyGanIndex) { this.dailyGanIndex = dailyGanIndex; }
    public Integer getDailyJiIndex() { return dailyJiIndex; }
    public void setDailyJiIndex(Integer dailyJiIndex) { this.dailyJiIndex = dailyJiIndex; }
    public String getTwelveUnseong() { return twelveUnseong; }
    public void setTwelveUnseong(String twelveUnseong) { this.twelveUnseong = twelveUnseong; }
    public String getSipseong() { return sipseong; }
    public void setSipseong(String sipseong) { this.sipseong = sipseong; }
    public String getHarmonyType() { return harmonyType; }
    public void setHarmonyType(String harmonyType) { this.harmonyType = harmonyType; }
    public Integer getCareerScore() { return careerScore; }
    public void setCareerScore(Integer careerScore) { this.careerScore = careerScore; }
    public String getCareerText() { return careerText; }
    public void setCareerText(String careerText) { this.careerText = careerText; }
    public Integer getStudyScore() { return studyScore; }
    public void setStudyScore(Integer studyScore) { this.studyScore = studyScore; }
    public String getStudyText() { return studyText; }
    public void setStudyText(String studyText) { this.studyText = studyText; }
    public String getLuckyTime() { return luckyTime; }
    public void setLuckyTime(String luckyTime) { this.luckyTime = luckyTime; }
    public String getWarningTime() { return warningTime; }
    public void setWarningTime(String warningTime) { this.warningTime = warningTime; }
    public String getSajuInsight() { return sajuInsight; }
    public void setSajuInsight(String sajuInsight) { this.sajuInsight = sajuInsight; }
    public String getCounselorCtaMessage() { return counselorCtaMessage; }
    public void setCounselorCtaMessage(String counselorCtaMessage) { this.counselorCtaMessage = counselorCtaMessage; }
}
