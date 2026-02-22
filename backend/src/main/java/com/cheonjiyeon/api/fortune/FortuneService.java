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
