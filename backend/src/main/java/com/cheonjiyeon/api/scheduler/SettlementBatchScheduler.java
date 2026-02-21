package com.cheonjiyeon.api.scheduler;

import com.cheonjiyeon.api.settlement.CounselorSettlementRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 정산 배치 스케줄러
 * 매월 1일 00:00에 전월 정산 데이터를 집계하고 로그 요약
 */
@Component
@ConditionalOnProperty(name = "scheduler.enabled", havingValue = "true", matchIfMissing = true)
public class SettlementBatchScheduler {

    private static final Logger log = LoggerFactory.getLogger(SettlementBatchScheduler.class);

    private final CounselorSettlementRepository counselorSettlementRepository;

    public SettlementBatchScheduler(CounselorSettlementRepository counselorSettlementRepository) {
        this.counselorSettlementRepository = counselorSettlementRepository;
    }

    /**
     * 매월 1일 00:00 실행
     * PENDING 상태 정산 건수를 조회하고 요약 로그 출력
     */
    @Scheduled(cron = "${scheduler.settlement-batch-cron:0 0 0 1 * ?}")
    public void processMonthlySettlements() {
        log.info("Settlement batch scheduler triggered");

        long pendingCount = counselorSettlementRepository.countByStatus("PENDING");
        long requestedCount = counselorSettlementRepository.countByStatus("REQUESTED");
        long confirmedCount = counselorSettlementRepository.countByStatus("CONFIRMED");

        log.info("Settlement summary - PENDING: {}, REQUESTED: {}, CONFIRMED: {}",
                pendingCount, requestedCount, confirmedCount);

        if (pendingCount > 0) {
            log.info("{} counselors have PENDING settlements available for withdrawal", pendingCount);
        }

        log.info("Settlement batch scheduler completed");
    }
}
