package com.cheonjiyeon.api.ops;

import com.cheonjiyeon.api.auth.UserRepository;
import com.cheonjiyeon.api.booking.BookingRepository;
import com.cheonjiyeon.api.counselor.CounselorRepository;
import com.cheonjiyeon.api.counselor.SlotRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/ops")
public class OpsController {
    private final UserRepository userRepository;
    private final CounselorRepository counselorRepository;
    private final SlotRepository slotRepository;
    private final BookingRepository bookingRepository;

    public OpsController(UserRepository userRepository,
                         CounselorRepository counselorRepository,
                         SlotRepository slotRepository,
                         BookingRepository bookingRepository) {
        this.userRepository = userRepository;
        this.counselorRepository = counselorRepository;
        this.slotRepository = slotRepository;
        this.bookingRepository = bookingRepository;
    }

    @GetMapping("/summary")
    public Map<String, Long> summary() {
        return Map.of(
                "users", userRepository.count(),
                "counselors", counselorRepository.count(),
                "availableSlots", slotRepository.countByAvailableTrue(),
                "booked", bookingRepository.countByStatus("BOOKED"),
                "canceled", bookingRepository.countByStatus("CANCELED")
        );
    }
}
