CREATE TABLE refunds (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  reservation_id BIGINT NOT NULL,
  payment_id BIGINT,
  user_id BIGINT NOT NULL,
  amount BIGINT NOT NULL,
  reason TEXT,
  status VARCHAR(20) NOT NULL,
  admin_note TEXT,
  processed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_refund_booking FOREIGN KEY (reservation_id) REFERENCES bookings(id),
  CONSTRAINT fk_refund_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_refund_payment ON refunds(payment_id);
CREATE INDEX idx_refund_user ON refunds(user_id);
CREATE INDEX idx_refund_status ON refunds(status);
