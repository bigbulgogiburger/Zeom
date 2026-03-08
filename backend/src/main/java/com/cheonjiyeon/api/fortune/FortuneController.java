package com.cheonjiyeon.api.fortune;

import com.cheonjiyeon.api.auth.TokenStore;
import com.cheonjiyeon.api.auth.UserRepository;
import com.cheonjiyeon.api.common.ApiException;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
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

    // === 띠별 운세 (인증 불필요) ===

    @GetMapping("/zodiac")
    public FortuneDtos.ZodiacListResponse getAllZodiacFortunes() {
        return new FortuneDtos.ZodiacListResponse(
                fortuneService.getAllZodiacFortunes(),
                java.time.LocalDate.now()
        );
    }

    @GetMapping("/zodiac/{animal}")
    public FortuneDtos.ZodiacFortuneResponse getZodiacFortune(@PathVariable String animal) {
        return fortuneService.getZodiacFortune(animal);
    }

    // === 궁합 (인증 불필요) ===

    @PostMapping("/compatibility")
    public FortuneDtos.CompatibilityResponse getCompatibility(
            @RequestBody FortuneDtos.CompatibilityRequest request
    ) {
        if (request.birthDate1() == null || request.birthDate2() == null) {
            throw new ApiException(400, "두 사람의 생년월일을 모두 입력해주세요.");
        }
        try {
            LocalDate date1 = LocalDate.parse(request.birthDate1());
            LocalDate date2 = LocalDate.parse(request.birthDate2());
            return fortuneService.calculateCompatibility(date1, date2);
        } catch (DateTimeParseException e) {
            throw new ApiException(400, "날짜 형식이 올바르지 않습니다. YYYY-MM-DD 형식으로 입력해주세요.");
        }
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
