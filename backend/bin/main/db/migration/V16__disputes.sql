CREATE TABLE disputes (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  reservation_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL,
  resolution TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_dispute_booking FOREIGN KEY (reservation_id) REFERENCES bookings(id),
  CONSTRAINT fk_dispute_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_dispute_reservation ON disputes(reservation_id);
CREATE INDEX idx_dispute_user ON disputes(user_id);
CREATE INDEX idx_dispute_status ON disputes(status);
