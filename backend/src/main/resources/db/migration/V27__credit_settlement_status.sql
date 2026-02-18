-- Add settlement tracking columns to credit_usage_log
ALTER TABLE credit_usage_log ADD COLUMN status VARCHAR(20) DEFAULT 'RESERVED';
ALTER TABLE credit_usage_log ADD COLUMN consumed_at TIMESTAMP NULL;
ALTER TABLE credit_usage_log ADD COLUMN actual_minutes INT NULL;
ALTER TABLE credit_usage_log ADD COLUMN refunded_units INT DEFAULT 0;
