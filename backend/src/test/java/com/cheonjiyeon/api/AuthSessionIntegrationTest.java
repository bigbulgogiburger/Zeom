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
class AuthSessionIntegrationTest {

    @Autowired MockMvc mvc;

    @Test
    void session_list_shows_active_sessions() throws Exception {
        String email = "sess_" + System.nanoTime() + "@zeom.com";
        String[] tokens = signupAndGetTokens(email);

        // login from a second device
        mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"Password123!\",\"deviceId\":\"d2\",\"deviceName\":\"Phone\"}"))
                .andExpect(status().isOk());

        mvc.perform(get("/api/v1/auth/sessions")
                        .header("Authorization", "Bearer " + tokens[0]))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sessions").isArray())
                .andExpect(jsonPath("$.sessions", hasSize(greaterThanOrEqualTo(2))));
    }

    @Test
    void session_revoke_removes_specific_session() throws Exception {
        String email = "revoke_" + System.nanoTime() + "@zeom.com";
        String[] tokens = signupAndGetTokens(email);

        // login again to create a second session
        String loginRes = mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"Password123!\",\"deviceId\":\"d2\",\"deviceName\":\"Tablet\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        // get session list
        String sessionsRes = mvc.perform(get("/api/v1/auth/sessions")
                        .header("Authorization", "Bearer " + tokens[0]))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        // extract first session id
        String sessionId = sessionsRes.replaceAll(".*\"id\":([0-9]+).*", "$1");

        // revoke it
        mvc.perform(post("/api/v1/auth/sessions/" + sessionId + "/revoke")
                        .header("Authorization", "Bearer " + tokens[0]))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    void session_revoke_requires_auth() throws Exception {
        mvc.perform(post("/api/v1/auth/sessions/1/revoke"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void logout_invalidates_refresh_token() throws Exception {
        String email = "logout_" + System.nanoTime() + "@zeom.com";
        String[] tokens = signupAndGetTokens(email);

        mvc.perform(post("/api/v1/auth/logout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + tokens[1] + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("로그아웃되었습니다."));

        // refresh with the logged-out token should fail
        mvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + tokens[1] + "\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void me_endpoint_without_token_returns_401() throws Exception {
        mvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void me_endpoint_with_invalid_token_returns_401() throws Exception {
        mvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer invalid.jwt.token"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void signup_duplicate_email_returns_409() throws Exception {
        String email = "dup_" + System.nanoTime() + "@zeom.com";
        signupAndGetTokens(email);

        mvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"Password123!\",\"name\":\"중복\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("이미 가입된 이메일입니다."));
    }

    @Test
    void login_wrong_password_returns_401() throws Exception {
        String email = "wrong_" + System.nanoTime() + "@zeom.com";
        signupAndGetTokens(email);

        mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"WrongPassword!\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void login_nonexistent_email_returns_401() throws Exception {
        mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"nonexistent@zeom.com\",\"password\":\"Password123!\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void signup_validation_errors() throws Exception {
        // missing email
        mvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"password\":\"Password123!\",\"name\":\"테스트\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value(true));

        // invalid email format
        mvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"not-an-email\",\"password\":\"Password123!\",\"name\":\"테스트\"}"))
                .andExpect(status().isBadRequest());

        // short password
        mvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"valid@zeom.com\",\"password\":\"short\",\"name\":\"테스트\"}"))
                .andExpect(status().isBadRequest());

        // short name
        mvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"valid2@zeom.com\",\"password\":\"Password123!\",\"name\":\"A\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void admin_login_rejects_non_admin() throws Exception {
        String email = "notadmin_" + System.nanoTime() + "@zeom.com";
        signupAndGetTokens(email);

        mvc.perform(post("/api/v1/auth/admin/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"Password123!\"}"))
                .andExpect(status().isForbidden());
    }

    /**
     * Returns [accessToken, refreshToken]
     */
    private String[] signupAndGetTokens(String email) throws Exception {
        String res = mvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"Password123!\",\"name\":\"테스트\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String access = res.replaceAll(".*\"accessToken\":\"([^\"]+)\".*", "$1");
        String refresh = res.replaceAll(".*\"refreshToken\":\"([^\"]+)\".*", "$1");
        return new String[]{access, refresh};
    }
}
