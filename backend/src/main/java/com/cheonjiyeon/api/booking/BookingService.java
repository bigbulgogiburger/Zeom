package com.cheonjiyeon.api.booking;

import com.cheonjiyeon.api.auth.TokenStore;
import com.cheonjiyeon.api.auth.UserEntity;
import com.cheonjiyeon.api.auth.UserRepository;
import com.cheonjiyeon.api.common.ApiException;
import com.cheonjiyeon.api.counselor.CounselorEntity;
import com.cheonjiyeon.api.counselor.CounselorRepository;
import com.cheonjiyeon.api.counselor.SlotEntity;
import com.cheonjiyeon.api.counselor.SlotRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class BookingService {
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final CounselorRepository counselorRepository;
    private final SlotRepository slotRepository;
    private final TokenStore tokenStore;

    public BookingService(BookingRepository bookingRepository,
                          UserRepository userRepository,
                          CounselorRepository counselorRepository,
                          SlotRepository slotRepository,
                          TokenStore tokenStore) {
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.counselorRepository = counselorRepository;
        this.slotRepository = slotRepository;
        this.tokenStore = tokenStore;
    }

    @Transactional
    public BookingDtos.BookingResponse create(String authHeader, BookingDtos.CreateBookingRequest req) {
        UserEntity user = resolveUser(authHeader);
        CounselorEntity counselor = counselorRepository.findById(req.counselorId())
                .orElseThrow(() -> new ApiException(404, "상담사를 찾을 수 없습니다."));
        SlotEntity slot = slotRepository.findById(req.slotId())
                .orElseThrow(() -> new ApiException(404, "슬롯을 찾을 수 없습니다."));

        if (!slot.getCounselor().getId().equals(counselor.getId())) {
            throw new ApiException(400, "상담사와 슬롯 정보가 일치하지 않습니다.");
        }
        if (!slot.isAvailable()) {
            throw new ApiException(409, "이미 예약된 슬롯입니다.");
        }

        slot.setAvailable(false);
        slotRepository.save(slot);

        BookingEntity booking = new BookingEntity();
        booking.setUser(user);
        booking.setCounselor(counselor);
        booking.setSlot(slot);
        booking.setStatus("BOOKED");

        BookingEntity saved = bookingRepository.save(booking);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<BookingDtos.BookingResponse> mine(String authHeader) {
        UserEntity user = resolveUser(authHeader);
        return bookingRepository.findByUserIdOrderByIdDesc(user.getId()).stream()
                .map(this::toResponse)
                .toList();
    }

    private UserEntity resolveUser(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new ApiException(401, "Authorization Bearer 토큰이 필요합니다.");
        }
        String token = authHeader.substring(7);
        Long userId = tokenStore.resolve(token)
                .orElseThrow(() -> new ApiException(401, "로그인이 필요합니다."));

        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(401, "유효하지 않은 토큰입니다."));
    }

    private BookingDtos.BookingResponse toResponse(BookingEntity booking) {
        return new BookingDtos.BookingResponse(
                booking.getId(),
                booking.getCounselor().getId(),
                booking.getCounselor().getName(),
                booking.getSlot().getId(),
                booking.getSlot().getStartAt(),
                booking.getSlot().getEndAt(),
                booking.getStatus()
        );
    }
}
