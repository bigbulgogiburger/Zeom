package com.cheonjiyeon.api.fortune;

import com.cheonjiyeon.api.auth.TokenStore;
import com.cheonjiyeon.api.auth.UserRepository;
import com.cheonjiyeon.api.common.ApiException;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/fortune")
public class FortuneController {

    private final FortuneService fortuneService;
    private final TokenStore tokenStore;
    private final UserRepository userRepository;

    public FortuneController(FortuneService fortuneService, TokenStore tokenStore, UserRepository userRepository) {
        this.fortuneService = fortuneService;
        this.tokenStore = tokenStore;
        this.userRepository = userRepository;
    }

    @GetMapping("/today")
    public FortuneDtos.FortuneResponse getTodayFortune(
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        Long userId = resolveUserId(authHeader);
        FortuneEntity fortune = fortuneService.getOrGenerateTodayFortune(userId);
        return FortuneDtos.FortuneResponse.from(fortune);
    }

    @GetMapping("/summary")
    public FortuneDtos.FortuneSummaryResponse getFortuneSummary(
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        Long userId = resolveUserId(authHeader);
        FortuneEntity fortune = fortuneService.getOrGenerateTodayFortune(userId);
        return FortuneDtos.FortuneSummaryResponse.from(fortune);
    }

    @GetMapping("/history")
    public FortuneDtos.FortuneHistoryResponse getFortuneHistory(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(defaultValue = "7") int days
    ) {
        Long userId = resolveUserId(authHeader);
        List<FortuneEntity> fortunes = fortuneService.getFortuneHistory(userId, days);
        return new FortuneDtos.FortuneHistoryResponse(
                fortunes.stream().map(FortuneDtos.FortuneResponse::from).toList(),
                fortunes.size()
        );
    }

    private Long resolveUserId(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new ApiException(401, "Authorization Bearer 토큰이 필요합니다.");
        }
        String token = authHeader.substring(7);
        Long userId = tokenStore.resolveAccessUserId(token)
                .orElseThrow(() -> new ApiException(401, "로그인이 필요합니다."));
        // Verify user exists
        userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(401, "유효하지 않은 토큰입니다."));
        return userId;
    }
}
