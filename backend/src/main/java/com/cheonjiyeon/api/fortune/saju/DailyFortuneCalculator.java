package com.cheonjiyeon.api.fortune.saju;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

/**
 * 사주 기반 오늘의 운세 산출 엔진
 *
 * 핵심 원리: 오늘 일진의 천간/지지와 사용자 사주팔자의 상호작용 분석
 */
public final class DailyFortuneCalculator {

    private DailyFortuneCalculator() {}

    /**
     * 사주 기반 일일 운세 계산
     */
    public static DailyFortuneResult calculate(SajuChart chart, LocalDate today) {
        CheonganEnum dayGan = chart.getDayGan();
        CheonganEnum todayGan = ManseryeokData.getDayGan(today);
        JijiEnum todayJi = ManseryeokData.getDayJi(today);

        // 십성 관계
        SipseongEnum sipseong = SipseongEnum.calculate(dayGan, todayGan);

        // 12운성
        TwelveUnseongEnum unseong = TwelveUnseongEnum.calculate(dayGan, todayJi);

        // 합충 관계
        String harmonyType = checkHarmony(todayJi, chart);

        // 총운 점수 계산
        int overallScore = calculateOverallScore(sipseong, unseong, harmonyType, dayGan, todayGan);

        // 카테고리별 점수 계산
        int wealthScore = calculateCategoryScore(overallScore, sipseong, "wealth");
        int loveScore = calculateCategoryScore(overallScore, sipseong, "love");
        int healthScore = calculateCategoryScore(overallScore, sipseong, "health");
        int careerScore = calculateCategoryScore(overallScore, sipseong, "career");
        int studyScore = calculateCategoryScore(overallScore, sipseong, "study");

        // 럭키 정보
        String luckyColor = determineLuckyColor(dayGan, todayGan);
        int luckyNumber = determineLuckyNumber(dayGan, todayJi);
        String luckyDirection = determineLuckyDirection(dayGan);
        String luckyTime = determineLuckyTime(dayGan);
        String warningTime = determineWarningTime(dayGan);

        return new DailyFortuneResult(
            overallScore, wealthScore, loveScore, healthScore, careerScore, studyScore,
            sipseong, unseong, harmonyType,
            todayGan, todayJi,
            luckyColor, luckyNumber, luckyDirection, luckyTime, warningTime
        );
    }

    /**
     * 총운 점수 계산
     * base(50) + 12운성 weight + 십성 bonus + 합충 correction
     */
    private static int calculateOverallScore(SipseongEnum sipseong, TwelveUnseongEnum unseong,
                                              String harmonyType, CheonganEnum dayGan, CheonganEnum todayGan) {
        int score = 50;

        // 12운성 가중치
        score += unseong.getScoreWeight();

        // 십성 관계 보너스
        String ohaengRelation = dayGan.getOhaeng().getRelation(todayGan.getOhaeng());
        score += switch (ohaengRelation) {
            case "상생", "피생" -> 15;
            case "비화" -> 5;
            case "상극", "피극" -> -10;
            default -> 0;
        };

        // 합충형파해 보정
        score += switch (harmonyType) {
            case "삼합" -> 20;
            case "육합" -> 10;
            case "충" -> -15;
            case "형" -> -10;
            case "파" -> -8;
            case "해" -> -5;
            default -> 0;
        };

        return clamp(score, 1, 100);
    }

    /**
     * 카테고리별 점수 계산
     */
    private static int calculateCategoryScore(int overallScore, SipseongEnum sipseong, String category) {
        int adjustment = 0;

        switch (category) {
            case "wealth":
                adjustment = switch (sipseong) {
                    case PYEONJAE, JEONGJAE -> 10;   // 재성 활성
                    case GEOPJAE -> -8;              // 겁재 = 손재
                    case SIKSIN -> 5;                // 식신생재
                    default -> 0;
                };
                break;
            case "love":
                adjustment = switch (sipseong) {
                    case JEONGGWAN, PYEONGWAN -> 8;  // 관성 = 배우자
                    case JEONGIN -> 5;               // 정인 = 지원
                    case SANGGWAN -> -5;             // 상관 = 관계 변동
                    default -> 0;
                };
                break;
            case "health":
                adjustment = switch (sipseong) {
                    case BIGYEON, GEOPJAE -> 5;      // 비겁 = 체력
                    case PYEONGWAN -> -8;            // 편관 = 압박
                    case JEONGIN, PYEONIN -> 3;      // 인성 = 보호
                    default -> 0;
                };
                break;
            case "career":
                adjustment = switch (sipseong) {
                    case JEONGGWAN -> 10;            // 정관 = 명예
                    case PYEONGWAN -> 5;             // 편관 = 권위
                    case SIKSIN, SANGGWAN -> 7;      // 식상 = 재능
                    default -> 0;
                };
                break;
            case "study":
                adjustment = switch (sipseong) {
                    case JEONGIN, PYEONIN -> 10;     // 인성 = 학업
                    case SIKSIN -> 5;                // 식신 = 표현력
                    case GEOPJAE -> -5;              // 겁재 = 산만
                    default -> 0;
                };
                break;
        }

        return clamp(overallScore + adjustment, 1, 100);
    }

