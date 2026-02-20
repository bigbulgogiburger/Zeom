package com.cheonjiyeon.api.scheduler;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 정산 배치 스케줄러
 * 매월 1일 00:00에 전월 정산 데이터를 집계하고 정산 요청 상태로 변경
 */
@Component
@ConditionalOnProperty(name = "scheduler.enabled", havingValue = "true", matchIfMissing = true)
public class SettlementBatchScheduler {

    private static final Logger log = LoggerFactory.getLogger(SettlementBatchScheduler.class);

    /**
     * 매월 1일 00:00 실행
     * 전월 정산 기간의 PENDING 정산을 REQUESTED로 전환
     */
    @Scheduled(cron = "${scheduler.settlement-batch-cron:0 0 0 1 * ?}")
    public void processMonthlySettlements() {
        log.info("Settlement batch scheduler triggered");
        // 현재는 정산 요청이 수동(상담사 출금 요청)으로 처리되므로
        // 이 스케줄러는 향후 자동 정산 프로세스 구현 시 활용 예정
        log.info("Settlement batch scheduler completed (no-op for now)");
    }
}
