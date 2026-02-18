ALTER TABLE bookings ADD COLUMN channel VARCHAR(10) DEFAULT 'VIDEO';
ALTER TABLE bookings ADD COLUMN cancel_reason TEXT;

CREATE INDEX idx_booking_channel ON bookings(channel);
