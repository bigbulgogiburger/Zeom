package com.cheonjiyeon.api.consultation;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ConsultationSessionRepository extends JpaRepository<ConsultationSessionEntity, Long> {
    Optional<ConsultationSessionEntity> findByReservationId(Long reservationId);
    List<ConsultationSessionEntity> findByReservationIdIn(List<Long> reservationIds);
    List<ConsultationSessionEntity> findByStartedAtIsNotNullAndEndedAtIsNull();
    List<ConsultationSessionEntity> findByEndedAtIsNotNull();
    List<ConsultationSessionEntity> findByEndedAtIsNotNullAndChannelDeletedFalse();
    List<ConsultationSessionEntity> findByEndedAtBeforeAndChannelDeletedFalseAndEndedAtIsNotNull(LocalDateTime cutoff);
}
