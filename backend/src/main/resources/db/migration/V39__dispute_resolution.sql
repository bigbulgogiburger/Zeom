-- disputes.status already exists from V16, adding resolution-related columns only
ALTER TABLE disputes ADD COLUMN resolution_type VARCHAR(50);
ALTER TABLE disputes ADD COLUMN resolution_note TEXT;
ALTER TABLE disputes ADD COLUMN resolved_by BIGINT;
ALTER TABLE disputes ADD COLUMN resolved_at TIMESTAMP;
