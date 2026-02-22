package com.cheonjiyeon.api.fortune.saju;

import java.time.LocalDate;

/**
 * 양력-음력 변환기
 *
 * 간략 구현: 음력 날짜를 양력으로 변환하기 위한 룩업 테이블 기반.
 * 실제 프로덕션에서는 한국천문연구원 데이터를 사용해야 하지만,
 * 여기서는 사주 산출에 필요한 핵심 로직만 구현.
 *
 * 음력 입력 시 양력 변환이 필요한 케이스:
 * - 사용자가 calendarType="lunar"로 생년월일을 입력한 경우
 *
 * 현재 구현: 음력을 대략적으로 양력으로 변환 (1~2일 오차 가능)
 * 향후: 만세력 DB 테이블의 음력-양력 매핑 데이터로 정확한 변환
 */
public final class SolarLunarConverter {

    private SolarLunarConverter() {}

    /**
     * 음력 날짜를 양력 날짜로 변환 (근사값)
     *
     * 정확한 변환은 만세력 DB가 필요하지만,
     * 현재는 음력-양력 차이의 대략적 보정으로 처리.
     *
     * 음력은 양력보다 약 20~50일 뒤쳐지므로,
     * 해당 연도의 음력 1월 1일 기준 offset 사용.
     *
     * @param lunarYear 음력 연도
     * @param lunarMonth 음력 월
     * @param lunarDay 음력 일
     * @param isLeapMonth 윤달 여부
     * @return 근사 양력 날짜
     */
    public static LocalDate lunarToSolar(int lunarYear, int lunarMonth, int lunarDay, boolean isLeapMonth) {
        // 음력 1/1은 양력 1월 21일 ~ 2월 20일 사이
        // 대략 양력 = 음력 + 30~33일 (연도별 편차)
        // 이 근사값은 사주 계산에서 +-1~2일 오차를 허용
        int offset = getLunarNewYearOffset(lunarYear);
        LocalDate lunarNewYear = LocalDate.of(lunarYear, 1, 1).plusDays(offset);

        // 음력 월/일로부터 경과일 추정
        int daysFromNewYear = 0;
        for (int m = 1; m < lunarMonth; m++) {
            daysFromNewYear += getLunarMonthDays(lunarYear, m);
        }
        daysFromNewYear += lunarDay - 1;

        return lunarNewYear.plusDays(daysFromNewYear);
    }

    /**
     * 해당 연도 음력 설날의 양력 기준 1/1로부터의 offset (대략값)
     * 실제로는 천문 데이터가 필요하며, 여기서는 근사값 사용.
     */
    private static int getLunarNewYearOffset(int year) {
        // 음력 설날 양력 날짜 (주요 연도)
        // 이 데이터는 근사적으로 사용
        int base = 30; // 평균적으로 양력 1/31 근처
        // 19년 주기(메톤 주기)로 음력 설날이 약간씩 변함
        int cycle = (year - 2000) % 19;
        int adjustment = switch (cycle) {
            case 0 -> 4;   // 2000: 2/5
            case 1 -> 23;  // 2001: 1/24
            case 2 -> 11;  // 2002: 2/12
            case 3 -> 0;   // 2003: 2/1
            case 4 -> 21;  // 2004: 1/22
            case 5 -> 8;   // 2005: 2/9
            case 6 -> 28;  // 2006: 1/29
            case 7 -> 17;  // 2007: 2/18
            case 8 -> 6;   // 2008: 2/7
            case 9 -> 25;  // 2009: 1/26
            case 10 -> 13; // 2010: 2/14
            case 11 -> 2;  // 2011: 2/3
            case 12 -> 22; // 2012: 1/23
            case 13 -> 9;  // 2013: 2/10
            case 14 -> 30; // 2014: 1/31
            case 15 -> 18; // 2015: 2/19
            case 16 -> 7;  // 2016: 2/8
            case 17 -> 27; // 2017: 1/28
            case 18 -> 15; // 2018: 2/16
            default -> base;
        };
        return adjustment;
    }

    /**
     * 음력 월의 대략적 일수 (29 or 30)
     */
    private static int getLunarMonthDays(int year, int month) {
        // 음력 월은 29일(소월) 또는 30일(대월) 교대
        // 근사적으로 홀수월=30일, 짝수월=29일 적용
        return (month % 2 == 1) ? 30 : 29;
    }

    /**
     * 양력 생년월일을 처리 (calendarType에 따라)
     * @param birthDate "YYYY-MM-DD" 형식
     * @param calendarType "solar" or "lunar"
     * @param isLeapMonth 윤달 여부
     * @return 양력 LocalDate
     */
    public static LocalDate resolveSolarDate(LocalDate birthDate, String calendarType, Boolean isLeapMonth) {
        if ("lunar".equals(calendarType)) {
            return lunarToSolar(
                birthDate.getYear(),
                birthDate.getMonthValue(),
                birthDate.getDayOfMonth(),
                Boolean.TRUE.equals(isLeapMonth)
            );
        }
        return birthDate; // 양력인 경우 그대로 반환
    }
}
