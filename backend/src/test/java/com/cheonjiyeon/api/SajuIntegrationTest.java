package com.cheonjiyeon.api;

import com.cheonjiyeon.api.fortune.FortuneEntity;
import com.cheonjiyeon.api.fortune.FortuneRepository;
import com.cheonjiyeon.api.fortune.SajuChartEntity;
import com.cheonjiyeon.api.fortune.SajuChartRepository;
import com.cheonjiyeon.api.fortune.saju.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.Optional;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class SajuIntegrationTest {

    @Autowired
    MockMvc mvc;

    @Autowired
    FortuneRepository fortuneRepository;

    @Autowired
    SajuChartRepository sajuChartRepository;

    // ========== Phase 1: 사주 엔진 단위 테스트 ==========

    @Test
    void cheongan_enum_fromIndex() {
        assertEquals(CheonganEnum.GAP, CheonganEnum.fromIndex(1));
        assertEquals(CheonganEnum.GYE, CheonganEnum.fromIndex(10));
        assertEquals(CheonganEnum.GAP, CheonganEnum.fromIndex(11)); // wraps around
    }

    @Test
    void jiji_enum_fromIndex() {
        assertEquals(JijiEnum.JA, JijiEnum.fromIndex(1));
        assertEquals(JijiEnum.HAE, JijiEnum.fromIndex(12));
        assertEquals(JijiEnum.JA, JijiEnum.fromIndex(13)); // wraps around
    }

    @Test
    void jiji_fromSijin() {
        assertEquals(JijiEnum.JA, JijiEnum.fromSijin("자시"));
        assertEquals(JijiEnum.O, JijiEnum.fromSijin("오시"));
        assertNull(JijiEnum.fromSijin("unknown"));
        assertNull(JijiEnum.fromSijin("모름"));
    }

    @Test
    void ohaeng_sangsaeng_cycle() {
        assertEquals(OhaengEnum.HWA, OhaengEnum.MOK.getSangsaeng()); // 목생화
        assertEquals(OhaengEnum.TO, OhaengEnum.HWA.getSangsaeng());  // 화생토
        assertEquals(OhaengEnum.GEUM, OhaengEnum.TO.getSangsaeng()); // 토생금
        assertEquals(OhaengEnum.SU, OhaengEnum.GEUM.getSangsaeng()); // 금생수
        assertEquals(OhaengEnum.MOK, OhaengEnum.SU.getSangsaeng());  // 수생목
    }

    @Test
    void ohaeng_sanggeuk_cycle() {
        assertEquals(OhaengEnum.TO, OhaengEnum.MOK.getSanggeuk());   // 목극토
        assertEquals(OhaengEnum.SU, OhaengEnum.TO.getSanggeuk());    // 토극수
        assertEquals(OhaengEnum.HWA, OhaengEnum.SU.getSanggeuk());   // 수극화
        assertEquals(OhaengEnum.GEUM, OhaengEnum.HWA.getSanggeuk()); // 화극금
        assertEquals(OhaengEnum.MOK, OhaengEnum.GEUM.getSanggeuk()); // 금극목
    }

    @Test
    void sipseong_calculation() {
        // 갑(목, 양) vs 갑(목, 양) = 비견
        assertEquals(SipseongEnum.BIGYEON, SipseongEnum.calculate(CheonganEnum.GAP, CheonganEnum.GAP));

        // 갑(목, 양) vs 을(목, 음) = 겁재
        assertEquals(SipseongEnum.GEOPJAE, SipseongEnum.calculate(CheonganEnum.GAP, CheonganEnum.EUL));

        // 갑(목, 양) vs 병(화, 양) = 식신 (내가 생하는, 같은 음양)
        assertEquals(SipseongEnum.SIKSIN, SipseongEnum.calculate(CheonganEnum.GAP, CheonganEnum.BYEONG));

        // 갑(목, 양) vs 정(화, 음) = 상관 (내가 생하는, 다른 음양)
        assertEquals(SipseongEnum.SANGGWAN, SipseongEnum.calculate(CheonganEnum.GAP, CheonganEnum.JEONG));

        // 갑(목, 양) vs 무(토, 양) = 편재 (내가 극하는, 같은 음양)
        assertEquals(SipseongEnum.PYEONJAE, SipseongEnum.calculate(CheonganEnum.GAP, CheonganEnum.MU));

        // 갑(목, 양) vs 기(토, 음) = 정재 (내가 극하는, 다른 음양)
        assertEquals(SipseongEnum.JEONGJAE, SipseongEnum.calculate(CheonganEnum.GAP, CheonganEnum.GI));

        // 갑(목, 양) vs 경(금, 양) = 편관 (나를 극하는, 같은 음양)
        assertEquals(SipseongEnum.PYEONGWAN, SipseongEnum.calculate(CheonganEnum.GAP, CheonganEnum.GYEONG));

        // 갑(목, 양) vs 신(금, 음) = 정관 (나를 극하는, 다른 음양)
        assertEquals(SipseongEnum.JEONGGWAN, SipseongEnum.calculate(CheonganEnum.GAP, CheonganEnum.SIN));

        // 갑(목, 양) vs 임(수, 양) = 편인 (나를 생하는, 같은 음양)
        assertEquals(SipseongEnum.PYEONIN, SipseongEnum.calculate(CheonganEnum.GAP, CheonganEnum.IM));

        // 갑(목, 양) vs 계(수, 음) = 정인 (나를 생하는, 다른 음양)
        assertEquals(SipseongEnum.JEONGIN, SipseongEnum.calculate(CheonganEnum.GAP, CheonganEnum.GYE));
    }

    @Test
    void year_pillar_calculation() {
        // 2000년 3월 (입춘 이후) → 2000년 기준
        // 간: (2000-3) % 10 = 1997 % 10 = 7 = 경
        // 지: (2000-3) % 12 = 1997 % 12 = 5 = 진
        SajuPillar yp = SajuCalculator.calculateYearPillar(LocalDate.of(2000, 3, 15));
        assertEquals(CheonganEnum.GYEONG, yp.getGan());
        assertEquals(JijiEnum.JIN, yp.getJi());
    }

    @Test
    void year_pillar_before_ipchun() {
        // 2000년 1월 (입춘 이전) → 1999년 기준
        // 간: (1999-3) % 10 = 1996 % 10 = 6 = 기
        // 지: (1999-3) % 12 = 1996 % 12 = 4 = 묘
        SajuPillar yp = SajuCalculator.calculateYearPillar(LocalDate.of(2000, 1, 15));
        assertEquals(CheonganEnum.GI, yp.getGan());
        assertEquals(JijiEnum.MYO, yp.getJi());
    }

    @Test
    void day_pillar_calculation() {
        // 2000-01-01 = 갑진일 (기준일)
        SajuPillar dp = SajuCalculator.calculateDayPillar(LocalDate.of(2000, 1, 1));
        assertEquals(CheonganEnum.GAP, dp.getGan());
        assertEquals(JijiEnum.JIN, dp.getJi());

        // 다음 날은 을사일
        SajuPillar dp2 = SajuCalculator.calculateDayPillar(LocalDate.of(2000, 1, 2));
        assertEquals(CheonganEnum.EUL, dp2.getGan());
        assertEquals(JijiEnum.SA, dp2.getJi());
    }

    @Test
    void hour_pillar_calculation() {
        // 갑일 자시 → 갑자 (갑/기 → 자시 시작 천간 = 갑)
        SajuPillar hp = SajuCalculator.calculateHourPillar("자시", CheonganEnum.GAP);
        assertNotNull(hp);
        assertEquals(CheonganEnum.GAP, hp.getGan());
        assertEquals(JijiEnum.JA, hp.getJi());

        // unknown → null
        assertNull(SajuCalculator.calculateHourPillar("unknown", CheonganEnum.GAP));
    }

    @Test
    void full_chart_calculation() {
        // 1990-03-15 오시 남성
        SajuChart chart = SajuCalculator.calculateChart(
            LocalDate.of(1990, 3, 15), "오시", "male"
        );

        assertNotNull(chart);
        assertNotNull(chart.getYearPillar());
        assertNotNull(chart.getMonthPillar());
        assertNotNull(chart.getDayPillar());
        assertNotNull(chart.getHourPillar());
        assertNotNull(chart.getDayGan());
        assertNotNull(chart.getOhaengBalance());
        assertNotNull(chart.getDominantElement());
        assertNotNull(chart.getWeakElement());
    }

    @Test
    void chart_without_hour() {
        // 시간 모름
        SajuChart chart = SajuCalculator.calculateChart(
            LocalDate.of(1990, 3, 15), "unknown", "female"
        );

        assertNotNull(chart);
        assertNotNull(chart.getYearPillar());
        assertNotNull(chart.getMonthPillar());
        assertNotNull(chart.getDayPillar());
        assertNull(chart.getHourPillar()); // 시주 없음
    }

    @Test
    void daily_fortune_calculator() {
        SajuChart chart = SajuCalculator.calculateChart(
            LocalDate.of(1990, 3, 15), "오시", "male"
        );

        DailyFortuneCalculator.DailyFortuneResult result =
            DailyFortuneCalculator.calculate(chart, LocalDate.now());

        assertNotNull(result);
        assertTrue(result.getOverallScore() >= 1 && result.getOverallScore() <= 100);
        assertTrue(result.getWealthScore() >= 1 && result.getWealthScore() <= 100);
        assertTrue(result.getLoveScore() >= 1 && result.getLoveScore() <= 100);
        assertTrue(result.getHealthScore() >= 1 && result.getHealthScore() <= 100);
        assertTrue(result.getCareerScore() >= 1 && result.getCareerScore() <= 100);
        assertTrue(result.getStudyScore() >= 1 && result.getStudyScore() <= 100);
        assertNotNull(result.getSipseong());
        assertNotNull(result.getUnseong());
        assertNotNull(result.getHarmonyType());
        assertNotNull(result.getLuckyColor());
        assertNotNull(result.getLuckyDirection());
        assertNotNull(result.getLuckyTime());
        assertNotNull(result.getWarningTime());
    }

    @Test
    void twelve_unseong_calculation() {
        // 갑(양목)이 해(수)를 만나면 장생
        TwelveUnseongEnum result = TwelveUnseongEnum.calculate(CheonganEnum.GAP, JijiEnum.HAE);
        assertNotNull(result);
        assertTrue(result.getScoreWeight() >= -8 && result.getScoreWeight() <= 10);
    }

    // ========== Phase 2: API 통합 테스트 ==========

    @Test
    void saju_fortune_with_birth_info() throws Exception {
        // 생년월일시 포함 회원가입
        String token = signupWithBirthInfo(
            "saju1_" + System.nanoTime() + "@zeom.com",
            "1990-03-15", "오시", "male"
        );

        // 사주 기반 운세 조회
        mvc.perform(get("/api/v1/fortune/today")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.overallScore").isNumber())
                .andExpect(jsonPath("$.sipseong").isString())
                .andExpect(jsonPath("$.twelveUnseong").isString())
                .andExpect(jsonPath("$.harmonyType").isString())
                .andExpect(jsonPath("$.careerScore").isNumber())
                .andExpect(jsonPath("$.studyScore").isNumber())
                .andExpect(jsonPath("$.luckyTime").isString())
                .andExpect(jsonPath("$.warningTime").isString())
                .andExpect(jsonPath("$.sajuInsight").isString())
                .andExpect(jsonPath("$.counselorCtaMessage").isString());
    }

    @Test
    void saju_fortune_without_birth_info_falls_back_to_hash() throws Exception {
        // 생년월일 없이 회원가입
        String token = signupAndGetToken("saju2_" + System.nanoTime() + "@zeom.com");

        // SHA-256 기반 폴백 운세
        mvc.perform(get("/api/v1/fortune/today")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.overallScore").isNumber())
                // 사주 확장 필드는 null
                .andExpect(jsonPath("$.sipseong").doesNotExist());
    }

    @Test
    void get_my_saju_chart() throws Exception {
        String token = signupWithBirthInfo(
            "saju3_" + System.nanoTime() + "@zeom.com",
            "1985-07-20", "인시", "female"
        );

        mvc.perform(get("/api/v1/saju/my-chart")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.yearPillar.gan").isString())
                .andExpect(jsonPath("$.yearPillar.ji").isString())
                .andExpect(jsonPath("$.yearPillar.ganHanja").isString())
                .andExpect(jsonPath("$.yearPillar.jiHanja").isString())
                .andExpect(jsonPath("$.monthPillar").isNotEmpty())
                .andExpect(jsonPath("$.dayPillar").isNotEmpty())
                .andExpect(jsonPath("$.hourPillar").isNotEmpty())
                .andExpect(jsonPath("$.ohaengBalance").isMap())
                .andExpect(jsonPath("$.dominantElement").isString())
                .andExpect(jsonPath("$.weakElement").isString());
    }

    @Test
    void get_my_saju_chart_without_birth_date_returns_400() throws Exception {
        String token = signupAndGetToken("saju4_" + System.nanoTime() + "@zeom.com");

        mvc.perform(get("/api/v1/saju/my-chart")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest());
    }

    @Test
    void update_birth_info_recalculates_chart() throws Exception {
        String token = signupWithBirthInfo(
            "saju5_" + System.nanoTime() + "@zeom.com",
            "1990-03-15", "오시", "male"
        );

        // 생년월일시 수정
        mvc.perform(put("/api/v1/saju/birth-info")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"birthDate\":\"1990-06-20\",\"birthHour\":\"자시\",\"gender\":\"male\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.yearPillar").isNotEmpty())
                .andExpect(jsonPath("$.dayPillar").isNotEmpty());
    }

    @Test
    void saju_chart_cached_in_database() throws Exception {
        String token = signupWithBirthInfo(
            "saju6_" + System.nanoTime() + "@zeom.com",
            "1988-12-25", "축시", "male"
        );

        // 사주 조회로 캐시 생성
        mvc.perform(get("/api/v1/saju/my-chart")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // DB에 캐시 확인
        long chartCount = sajuChartRepository.count();
        assertTrue(chartCount > 0, "Saju chart should be cached in database");
    }

    @Test
    void saju_requires_authentication() throws Exception {
        mvc.perform(get("/api/v1/saju/my-chart"))
                .andExpect(status().isUnauthorized());

        mvc.perform(put("/api/v1/saju/birth-info")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"birthDate\":\"1990-01-01\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void fortune_text_templates_not_empty() {
        // 모든 십성에 대해 텍스트가 존재하는지 확인
        for (SipseongEnum s : SipseongEnum.values()) {
            assertFalse(SajuFortuneTexts.getOverallText(s, 50).isEmpty(),
                "Overall text for " + s.getName() + " should not be empty");
            assertFalse(SajuFortuneTexts.getOverallText(s, 10).isEmpty(),
                "Overall text (low) for " + s.getName() + " should not be empty");
            assertFalse(SajuFortuneTexts.getOverallText(s, 90).isEmpty(),
                "Overall text (high) for " + s.getName() + " should not be empty");
        }
    }

    @Test
    void saju_insight_generation() {
        String insight = SajuFortuneTexts.generateSajuInsight(
            SipseongEnum.PYEONGWAN,
            TwelveUnseongEnum.JANGSAENG,
            "육합",
            CheonganEnum.IM,
            CheonganEnum.BYEONG
        );
        assertNotNull(insight);
        assertFalse(insight.isEmpty());
        assertTrue(insight.contains("임"), "Insight should contain day gan name");
        assertTrue(insight.contains("편관"), "Insight should contain sipseong name");
    }

    @Test
    void signup_with_saju_fields() throws Exception {
        String email = "saju_signup_" + System.nanoTime() + "@zeom.com";
        String json = """
            {
                "email": "%s",
                "password": "Password123!",
                "name": "사주테스터",
                "birthDate": "1990-03-15",
                "birthHour": "오시",
                "gender": "male",
                "calendarType": "solar",
                "isLeapMonth": false,
                "termsAgreed": true
            }
            """.formatted(email);

        mvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isString())
                .andExpect(jsonPath("$.user.email").value(email));
    }

    @Test
    void lunar_calendar_signup_and_chart() throws Exception {
        String token = signupWithLunarBirthInfo(
            "saju_lunar_" + System.nanoTime() + "@zeom.com",
            "1990-03-15", "자시", "female", "lunar", false
        );

        mvc.perform(get("/api/v1/saju/my-chart")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.yearPillar").isNotEmpty());
    }

    // ========== Helper Methods ==========

    private String signupAndGetToken(String email) throws Exception {
        return mvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"Password123!\",\"name\":\"테스터\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString()
                .replaceAll(".*\"accessToken\":\"([^\"]+)\".*", "$1");
    }

    private String signupWithBirthInfo(String email, String birthDate, String birthHour, String gender) throws Exception {
        String json = """
            {
                "email": "%s",
                "password": "Password123!",
                "name": "사주테스터",
                "birthDate": "%s",
                "birthHour": "%s",
                "gender": "%s",
                "termsAgreed": true
            }
            """.formatted(email, birthDate, birthHour, gender);

        return mvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString()
                .replaceAll(".*\"accessToken\":\"([^\"]+)\".*", "$1");
    }

    private String signupWithLunarBirthInfo(String email, String birthDate, String birthHour,
                                             String gender, String calendarType, boolean isLeapMonth) throws Exception {
        String json = """
            {
                "email": "%s",
                "password": "Password123!",
                "name": "사주테스터",
                "birthDate": "%s",
                "birthHour": "%s",
                "gender": "%s",
                "calendarType": "%s",
                "isLeapMonth": %b,
                "termsAgreed": true
            }
            """.formatted(email, birthDate, birthHour, gender, calendarType, isLeapMonth);

        return mvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString()
                .replaceAll(".*\"accessToken\":\"([^\"]+)\".*", "$1");
    }
}
