-- OAuth columns for social login support (Google, Kakao, Naver) - H2 compatible
ALTER TABLE users ADD COLUMN oauth_provider VARCHAR(20);
ALTER TABLE users ADD COLUMN oauth_id VARCHAR(255);
ALTER TABLE users MODIFY COLUMN password_hash VARCHAR(255) NULL;
CREATE UNIQUE INDEX idx_users_oauth ON users(oauth_provider, oauth_id);
