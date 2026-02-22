package com.cheonjiyeon.api.fortune.saju;

/**
 * 오행(五行) - 5가지 원소
 * 상생(相生): 목->화->토->금->수->목
 * 상극(相克): 목->토->수->화->금->목
 */
public enum OhaengEnum {
    MOK("목", "木", "청록"),
    HWA("화", "火", "적색"),
    TO("토", "土", "황색"),
    GEUM("금", "金", "백색"),
    SU("수", "水", "흑색");

    private final String name;
    private final String hanja;
    private final String color;

    OhaengEnum(String name, String hanja, String color) {
        this.name = name;
        this.hanja = hanja;
        this.color = color;
    }

    public String getName() { return name; }
    public String getHanja() { return hanja; }
    public String getColor() { return color; }

    /**
     * 상생 관계: this가 생해주는 오행
     */
    public OhaengEnum getSangsaeng() {
        return switch (this) {
            case MOK -> HWA;   // 목생화
            case HWA -> TO;    // 화생토
            case TO -> GEUM;   // 토생금
            case GEUM -> SU;   // 금생수
            case SU -> MOK;    // 수생목
        };
    }

    /**
     * 상극 관계: this가 극하는 오행
     */
    public OhaengEnum getSanggeuk() {
        return switch (this) {
            case MOK -> TO;    // 목극토
            case TO -> SU;     // 토극수
            case SU -> HWA;    // 수극화
            case HWA -> GEUM;  // 화극금
            case GEUM -> MOK;  // 금극목
        };
    }

    /**
     * 두 오행의 관계 판별
     * @return "상생" (내가 생), "피생" (내가 받음), "상극" (내가 극), "피극" (내가 당함), "비화" (같음)
     */
    public String getRelation(OhaengEnum other) {
        if (this == other) return "비화";
        if (this.getSangsaeng() == other) return "상생";
        if (other.getSangsaeng() == this) return "피생";
        if (this.getSanggeuk() == other) return "상극";
        if (other.getSanggeuk() == this) return "피극";
        return "비화";
    }
}
