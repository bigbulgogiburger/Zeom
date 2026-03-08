package com.cheonjiyeon.api.fortune;

import com.cheonjiyeon.api.auth.UserEntity;
import com.cheonjiyeon.api.auth.UserRepository;
import com.cheonjiyeon.api.fortune.saju.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class FortuneService {

    private final FortuneRepository fortuneRepository;
    private final SajuChartRepository sajuChartRepository;
    private final UserRepository userRepository;

    public FortuneService(FortuneRepository fortuneRepository,
                          SajuChartRepository sajuChartRepository,
                          UserRepository userRepository) {
        this.fortuneRepository = fortuneRepository;
        this.sajuChartRepository = sajuChartRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public FortuneEntity getOrGenerateTodayFortune(Long userId) {
        LocalDate today = LocalDate.now();
        return fortuneRepository.findByUserIdAndFortuneDate(userId, today)
                .orElseGet(() -> generateFortune(userId, today));
    }

    public List<FortuneEntity> getFortuneHistory(Long userId, int days) {
        Page<FortuneEntity> page = fortuneRepository.findByUserIdOrderByFortuneDateDesc(
                userId, PageRequest.of(0, days));
        return page.getContent();
    }

    /**
     * 사주 명식 조회 또는 계산
     */
    @Transactional
    public SajuChart getOrCalculateSajuChart(Long userId) {
        UserEntity user = userRepository.findById(userId).orElse(null);
        if (user == null || user.getBirthDate() == null) return null;

        // 캐시된 사주 명식이 있으면 복원
        SajuChartEntity cached = sajuChartRepository.findByUserId(userId).orElse(null);
        if (cached != null) {
            return restoreChart(cached);
        }

        // 사주 계산
        LocalDate solarDate = SolarLunarConverter.resolveSolarDate(
            user.getBirthDate(), user.getCalendarType(), user.getIsLeapMonth());
        String birthHour = user.getBirthHour() != null ? user.getBirthHour() : "unknown";
        String gender = user.getGender() != null ? user.getGender() : "male";

        SajuChart chart = SajuCalculator.calculateChart(solarDate, birthHour, gender);

        // 캐시 저장
        saveChartCache(userId, solarDate, birthHour, gender, chart);

        return chart;
    }

    /**
     * 사주 명식 재계산 (생년월일시 변경 시)
     */
    @Transactional
    public SajuChart recalculateSajuChart(Long userId, LocalDate birthDate, String birthHour,
                                           String calendarType, Boolean isLeapMonth, String gender) {
        LocalDate solarDate = SolarLunarConverter.resolveSolarDate(birthDate, calendarType, isLeapMonth);
        String hour = birthHour != null ? birthHour : "unknown";
        String gen = gender != null ? gender : "male";

        SajuChart chart = SajuCalculator.calculateChart(solarDate, hour, gen);

        // 기존 캐시 삭제 후 새로 저장
        sajuChartRepository.findByUserId(userId).ifPresent(existing -> sajuChartRepository.delete(existing));
        saveChartCache(userId, solarDate, hour, gen, chart);

        // 오늘 운세도 재생성 (기존 삭제)
        LocalDate today = LocalDate.now();
        fortuneRepository.findByUserIdAndFortuneDate(userId, today)
                .ifPresent(fortuneRepository::delete);

        return chart;
    }

    /**
     * 사주 명식 DTO 변환
     */
    public FortuneDtos.SajuChartResponse toChartResponse(SajuChart chart) {
        if (chart == null) return null;

        Map<String, Integer> ohaengMap = new LinkedHashMap<>();
        for (Map.Entry<OhaengEnum, Integer> entry : chart.getOhaengBalance().entrySet()) {
            ohaengMap.put(entry.getKey().getName(), entry.getValue());
        }

        return new FortuneDtos.SajuChartResponse(
            toPillarDto(chart.getYearPillar()),
            toPillarDto(chart.getMonthPillar()),
            toPillarDto(chart.getDayPillar()),
            chart.getHourPillar() != null ? toPillarDto(chart.getHourPillar()) : null,
            ohaengMap,
            chart.getDominantElement().getName(),
            chart.getWeakElement().getName()
        );
    }

    private FortuneDtos.PillarDto toPillarDto(SajuPillar pillar) {
        return new FortuneDtos.PillarDto(
            pillar.getGanName(),
            pillar.getJiName(),
            pillar.getGanHanja(),
            pillar.getJiHanja(),
            pillar.getGanOhaeng().getName(),
            pillar.getJiOhaeng().getName()
        );
    }

    private FortuneEntity generateFortune(Long userId, LocalDate date) {
        // 사주 데이터가 있는 경우 사주 기반 운세
        SajuChart chart = getOrCalculateSajuChart(userId);
        if (chart != null) {
            return generateSajuFortune(userId, date, chart);
        }

        // 사주 데이터가 없는 경우 기존 SHA-256 폴백
        return generateHashFortune(userId, date);
    }

    /**
     * 사주 기반 운세 생성
     */
    private FortuneEntity generateSajuFortune(Long userId, LocalDate date, SajuChart chart) {
        DailyFortuneCalculator.DailyFortuneResult result = DailyFortuneCalculator.calculate(chart, date);
        SipseongEnum sipseong = result.getSipseong();
        TwelveUnseongEnum unseong = result.getUnseong();

        FortuneEntity fortune = new FortuneEntity();
        fortune.setUserId(userId);
        fortune.setFortuneDate(date);
        fortune.setOverallScore(result.getOverallScore());
        fortune.setWealthScore(result.getWealthScore());
        fortune.setLoveScore(result.getLoveScore());
        fortune.setHealthScore(result.getHealthScore());

        // 사주 기반 텍스트
        fortune.setOverallText(SajuFortuneTexts.getOverallText(sipseong, result.getOverallScore()));
        fortune.setWealthText(FortuneTexts.getTextsByScore("wealth", result.getWealthScore())[
            Math.abs(result.getWealthScore()) % FortuneTexts.getTextsByScore("wealth", result.getWealthScore()).length
        ]);
        fortune.setLoveText(FortuneTexts.getTextsByScore("love", result.getLoveScore())[
            Math.abs(result.getLoveScore()) % FortuneTexts.getTextsByScore("love", result.getLoveScore()).length
        ]);
        fortune.setHealthText(FortuneTexts.getTextsByScore("health", result.getHealthScore())[
            Math.abs(result.getHealthScore()) % FortuneTexts.getTextsByScore("health", result.getHealthScore()).length
        ]);

        // 사주 확장 필드
        fortune.setDailyGanIndex(result.getTodayGan().getIndex());
        fortune.setDailyJiIndex(result.getTodayJi().getIndex());
        fortune.setTwelveUnseong(unseong.getName());
        fortune.setSipseong(sipseong.getName());
        fortune.setHarmonyType(result.getHarmonyType());
        fortune.setCareerScore(result.getCareerScore());
        fortune.setCareerText(SajuFortuneTexts.getCategoryText("career", result.getCareerScore()));
        fortune.setStudyScore(result.getStudyScore());
        fortune.setStudyText(SajuFortuneTexts.getCategoryText("study", result.getStudyScore()));

        fortune.setLuckyColor(result.getLuckyColor());
        fortune.setLuckyNumber(result.getLuckyNumber());
        fortune.setLuckyDirection(result.getLuckyDirection());
        fortune.setLuckyTime(result.getLuckyTime());
        fortune.setWarningTime(result.getWarningTime());

        fortune.setSajuInsight(SajuFortuneTexts.generateSajuInsight(
            sipseong, unseong, result.getHarmonyType(),
            chart.getDayGan(), result.getTodayGan()
        ));
        fortune.setCounselorCtaMessage(SajuFortuneTexts.getCounselorCtaMessage(
            sipseong, result.getOverallScore()
        ));

        return fortuneRepository.save(fortune);
    }

    /**
     * SHA-256 기반 폴백 운세 (기존 로직)
     */
    private FortuneEntity generateHashFortune(Long userId, LocalDate date) {
        byte[] hash = computeHash(userId, date);

        int overallScore = scoreFromHash(hash, 0);
        int wealthScore = scoreFromHash(hash, 4);
        int loveScore = scoreFromHash(hash, 8);
        int healthScore = scoreFromHash(hash, 12);

        FortuneEntity fortune = new FortuneEntity();
        fortune.setUserId(userId);
        fortune.setFortuneDate(date);
        fortune.setOverallScore(overallScore);
        fortune.setWealthScore(wealthScore);
        fortune.setLoveScore(loveScore);
        fortune.setHealthScore(healthScore);

        fortune.setOverallText(pickText("overall", overallScore, hash, 16));
        fortune.setWealthText(pickText("wealth", wealthScore, hash, 17));
        fortune.setLoveText(pickText("love", loveScore, hash, 18));
        fortune.setHealthText(pickText("health", healthScore, hash, 19));

        fortune.setLuckyColor(pickFromArray(FortuneTexts.LUCKY_COLORS, hash, 20));
        fortune.setLuckyNumber(FortuneTexts.LUCKY_NUMBERS[unsignedByte(hash[21]) % FortuneTexts.LUCKY_NUMBERS.length]);
        fortune.setLuckyDirection(pickFromArray(FortuneTexts.LUCKY_DIRECTIONS, hash, 22));

        return fortuneRepository.save(fortune);
    }

    private void saveChartCache(Long userId, LocalDate solarDate, String birthHour,
                                 String gender, SajuChart chart) {
        SajuChartEntity entity = new SajuChartEntity();
        entity.setUserId(userId);
        entity.setBirthSolarDate(solarDate);
        entity.setBirthHour(birthHour);
        entity.setGender(gender);
        entity.setYearGan(chart.getYearPillar().getGan().getIndex());
        entity.setYearJi(chart.getYearPillar().getJi().getIndex());
        entity.setMonthGan(chart.getMonthPillar().getGan().getIndex());
        entity.setMonthJi(chart.getMonthPillar().getJi().getIndex());
        entity.setDayGan(chart.getDayPillar().getGan().getIndex());
        entity.setDayJi(chart.getDayPillar().getJi().getIndex());
        if (chart.getHourPillar() != null) {
            entity.setHourGan(chart.getHourPillar().getGan().getIndex());
            entity.setHourJi(chart.getHourPillar().getJi().getIndex());
        }
        entity.setOhaengWood(chart.getOhaengBalance().getOrDefault(OhaengEnum.MOK, 0));
        entity.setOhaengFire(chart.getOhaengBalance().getOrDefault(OhaengEnum.HWA, 0));
        entity.setOhaengEarth(chart.getOhaengBalance().getOrDefault(OhaengEnum.TO, 0));
        entity.setOhaengMetal(chart.getOhaengBalance().getOrDefault(OhaengEnum.GEUM, 0));
        entity.setOhaengWater(chart.getOhaengBalance().getOrDefault(OhaengEnum.SU, 0));
        sajuChartRepository.save(entity);
    }

    private SajuChart restoreChart(SajuChartEntity entity) {
        SajuPillar yearPillar = new SajuPillar(
            CheonganEnum.fromIndex(entity.getYearGan()),
            JijiEnum.fromIndex(entity.getYearJi())
        );
        SajuPillar monthPillar = new SajuPillar(
            CheonganEnum.fromIndex(entity.getMonthGan()),
            JijiEnum.fromIndex(entity.getMonthJi())
        );
        SajuPillar dayPillar = new SajuPillar(
            CheonganEnum.fromIndex(entity.getDayGan()),
            JijiEnum.fromIndex(entity.getDayJi())
        );
        SajuPillar hourPillar = null;
        if (entity.getHourGan() != null && entity.getHourJi() != null) {
            hourPillar = new SajuPillar(
                CheonganEnum.fromIndex(entity.getHourGan()),
                JijiEnum.fromIndex(entity.getHourJi())
            );
        }
        return new SajuChart(yearPillar, monthPillar, dayPillar, hourPillar);
    }

    // === 띠별 운세 ===

    /**
     * 12지신 전체 띠별 운세 반환 (인증 불필요)
     * 날짜 기반 시드로 일관된 일일 운세 생성
     */
    public List<FortuneDtos.ZodiacFortuneResponse> getAllZodiacFortunes() {
        LocalDate today = LocalDate.now();
        return java.util.Arrays.stream(JijiEnum.values())
                .map(ji -> generateZodiacFortune(ji, today))
                .toList();
    }

    /**
     * 특정 띠 운세 반환
     */
    public FortuneDtos.ZodiacFortuneResponse getZodiacFortune(String animal) {
        JijiEnum ji = findJijiByAnimal(animal);
        return generateZodiacFortune(ji, LocalDate.now());
    }

    private FortuneDtos.ZodiacFortuneResponse generateZodiacFortune(JijiEnum ji, LocalDate date) {
        // 띠 + 날짜 기반 시드로 일관된 운세 생성
        byte[] hash = computeHash((long) ji.getIndex(), date);

        int overallScore = scoreFromHash(hash, 0);
        int wealthScore = scoreFromHash(hash, 4);
        int loveScore = scoreFromHash(hash, 8);
        int healthScore = scoreFromHash(hash, 12);

        return new FortuneDtos.ZodiacFortuneResponse(
                ji.getAnimal(),
                getAnimalEmoji(ji),
                ji.getName(),
                ji.getHanja(),
                date,
                overallScore,
                pickText("overall", overallScore, hash, 16),
                wealthScore,
                pickText("wealth", wealthScore, hash, 17),
                loveScore,
                pickText("love", loveScore, hash, 18),
                healthScore,
                pickText("health", healthScore, hash, 19),
                pickFromArray(FortuneTexts.LUCKY_COLORS, hash, 20),
                FortuneTexts.LUCKY_NUMBERS[unsignedByte(hash[21]) % FortuneTexts.LUCKY_NUMBERS.length],
                pickFromArray(FortuneTexts.LUCKY_DIRECTIONS, hash, 22)
        );
    }

    private JijiEnum findJijiByAnimal(String animal) {
        for (JijiEnum ji : JijiEnum.values()) {
            if (ji.getAnimal().equals(animal)) return ji;
        }
        throw new com.cheonjiyeon.api.common.ApiException(400, "알 수 없는 띠입니다: " + animal);
    }

    private String getAnimalEmoji(JijiEnum ji) {
        return switch (ji) {
            case JA -> "\uD83D\uDC2D";     // 쥐
            case CHUK -> "\uD83D\uDC2E";   // 소
            case IN -> "\uD83D\uDC2F";     // 호랑이
            case MYO -> "\uD83D\uDC30";    // 토끼
            case JIN -> "\uD83D\uDC09";    // 용
            case SA -> "\uD83D\uDC0D";     // 뱀
            case O -> "\uD83D\uDC34";      // 말
            case MI -> "\uD83D\uDC11";     // 양
            case SHIN -> "\uD83D\uDC12";   // 원숭이
            case YU -> "\uD83D\uDC14";     // 닭
            case SUL -> "\uD83D\uDC15";    // 개
            case HAE -> "\uD83D\uDC37";    // 돼지
        };
    }

    // === 궁합 ===

    /**
     * 두 사람의 생년월일로 궁합 점수 계산 (인증 불필요)
     * 띠 오행 기반 궁합 알고리즘
     */
    public FortuneDtos.CompatibilityResponse calculateCompatibility(LocalDate birthDate1, LocalDate birthDate2) {
        // 출생연도로 띠(지지) 결정
        JijiEnum ji1 = getYearJiji(birthDate1.getYear());
        JijiEnum ji2 = getYearJiji(birthDate2.getYear());

        OhaengEnum ohaeng1 = ji1.getOhaeng();
        OhaengEnum ohaeng2 = ji2.getOhaeng();

        String relation = ohaeng1.getRelation(ohaeng2);

        // 기본 점수: 오행 관계 기반
        int baseScore = switch (relation) {
            case "상생" -> 85;   // 내가 생해줌 → 좋음
            case "피생" -> 88;   // 상대가 생해줌 → 매우 좋음
            case "비화" -> 75;   // 같은 오행 → 무난
            case "상극" -> 50;   // 내가 극함 → 주의
            case "피극" -> 45;   // 내가 당함 → 주의
            default -> 70;
        };

        // 충(沖) 관계 감점 (인덱스 차이 6)
        boolean isChung = ji1.getChung() == ji2;
        if (isChung) baseScore -= 15;

        // 삼합(三合) 보너스 (인덱스 차이 4 또는 8)
        int diff = Math.abs(ji1.getIndex() - ji2.getIndex());
        boolean isSamhap = (diff == 4 || diff == 8);
        if (isSamhap) baseScore += 10;

        // 육합(六合) 보너스
        boolean isYukhap = isYukhapPair(ji1, ji2);
        if (isYukhap) baseScore += 12;

        int score = Math.max(20, Math.min(100, baseScore));

        // 날짜 기반 변동으로 카테고리별 점수 약간 다르게
        byte[] seed = computeHash(birthDate1.getYear() * 10000L + birthDate2.getYear(), LocalDate.now());
        int loveDelta = (unsignedByte(seed[0]) % 15) - 7;
        int workDelta = (unsignedByte(seed[1]) % 15) - 7;
        int friendDelta = (unsignedByte(seed[2]) % 15) - 7;

        int loveScore = Math.max(20, Math.min(100, score + loveDelta));
        int workScore = Math.max(20, Math.min(100, score + workDelta));
        int friendScore = Math.max(20, Math.min(100, score + friendDelta));

        return new FortuneDtos.CompatibilityResponse(
                score,
                generateCompatibilitySummary(ji1, ji2, relation, score),
                new FortuneDtos.CompatibilityCategoryScore(loveScore, generateCategoryDesc("love", relation, loveScore)),
                new FortuneDtos.CompatibilityCategoryScore(workScore, generateCategoryDesc("work", relation, workScore)),
                new FortuneDtos.CompatibilityCategoryScore(friendScore, generateCategoryDesc("friendship", relation, friendScore)),
                ji1.getAnimal(),
                ji2.getAnimal(),
                getAnimalEmoji(ji1),
                getAnimalEmoji(ji2)
        );
    }

    private JijiEnum getYearJiji(int year) {
        // 지지는 12년 주기, 자(쥐)=1 기준: (year - 4) % 12 → 0=자, 1=축, ...
        int idx = ((year - 4) % 12 + 12) % 12;
        return JijiEnum.fromIndex(idx + 1);
    }

    private boolean isYukhapPair(JijiEnum a, JijiEnum b) {
        // 육합 쌍: 자-축, 인-해, 묘-술, 진-유, 사-신, 오-미
        int[][] pairs = {{1,2},{3,12},{4,11},{5,10},{6,9},{7,8}};
        for (int[] p : pairs) {
            if ((a.getIndex() == p[0] && b.getIndex() == p[1]) ||
                (a.getIndex() == p[1] && b.getIndex() == p[0])) return true;
        }
        return false;
    }

    private String generateCompatibilitySummary(JijiEnum ji1, JijiEnum ji2, String relation, int score) {
        String animal1 = ji1.getAnimal();
        String animal2 = ji2.getAnimal();
        if (score >= 85) {
            return animal1 + "띠와 " + animal2 + "띠는 천생연분의 궁합입니다! 서로를 깊이 이해하고 보완하는 관계입니다.";
        } else if (score >= 70) {
            return animal1 + "띠와 " + animal2 + "띠는 좋은 궁합입니다. 서로 배려하며 함께 성장할 수 있는 관계예요.";
        } else if (score >= 55) {
            return animal1 + "띠와 " + animal2 + "띠는 무난한 궁합입니다. 서로의 차이를 존중하면 좋은 관계를 유지할 수 있어요.";
        } else {
            return animal1 + "띠와 " + animal2 + "띠는 노력이 필요한 궁합입니다. 상대의 입장을 이해하려는 노력이 중요합니다.";
        }
    }

    private String generateCategoryDesc(String category, String relation, int score) {
        return switch (category) {
            case "love" -> score >= 75
                ? "감정적으로 잘 통하며 서로에게 깊은 유대감을 느낄 수 있습니다."
                : score >= 55
                    ? "서로의 감정 표현 방식이 다를 수 있지만, 대화를 통해 충분히 극복 가능합니다."
                    : "감정적 교류에 약간의 어려움이 있을 수 있으니 서로의 감정에 귀 기울이세요.";
            case "work" -> score >= 75
                ? "업무적으로 시너지가 뛰어납니다. 함께 일하면 좋은 성과를 기대할 수 있어요."
                : score >= 55
                    ? "역할을 명확히 나누면 효율적으로 협력할 수 있습니다."
                    : "업무 스타일의 차이가 있으니 서로의 방식을 존중하는 것이 중요합니다.";
            case "friendship" -> score >= 75
                ? "서로에게 든든한 친구가 될 수 있습니다. 오래도록 좋은 관계를 유지할 수 있어요."
                : score >= 55
                    ? "적절한 거리를 유지하며 서로를 응원하는 관계가 될 수 있습니다."
                    : "서로의 생활 방식이 다를 수 있으니 이해와 양보가 필요합니다.";
            default -> "";
        };
    }

    // === SHA-256 helper methods (preserved for fallback) ===

    private byte[] computeHash(Long userId, LocalDate date) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            String seed = userId + ":" + date.toString();
            return digest.digest(seed.getBytes(StandardCharsets.UTF_8));
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    private int scoreFromHash(byte[] hash, int offset) {
        int value = ((unsignedByte(hash[offset]) << 24)
                | (unsignedByte(hash[offset + 1]) << 16)
                | (unsignedByte(hash[offset + 2]) << 8)
                | unsignedByte(hash[offset + 3]));
        return (Math.abs(value) % 100) + 1;
    }

    private String pickText(String category, int score, byte[] hash, int hashIdx) {
        String[] texts = FortuneTexts.getTextsByScore(category, score);
        int idx = unsignedByte(hash[hashIdx]) % texts.length;
        return texts[idx];
    }

    private String pickFromArray(String[] array, byte[] hash, int hashIdx) {
        int idx = unsignedByte(hash[hashIdx]) % array.length;
        return array[idx];
    }

    private int unsignedByte(byte b) {
        return b & 0xFF;
    }
}
