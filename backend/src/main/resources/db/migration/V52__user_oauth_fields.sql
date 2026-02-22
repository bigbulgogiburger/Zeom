-- OAuth columns for social login support (Google, Kakao, Naver)
-- H2/MySQL compatible version

ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_id VARCHAR(255);
ALTER TABLE users ALTER COLUMN password_hash SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_oauth ON users(oauth_provider, oauth_id);
