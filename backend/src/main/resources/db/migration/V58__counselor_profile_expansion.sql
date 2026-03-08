-- 상담사 프로필 확장 필드
ALTER TABLE counselors ADD COLUMN profile_image_url VARCHAR(500);
ALTER TABLE counselors ADD COLUMN career_years INT DEFAULT 0;
ALTER TABLE counselors ADD COLUMN certifications VARCHAR(1000);
ALTER TABLE counselors ADD COLUMN average_rating DOUBLE DEFAULT 0;
ALTER TABLE counselors ADD COLUMN total_reviews INT DEFAULT 0;
ALTER TABLE counselors ADD COLUMN total_consultations INT DEFAULT 0;
ALTER TABLE counselors ADD COLUMN response_rate INT DEFAULT 100;
ALTER TABLE counselors ADD COLUMN price_per_minute INT DEFAULT 3000;
ALTER TABLE counselors ADD COLUMN is_online BOOLEAN DEFAULT FALSE;
ALTER TABLE counselors ADD COLUMN tags VARCHAR(500);
ALTER TABLE counselors ADD COLUMN short_video_url VARCHAR(500);
