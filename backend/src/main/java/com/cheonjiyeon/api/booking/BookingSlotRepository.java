package com.cheonjiyeon.api.booking;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BookingSlotRepository extends JpaRepository<BookingSlotEntity, Long> {
    List<BookingSlotEntity> findByBookingId(Long bookingId);
}
