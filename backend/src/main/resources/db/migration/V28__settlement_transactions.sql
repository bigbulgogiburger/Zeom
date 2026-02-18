CREATE TABLE settlement_transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id BIGINT NOT NULL,
    booking_id BIGINT NOT NULL,
    customer_id BIGINT NOT NULL,
    counselor_id BIGINT NOT NULL,
    credits_reserved INT NOT NULL,
    credits_consumed INT NOT NULL,
    credits_refunded INT NOT NULL,
    actual_duration_sec INT NOT NULL,
    settlement_type VARCHAR(20) NOT NULL,
    counselor_earning BIGINT NOT NULL,
    platform_fee BIGINT NOT NULL,
    commission_rate DECIMAL(5,2) NOT NULL,
    settled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_stx_session FOREIGN KEY (session_id) REFERENCES consultation_sessions(id),
    CONSTRAINT fk_stx_booking FOREIGN KEY (booking_id) REFERENCES bookings(id),
    CONSTRAINT fk_stx_customer FOREIGN KEY (customer_id) REFERENCES users(id),
    CONSTRAINT fk_stx_counselor FOREIGN KEY (counselor_id) REFERENCES counselors(id)
);

CREATE INDEX idx_stx_session ON settlement_transactions(session_id);
CREATE INDEX idx_stx_counselor ON settlement_transactions(counselor_id);
CREATE INDEX idx_stx_customer ON settlement_transactions(customer_id);
CREATE INDEX idx_stx_settled ON settlement_transactions(settled_at);
