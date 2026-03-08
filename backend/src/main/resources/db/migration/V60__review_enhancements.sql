-- Review enhancements: photos, helpful votes, consultation type, anonymous option
ALTER TABLE reviews ADD COLUMN photo_urls VARCHAR(2000);
ALTER TABLE reviews ADD COLUMN helpful_count INT DEFAULT 0;
ALTER TABLE reviews ADD COLUMN consultation_type VARCHAR(50);
ALTER TABLE reviews ADD COLUMN is_anonymous BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS helpful_votes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    review_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_helpful_vote UNIQUE (user_id, review_id)
);
