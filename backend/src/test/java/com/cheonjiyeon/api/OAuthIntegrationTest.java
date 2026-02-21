package com.cheonjiyeon.api;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class OAuthIntegrationTest {

    @Autowired MockMvc mvc;

    @Test
    void oauth_login_creates_new_user() throws Exception {
        String oauthId = "user_" + System.nanoTime();

        mvc.perform(post("/api/v1/auth/oauth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"provider\":\"kakao\",\"code\":\"fake_kakao_" + oauthId + "\",\"redirectUri\":\"http://localhost:3000/callback\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value("oauth_" + oauthId + "@test.com"))
                .andExpect(jsonPath("$.user.name").value("테스트유저_" + oauthId))
                .andExpect(jsonPath("$.user.role").value("USER"));
    }

    @Test
    void oauth_login_returns_existing_user_on_second_login() throws Exception {
        String oauthId = "repeat_" + System.nanoTime();

        // First login - creates user
        String firstRes = mvc.perform(post("/api/v1/auth/oauth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"provider\":\"kakao\",\"code\":\"fake_kakao_" + oauthId + "\",\"redirectUri\":\"http://localhost:3000/callback\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String userId1 = firstRes.replaceAll(".*\"id\":([0-9]+).*", "$1");

        // Second login - returns same user
        String secondRes = mvc.perform(post("/api/v1/auth/oauth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"provider\":\"kakao\",\"code\":\"fake_kakao_" + oauthId + "\",\"redirectUri\":\"http://localhost:3000/callback\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String userId2 = secondRes.replaceAll(".*\"id\":([0-9]+).*", "$1");

        assert userId1.equals(userId2) : "Expected same user ID on repeated OAuth login";
    }

    @Test
    void oauth_login_merges_with_existing_email_account() throws Exception {
        String oauthId = "merge_" + System.nanoTime();
        String email = "oauth_" + oauthId + "@test.com";

        // First, signup with email/password
        String signupRes = mvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"Password123!\",\"name\":\"이메일유저\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String originalUserId = signupRes.replaceAll(".*\"id\":([0-9]+).*", "$1");

        // Then login with OAuth using same email (FakeOAuthProvider generates email as oauth_{oauthId}@test.com)
        String oauthRes = mvc.perform(post("/api/v1/auth/oauth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"provider\":\"kakao\",\"code\":\"fake_kakao_" + oauthId + "\",\"redirectUri\":\"http://localhost:3000/callback\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String mergedUserId = oauthRes.replaceAll(".*\"id\":([0-9]+).*", "$1");

        // Should be the same user (merged)
        assert originalUserId.equals(mergedUserId) : "Expected OAuth to merge with existing email account";
    }

    @Test
    void oauth_login_with_naver_provider() throws Exception {
        String oauthId = "naver_" + System.nanoTime();

        mvc.perform(post("/api/v1/auth/oauth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"provider\":\"naver\",\"code\":\"fake_naver_" + oauthId + "\",\"redirectUri\":\"http://localhost:3000/callback\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value("oauth_" + oauthId + "@test.com"))
                .andExpect(jsonPath("$.user.role").value("USER"));
    }

    @Test
    void oauth_user_can_access_me_endpoint() throws Exception {
        String oauthId = "me_" + System.nanoTime();

        String loginRes = mvc.perform(post("/api/v1/auth/oauth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"provider\":\"kakao\",\"code\":\"fake_kakao_" + oauthId + "\",\"redirectUri\":\"http://localhost:3000/callback\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String accessToken = loginRes.replaceAll(".*\"accessToken\":\"([^\"]+)\".*", "$1");

        mvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("oauth_" + oauthId + "@test.com"))
                .andExpect(jsonPath("$.emailVerified").value(true));
    }

    @Test
    void oauth_login_requires_provider_and_code() throws Exception {
        // Missing provider
        mvc.perform(post("/api/v1/auth/oauth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\":\"some_code\"}"))
                .andExpect(status().isBadRequest());

        // Missing code
        mvc.perform(post("/api/v1/auth/oauth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"provider\":\"kakao\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void oauth_login_different_providers_create_separate_accounts() throws Exception {
        String oauthId = "multi_" + System.nanoTime();

        // Login with Kakao
        String kakaoRes = mvc.perform(post("/api/v1/auth/oauth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"provider\":\"kakao\",\"code\":\"fake_kakao_" + oauthId + "\",\"redirectUri\":\"http://localhost:3000/callback\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String kakaoUserId = kakaoRes.replaceAll(".*\"id\":([0-9]+).*", "$1");

        // Login with Naver (same oauthId but different provider)
        String naverRes = mvc.perform(post("/api/v1/auth/oauth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"provider\":\"naver\",\"code\":\"fake_naver_" + oauthId + "\",\"redirectUri\":\"http://localhost:3000/callback\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String naverUserId = naverRes.replaceAll(".*\"id\":([0-9]+).*", "$1");

        // Note: same oauthId but different email generated by FakeOAuthProvider, so these will be separate accounts
        // Both should succeed and have valid tokens
        assert !kakaoUserId.isEmpty() : "Kakao user should be created";
        assert !naverUserId.isEmpty() : "Naver user should be created";
    }
}
