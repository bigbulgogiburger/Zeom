CREATE TABLE booking_slots (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  booking_id BIGINT NOT NULL,
  slot_id BIGINT NOT NULL UNIQUE,
  CONSTRAINT fk_bs_booking FOREIGN KEY (booking_id) REFERENCES bookings(id),
  CONSTRAINT fk_bs_slot FOREIGN KEY (slot_id) REFERENCES counselor_slots(id)
);
CREATE INDEX idx_booking_slots_booking ON booking_slots(booking_id);

-- Make slot_id nullable in bookings for multi-slot support (kept for backward compat)
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS fk_booking_slot;
ALTER TABLE bookings MODIFY COLUMN slot_id BIGINT NULL;
