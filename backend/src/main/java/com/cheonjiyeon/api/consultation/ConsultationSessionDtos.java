package com.cheonjiyeon.api.consultation;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public class ConsultationSessionDtos {
    public record EndSessionRequest(@NotNull String endReason) {}

    public record SessionResponse(
            Long id,
            Long reservationId,
            String sendbirdRoomId,
            LocalDateTime startedAt,
            LocalDateTime endedAt,
            Integer durationSec,
            String endReason,
            LocalDateTime createdAt
    ) {
        public static SessionResponse from(ConsultationSessionEntity session) {
            return new SessionResponse(
                    session.getId(),
                    session.getReservationId(),
                    session.getSendbirdRoomId(),
                    session.getStartedAt(),
                    session.getEndedAt(),
                    session.getDurationSec(),
                    session.getEndReason(),
                    session.getCreatedAt()
            );
        }
    }

    public record SessionTokenResponse(
            String token,
            String sendbirdToken,
            String sendbirdUserId,
            String sendbirdAppId,
            String calleeId,
            String channelUrl,
            String calleeName,
            Integer durationMinutes
    ) {}

    public record CounselorAuthResponse(String sendbirdToken, String sendbirdUserId, String sendbirdAppId) {}
}
