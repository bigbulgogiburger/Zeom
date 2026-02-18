CREATE TABLE reviews (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  reservation_id BIGINT NOT NULL UNIQUE,
  user_id BIGINT NOT NULL,
  counselor_id BIGINT NOT NULL,
  rating TINYINT NOT NULL,
  comment TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_review_booking FOREIGN KEY (reservation_id) REFERENCES bookings(id),
  CONSTRAINT fk_review_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_review_counselor FOREIGN KEY (counselor_id) REFERENCES counselors(id),
  CONSTRAINT chk_rating CHECK (rating >= 1 AND rating <= 5)
);

CREATE INDEX idx_review_user ON reviews(user_id);
CREATE INDEX idx_review_counselor ON reviews(counselor_id);
CREATE INDEX idx_review_created ON reviews(created_at);
