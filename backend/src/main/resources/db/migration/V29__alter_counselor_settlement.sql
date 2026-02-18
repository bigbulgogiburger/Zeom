-- Enhance counselor_settlement table with additional columns for detailed settlement tracking
ALTER TABLE counselor_settlement ADD COLUMN total_duration_min INT DEFAULT 0;
ALTER TABLE counselor_settlement ADD COLUMN gross_amount BIGINT DEFAULT 0;
ALTER TABLE counselor_settlement ADD COLUMN commission_amount BIGINT DEFAULT 0;
ALTER TABLE counselor_settlement ADD COLUMN confirmed_at TIMESTAMP NULL;
