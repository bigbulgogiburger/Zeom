package com.cheonjiyeon.api.product;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "products")
public class ProductEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 400)
    private String description;

    @Column(nullable = false)
    private Integer minutes;

    @Column(nullable = false)
    private Long cashAmount;

    @Column(nullable = false)
    private Long priceKrw;

    @Column(nullable = false)
    private Boolean active;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (active == null) active = true;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Integer getMinutes() { return minutes; }
    public void setMinutes(Integer minutes) { this.minutes = minutes; }
    public Long getCashAmount() { return cashAmount; }
    public void setCashAmount(Long cashAmount) { this.cashAmount = cashAmount; }
    public Long getPriceKrw() { return priceKrw; }
    public void setPriceKrw(Long priceKrw) { this.priceKrw = priceKrw; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
