package com.cheonjiyeon.api.fortune;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.util.List;

@Service
public class FortuneService {

    private final FortuneRepository fortuneRepository;

    public FortuneService(FortuneRepository fortuneRepository) {
        this.fortuneRepository = fortuneRepository;
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

    private FortuneEntity generateFortune(Long userId, LocalDate date) {
        // 결정론적 해시: 같은 userId + 같은 날짜 = 항상 같은 결과
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

    /**
     * userId + date 문자열로 SHA-256 해시 생성
     */
    private byte[] computeHash(Long userId, LocalDate date) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            String seed = userId + ":" + date.toString();
            return digest.digest(seed.getBytes(StandardCharsets.UTF_8));
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    /**
     * 해시 바이트 4개를 사용하여 1-100 범위의 점수 생성
     */
    private int scoreFromHash(byte[] hash, int offset) {
        int value = ((unsignedByte(hash[offset]) << 24)
                | (unsignedByte(hash[offset + 1]) << 16)
                | (unsignedByte(hash[offset + 2]) << 8)
                | unsignedByte(hash[offset + 3]));
        return (Math.abs(value) % 100) + 1;
    }

    /**
     * 카테고리와 점수에 맞는 텍스트 배열에서 해시 기반으로 하나 선택
     */
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
