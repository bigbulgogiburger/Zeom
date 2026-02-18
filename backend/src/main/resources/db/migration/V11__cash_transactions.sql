CREATE TABLE cash_transactions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  type VARCHAR(20) NOT NULL,
  amount BIGINT NOT NULL,
  balance_after BIGINT NOT NULL,
  ref_type VARCHAR(40),
  ref_id BIGINT,
  idempotency_key VARCHAR(200) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cash_tx_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_cash_tx_user ON cash_transactions(user_id);
CREATE INDEX idx_cash_tx_created ON cash_transactions(created_at);
CREATE INDEX idx_cash_tx_idempotency ON cash_transactions(idempotency_key);
