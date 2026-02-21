-- Add withdrawal-related columns to counselor_settlement
ALTER TABLE counselor_settlement ADD COLUMN requested_at TIMESTAMP NULL;
ALTER TABLE counselor_settlement ADD COLUMN transfer_note VARCHAR(500) NULL;
