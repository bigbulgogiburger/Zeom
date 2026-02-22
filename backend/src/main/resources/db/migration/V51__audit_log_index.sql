-- H2/MySQL compatible: create index on audit_logs.created_at
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
