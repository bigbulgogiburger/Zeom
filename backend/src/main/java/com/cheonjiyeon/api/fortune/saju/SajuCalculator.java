package com.cheonjiyeon.api.fortune.saju;

import java.time.LocalDate;

/**
 * 사주팔자 산출 메인 엔진
 *
 * 4기둥(년주, 월주, 일주, 시주)을 계산하여 SajuChart를 생성한다.
 */
public final class SajuCalculator {

    private SajuCalculator() {}

    /**
     * 년주(年柱) 세우기
     *
     * 기준: 입춘(立春) 기준으로 연도 결정
     * 천간: (양력년도 - 3) % 10 → 천간 인덱스
     * 지지: (양력년도 - 3) % 12 → 지지 인덱스
     */
    public static SajuPillar calculateYearPillar(LocalDate solarDate) {
        int year = solarDate.getYear();

        // 입춘 이전이면 전년도 기준
        if (JeolgiData.isBeforeIpchun(solarDate)) {
            year -= 1;
        }

        int ganIndex = ((year - 3) % 10);
        if (ganIndex <= 0) ganIndex += 10;

        int jiIndex = ((year - 3) % 12);
        if (jiIndex <= 0) jiIndex += 12;

        return new SajuPillar(
            CheonganEnum.fromIndex(ganIndex),
            JijiEnum.fromIndex(jiIndex)
        );
    }

    /**
     * 월주(月柱) 세우기
     *
     * 지지: 절기 기준으로 결정 (입춘=인, 경칩=묘, ...)
     * 천간: 오호결원법(五虎遁元法) - 년간에 따라 1월(인월)의 천간 결정
     */
    public static SajuPillar calculateMonthPillar(LocalDate solarDate, CheonganEnum yearGan) {
        int sajuMonth = JeolgiData.getSajuMonth(solarDate);
        int monthJiIndex = JeolgiData.getMonthJiIndex(sajuMonth);

        // 오호결원법: 년간에 따른 1월(인월) 시작 천간
        int startGanIndex = getMonthStartGan(yearGan);

        // 사주 월 번호(1=인월)에 따라 월간 계산
        int monthGanIndex = startGanIndex + (sajuMonth - 1);
        if (monthGanIndex > 10) monthGanIndex -= 10;

        return new SajuPillar(
            CheonganEnum.fromIndex(monthGanIndex),
            JijiEnum.fromIndex(monthJiIndex)
        );
    }

    /**
     * 오호결원법(五虎遁元法) - 년간에 따른 인월(1월) 시작 천간 인덱스
     *
     * 갑/기 → 병(3)
     * 을/경 → 무(5)
     * 병/신 → 경(7)
     * 정/임 → 임(9)
     * 무/계 → 갑(1)
     */
    private static int getMonthStartGan(CheonganEnum yearGan) {
        return switch (yearGan) {
            case GAP, GI -> 3;     // 병(丙)
            case EUL, GYEONG -> 5; // 무(戊)
            case BYEONG, SIN -> 7; // 경(庚)
            case JEONG, IM -> 9;   // 임(壬)
            case MU, GYE -> 1;     // 갑(甲)
        };
    }

    /**
     * 일주(日柱) 세우기
     *
     * 만세력 알고리즘 기반 (60갑자 순환)
     */
    public static SajuPillar calculateDayPillar(LocalDate solarDate) {
        CheonganEnum dayGan = ManseryeokData.getDayGan(solarDate);
        JijiEnum dayJi = ManseryeokData.getDayJi(solarDate);
        return new SajuPillar(dayGan, dayJi);
    }

    /**
     * 시주(時柱) 세우기
     *
     * 지지: 출생 시간을 12시진으로 변환
     * 천간: 오자결원법(五子遁元法) - 일간에 따라 자시(子時)의 천간 결정
     *
     * @param birthHour 시진 이름 ("자시", "축시", ...) 또는 "unknown"
     * @param dayGan 일간(日干)
     * @return 시주 SajuPillar, birthHour가 unknown이면 null
     */
    public static SajuPillar calculateHourPillar(String birthHour, CheonganEnum dayGan) {
        JijiEnum hourJi = JijiEnum.fromSijin(birthHour);
        if (hourJi == null) return null;

        // 오자결원법
        // dx: 일간 인덱스를 5 이하로 변환 (갑기=1, 을경=2, 병신=3, 정임=4, 무계=5)
        int dayGanIndex = dayGan.getIndex();
        int dx = (dayGanIndex > 5) ? dayGanIndex - 5 : dayGanIndex;

        // hourGanIndex = hourJiIndex + ((dx - 1) * 2)
        int hourGanIndex = hourJi.getIndex() + ((dx - 1) * 2);
        while (hourGanIndex > 10) hourGanIndex -= 10;

        return new SajuPillar(
            CheonganEnum.fromIndex(hourGanIndex),
            hourJi
        );
    }

    /**
     * 전체 사주 명식 계산
     *
     * @param birthDate 양력 생년월일
     * @param birthHour 시진 ("자시"~"해시" 또는 "unknown")
     * @param gender "male" 또는 "female"
     * @return 완성된 SajuChart
     */
    public static SajuChart calculateChart(LocalDate birthDate, String birthHour, String gender) {
        SajuPillar yearPillar = calculateYearPillar(birthDate);
        SajuPillar monthPillar = calculateMonthPillar(birthDate, yearPillar.getGan());
        SajuPillar dayPillar = calculateDayPillar(birthDate);
        SajuPillar hourPillar = calculateHourPillar(birthHour, dayPillar.getGan());

        return new SajuChart(yearPillar, monthPillar, dayPillar, hourPillar);
    }
}
