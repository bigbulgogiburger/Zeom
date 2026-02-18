package com.cheonjiyeon.api.auth;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class UserEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 120)
    private String email;

    @Column(nullable = false, length = 200)
    private String passwordHash;

    @Column(nullable = false, length = 60)
    private String name;

    @Column(nullable = false, length = 20)
    private String role;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(length = 20)
    private String phone;

    @Column(length = 20)
    private String status;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Column(length = 10)
    private String gender;

    @Column(name = "terms_agreed", nullable = false)
    private boolean termsAgreed;

    @Column(name = "terms_agreed_at")
    private LocalDateTime termsAgreedAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (role == null) role = "USER";
        if (status == null) status = "ACTIVE";
    }

    public Long getId() { return id; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDate getBirthDate() { return birthDate; }
    public void setBirthDate(LocalDate birthDate) { this.birthDate = birthDate; }
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    public boolean isTermsAgreed() { return termsAgreed; }
    public void setTermsAgreed(boolean termsAgreed) { this.termsAgreed = termsAgreed; }
    public LocalDateTime getTermsAgreedAt() { return termsAgreedAt; }
    public void setTermsAgreedAt(LocalDateTime termsAgreedAt) { this.termsAgreedAt = termsAgreedAt; }
}
