CREATE TABLE notification_preferences (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    booking_confirmed_email BOOLEAN NOT NULL DEFAULT TRUE,
    consultation_reminder_email BOOLEAN NOT NULL DEFAULT TRUE,
    consultation_completed_email BOOLEAN NOT NULL DEFAULT TRUE,
    refund_status_email BOOLEAN NOT NULL DEFAULT TRUE,
    settlement_paid_email BOOLEAN NOT NULL DEFAULT TRUE,
    review_received_email BOOLEAN NOT NULL DEFAULT TRUE,
    new_booking_email BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
