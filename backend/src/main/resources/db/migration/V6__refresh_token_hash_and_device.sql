ALTER TABLE refresh_tokens ADD COLUMN token_hash VARCHAR(128);
ALTER TABLE refresh_tokens ADD COLUMN device_id VARCHAR(120);
ALTER TABLE refresh_tokens ADD COLUMN device_name VARCHAR(160);

UPDATE refresh_tokens SET token_hash = 'legacy', device_id = 'legacy', device_name = 'legacy' WHERE token_hash IS NULL;

ALTER TABLE refresh_tokens MODIFY COLUMN token_hash VARCHAR(128) NOT NULL;
ALTER TABLE refresh_tokens MODIFY COLUMN device_id VARCHAR(120) NOT NULL;
ALTER TABLE refresh_tokens MODIFY COLUMN device_name VARCHAR(160) NOT NULL;

ALTER TABLE refresh_tokens DROP COLUMN token;
