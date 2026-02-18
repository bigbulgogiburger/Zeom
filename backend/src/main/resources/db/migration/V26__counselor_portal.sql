-- counselor_settlement table
CREATE TABLE counselor_settlement (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    counselor_id BIGINT NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_sessions INT DEFAULT 0,
    total_amount BIGINT DEFAULT 0,
    commission_rate DECIMAL(5,2) DEFAULT 20.00,
    net_amount BIGINT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'PENDING',
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- consultation_memo table
CREATE TABLE consultation_memo (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id BIGINT NOT NULL,
    counselor_id BIGINT NOT NULL,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add reply fields to reviews table
ALTER TABLE reviews ADD COLUMN reply TEXT;
ALTER TABLE reviews ADD COLUMN reply_at TIMESTAMP;
