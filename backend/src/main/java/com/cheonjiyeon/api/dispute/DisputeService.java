package com.cheonjiyeon.api.dispute;

import com.cheonjiyeon.api.auth.TokenStore;
import com.cheonjiyeon.api.auth.UserEntity;
import com.cheonjiyeon.api.auth.UserRepository;
import com.cheonjiyeon.api.booking.BookingRepository;
import com.cheonjiyeon.api.common.ApiException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DisputeService {
    private final DisputeRepository disputeRepository;
    private final BookingRepository bookingRepository;
    private final TokenStore tokenStore;
    private final UserRepository userRepository;

    public DisputeService(
            DisputeRepository disputeRepository,
            BookingRepository bookingRepository,
            TokenStore tokenStore,
            UserRepository userRepository
    ) {
        this.disputeRepository = disputeRepository;
        this.bookingRepository = bookingRepository;
        this.tokenStore = tokenStore;
        this.userRepository = userRepository;
    }

    @Transactional
    public DisputeEntity createDispute(String authHeader, DisputeDtos.CreateDisputeRequest req) {
        UserEntity user = resolveUser(authHeader);

        // Validate reservation exists
        bookingRepository.findById(req.reservationId())
                .orElseThrow(() -> new ApiException(404, "예약을 찾을 수 없습니다."));

        DisputeEntity dispute = new DisputeEntity();
        dispute.setReservationId(req.reservationId());
        dispute.setUserId(user.getId());
        dispute.setCategory(req.category());
        dispute.setDescription(req.description());
        dispute.setStatus("OPEN");

        return disputeRepository.save(dispute);
    }

    public DisputeDtos.DisputeListResponse getMyDisputes(String authHeader, int page, int size) {
        UserEntity user = resolveUser(authHeader);

        Page<DisputeEntity> disputePage = disputeRepository.findByUserIdOrderByCreatedAtDesc(
                user.getId(),
                PageRequest.of(page, size)
        );

        return new DisputeDtos.DisputeListResponse(
                disputePage.getContent().stream()
                        .map(DisputeDtos.DisputeResponse::from)
                        .toList(),
                disputePage.getTotalPages(),
                disputePage.getTotalElements()
        );
    }

    private UserEntity resolveUser(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new ApiException(401, "Authorization Bearer 토큰이 필요합니다.");
        }
        String token = authHeader.substring(7);
        Long userId = tokenStore.resolveAccessUserId(token)
                .orElseThrow(() -> new ApiException(401, "로그인이 필요합니다."));

        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(401, "유효하지 않은 토큰입니다."));
    }
}
