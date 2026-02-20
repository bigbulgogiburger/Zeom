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

    // V48: 세션 시간 알림 추적
    @Column(name = "alert_5min_sent", columnDefinition = "BOOLEAN DEFAULT FALSE")
    private Boolean alert5minSent = false;

    @Column(name = "alert_3min_sent", columnDefinition = "BOOLEAN DEFAULT FALSE")
    private Boolean alert3minSent = false;

    @Column(name = "alert_1min_sent", columnDefinition = "BOOLEAN DEFAULT FALSE")
    private Boolean alert1minSent = false;

    @Column(name = "grace_period_end")
    private LocalDateTime gracePeriodEnd;

    @Column(name = "counselor_ready_at")
    private LocalDateTime counselorReadyAt;

    @Column(name = "channel_deleted", columnDefinition = "BOOLEAN DEFAULT FALSE")
    private Boolean channelDeleted = false;

    // V49: 연속 세션 연결
    @Column(name = "continued_from_session_id")
    private Long continuedFromSessionId;

    @Column(name = "continued_to_session_id")
    private Long continuedToSessionId;

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
    public Boolean getAlert5minSent() { return alert5minSent; }
    public void setAlert5minSent(Boolean alert5minSent) { this.alert5minSent = alert5minSent; }
    public Boolean getAlert3minSent() { return alert3minSent; }
    public void setAlert3minSent(Boolean alert3minSent) { this.alert3minSent = alert3minSent; }
    public Boolean getAlert1minSent() { return alert1minSent; }
    public void setAlert1minSent(Boolean alert1minSent) { this.alert1minSent = alert1minSent; }
    public LocalDateTime getGracePeriodEnd() { return gracePeriodEnd; }
    public void setGracePeriodEnd(LocalDateTime gracePeriodEnd) { this.gracePeriodEnd = gracePeriodEnd; }
    public LocalDateTime getCounselorReadyAt() { return counselorReadyAt; }
    public void setCounselorReadyAt(LocalDateTime counselorReadyAt) { this.counselorReadyAt = counselorReadyAt; }
    public Boolean getChannelDeleted() { return channelDeleted; }
    public void setChannelDeleted(Boolean channelDeleted) { this.channelDeleted = channelDeleted; }
    public Long getContinuedFromSessionId() { return continuedFromSessionId; }
    public void setContinuedFromSessionId(Long continuedFromSessionId) { this.continuedFromSessionId = continuedFromSessionId; }
    public Long getContinuedToSessionId() { return continuedToSessionId; }
    public void setContinuedToSessionId(Long continuedToSessionId) { this.continuedToSessionId = continuedToSessionId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
