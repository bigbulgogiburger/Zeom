-- V49: 연속 세션 연결 추적
ALTER TABLE consultation_sessions ADD COLUMN continued_from_session_id BIGINT NULL;
ALTER TABLE consultation_sessions ADD COLUMN continued_to_session_id BIGINT NULL;
