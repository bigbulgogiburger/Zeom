-- Create index on audit_logs.created_at (H2 compatible)
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
