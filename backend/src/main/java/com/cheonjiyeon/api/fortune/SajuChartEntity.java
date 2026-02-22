package com.cheonjiyeon.api.fortune;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "saju_charts")
public class SajuChartEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Column(name = "birth_solar_date", nullable = false)
    private LocalDate birthSolarDate;

    @Column(name = "birth_hour", length = 10)
    private String birthHour;

    @Column(nullable = false, length = 10)
    private String gender;

    @Column(name = "year_gan", nullable = false)
    private int yearGan;

    @Column(name = "year_ji", nullable = false)
    private int yearJi;

    @Column(name = "month_gan", nullable = false)
    private int monthGan;

    @Column(name = "month_ji", nullable = false)
    private int monthJi;

    @Column(name = "day_gan", nullable = false)
    private int dayGan;

    @Column(name = "day_ji", nullable = false)
    private int dayJi;

    @Column(name = "hour_gan")
    private Integer hourGan;

    @Column(name = "hour_ji")
    private Integer hourJi;

    @Column(name = "ohaeng_wood")
    private int ohaengWood;

    @Column(name = "ohaeng_fire")
    private int ohaengFire;

    @Column(name = "ohaeng_earth")
    private int ohaengEarth;

    @Column(name = "ohaeng_metal")
    private int ohaengMetal;

    @Column(name = "ohaeng_water")
    private int ohaengWater;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (updatedAt == null) updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public LocalDate getBirthSolarDate() { return birthSolarDate; }
    public void setBirthSolarDate(LocalDate birthSolarDate) { this.birthSolarDate = birthSolarDate; }
    public String getBirthHour() { return birthHour; }
    public void setBirthHour(String birthHour) { this.birthHour = birthHour; }
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    public int getYearGan() { return yearGan; }
    public void setYearGan(int yearGan) { this.yearGan = yearGan; }
    public int getYearJi() { return yearJi; }
    public void setYearJi(int yearJi) { this.yearJi = yearJi; }
    public int getMonthGan() { return monthGan; }
    public void setMonthGan(int monthGan) { this.monthGan = monthGan; }
    public int getMonthJi() { return monthJi; }
    public void setMonthJi(int monthJi) { this.monthJi = monthJi; }
    public int getDayGan() { return dayGan; }
    public void setDayGan(int dayGan) { this.dayGan = dayGan; }
    public int getDayJi() { return dayJi; }
    public void setDayJi(int dayJi) { this.dayJi = dayJi; }
    public Integer getHourGan() { return hourGan; }
    public void setHourGan(Integer hourGan) { this.hourGan = hourGan; }
    public Integer getHourJi() { return hourJi; }
    public void setHourJi(Integer hourJi) { this.hourJi = hourJi; }
    public int getOhaengWood() { return ohaengWood; }
    public void setOhaengWood(int ohaengWood) { this.ohaengWood = ohaengWood; }
    public int getOhaengFire() { return ohaengFire; }
    public void setOhaengFire(int ohaengFire) { this.ohaengFire = ohaengFire; }
    public int getOhaengEarth() { return ohaengEarth; }
    public void setOhaengEarth(int ohaengEarth) { this.ohaengEarth = ohaengEarth; }
    public int getOhaengMetal() { return ohaengMetal; }
    public void setOhaengMetal(int ohaengMetal) { this.ohaengMetal = ohaengMetal; }
    public int getOhaengWater() { return ohaengWater; }
    public void setOhaengWater(int ohaengWater) { this.ohaengWater = ohaengWater; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
