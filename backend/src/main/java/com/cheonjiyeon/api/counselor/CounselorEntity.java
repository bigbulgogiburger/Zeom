package com.cheonjiyeon.api.counselor;

import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "counselors")
public class CounselorEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String name;

    @Column(nullable = false, length = 60)
    private String specialty;

    @Column(nullable = false, length = 400)
    private String intro;

    private Long userId;

    @Column(precision = 3, scale = 2)
    private BigDecimal ratingAvg;

    @Column(nullable = false)
    private Integer reviewCount;

    @Column(nullable = false)
    private Boolean isActive;

    @PrePersist
    void onCreate() {
        if (ratingAvg == null) ratingAvg = BigDecimal.ZERO;
        if (reviewCount == null) reviewCount = 0;
        if (isActive == null) isActive = true;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getSpecialty() { return specialty; }
    public void setSpecialty(String specialty) { this.specialty = specialty; }
    public String getIntro() { return intro; }
    public void setIntro(String intro) { this.intro = intro; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public BigDecimal getRatingAvg() { return ratingAvg; }
    public void setRatingAvg(BigDecimal ratingAvg) { this.ratingAvg = ratingAvg; }
    public Integer getReviewCount() { return reviewCount; }
    public void setReviewCount(Integer reviewCount) { this.reviewCount = reviewCount; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
}
