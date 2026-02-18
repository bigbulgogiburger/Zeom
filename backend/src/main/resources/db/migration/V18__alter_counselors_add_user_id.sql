ALTER TABLE counselors ADD COLUMN user_id BIGINT;
ALTER TABLE counselors ADD COLUMN rating_avg DECIMAL(3,2) DEFAULT 0.00;
ALTER TABLE counselors ADD COLUMN review_count INT NOT NULL DEFAULT 0;
ALTER TABLE counselors ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE counselors ADD CONSTRAINT fk_counselor_user FOREIGN KEY (user_id) REFERENCES users(id);

CREATE INDEX idx_counselor_user ON counselors(user_id);
CREATE INDEX idx_counselor_active ON counselors(is_active);
CREATE INDEX idx_counselor_rating ON counselors(rating_avg);
