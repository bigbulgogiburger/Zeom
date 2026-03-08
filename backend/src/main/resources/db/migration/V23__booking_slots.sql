CREATE TABLE booking_slots (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  booking_id BIGINT NOT NULL,
  slot_id BIGINT NOT NULL UNIQUE,
  CONSTRAINT fk_bs_booking FOREIGN KEY (booking_id) REFERENCES bookings(id),
  CONSTRAINT fk_bs_slot FOREIGN KEY (slot_id) REFERENCES counselor_slots(id)
);
CREATE INDEX idx_booking_slots_booking ON booking_slots(booking_id);

-- Make slot_id nullable in bookings for multi-slot support (kept for backward compat)
SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_NAME = 'fk_booking_slot' AND TABLE_NAME = 'bookings' AND TABLE_SCHEMA = DATABASE());
SET @sql = IF(@fk_exists > 0, 'ALTER TABLE bookings DROP FOREIGN KEY fk_booking_slot', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
ALTER TABLE bookings MODIFY COLUMN slot_id BIGINT NULL;
