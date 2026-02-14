package com.cheonjiyeon.api;

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
    void ops_summary_requires_admin() throws Exception {
        String userRes = mvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"user@zeom.com\",\"password\":\"Password123!\",\"name\":\"일반\"}"))
                .andReturn().getResponse().getContentAsString();
        String userAccess = userRes.replaceAll(".*\"accessToken\":\"([^\"]+)\".*", "$1");

        mvc.perform(get("/api/v1/ops/summary")
                        .header("Authorization", "Bearer " + userAccess))
                .andExpect(status().isForbidden());

        String adminRes = mvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin_ops@zeom.com\",\"password\":\"Password123!\",\"name\":\"관리자\"}"))
                .andReturn().getResponse().getContentAsString();
        String adminAccess = adminRes.replaceAll(".*\"accessToken\":\"([^\"]+)\".*", "$1");

        mvc.perform(get("/api/v1/ops/summary")
                        .header("Authorization", "Bearer " + adminAccess))
                .andExpect(status().isOk());
    }
}
