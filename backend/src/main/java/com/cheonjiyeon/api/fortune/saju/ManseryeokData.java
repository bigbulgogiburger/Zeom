package com.cheonjiyeon.api.fortune.saju;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/**
 * 만세력 데이터 - 일주(日柱) 산출
 *
 * 일진은 60갑자가 순환하는 고정 패턴이므로,
 * 기준일로부터의 offset을 계산하여 일간/일지를 알 수 있다.
 *
 * 기준일: 2000-01-01 = 갑진(甲辰)일 (간=1, 지=5)
 */
public final class ManseryeokData {

    private ManseryeokData() {}

    // 2000-01-01 기준일
    private static final LocalDate REFERENCE_DATE = LocalDate.of(2000, 1, 1);
    // 2000-01-01의 천간 인덱스 (갑=1)
    private static final int REFERENCE_GAN_INDEX = 1; // 甲
    // 2000-01-01의 지지 인덱스 (진=5)
    private static final int REFERENCE_JI_INDEX = 5;  // 辰

    /**
     * 양력 날짜의 일간(日干) 인덱스 (1~10) 계산
     */
    public static int getDayGanIndex(LocalDate solarDate) {
        long days = ChronoUnit.DAYS.between(REFERENCE_DATE, solarDate);
        int ganIndex = (int) (((days % 10) + 10) % 10) + REFERENCE_GAN_INDEX;
        if (ganIndex > 10) ganIndex -= 10;
        return ganIndex;
    }

    /**
     * 양력 날짜의 일지(日支) 인덱스 (1~12) 계산
     */
    public static int getDayJiIndex(LocalDate solarDate) {
        long days = ChronoUnit.DAYS.between(REFERENCE_DATE, solarDate);
        int jiIndex = (int) (((days % 12) + 12) % 12) + REFERENCE_JI_INDEX;
        if (jiIndex > 12) jiIndex -= 12;
        return jiIndex;
    }

    /**
     * 양력 날짜의 일간 천간 반환
     */
    public static CheonganEnum getDayGan(LocalDate solarDate) {
        return CheonganEnum.fromIndex(getDayGanIndex(solarDate));
    }

    /**
     * 양력 날짜의 일지 지지 반환
     */
    public static JijiEnum getDayJi(LocalDate solarDate) {
        return JijiEnum.fromIndex(getDayJiIndex(solarDate));
    }
}
