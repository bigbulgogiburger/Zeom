package com.cheonjiyeon.api.dispute;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.List;

public class DisputeDtos {
    public record CreateDisputeRequest(
            @NotNull Long reservationId,
            @NotBlank String category,
            @NotBlank String description
    ) {}

    public record DisputeResponse(
            Long id,
            Long reservationId,
            Long userId,
            String category,
            String description,
            String status,
            String resolution,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
        public static DisputeResponse from(DisputeEntity dispute) {
            return new DisputeResponse(
                    dispute.getId(),
                    dispute.getReservationId(),
                    dispute.getUserId(),
                    dispute.getCategory(),
                    dispute.getDescription(),
                    dispute.getStatus(),
                    dispute.getResolution(),
                    dispute.getCreatedAt(),
                    dispute.getUpdatedAt()
            );
        }
    }

    public record DisputeListResponse(List<DisputeResponse> disputes, int totalPages, long totalElements) {}
}
