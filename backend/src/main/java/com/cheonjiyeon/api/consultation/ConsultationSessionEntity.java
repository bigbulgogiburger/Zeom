package com.cheonjiyeon.api.consultation;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "consultation_sessions")
public class ConsultationSessionEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long reservationId;

    @Column(length = 120)
    private String sendbirdRoomId;

    private LocalDateTime startedAt;

    private LocalDateTime endedAt;

    private Integer durationSec;

    @Column(length = 30)
    private String endReason;  // NORMAL, TIMEOUT, NETWORK, ADMIN

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Long getReservationId() { return reservationId; }
    public void setReservationId(Long reservationId) { this.reservationId = reservationId; }
    public String getSendbirdRoomId() { return sendbirdRoomId; }
    public void setSendbirdRoomId(String sendbirdRoomId) { this.sendbirdRoomId = sendbirdRoomId; }
    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }
    public LocalDateTime getEndedAt() { return endedAt; }
    public void setEndedAt(LocalDateTime endedAt) { this.endedAt = endedAt; }
    public Integer getDurationSec() { return durationSec; }
    public void setDurationSec(Integer durationSec) { this.durationSec = durationSec; }
    public String getEndReason() { return endReason; }
    public void setEndReason(String endReason) { this.endReason = endReason; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
