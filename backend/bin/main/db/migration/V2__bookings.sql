CREATE TABLE bookings (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  counselor_id BIGINT NOT NULL,
  slot_id BIGINT NOT NULL UNIQUE,
  status VARCHAR(30) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_booking_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_booking_counselor FOREIGN KEY (counselor_id) REFERENCES counselors(id),
  CONSTRAINT fk_booking_slot FOREIGN KEY (slot_id) REFERENCES counselor_slots(id)
);
