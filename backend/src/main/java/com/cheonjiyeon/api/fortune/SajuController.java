package com.cheonjiyeon.api.fortune;

import com.cheonjiyeon.api.auth.TokenStore;
import com.cheonjiyeon.api.auth.UserEntity;
import com.cheonjiyeon.api.auth.UserRepository;
import com.cheonjiyeon.api.common.ApiException;
import com.cheonjiyeon.api.fortune.saju.SajuChart;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/saju")
public class SajuController {

    private final FortuneService fortuneService;
    private final TokenStore tokenStore;
    private final UserRepository userRepository;

    public SajuController(FortuneService fortuneService, TokenStore tokenStore, UserRepository userRepository) {
        this.fortuneService = fortuneService;
        this.tokenStore = tokenStore;
        this.userRepository = userRepository;
    }

    /**
     * 내 사주 명식 조회
     */
    @GetMapping("/my-chart")
    public FortuneDtos.SajuChartResponse getMyChart(
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        Long userId = resolveUserId(authHeader);
        SajuChart chart = fortuneService.getOrCalculateSajuChart(userId);
        if (chart == null) {
            throw new ApiException(400, "생년월일 정보가 없습니다. 먼저 생년월일을 입력해주세요.");
        }
        return fortuneService.toChartResponse(chart);
    }

    /**
     * 생년월일시 수정 (사주 재계산)
     */
    @PutMapping("/birth-info")
    @Transactional
    public FortuneDtos.SajuChartResponse updateBirthInfo(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody FortuneDtos.BirthInfoRequest req
    ) {
        Long userId = resolveUserId(authHeader);
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(401, "유효하지 않은 사용자입니다."));

        // 사용자 정보 업데이트
        if (req.birthDate() != null && !req.birthDate().isBlank()) {
            user.setBirthDate(LocalDate.parse(req.birthDate()));
        }
        if (req.birthHour() != null) {
            user.setBirthHour(req.birthHour());
        }
        if (req.calendarType() != null) {
            user.setCalendarType(req.calendarType());
        }
        if (req.isLeapMonth() != null) {
            user.setIsLeapMonth(req.isLeapMonth());
        }
        if (req.gender() != null) {
            user.setGender(req.gender());
        }
        userRepository.save(user);

        if (user.getBirthDate() == null) {
            throw new ApiException(400, "생년월일을 입력해주세요.");
        }

        // 사주 재계산
        SajuChart chart = fortuneService.recalculateSajuChart(
            userId, user.getBirthDate(), user.getBirthHour(),
            user.getCalendarType(), user.getIsLeapMonth(), user.getGender()
        );

        return fortuneService.toChartResponse(chart);
    }

    private Long resolveUserId(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new ApiException(401, "Authorization Bearer 토큰이 필요합니다.");
        }
        String token = authHeader.substring(7);
        Long userId = tokenStore.resolveAccessUserId(token)
                .orElseThrow(() -> new ApiException(401, "로그인이 필요합니다."));
        userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(401, "유효하지 않은 토큰입니다."));
        return userId;
    }
}
