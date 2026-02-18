package com.cheonjiyeon.api.credit;

import com.cheonjiyeon.api.auth.TokenStore;
import com.cheonjiyeon.api.auth.UserEntity;
import com.cheonjiyeon.api.auth.UserRepository;
import com.cheonjiyeon.api.common.ApiException;
import com.cheonjiyeon.api.product.ProductEntity;
import com.cheonjiyeon.api.product.ProductService;
import com.cheonjiyeon.api.wallet.WalletService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class CreditService {
    private final CreditRepository creditRepository;
    private final CreditUsageLogRepository usageLogRepository;
    private final ProductService productService;
    private final WalletService walletService;
    private final TokenStore tokenStore;
    private final UserRepository userRepository;

    public CreditService(
            CreditRepository creditRepository,
            CreditUsageLogRepository usageLogRepository,
            ProductService productService,
            WalletService walletService,
            TokenStore tokenStore,
            UserRepository userRepository
    ) {
        this.creditRepository = creditRepository;
        this.usageLogRepository = usageLogRepository;
        this.productService = productService;
        this.walletService = walletService;
        this.tokenStore = tokenStore;
        this.userRepository = userRepository;
    }

    @Transactional
    public CreditDtos.CreditPurchaseResponse purchaseCredits(String authHeader, CreditDtos.PurchaseCreditRequest req) {
        UserEntity user = resolveUser(authHeader);
        ProductEntity product = productService.findById(req.productId());

        if (!product.getActive()) {
            throw new ApiException(400, "비활성화된 상품입니다.");
        }

        // Calculate units: 1 unit = 30 minutes
        int units = product.getMinutes() / 30;
        if (units <= 0) {
            throw new ApiException(400, "유효하지 않은 상담권 상품입니다.");
        }

        // Deduct from wallet (uses pessimistic lock internally)
        walletService.debit(user.getId(), product.getPriceKrw(), "CREDIT_PURCHASE", null);

        // Create credit record
        CreditEntity credit = new CreditEntity();
        credit.setUserId(user.getId());
        credit.setTotalUnits(units);
        credit.setRemainingUnits(units);
        credit.setProductId(product.getId());
        credit.setPurchasedAt(LocalDateTime.now());

        CreditEntity saved = creditRepository.save(credit);

        return new CreditDtos.CreditPurchaseResponse(
                saved.getId(),
                saved.getTotalUnits(),
                saved.getProductId(),
                saved.getPurchasedAt()
        );
    }

    @Transactional(readOnly = true)
    public CreditDtos.CreditBalanceResponse getMyBalance(String authHeader) {
        UserEntity user = resolveUser(authHeader);
        int totalUnits = creditRepository.sumTotalUnitsByUserId(user.getId());
        int remainingUnits = creditRepository.sumRemainingUnitsByUserId(user.getId());
        return new CreditDtos.CreditBalanceResponse(totalUnits, totalUnits - remainingUnits, remainingUnits);
    }

    @Transactional(readOnly = true)
    public CreditDtos.CreditHistoryResponse getHistory(String authHeader) {
        UserEntity user = resolveUser(authHeader);
        List<CreditEntity> credits = creditRepository.findByUserIdOrderByCreatedAtDesc(user.getId());

        List<CreditDtos.CreditHistoryItem> items = credits.stream()
                .map(c -> {
                    List<CreditUsageLogEntity> usages = usageLogRepository.findByCreditIdOrderByUsedAtDesc(c.getId());
                    return CreditDtos.CreditHistoryItem.from(c, usages);
                })
                .toList();

        return new CreditDtos.CreditHistoryResponse(items);
    }

    @Transactional
    public void reserveCredits(Long userId, Long bookingId, int units) {
        if (units <= 0) {
            throw new ApiException(400, "사용할 상담권 수량은 1 이상이어야 합니다.");
        }

        List<CreditEntity> available = creditRepository.findAvailableCreditsWithLock(userId);

        int totalAvailable = available.stream().mapToInt(CreditEntity::getRemainingUnits).sum();
        if (totalAvailable < units) {
            throw new ApiException(400, "상담권이 부족합니다. 필요: " + units + ", 보유: " + totalAvailable);
        }

        int remaining = units;
        for (CreditEntity credit : available) {
            if (remaining <= 0) break;

            int deduct = Math.min(credit.getRemainingUnits(), remaining);
            credit.setRemainingUnits(credit.getRemainingUnits() - deduct);
            creditRepository.save(credit);

            CreditUsageLogEntity log = new CreditUsageLogEntity();
            log.setCreditId(credit.getId());
            log.setBookingId(bookingId);
            log.setUnitsUsed(deduct);
            usageLogRepository.save(log);

            remaining -= deduct;
        }
    }

    @Transactional
    public void releaseCredits(Long bookingId) {
        List<CreditUsageLogEntity> usages = usageLogRepository.findByBookingId(bookingId);
        for (CreditUsageLogEntity usage : usages) {
            CreditEntity credit = creditRepository.findById(usage.getCreditId())
                    .orElseThrow(() -> new ApiException(404, "상담권을 찾을 수 없습니다."));
            credit.setRemainingUnits(credit.getRemainingUnits() + usage.getUnitsUsed());
            creditRepository.save(credit);
            usageLogRepository.delete(usage);
        }
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
