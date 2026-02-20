ALTER TABLE notification_preferences ADD COLUMN booking_confirmed_sms BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE notification_preferences ADD COLUMN consultation_reminder_sms BOOLEAN NOT NULL DEFAULT TRUE;
