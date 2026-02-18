CREATE TABLE consultation_sessions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  reservation_id BIGINT NOT NULL,
  sendbird_room_id VARCHAR(120),
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  duration_sec INT,
  end_reason VARCHAR(30),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_session_booking FOREIGN KEY (reservation_id) REFERENCES bookings(id)
);

CREATE INDEX idx_session_reservation ON consultation_sessions(reservation_id);
CREATE INDEX idx_session_started ON consultation_sessions(started_at);
