package com.cheonjiyeon.api.settlement;

import com.cheonjiyeon.api.booking.BookingEntity;
import com.cheonjiyeon.api.booking.BookingRepository;
import com.cheonjiyeon.api.common.ApiException;
import com.cheonjiyeon.api.consultation.ConsultationSessionEntity;
import com.cheonjiyeon.api.credit.CreditEntity;
import com.cheonjiyeon.api.credit.CreditRepository;
import com.cheonjiyeon.api.credit.CreditUsageLogEntity;
import com.cheonjiyeon.api.credit.CreditUsageLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.List;

@Service
public class SettlementService {

    private static final long CREDIT_UNIT_PRICE = 33_000L; // 33,000원 per credit (30min)
    private static final BigDecimal COMMISSION_RATE = new BigDecimal("20.00");
    private static final double COMMISSION_FRACTION = 0.20;
    private static final int NETWORK_MIN_THRESHOLD_SEC = 600; // 10분

    private final SettlementTransactionRepository settlementTransactionRepository;
    private final CounselorSettlementRepository counselorSettlementRepository;
    private final CreditUsageLogRepository usageLogRepository;
    private final CreditRepository creditRepository;
    private final BookingRepository bookingRepository;

    public SettlementService(
            SettlementTransactionRepository settlementTransactionRepository,
            CounselorSettlementRepository counselorSettlementRepository,
            CreditUsageLogRepository usageLogRepository,
            CreditRepository creditRepository,
            BookingRepository bookingRepository
    ) {
        this.settlementTransactionRepository = settlementTransactionRepository;
        this.counselorSettlementRepository = counselorSettlementRepository;
        this.usageLogRepository = usageLogRepository;
        this.creditRepository = creditRepository;
        this.bookingRepository = bookingRepository;
    }

    @Transactional
    public SettlementTransactionEntity settleSession(ConsultationSessionEntity session) {
        // Idempotency: skip if already settled
        if (settlementTransactionRepository.existsBySessionId(session.getId())) {
            return settlementTransactionRepository.findBySessionId(session.getId()).orElseThrow();
        }

        BookingEntity booking = bookingRepository.findById(session.getReservationId())
                .orElseThrow(() -> new ApiException(404, "예약을 찾을 수 없습니다: " + session.getReservationId()));

        int creditsReserved = booking.getCreditsUsed();
        int durationSec = session.getDurationSec() != null ? session.getDurationSec() : 0;
        String endReason = session.getEndReason() != null ? session.getEndReason() : "NORMAL";

        // Determine settlement type and credits consumed/refunded
        String settlementType;
        int creditsConsumed;
        int creditsRefunded;

        switch (endReason) {
            case "NORMAL", "TIMEOUT" -> {
                // Full consumption
                settlementType = endReason;
                creditsConsumed = creditsReserved;
                creditsRefunded = 0;
            }
            case "NETWORK" -> {
                if (durationSec < NETWORK_MIN_THRESHOLD_SEC) {
                    // Under 10 min: full refund
                    settlementType = "NETWORK_SHORT";
                    creditsConsumed = 0;
                    creditsRefunded = creditsReserved;
                } else {
                    // 10 min+: proportional consumption (ceil of actual minutes / 30)
                    int actualMinutes = (int) Math.ceil(durationSec / 60.0);
                    int unitsNeeded = (int) Math.ceil(actualMinutes / 30.0);
                    creditsConsumed = Math.min(unitsNeeded, creditsReserved);
                    creditsRefunded = creditsReserved - creditsConsumed;
                    settlementType = creditsRefunded > 0 ? "NETWORK_PARTIAL" : "NETWORK";
                }
            }
            case "ADMIN" -> {
                // Full refund
                settlementType = "ADMIN_REFUND";
                creditsConsumed = 0;
                creditsRefunded = creditsReserved;
            }
            default -> {
                settlementType = endReason;
                creditsConsumed = creditsReserved;
                creditsRefunded = 0;
            }
        }

        // Update credit_usage_log entries
        List<CreditUsageLogEntity> usageLogs = usageLogRepository.findByBookingId(booking.getId());
        int actualMinutes = (int) Math.ceil(durationSec / 60.0);
        int refundRemaining = creditsRefunded;

        for (CreditUsageLogEntity log : usageLogs) {
            log.setActualMinutes(actualMinutes);
            log.setConsumedAt(LocalDateTime.now());

            if (creditsRefunded == 0) {
                // Full consumption
                log.setStatus("CONSUMED");
                log.setRefundedUnits(0);
            } else if (creditsConsumed == 0) {
                // Full refund
                log.setStatus("RELEASED");
                log.setRefundedUnits(log.getUnitsUsed());

                // Restore credits
                CreditEntity credit = creditRepository.findById(log.getCreditId())
                        .orElseThrow(() -> new ApiException(404, "상담권을 찾을 수 없습니다."));
                credit.setRemainingUnits(credit.getRemainingUnits() + log.getUnitsUsed());
                creditRepository.save(credit);
            } else {
                // Partial refund: distribute refund across usage logs
                int refundFromThis = Math.min(refundRemaining, log.getUnitsUsed());
                if (refundFromThis > 0 && refundFromThis == log.getUnitsUsed()) {
                    log.setStatus("RELEASED");
                    log.setRefundedUnits(refundFromThis);

                    CreditEntity credit = creditRepository.findById(log.getCreditId())
                            .orElseThrow(() -> new ApiException(404, "상담권을 찾을 수 없습니다."));
                    credit.setRemainingUnits(credit.getRemainingUnits() + refundFromThis);
                    creditRepository.save(credit);

                    refundRemaining -= refundFromThis;
                } else if (refundFromThis > 0) {
                    log.setStatus("PARTIAL_REFUND");
                    log.setRefundedUnits(refundFromThis);

                    CreditEntity credit = creditRepository.findById(log.getCreditId())
                            .orElseThrow(() -> new ApiException(404, "상담권을 찾을 수 없습니다."));
                    credit.setRemainingUnits(credit.getRemainingUnits() + refundFromThis);
                    creditRepository.save(credit);

                    refundRemaining -= refundFromThis;
                } else {
                    log.setStatus("CONSUMED");
                    log.setRefundedUnits(0);
                }
            }
            usageLogRepository.save(log);
        }

        // Calculate earnings
        long grossAmount = CREDIT_UNIT_PRICE * creditsConsumed;
        long platformFee = (long) (grossAmount * COMMISSION_FRACTION);
        long counselorEarning = grossAmount - platformFee;

        // Create settlement transaction
        SettlementTransactionEntity tx = new SettlementTransactionEntity();
        tx.setSessionId(session.getId());
        tx.setBookingId(booking.getId());
        tx.setCustomerId(booking.getUser().getId());
        tx.setCounselorId(booking.getCounselor().getId());
        tx.setCreditsReserved(creditsReserved);
        tx.setCreditsConsumed(creditsConsumed);
        tx.setCreditsRefunded(creditsRefunded);
        tx.setActualDurationSec(durationSec);
        tx.setSettlementType(settlementType);
        tx.setCounselorEarning(counselorEarning);
        tx.setPlatformFee(platformFee);
        tx.setCommissionRate(COMMISSION_RATE);

        SettlementTransactionEntity saved = settlementTransactionRepository.save(tx);

        // Update counselor settlement for current period
        updateCounselorSettlement(booking.getCounselor().getId(), durationSec, grossAmount, platformFee, counselorEarning);

        return saved;
    }

