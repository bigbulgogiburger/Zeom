package com.cheonjiyeon.api.credit;

import java.time.LocalDateTime;
import java.util.List;

public class CreditDtos {
    public record PurchaseCreditRequest(Long productId) {}

    public record CreditBalanceResponse(int totalUnits, int usedUnits, int remainingUnits) {}

    public record CreditPurchaseResponse(
            Long creditId,
            int units,
            Long productId,
            LocalDateTime purchasedAt
    ) {}

    public record CreditHistoryItem(
            Long id,
            int totalUnits,
            int remainingUnits,
            Long productId,
            LocalDateTime purchasedAt,
            List<UsageItem> usages
    ) {
        public static CreditHistoryItem from(CreditEntity credit, List<CreditUsageLogEntity> usages) {
            return new CreditHistoryItem(
                    credit.getId(),
                    credit.getTotalUnits(),
                    credit.getRemainingUnits(),
                    credit.getProductId(),
                    credit.getPurchasedAt(),
                    usages.stream().map(UsageItem::from).toList()
            );
        }
    }

    public record UsageItem(Long bookingId, int unitsUsed, LocalDateTime usedAt) {
        public static UsageItem from(CreditUsageLogEntity log) {
            return new UsageItem(log.getBookingId(), log.getUnitsUsed(), log.getUsedAt());
        }
    }

    public record CreditHistoryResponse(List<CreditHistoryItem> items) {}

    public record ReserveCreditRequest(Long bookingId, int units) {}

    public record ReserveCreditResponse(Long creditId, Long bookingId, int unitsUsed) {}
}
