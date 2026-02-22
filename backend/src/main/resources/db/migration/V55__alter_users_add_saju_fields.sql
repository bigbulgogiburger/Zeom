-- 사주 정보를 위한 사용자 필드 추가
ALTER TABLE users ADD COLUMN birth_hour VARCHAR(10);
ALTER TABLE users ADD COLUMN calendar_type VARCHAR(10) DEFAULT 'solar';
ALTER TABLE users ADD COLUMN is_leap_month BOOLEAN DEFAULT FALSE;