    private void updateCounselorSettlement(Long counselorId, int durationSec, long grossAmount, long platformFee, long counselorEarning) {
        LocalDate today = LocalDate.now();
        LocalDate periodStart = today.with(TemporalAdjusters.firstDayOfMonth());
        LocalDate periodEnd = today.with(TemporalAdjusters.lastDayOfMonth());

        CounselorSettlementEntity settlement = counselorSettlementRepository
                .findByCounselorIdAndPeriodStartAndPeriodEnd(counselorId, periodStart, periodEnd)
                .orElseGet(() -> {
                    CounselorSettlementEntity s = new CounselorSettlementEntity();
                    s.setCounselorId(counselorId);
                    s.setPeriodStart(periodStart);
                    s.setPeriodEnd(periodEnd);
                    s.setCommissionRate(COMMISSION_RATE);
                    return s;
                });

        settlement.setTotalSessions(settlement.getTotalSessions() + 1);
        settlement.setTotalDurationMin(settlement.getTotalDurationMin() + (int) Math.ceil(durationSec / 60.0));
        settlement.setGrossAmount(settlement.getGrossAmount() + grossAmount);
        settlement.setCommissionAmount(settlement.getCommissionAmount() + platformFee);
        settlement.setNetAmount(settlement.getNetAmount() + counselorEarning);
        settlement.setTotalAmount(settlement.getTotalAmount() + grossAmount);

        counselorSettlementRepository.save(settlement);
    }

    @Transactional(readOnly = true)
    public SettlementDtos.SettlementResponse getSettlementBySessionId(Long sessionId) {
        SettlementTransactionEntity tx = settlementTransactionRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new ApiException(404, "정산 내역을 찾을 수 없습니다: sessionId=" + sessionId));
        return SettlementDtos.SettlementResponse.from(tx);
    }

    @Transactional(readOnly = true)
    public SettlementDtos.CustomerSettlementListResponse getCustomerSettlements(Long userId) {
        List<SettlementTransactionEntity> txs = settlementTransactionRepository.findByCustomerIdOrderByCreatedAtDesc(userId);
        return new SettlementDtos.CustomerSettlementListResponse(
                txs.stream().map(SettlementDtos.SettlementResponse::from).toList()
        );
    }

    @Transactional(readOnly = true)
    public SettlementDtos.CounselorSettlementListResponse getCounselorSettlements(Long counselorId) {
        List<CounselorSettlementEntity> settlements = counselorSettlementRepository.findByCounselorIdOrderByPeriodStartDesc(counselorId);
        return new SettlementDtos.CounselorSettlementListResponse(
                settlements.stream().map(SettlementDtos.CounselorSettlementSummary::from).toList()
        );
    }

    @Transactional(readOnly = true)
    public SettlementDtos.CounselorSettlementDetailResponse getCounselorSettlementDetail(Long settlementId) {
        CounselorSettlementEntity settlement = counselorSettlementRepository.findById(settlementId)
                .orElseThrow(() -> new ApiException(404, "정산 내역을 찾을 수 없습니다: " + settlementId));

        List<SettlementTransactionEntity> txs = settlementTransactionRepository.findByCounselorIdOrderByCreatedAtDesc(settlement.getCounselorId());

        // Filter transactions within the settlement period
        List<SettlementDtos.SettlementResponse> periodTxs = txs.stream()
                .filter(tx -> {
                    LocalDate txDate = tx.getSettledAt().toLocalDate();
                    return !txDate.isBefore(settlement.getPeriodStart()) && !txDate.isAfter(settlement.getPeriodEnd());
                })
                .map(SettlementDtos.SettlementResponse::from)
                .toList();

        return new SettlementDtos.CounselorSettlementDetailResponse(
                SettlementDtos.CounselorSettlementSummary.from(settlement),
                periodTxs
        );
    }
}