    /**
     * 합충형파해 체크
     */
    private static String checkHarmony(JijiEnum todayJi, SajuChart chart) {
        // 충(沖) 체크 - 인덱스 차이 6
        if (isChung(todayJi, chart)) return "충";

        // 육합(六合) 체크
        if (isYukhap(todayJi, chart)) return "육합";

        // 삼합(三合) 체크
        if (isSamhap(todayJi, chart)) return "삼합";

        // 형(刑) 체크
        if (isHyeong(todayJi, chart)) return "형";

        // 파(破) 체크
        if (isPa(todayJi, chart)) return "파";

        // 해(害) 체크
        if (isHae(todayJi, chart)) return "해";

        return "없음";
    }

    private static boolean isChung(JijiEnum todayJi, SajuChart chart) {
        JijiEnum chungJi = todayJi.getChung();
        return matchesAnyJi(chungJi, chart);
    }

    /**
     * 육합 쌍: 자-축, 인-해, 묘-술, 진-유, 사-신, 오-미
     */
    private static final int[][] YUKHAP_PAIRS = {
        {1, 2}, {3, 12}, {4, 11}, {5, 10}, {6, 9}, {7, 8}
    };

    private static boolean isYukhap(JijiEnum todayJi, SajuChart chart) {
        for (int[] pair : YUKHAP_PAIRS) {
            int partner = -1;
            if (todayJi.getIndex() == pair[0]) partner = pair[1];
            else if (todayJi.getIndex() == pair[1]) partner = pair[0];
            if (partner > 0 && matchesAnyJi(JijiEnum.fromIndex(partner), chart)) return true;
        }
        return false;
    }

    /**
     * 삼합 조: 인오술(화), 해묘미(목), 신자진(수), 사유축(금)
     */
    private static final int[][] SAMHAP_GROUPS = {
        {3, 7, 11},  // 인오술 (화국)
        {12, 4, 8},  // 해묘미 (목국)
        {9, 1, 5},   // 신자진 (수국)
        {6, 10, 2},  // 사유축 (금국)
    };

    private static boolean isSamhap(JijiEnum todayJi, SajuChart chart) {
        for (int[] group : SAMHAP_GROUPS) {
            boolean todayInGroup = false;
            int matchCount = 0;
            for (int idx : group) {
                if (todayJi.getIndex() == idx) todayInGroup = true;
                if (matchesAnyJi(JijiEnum.fromIndex(idx), chart)) matchCount++;
            }
            if (todayInGroup && matchCount >= 2) return true;
        }
        return false;
    }

    /**
     * 형(刑) 쌍: 인-사, 사-신, 축-술, 축-미, 자-묘
     */
    private static final int[][] HYEONG_PAIRS = {
        {3, 6}, {6, 9}, {2, 11}, {2, 8}, {1, 4}
    };

    private static boolean isHyeong(JijiEnum todayJi, SajuChart chart) {
        for (int[] pair : HYEONG_PAIRS) {
            int partner = -1;
            if (todayJi.getIndex() == pair[0]) partner = pair[1];
            else if (todayJi.getIndex() == pair[1]) partner = pair[0];
            if (partner > 0 && matchesAnyJi(JijiEnum.fromIndex(partner), chart)) return true;
        }
        return false;
    }

    /**
     * 파(破) 쌍: 자-유, 축-진, 인-해, 묘-오, 사-신, 미-술
     */
    private static final int[][] PA_PAIRS = {
        {1, 10}, {2, 5}, {3, 12}, {4, 7}, {6, 9}, {8, 11}
    };

    private static boolean isPa(JijiEnum todayJi, SajuChart chart) {
        for (int[] pair : PA_PAIRS) {
            int partner = -1;
            if (todayJi.getIndex() == pair[0]) partner = pair[1];
            else if (todayJi.getIndex() == pair[1]) partner = pair[0];
            if (partner > 0 && matchesAnyJi(JijiEnum.fromIndex(partner), chart)) return true;
        }
        return false;
    }

    /**
     * 해(害) 쌍: 자-미, 축-오, 인-사, 묘-진, 신-해, 유-술
     */
    private static final int[][] HAE_PAIRS = {
        {1, 8}, {2, 7}, {3, 6}, {4, 5}, {9, 12}, {10, 11}
    };

    private static boolean isHae(JijiEnum todayJi, SajuChart chart) {
        for (int[] pair : HAE_PAIRS) {
            int partner = -1;
            if (todayJi.getIndex() == pair[0]) partner = pair[1];
            else if (todayJi.getIndex() == pair[1]) partner = pair[0];
            if (partner > 0 && matchesAnyJi(JijiEnum.fromIndex(partner), chart)) return true;
        }
        return false;
    }

