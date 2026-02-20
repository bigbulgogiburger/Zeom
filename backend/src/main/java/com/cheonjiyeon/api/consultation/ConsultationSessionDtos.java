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

    public record CanEnterResponse(boolean canEnter, long secondsUntilStart, String message) {}

    public record SessionSummaryResponse(
            Long sessionId,
            Long reservationId,
            String counselorName,
            String counselorSpecialty,
            LocalDateTime startedAt,
            LocalDateTime endedAt,
            Integer durationSec,
            String endReason,
            int creditsUsed,
            String memo
    ) {}

    public record SessionStatusResponse(
            Long sessionId,
            Long reservationId,
            boolean counselorReady,
            LocalDateTime counselorReadyAt,
            long remainingSeconds,
            int creditsUsed,
            int totalCredits,
            String state // WAITING, ACTIVE, ENDED
    ) {}

    public record NextConsecutiveResponse(
            boolean hasNext,
            Long nextBookingId,
            LocalDateTime nextSlotStartAt,
            LocalDateTime nextSlotEndAt
    ) {}

    public record ContinueNextRequest(@NotNull Long nextBookingId) {}

    public record ContinueNextResponse(
            Long sessionId,
            int extendedDurationMinutes,
            int creditsConsumed,
            LocalDateTime newEndTime
    ) {}

    public record ConsumeCreditResponse(
            int creditIndex,
            int totalCredits,
            LocalDateTime consumedAt
    ) {}

    public record CounselorReadyResponse(
            boolean ready,
            LocalDateTime readyAt
    ) {}
}
