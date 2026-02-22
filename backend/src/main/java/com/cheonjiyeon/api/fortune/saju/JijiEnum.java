package com.cheonjiyeon.api.fortune.saju;

/**
 * 지지(地支) - 12개의 땅 가지
 * 인덱스 1~12 (자=1, 축=2, ..., 해=12)
 */
public enum JijiEnum {
    JA(1, "자", "子", OhaengEnum.SU, true, "쥐", "23:30~01:30"),
    CHUK(2, "축", "丑", OhaengEnum.TO, false, "소", "01:30~03:30"),
    IN(3, "인", "寅", OhaengEnum.MOK, true, "호랑이", "03:30~05:30"),
    MYO(4, "묘", "卯", OhaengEnum.MOK, false, "토끼", "05:30~07:30"),
    JIN(5, "진", "辰", OhaengEnum.TO, true, "용", "07:30~09:30"),
    SA(6, "사", "巳", OhaengEnum.HWA, false, "뱀", "09:30~11:30"),
    O(7, "오", "午", OhaengEnum.HWA, true, "말", "11:30~13:30"),
    MI(8, "미", "未", OhaengEnum.TO, false, "양", "13:30~15:30"),
    SHIN(9, "신", "申", OhaengEnum.GEUM, true, "원숭이", "15:30~17:30"),
    YU(10, "유", "酉", OhaengEnum.GEUM, false, "닭", "17:30~19:30"),
    SUL(11, "술", "戌", OhaengEnum.TO, true, "개", "19:30~21:30"),
    HAE(12, "해", "亥", OhaengEnum.SU, false, "돼지", "21:30~23:30");

    private final int index;
    private final String name;
    private final String hanja;
    private final OhaengEnum ohaeng;
    private final boolean yang;
    private final String animal;
    private final String timeRange;

    JijiEnum(int index, String name, String hanja, OhaengEnum ohaeng, boolean yang, String animal, String timeRange) {
        this.index = index;
        this.name = name;
        this.hanja = hanja;
        this.ohaeng = ohaeng;
        this.yang = yang;
        this.animal = animal;
        this.timeRange = timeRange;
    }

    public int getIndex() { return index; }
    public String getName() { return name; }
    public String getHanja() { return hanja; }
    public OhaengEnum getOhaeng() { return ohaeng; }
    public boolean isYang() { return yang; }
    public boolean isYin() { return !yang; }
    public String getAnimal() { return animal; }
    public String getTimeRange() { return timeRange; }

    /**
     * 인덱스(1~12)로 지지 찾기
     */
    public static JijiEnum fromIndex(int index) {
        int normalized = ((index - 1) % 12 + 12) % 12 + 1;
        for (JijiEnum j : values()) {
            if (j.index == normalized) return j;
        }
        throw new IllegalArgumentException("Invalid jiji index: " + index);
    }

    /**
     * 시진 이름("자시", "축시" 등)으로 지지 찾기
     */
    public static JijiEnum fromSijin(String sijin) {
        if (sijin == null || sijin.equals("unknown") || sijin.equals("모름")) return null;
        String clean = sijin.replace("시", "");
        for (JijiEnum j : values()) {
            if (j.name.equals(clean)) return j;
        }
        throw new IllegalArgumentException("Invalid sijin: " + sijin);
    }

    /**
     * 충(沖) 관계 지지 반환 (인덱스 차이 6)
     */
    public JijiEnum getChung() {
        int chungIndex = ((this.index - 1 + 6) % 12) + 1;
        return fromIndex(chungIndex);
    }
}
