package com.cheonjiyeon.api.fortune.saju;

/**
 * 사주 기둥 하나 (천간 + 지지)
 */
public class SajuPillar {
    private final CheonganEnum gan;
    private final JijiEnum ji;

    public SajuPillar(CheonganEnum gan, JijiEnum ji) {
        this.gan = gan;
        this.ji = ji;
    }

    public CheonganEnum getGan() { return gan; }
    public JijiEnum getJi() { return ji; }

    public String getGanName() { return gan.getName(); }
    public String getJiName() { return ji.getName(); }
    public String getGanHanja() { return gan.getHanja(); }
    public String getJiHanja() { return ji.getHanja(); }
    public OhaengEnum getGanOhaeng() { return gan.getOhaeng(); }
    public OhaengEnum getJiOhaeng() { return ji.getOhaeng(); }

    @Override
    public String toString() {
        return gan.getHanja() + ji.getHanja() + "(" + gan.getName() + ji.getName() + ")";
    }
}
