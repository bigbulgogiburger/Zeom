package com.cheonjiyeon.api.review;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "reviews")
public class ReviewEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long reservationId;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Long counselorId;

    @Column(nullable = false)
    private Integer rating;  // 1-5

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column(columnDefinition = "TEXT")
    private String reply;

    private LocalDateTime replyAt;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Long getReservationId() { return reservationId; }
    public void setReservationId(Long reservationId) { this.reservationId = reservationId; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Long getCounselorId() { return counselorId; }
    public void setCounselorId(Long counselorId) { this.counselorId = counselorId; }
    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }
    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
    public String getReply() { return reply; }
    public void setReply(String reply) { this.reply = reply; }
    public LocalDateTime getReplyAt() { return replyAt; }
    public void setReplyAt(LocalDateTime replyAt) { this.replyAt = replyAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