    private static boolean matchesAnyJi(JijiEnum target, SajuChart chart) {
        if (chart.getYearPillar().getJi() == target) return true;
        if (chart.getMonthPillar().getJi() == target) return true;
        if (chart.getDayPillar().getJi() == target) return true;
        if (chart.getHourPillar() != null && chart.getHourPillar().getJi() == target) return true;
        return false;
    }

    private static String determineLuckyColor(CheonganEnum dayGan, CheonganEnum todayGan) {
        // 일간의 용신(부족한 오행) 색상
        OhaengEnum needed = dayGan.getOhaeng().getSangsaeng(); // 내가 생하는 오행의 생을 도우는 색
        return switch (needed) {
            case MOK -> "초록";
            case HWA -> "빨강";
            case TO -> "노랑";
            case GEUM -> "하양";
            case SU -> "검정";
        };
    }

    private static int determineLuckyNumber(CheonganEnum dayGan, JijiEnum todayJi) {
        return ((dayGan.getIndex() + todayJi.getIndex()) % 9) + 1;
    }

    private static String determineLuckyDirection(CheonganEnum dayGan) {
        return switch (dayGan.getOhaeng()) {
            case MOK -> "동쪽";
            case HWA -> "남쪽";
            case TO -> "중앙";
            case GEUM -> "서쪽";
            case SU -> "북쪽";
        };
    }

    private static String determineLuckyTime(CheonganEnum dayGan) {
        // 일간과 상생하는 시간대
        OhaengEnum luckyOhaeng = dayGan.getOhaeng(); // 비화 또는 피생
        for (JijiEnum ji : JijiEnum.values()) {
            if (ji.getOhaeng() == luckyOhaeng.getSangsaeng()) {
                // 내가 생하는 오행이 활성화되는 시간 = 식신시
                return ji.getName() + "시 (" + ji.getTimeRange() + ")";
            }
        }
        return "오시 (11:30~13:30)";
    }

    private static String determineWarningTime(CheonganEnum dayGan) {
        // 일간을 극하는 오행의 시간대
        OhaengEnum dangerOhaeng = dayGan.getOhaeng();
        for (JijiEnum ji : JijiEnum.values()) {
            if (ji.getOhaeng().getSanggeuk() == dangerOhaeng) {
                return ji.getName() + "시 (" + ji.getTimeRange() + ")";
            }
        }
        return "해시 (21:30~23:30)";
    }

    private static int clamp(int value, int min, int max) {
        return Math.max(min, Math.min(max, value));
    }

    /**
     * 운세 계산 결과 VO
     */
    public static class DailyFortuneResult {
        private final int overallScore;
        private final int wealthScore;
        private final int loveScore;
        private final int healthScore;
        private final int careerScore;
        private final int studyScore;
        private final SipseongEnum sipseong;
        private final TwelveUnseongEnum unseong;
        private final String harmonyType;
        private final CheonganEnum todayGan;
        private final JijiEnum todayJi;
        private final String luckyColor;
        private final int luckyNumber;
        private final String luckyDirection;
        private final String luckyTime;
        private final String warningTime;

        public DailyFortuneResult(int overallScore, int wealthScore, int loveScore,
                                   int healthScore, int careerScore, int studyScore,
                                   SipseongEnum sipseong, TwelveUnseongEnum unseong,
                                   String harmonyType, CheonganEnum todayGan, JijiEnum todayJi,
                                   String luckyColor, int luckyNumber, String luckyDirection,
                                   String luckyTime, String warningTime) {
            this.overallScore = overallScore;
            this.wealthScore = wealthScore;
            this.loveScore = loveScore;
            this.healthScore = healthScore;
            this.careerScore = careerScore;
            this.studyScore = studyScore;
            this.sipseong = sipseong;
            this.unseong = unseong;
            this.harmonyType = harmonyType;
            this.todayGan = todayGan;
            this.todayJi = todayJi;
            this.luckyColor = luckyColor;
            this.luckyNumber = luckyNumber;
            this.luckyDirection = luckyDirection;
            this.luckyTime = luckyTime;
            this.warningTime = warningTime;
        }

        public int getOverallScore() { return overallScore; }
        public int getWealthScore() { return wealthScore; }
        public int getLoveScore() { return loveScore; }
        public int getHealthScore() { return healthScore; }
        public int getCareerScore() { return careerScore; }
        public int getStudyScore() { return studyScore; }
        public SipseongEnum getSipseong() { return sipseong; }
        public TwelveUnseongEnum getUnseong() { return unseong; }
        public String getHarmonyType() { return harmonyType; }
        public CheonganEnum getTodayGan() { return todayGan; }
        public JijiEnum getTodayJi() { return todayJi; }
        public String getLuckyColor() { return luckyColor; }
        public int getLuckyNumber() { return luckyNumber; }
        public String getLuckyDirection() { return luckyDirection; }
        public String getLuckyTime() { return luckyTime; }
        public String getWarningTime() { return warningTime; }
    }
}
