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

    @Column(name = "supported_consultation_types", length = 100)
    private String supportedConsultationTypes = "VIDEO";

    @Column(name = "profile_image_url", length = 500)
    private String profileImageUrl;

    @Column(name = "career_years")
    private Integer careerYears;

    @Column(name = "certifications", length = 1000)
    private String certifications;

    @Column(name = "average_rating")
    private Double averageRating;

    @Column(name = "total_reviews")
    private Integer totalReviews;

    @Column(name = "total_consultations")
    private Integer totalConsultations;

    @Column(name = "response_rate")
    private Integer responseRate;

    @Column(name = "price_per_minute")
    private Integer pricePerMinute;

    @Column(name = "is_online")
    private Boolean isOnline;

    @Column(name = "tags", length = 500)
    private String tags;

    @Column(name = "short_video_url", length = 500)
    private String shortVideoUrl;

    @PrePersist
    void onCreate() {
        if (ratingAvg == null) ratingAvg = BigDecimal.ZERO;
        if (reviewCount == null) reviewCount = 0;
        if (isActive == null) isActive = true;
        if (supportedConsultationTypes == null) supportedConsultationTypes = "VIDEO";
        if (careerYears == null) careerYears = 0;
        if (averageRating == null) averageRating = 0.0;
        if (totalReviews == null) totalReviews = 0;
        if (totalConsultations == null) totalConsultations = 0;
        if (responseRate == null) responseRate = 100;
        if (pricePerMinute == null) pricePerMinute = 3000;
        if (isOnline == null) isOnline = false;
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
    public String getSupportedConsultationTypes() { return supportedConsultationTypes; }
    public void setSupportedConsultationTypes(String supportedConsultationTypes) { this.supportedConsultationTypes = supportedConsultationTypes; }

    public String getProfileImageUrl() { return profileImageUrl; }
    public void setProfileImageUrl(String profileImageUrl) { this.profileImageUrl = profileImageUrl; }

    public Integer getCareerYears() { return careerYears; }
    public void setCareerYears(Integer careerYears) { this.careerYears = careerYears; }

    public String getCertifications() { return certifications; }
    public void setCertifications(String certifications) { this.certifications = certifications; }

    public Double getAverageRating() { return averageRating; }
    public void setAverageRating(Double averageRating) { this.averageRating = averageRating; }

    public Integer getTotalReviews() { return totalReviews; }
    public void setTotalReviews(Integer totalReviews) { this.totalReviews = totalReviews; }

    public Integer getTotalConsultations() { return totalConsultations; }
    public void setTotalConsultations(Integer totalConsultations) { this.totalConsultations = totalConsultations; }

    public Integer getResponseRate() { return responseRate; }
    public void setResponseRate(Integer responseRate) { this.responseRate = responseRate; }

    public Integer getPricePerMinute() { return pricePerMinute; }
    public void setPricePerMinute(Integer pricePerMinute) { this.pricePerMinute = pricePerMinute; }

    public Boolean getIsOnline() { return isOnline; }
    public void setIsOnline(Boolean isOnline) { this.isOnline = isOnline; }

    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }

    public String getShortVideoUrl() { return shortVideoUrl; }
    public void setShortVideoUrl(String shortVideoUrl) { this.shortVideoUrl = shortVideoUrl; }
}
