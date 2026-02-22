package com.cheonjiyeon.api.fortune.saju;

/**
 * 천간(天干) - 10개의 하늘 줄기
 * 인덱스 1~10 (갑=1, 을=2, ..., 계=10)
 */
public enum CheonganEnum {
    GAP(1, "갑", "甲", OhaengEnum.MOK, true),
    EUL(2, "을", "乙", OhaengEnum.MOK, false),
    BYEONG(3, "병", "丙", OhaengEnum.HWA, true),
    JEONG(4, "정", "丁", OhaengEnum.HWA, false),
    MU(5, "무", "戊", OhaengEnum.TO, true),
    GI(6, "기", "己", OhaengEnum.TO, false),
    GYEONG(7, "경", "庚", OhaengEnum.GEUM, true),
    SIN(8, "신", "辛", OhaengEnum.GEUM, false),
    IM(9, "임", "壬", OhaengEnum.SU, true),
    GYE(10, "계", "癸", OhaengEnum.SU, false);

    private final int index;
    private final String name;
    private final String hanja;
    private final OhaengEnum ohaeng;
    private final boolean yang;

    CheonganEnum(int index, String name, String hanja, OhaengEnum ohaeng, boolean yang) {
        this.index = index;
        this.name = name;
        this.hanja = hanja;
        this.ohaeng = ohaeng;
        this.yang = yang;
    }

    public int getIndex() { return index; }
    public String getName() { return name; }
    public String getHanja() { return hanja; }
    public OhaengEnum getOhaeng() { return ohaeng; }
    public boolean isYang() { return yang; }
    public boolean isYin() { return !yang; }

    /**
     * 인덱스(1~10)로 천간 찾기
     */
    public static CheonganEnum fromIndex(int index) {
        int normalized = ((index - 1) % 10 + 10) % 10 + 1;
        for (CheonganEnum c : values()) {
            if (c.index == normalized) return c;
        }
        throw new IllegalArgumentException("Invalid cheongan index: " + index);
    }
}
