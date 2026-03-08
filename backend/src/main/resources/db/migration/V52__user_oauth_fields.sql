-- OAuth columns for social login support (Google, Kakao, Naver)
-- MySQL compatible version

SET @col1 = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'oauth_provider');
SET @sql1 = IF(@col1 = 0, 'ALTER TABLE users ADD COLUMN oauth_provider VARCHAR(20)', 'SELECT 1');
PREPARE stmt1 FROM @sql1;
EXECUTE stmt1;
DEALLOCATE PREPARE stmt1;

SET @col2 = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'oauth_id');
SET @sql2 = IF(@col2 = 0, 'ALTER TABLE users ADD COLUMN oauth_id VARCHAR(255)', 'SELECT 1');
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

ALTER TABLE users MODIFY COLUMN password_hash VARCHAR(255) NULL;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND INDEX_NAME = 'idx_users_oauth');
SET @sql3 = IF(@idx_exists = 0, 'CREATE UNIQUE INDEX idx_users_oauth ON users(oauth_provider, oauth_id)', 'SELECT 1');
PREPARE stmt3 FROM @sql3;
EXECUTE stmt3;
DEALLOCATE PREPARE stmt3;
