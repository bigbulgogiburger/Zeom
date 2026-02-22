package com.cheonjiyeon.api.fortune.saju;

/**
 * 12운성(十二運星) - 일간이 지지를 만났을 때의 에너지 상태
 */
public enum TwelveUnseongEnum {
    JANGSAENG("장생", "長生", 8, "새 시작, 활력"),
    MOKYOK("목욕", "沐浴", 3, "변화, 유혹 주의"),
    GWANDAE("관대", "冠帶", 7, "자신감, 발전"),
    GEONROK("건록", "乾祿", 9, "왕성한 활동"),
    JEWANG("제왕", "帝旺", 10, "최고점, 과욕 주의"),
    SOE("쇠", "衰", -2, "안정 추구, 무리 금지"),
    BYEONG("병", "病", -5, "건강 관리"),
    SA("사", "死", -7, "전환기, 내면 성찰"),
    MYO("묘", "墓", -4, "정리, 축적"),
    JEOL("절", "絶", -8, "큰 변화, 위기=기회"),
    TAE("태", "胎", 2, "준비, 계획"),
    YANG("양", "養", 5, "성장 준비, 학습");

    private final String name;
    private final String hanja;
    private final int scoreWeight;
    private final String keyword;

    TwelveUnseongEnum(String name, String hanja, int scoreWeight, String keyword) {
        this.name = name;
        this.hanja = hanja;
        this.scoreWeight = scoreWeight;
        this.keyword = keyword;
    }

    public String getName() { return name; }
    public String getHanja() { return hanja; }
    public int getScoreWeight() { return scoreWeight; }
    public String getKeyword() { return keyword; }

    /**
     * 12운성 조견표 (일간 x 지지)
     * 행: 천간(갑~계, index 0~9), 열: 지지(자~해, index 0~11)
     * 순서: 장생, 목욕, 관대, 건록, 제왕, 쇠, 병, 사, 묘, 절, 태, 양
     */
    private static final int[][] UNSEONG_TABLE = {
        // 갑(甲, 양목): 장생=해(12), 역순으로 자=목욕
        {1, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 0},  // 갑
        {6, 4, 3, 2, 1, 0, 11, 10, 9, 8, 7, 5},   // 을
        {2, 0, 11, 10, 9, 8, 7, 6, 5, 4, 3, 1},   // 병
        {7, 5, 4, 3, 2, 1, 0, 11, 10, 9, 8, 6},   // 정
        {2, 0, 11, 10, 9, 8, 7, 6, 5, 4, 3, 1},   // 무
        {7, 5, 4, 3, 2, 1, 0, 11, 10, 9, 8, 6},   // 기
        {5, 3, 2, 1, 0, 11, 10, 9, 8, 7, 6, 4},   // 경
        {0, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 11},   // 신
        {8, 6, 5, 4, 3, 2, 1, 0, 11, 10, 9, 7},   // 임
        {3, 1, 0, 11, 10, 9, 8, 7, 6, 5, 4, 2},   // 계
    };

    private static final TwelveUnseongEnum[] ORDERED = {
        JANGSAENG, MOKYOK, GWANDAE, GEONROK, JEWANG, SOE,
        BYEONG, SA, MYO, JEOL, TAE, YANG
    };

    /**
     * 일간(天干)이 특정 지지(地支)를 만났을 때의 12운성
     */
    public static TwelveUnseongEnum calculate(CheonganEnum dayGan, JijiEnum ji) {
        int ganIdx = dayGan.getIndex() - 1; // 0-based
        int jiIdx = ji.getIndex() - 1;      // 0-based
        int unseongIdx = UNSEONG_TABLE[ganIdx][jiIdx];
        return ORDERED[unseongIdx];
    }
}
