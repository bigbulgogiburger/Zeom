package com.cheonjiyeon.api.fortune.saju;

/**
 * 십성(十星/十神) - 일간 기준으로 다른 글자와의 관계 유형
 */
public enum SipseongEnum {
    BIGYEON("비견", "比肩", "같은 오행, 같은 음양", "경쟁, 자립, 독립심"),
    GEOPJAE("겁재", "劫財", "같은 오행, 다른 음양", "손재, 분쟁, 도전"),
    SIKSIN("식신", "食神", "내가 생하는, 같은 음양", "재능, 표현, 풍요"),
    SANGGWAN("상관", "傷官", "내가 생하는, 다른 음양", "창의, 반항, 변화"),
    PYEONJAE("편재", "偏財", "내가 극하는, 같은 음양", "투자, 횡재, 사교"),
    JEONGJAE("정재", "正財", "내가 극하는, 다른 음양", "안정 수입, 절약"),
    PYEONGWAN("편관", "偏官", "나를 극하는, 같은 음양", "권위, 압박, 도전"),
    JEONGGWAN("정관", "正官", "나를 극하는, 다른 음양", "명예, 규율, 관직"),
    PYEONIN("편인", "偏印", "나를 생하는, 같은 음양", "학문, 변화, 비상"),
    JEONGIN("정인", "正印", "나를 생하는, 다른 음양", "지원, 안정, 학업");

    private final String name;
    private final String hanja;
    private final String relationship;
    private final String description;

    SipseongEnum(String name, String hanja, String relationship, String description) {
        this.name = name;
        this.hanja = hanja;
        this.relationship = relationship;
        this.description = description;
    }

    public String getName() { return name; }
    public String getHanja() { return hanja; }
    public String getRelationship() { return relationship; }
    public String getDescription() { return description; }

    /**
     * 일간(dayGan)을 기준으로 대상 천간(targetGan)의 십성을 판별
     */
    public static SipseongEnum calculate(CheonganEnum dayGan, CheonganEnum targetGan) {
        OhaengEnum myOhaeng = dayGan.getOhaeng();
        OhaengEnum targetOhaeng = targetGan.getOhaeng();
        boolean sameYinYang = (dayGan.isYang() == targetGan.isYang());

        if (myOhaeng == targetOhaeng) {
            return sameYinYang ? BIGYEON : GEOPJAE;
        }
        if (myOhaeng.getSangsaeng() == targetOhaeng) {
            // 내가 생하는 오행
            return sameYinYang ? SIKSIN : SANGGWAN;
        }
        if (myOhaeng.getSanggeuk() == targetOhaeng) {
            // 내가 극하는 오행
            return sameYinYang ? PYEONJAE : JEONGJAE;
        }
        if (targetOhaeng.getSanggeuk() == myOhaeng) {
            // 나를 극하는 오행
            return sameYinYang ? PYEONGWAN : JEONGGWAN;
        }
        if (targetOhaeng.getSangsaeng() == myOhaeng) {
            // 나를 생하는 오행
            return sameYinYang ? PYEONIN : JEONGIN;
        }

        return BIGYEON; // fallback
    }
}
