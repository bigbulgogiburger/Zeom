package com.cheonjiyeon.api.booking;

import com.cheonjiyeon.api.counselor.SlotEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "booking_slots")
public class BookingSlotEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private BookingEntity booking;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "slot_id", nullable = false)
    private SlotEntity slot;

    public BookingSlotEntity() {}

    public BookingSlotEntity(BookingEntity booking, SlotEntity slot) {
        this.booking = booking;
        this.slot = slot;
    }

    public Long getId() { return id; }
    public BookingEntity getBooking() { return booking; }
    public SlotEntity getSlot() { return slot; }
}
