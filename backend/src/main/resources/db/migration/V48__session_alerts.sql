-- V48: 세션 시간 알림 추적 + 상담사 준비 상태 + 채널 삭제 지연
ALTER TABLE consultation_sessions ADD COLUMN alert_5min_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE consultation_sessions ADD COLUMN alert_3min_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE consultation_sessions ADD COLUMN alert_1min_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE consultation_sessions ADD COLUMN grace_period_end TIMESTAMP NULL;
ALTER TABLE consultation_sessions ADD COLUMN counselor_ready_at TIMESTAMP NULL;
ALTER TABLE consultation_sessions ADD COLUMN channel_deleted BOOLEAN DEFAULT FALSE;
