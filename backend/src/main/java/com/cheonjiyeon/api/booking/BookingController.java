package com.cheonjiyeon.api.booking;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/bookings")
public class BookingController {
    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping
    public BookingDtos.BookingResponse create(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @Valid @RequestBody BookingDtos.CreateBookingRequest req
    ) {
        return bookingService.create(authHeader, req);
    }

    @GetMapping("/me")
    public List<BookingDtos.BookingResponse> mine(
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        return bookingService.mine(authHeader);
    }

    @PostMapping("/{id}/cancel")
    public BookingDtos.BookingResponse cancel(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id
    ) {
        return bookingService.cancel(authHeader, id);
    }
}
