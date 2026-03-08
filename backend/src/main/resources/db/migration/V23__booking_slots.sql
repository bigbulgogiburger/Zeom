CREATE TABLE IF NOT EXISTS booking_slots (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  booking_id BIGINT NOT NULL,
  slot_id BIGINT NOT NULL UNIQUE,
  CONSTRAINT fk_bs_booking FOREIGN KEY (booking_id) REFERENCES bookings(id),
  CONSTRAINT fk_bs_slot FOREIGN KEY (slot_id) REFERENCES counselor_slots(id)
);
CREATE INDEX IF NOT EXISTS idx_booking_slots_booking ON booking_slots(booking_id);

-- Make slot_id nullable in bookings for multi-slot support (H2 compatible)
ALTER TABLE bookings ALTER COLUMN slot_id BIGINT NULL;
