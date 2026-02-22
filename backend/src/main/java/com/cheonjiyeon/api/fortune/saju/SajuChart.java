package com.cheonjiyeon.api.fortune.saju;

import java.util.EnumMap;
import java.util.Map;

/**
 * 사주 사기둥 완성 VO (년주, 월주, 일주, 시주 + 오행 분석)
 */
public class SajuChart {
    private final SajuPillar yearPillar;
    private final SajuPillar monthPillar;
    private final SajuPillar dayPillar;
    private final SajuPillar hourPillar; // null if unknown
    private final Map<OhaengEnum, Integer> ohaengBalance;
    private final OhaengEnum dominantElement;
    private final OhaengEnum weakElement;

    public SajuChart(SajuPillar yearPillar, SajuPillar monthPillar,
                     SajuPillar dayPillar, SajuPillar hourPillar) {
        this.yearPillar = yearPillar;
        this.monthPillar = monthPillar;
        this.dayPillar = dayPillar;
        this.hourPillar = hourPillar;
        this.ohaengBalance = calculateOhaengBalance();
        this.dominantElement = findDominant();
        this.weakElement = findWeak();
    }

    private Map<OhaengEnum, Integer> calculateOhaengBalance() {
        Map<OhaengEnum, Integer> balance = new EnumMap<>(OhaengEnum.class);
        for (OhaengEnum o : OhaengEnum.values()) {
            balance.put(o, 0);
        }

        countPillar(balance, yearPillar);
        countPillar(balance, monthPillar);
        countPillar(balance, dayPillar);
        if (hourPillar != null) {
            countPillar(balance, hourPillar);
        }

        return balance;
    }

    private void countPillar(Map<OhaengEnum, Integer> balance, SajuPillar pillar) {
        balance.merge(pillar.getGanOhaeng(), 1, Integer::sum);
        balance.merge(pillar.getJiOhaeng(), 1, Integer::sum);
    }

    private OhaengEnum findDominant() {
        OhaengEnum dominant = OhaengEnum.MOK;
        int max = 0;
        for (Map.Entry<OhaengEnum, Integer> entry : ohaengBalance.entrySet()) {
            if (entry.getValue() > max) {
                max = entry.getValue();
                dominant = entry.getKey();
            }
        }
        return dominant;
    }

    private OhaengEnum findWeak() {
        OhaengEnum weak = OhaengEnum.MOK;
        int min = Integer.MAX_VALUE;
        for (Map.Entry<OhaengEnum, Integer> entry : ohaengBalance.entrySet()) {
            if (entry.getValue() < min) {
                min = entry.getValue();
                weak = entry.getKey();
            }
        }
        return weak;
    }

    public SajuPillar getYearPillar() { return yearPillar; }
    public SajuPillar getMonthPillar() { return monthPillar; }
    public SajuPillar getDayPillar() { return dayPillar; }
    public SajuPillar getHourPillar() { return hourPillar; }
    public Map<OhaengEnum, Integer> getOhaengBalance() { return ohaengBalance; }
    public OhaengEnum getDominantElement() { return dominantElement; }
    public OhaengEnum getWeakElement() { return weakElement; }

    /**
     * 일간(日干) - "나 자신"을 대표
     */
    public CheonganEnum getDayGan() {
        return dayPillar.getGan();
    }
}
