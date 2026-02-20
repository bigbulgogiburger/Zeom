-- users.status already exists from V17 (DEFAULT 'ACTIVE'), reusing it for account management
ALTER TABLE users ADD COLUMN suspended_at TIMESTAMP;
ALTER TABLE users ADD COLUMN suspended_reason TEXT;
ALTER TABLE users ADD COLUMN deletion_requested_at TIMESTAMP;
