ALTER TABLE bookings ADD COLUMN consultation_type VARCHAR(20) DEFAULT 'VIDEO';
ALTER TABLE counselors ADD COLUMN supported_consultation_types VARCHAR(100) DEFAULT 'VIDEO';

CREATE TABLE chat_messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    room_id BIGINT NOT NULL,
    sender_id BIGINT NOT NULL,
    sender_name VARCHAR(80) NOT NULL,
    sender_role VARCHAR(20) NOT NULL,
    content VARCHAR(2000) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chat_messages_room_id ON chat_messages(room_id);
