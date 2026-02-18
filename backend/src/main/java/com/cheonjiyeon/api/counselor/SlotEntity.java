package com.cheonjiyeon.api.counselor;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "counselor_slots")
public class SlotEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "counselor_id", nullable = false)
    private CounselorEntity counselor;

    @Column(nullable = false)
    private LocalDateTime startAt;

    @Column(nullable = false)
    private LocalDateTime endAt;

    @Column(nullable = false)
    private boolean available;

    public Long getId() { return id; }
    public CounselorEntity getCounselor() { return counselor; }
    public void setCounselor(CounselorEntity counselor) { this.counselor = counselor; }
    public LocalDateTime getStartAt() { return startAt; }
    public void setStartAt(LocalDateTime startAt) { this.startAt = startAt; }
    public LocalDateTime getEndAt() { return endAt; }
    public void setEndAt(LocalDateTime endAt) { this.endAt = endAt; }
    public boolean isAvailable() { return available; }
    public void setAvailable(boolean available) { this.available = available; }
}

