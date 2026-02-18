CREATE TABLE payment_status_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  payment_id BIGINT NOT NULL,
  from_status VARCHAR(20),
  to_status VARCHAR(20) NOT NULL,
  reason VARCHAR(120) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payment_status_log_payment FOREIGN KEY (payment_id) REFERENCES payments(id)
);

CREATE INDEX idx_payment_status_log_payment_id ON payment_status_logs(payment_id);
