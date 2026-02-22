-- OAuth columns for social login support (Google, Kakao, Naver)
-- Uses MySQL-compatible procedure to be idempotent

DROP PROCEDURE IF EXISTS add_oauth_columns;

DELIMITER //
CREATE PROCEDURE add_oauth_columns()
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
                   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'oauth_provider') THEN
        ALTER TABLE users ADD COLUMN oauth_provider VARCHAR(20);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
                   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'oauth_id') THEN
        ALTER TABLE users ADD COLUMN oauth_id VARCHAR(255);
    END IF;

    ALTER TABLE users MODIFY COLUMN password_hash VARCHAR(200) NULL;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
                   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND INDEX_NAME = 'idx_users_oauth') THEN
        CREATE UNIQUE INDEX idx_users_oauth ON users(oauth_provider, oauth_id);
    END IF;
END //
DELIMITER ;

CALL add_oauth_columns();
DROP PROCEDURE IF EXISTS add_oauth_columns;
