ALTER TABLE users ADD COLUMN oauth_provider VARCHAR(20);
ALTER TABLE users ADD COLUMN oauth_id VARCHAR(255);

ALTER TABLE users ALTER COLUMN password_hash SET NULL;

CREATE UNIQUE INDEX idx_users_oauth ON users(oauth_provider, oauth_id);
