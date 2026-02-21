package com.cheonjiyeon.api;

import com.cheonjiyeon.api.fortune.FortuneEntity;
import com.cheonjiyeon.api.fortune.FortuneRepository;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class FortuneIntegrationTest {

    @Autowired
    MockMvc mvc;

    @Autowired
    FortuneRepository fortuneRepository;

    @Test
    void get_today_fortune_creates_and_returns() throws Exception {
        String token = signupAndGetToken("fortune1_" + System.nanoTime() + "@zeom.com");

        mvc.perform(get("/api/v1/fortune/today")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fortuneDate").value(LocalDate.now().toString()))
                .andExpect(jsonPath("$.overallScore").isNumber())
                .andExpect(jsonPath("$.wealthScore").isNumber())
                .andExpect(jsonPath("$.loveScore").isNumber())
                .andExpect(jsonPath("$.healthScore").isNumber())
                .andExpect(jsonPath("$.overallText").isString())
                .andExpect(jsonPath("$.wealthText").isString())
                .andExpect(jsonPath("$.loveText").isString())
                .andExpect(jsonPath("$.healthText").isString())
                .andExpect(jsonPath("$.luckyColor").isString())
                .andExpect(jsonPath("$.luckyNumber").isNumber())
                .andExpect(jsonPath("$.luckyDirection").isString());
    }

    @Test
    void same_user_same_day_returns_deterministic_result() throws Exception {
        String token = signupAndGetToken("fortune2_" + System.nanoTime() + "@zeom.com");

        // First call
        String result1 = mvc.perform(get("/api/v1/fortune/today")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        // Second call - should return same result
        String result2 = mvc.perform(get("/api/v1/fortune/today")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertEquals(result1, result2, "Same user on same day should get identical fortune");
    }

    @Test
    void fortune_scores_within_valid_range() throws Exception {
        String token = signupAndGetToken("fortune3_" + System.nanoTime() + "@zeom.com");

        mvc.perform(get("/api/v1/fortune/today")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.overallScore", allOf(greaterThanOrEqualTo(1), lessThanOrEqualTo(100))))
                .andExpect(jsonPath("$.wealthScore", allOf(greaterThanOrEqualTo(1), lessThanOrEqualTo(100))))
                .andExpect(jsonPath("$.loveScore", allOf(greaterThanOrEqualTo(1), lessThanOrEqualTo(100))))
                .andExpect(jsonPath("$.healthScore", allOf(greaterThanOrEqualTo(1), lessThanOrEqualTo(100))));
    }

    @Test
    void get_fortune_summary() throws Exception {
        String token = signupAndGetToken("fortune4_" + System.nanoTime() + "@zeom.com");

        mvc.perform(get("/api/v1/fortune/summary")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fortuneDate").value(LocalDate.now().toString()))
                .andExpect(jsonPath("$.overallScore").isNumber())
                .andExpect(jsonPath("$.overallText").isString());
    }

    @Test
    void get_fortune_history() throws Exception {
        String token = signupAndGetToken("fortune5_" + System.nanoTime() + "@zeom.com");

        // Generate today's fortune first
        mvc.perform(get("/api/v1/fortune/today")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // Get history
        mvc.perform(get("/api/v1/fortune/history")
                        .header("Authorization", "Bearer " + token)
                        .param("days", "7"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fortunes").isArray())
                .andExpect(jsonPath("$.fortunes", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.totalDays").isNumber());
    }

    @Test
    void fortune_requires_authentication() throws Exception {
        mvc.perform(get("/api/v1/fortune/today"))
                .andExpect(status().isUnauthorized());

        mvc.perform(get("/api/v1/fortune/summary"))
                .andExpect(status().isUnauthorized());

        mvc.perform(get("/api/v1/fortune/history"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void fortune_with_invalid_token_returns_401() throws Exception {
        mvc.perform(get("/api/v1/fortune/today")
                        .header("Authorization", "Bearer invalid-token"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void fortune_persisted_to_database() throws Exception {
        String token = signupAndGetToken("fortune6_" + System.nanoTime() + "@zeom.com");

        String response = mvc.perform(get("/api/v1/fortune/today")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        // Extract userId from response
        String userIdStr = response.replaceAll(".*\"userId\":([0-9]+).*", "$1");
        Long userId = Long.parseLong(userIdStr);

        Optional<FortuneEntity> saved = fortuneRepository.findByUserIdAndFortuneDate(userId, LocalDate.now());
        assertTrue(saved.isPresent(), "Fortune should be persisted in database");
        assertEquals(LocalDate.now(), saved.get().getFortuneDate());
    }

    private String signupAndGetToken(String email) throws Exception {
        return mvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"Password123!\",\"name\":\"운세테스터\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString()
                .replaceAll(".*\"accessToken\":\"([^\"]+)\".*", "$1");
    }
}
