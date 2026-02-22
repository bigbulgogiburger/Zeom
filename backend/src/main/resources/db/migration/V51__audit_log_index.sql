-- MySQL 8.0 compatible: check if index exists before creating
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
               WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = 'audit_logs'
               AND INDEX_NAME = 'idx_audit_logs_created_at');

SET @sqlstmt := IF(@exist > 0, 'SELECT ''Index already exists''',
    'CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at)');

PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
