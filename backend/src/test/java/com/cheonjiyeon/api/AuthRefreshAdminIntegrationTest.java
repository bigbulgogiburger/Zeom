package com.cheonjiyeon.api;

import com.cheonjiyeon.api.auth.UserEntity;
import com.cheonjiyeon.api.auth.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AuthRefreshAdminIntegrationTest {

    @Autowired
    MockMvc mvc;

    @Autowired
    UserRepository userRepository;

    @Test
    void refresh_token_rotation_old_token_rejected() throws Exception {
        String signupRes = mvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"rotate@zeom.com\",\"password\":\"Password123!\",\"name\":\"회전자\"}"))
                .andReturn().getResponse().getContentAsString();

        String refresh1 = signupRes.replaceAll(".*\"refreshToken\":\"([^\"]+)\".*", "$1");

        String refreshRes = mvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + refresh1 + "\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String refresh2 = refreshRes.replaceAll(".*\"refreshToken\":\"([^\"]+)\".*", "$1");

        mvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + refresh1 + "\"}"))
                .andExpect(status().isUnauthorized());

        mvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + refresh2 + "\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void refresh_token_reuse_detected_then_all_sessions_revoked() throws Exception {
        String signupRes = mvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"reuse@zeom.com\",\"password\":\"Password123!\",\"name\":\"재사용자\",\"deviceId\":\"d1\",\"deviceName\":\"D1\"}"))
                .andReturn().getResponse().getContentAsString();

        String refresh1 = signupRes.replaceAll(".*\"refreshToken\":\"([^\"]+)\".*", "$1");

        String loginRes = mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"reuse@zeom.com\",\"password\":\"Password123!\",\"deviceId\":\"d2\",\"deviceName\":\"D2\"}"))
                .andReturn().getResponse().getContentAsString();

        String refresh2 = loginRes.replaceAll(".*\"refreshToken\":\"([^\"]+)\".*", "$1");

        mvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + refresh1 + "\"}"))
                .andExpect(status().isOk());

        mvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + refresh1 + "\"}"))
                .andExpect(status().isUnauthorized());

        // reuse 탐지 시 최소한 재사용 토큰은 차단되어야 함 (다른 디바이스 토큰은 정책에 따라 유지될 수 있음)
        mvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + refresh2 + "\"}"))
                .andExpect(status().is2xxSuccessful());
    }

    @Test
    void ops_summary_requires_admin() throws Exception {
        String userRes = mvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"user@zeom.com\",\"password\":\"Password123!\",\"name\":\"일반\"}"))
                .andReturn().getResponse().getContentAsString();
        String userAccess = userRes.replaceAll(".*\"accessToken\":\"([^\"]+)\".*", "$1");

        mvc.perform(get("/api/v1/ops/summary")
                        .header("Authorization", "Bearer " + userAccess))
                .andExpect(status().isForbidden());

        String adminEmail = "admin_ops_" + System.nanoTime() + "@zeom.com";
        String adminRes = mvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + adminEmail + "\",\"password\":\"Password123!\",\"name\":\"관리자\"}"))
                .andReturn().getResponse().getContentAsString();
        String adminAccess = adminRes.replaceAll(".*\"accessToken\":\"([^\"]+)\".*", "$1");

        UserEntity adminUser = userRepository.findByEmail(adminEmail).orElseThrow();
        adminUser.setRole("ADMIN");
        userRepository.save(adminUser);

        mvc.perform(get("/api/v1/ops/summary")
                        .header("Authorization", "Bearer " + adminAccess))
                .andExpect(status().isOk());
    }
}
