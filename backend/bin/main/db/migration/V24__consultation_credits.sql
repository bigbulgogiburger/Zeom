CREATE TABLE consultation_credits (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  total_units INT NOT NULL,
  remaining_units INT NOT NULL,
  product_id BIGINT,
  purchased_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_credit_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_credit_product FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE INDEX idx_credits_user ON consultation_credits(user_id);

CREATE TABLE credit_usage_log (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  credit_id BIGINT NOT NULL,
  booking_id BIGINT NOT NULL,
  units_used INT NOT NULL,
  used_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_usage_credit FOREIGN KEY (credit_id) REFERENCES consultation_credits(id),
  CONSTRAINT fk_usage_booking FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

CREATE INDEX idx_usage_credit ON credit_usage_log(credit_id);
CREATE INDEX idx_usage_booking ON credit_usage_log(booking_id);

-- Insert credit-based consultation products
INSERT INTO products(name, description, minutes, cash_amount, price_krw, active) VALUES
('상담권 1회 (30분)', '30분 상담권 1회', 30, 33000, 33000, TRUE),
('상담권 2회 (60분)', '30분 상담권 2회 묶음 (할인)', 60, 60000, 60000, TRUE),
('상담권 3회 (90분)', '30분 상담권 3회 묶음 (할인)', 90, 85000, 85000, TRUE);
