ALTER TABLE refresh_tokens ADD COLUMN token_hash VARCHAR(128);
ALTER TABLE refresh_tokens ADD COLUMN device_id VARCHAR(120);
ALTER TABLE refresh_tokens ADD COLUMN device_name VARCHAR(160);

UPDATE refresh_tokens SET token_hash = 'legacy', device_id = 'legacy', device_name = 'legacy' WHERE token_hash IS NULL;

ALTER TABLE refresh_tokens ALTER COLUMN token_hash SET NOT NULL;
ALTER TABLE refresh_tokens ALTER COLUMN device_id SET NOT NULL;
ALTER TABLE refresh_tokens ALTER COLUMN device_name SET NOT NULL;

ALTER TABLE refresh_tokens DROP COLUMN token;
