CREATE TABLE audit_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  action VARCHAR(50) NOT NULL,
  target_type VARCHAR(100) NOT NULL,
  target_id BIGINT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_action_created_at ON audit_logs(action, created_at);
