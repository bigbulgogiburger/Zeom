-- Create index on audit_logs.created_at (MySQL compatible)
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'audit_logs' AND INDEX_NAME = 'idx_audit_logs_created_at');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
