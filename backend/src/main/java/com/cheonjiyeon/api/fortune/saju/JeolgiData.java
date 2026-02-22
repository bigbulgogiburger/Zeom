package com.cheonjiyeon.api.fortune.saju;

import java.time.LocalDate;
import java.time.Month;

/**
 * 24절기 데이터 - 절기(節氣) 기준으로 월주의 지지를 결정
 *
 * 절기는 매년 날짜가 약간씩 다르지만, 근사적으로 고정 날짜를 사용.
 * 정확도를 높이려면 천문 데이터 사용 필요 (향후 확장).
 */
public final class JeolgiData {

    private JeolgiData() {}

    /**
     * 절기 경계 정보
     * 각 절기가 시작되는 월의 대략적 날짜 (양력 기준)
     * index 0=입춘(1월주), 1=경칩(2월주), ... 11=소한(12월주)
     */
    private static final int[][] JEOLGI_BOUNDARIES = {
        // {양력 월, 양력 일(대략)}
        {2, 4},   // 입춘(立春) → 인월(寅) = 사주 1월
        {3, 6},   // 경칩(驚蟄) → 묘월(卯) = 사주 2월
        {4, 5},   // 청명(清明) → 진월(辰) = 사주 3월
        {5, 6},   // 입하(立夏) → 사월(巳) = 사주 4월
        {6, 6},   // 망종(芒種) → 오월(午) = 사주 5월
        {7, 7},   // 소서(小暑) → 미월(未) = 사주 6월
        {8, 7},   // 입추(立秋) → 신월(申) = 사주 7월
        {9, 8},   // 백로(白露) → 유월(酉) = 사주 8월
        {10, 8},  // 한로(寒露) → 술월(戌) = 사주 9월
        {11, 7},  // 입동(立冬) → 해월(亥) = 사주 10월
        {12, 7},  // 대설(大雪) → 자월(子) = 사주 11월
        {1, 6},   // 소한(小寒) → 축월(丑) = 사주 12월
    };

    /**
     * 각 절기에 대응하는 지지 인덱스 (사주 월지)
     */
    private static final int[] MONTH_JI_INDEXES = {
        3,  // 인(寅) - 1월주
        4,  // 묘(卯) - 2월주
        5,  // 진(辰) - 3월주
        6,  // 사(巳) - 4월주
        7,  // 오(午) - 5월주
        8,  // 미(未) - 6월주
        9,  // 신(申) - 7월주
        10, // 유(酉) - 8월주
        11, // 술(戌) - 9월주
        12, // 해(亥) - 10월주
        1,  // 자(子) - 11월주
        2,  // 축(丑) - 12월주
    };

    /**
     * 양력 날짜로 사주 월(1~12)을 결정
     * 절기 기준: 해당 절기 날짜 이후이면 그 월, 이전이면 직전 월
     *
     * @return 사주 월 번호 (1=인월 ~ 12=축월)
     */
    public static int getSajuMonth(LocalDate solarDate) {
        int solarMonth = solarDate.getMonthValue();
        int solarDay = solarDate.getDayOfMonth();

        // 12절기를 순회하며 해당 날짜가 어느 절기 구간에 있는지 확인
        for (int i = 0; i < 12; i++) {
            int nextIdx = (i + 1) % 12;
            int[] current = JEOLGI_BOUNDARIES[i];
            int[] next = JEOLGI_BOUNDARIES[nextIdx];

            boolean afterCurrent = isOnOrAfter(solarMonth, solarDay, current[0], current[1]);
            boolean beforeNext = isBefore(solarMonth, solarDay, next[0], next[1]);

            // 특수 처리: 소한(12번째, 1월) ~ 입춘(1번째, 2월) 구간 (연말연초)
            if (i == 11) {
                // 소한(1/6) 이후 ~ 입춘(2/4) 이전
                if (afterCurrent && beforeNext) {
                    return i + 1; // 12 (축월)
                }
            } else {
                if (afterCurrent && beforeNext) {
                    return i + 1;
                }
            }
        }

        // 소한 이전 (1/1 ~ 1/5) → 전년도 12월(자월=11번째 사주월)
        if (solarMonth == 1 && solarDay < JEOLGI_BOUNDARIES[11][1]) {
            return 11; // 자월(대설~소한)
        }

        return 1; // fallback: 인월
    }

    /**
     * 사주 월 번호에 해당하는 지지 인덱스 반환
     */
    public static int getMonthJiIndex(int sajuMonth) {
        return MONTH_JI_INDEXES[sajuMonth - 1];
    }

    /**
     * 양력 날짜로 입춘 이전인지 확인 (년주 계산용)
     */
    public static boolean isBeforeIpchun(LocalDate solarDate) {
        int month = solarDate.getMonthValue();
        int day = solarDate.getDayOfMonth();
        // 입춘은 대략 2월 4일
        return month < 2 || (month == 2 && day < JEOLGI_BOUNDARIES[0][1]);
    }

    private static boolean isOnOrAfter(int m1, int d1, int m2, int d2) {
        return m1 > m2 || (m1 == m2 && d1 >= d2);
    }

    private static boolean isBefore(int m1, int d1, int m2, int d2) {
        return m1 < m2 || (m1 == m2 && d1 < d2);
    }
}
