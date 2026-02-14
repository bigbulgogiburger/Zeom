package com.cheonjiyeon.api;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class SecurityHardeningIntegrationTest {

    @Autowired MockMvc mvc;

    @Test
    void security_headers_present_on_responses() throws Exception {
        mvc.perform(get("/api/v1/counselors"))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().string("X-Frame-Options", "DENY"))
                .andExpect(header().string("Referrer-Policy", "strict-origin-when-cross-origin"))
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(header().string("Permissions-Policy", "camera=(), microphone=(), geolocation=()"));
    }

    @Test
    void security_headers_on_error_responses() throws Exception {
        mvc.perform(get("/api/v1/auth/me"))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().string("X-Frame-Options", "DENY"));
    }

    @Test
    void rate_limit_headers_present() throws Exception {
        mvc.perform(get("/api/v1/counselors"))
                .andExpect(header().exists("X-RateLimit-Limit"))
                .andExpect(header().exists("X-RateLimit-Remaining"));
    }

    @Test
    void error_response_format_consistent() throws Exception {
        // ApiException → structured error
        mvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value(true))
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").exists());

        // Validation error → structured error
        mvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"password\":\"Password123!\",\"name\":\"테스트\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value(true))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    void signup_new_user_gets_user_role_not_admin() throws Exception {
        // Verify the privilege escalation fix: admin-prefixed email should NOT get ADMIN role
        String email = "admin_exploit_" + System.nanoTime() + "@zeom.com";
        String token = mvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"Password123!\",\"name\":\"공격자\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString()
                .replaceAll(".*\"accessToken\":\"([^\"]+)\".*", "$1");

        mvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("USER"));

        // admin endpoints should be forbidden
        mvc.perform(get("/api/v1/ops/summary")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void booking_requires_auth() throws Exception {
        mvc.perform(post("/api/v1/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"counselorId\":1,\"slotId\":1}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void booking_nonexistent_counselor_returns_404() throws Exception {
        String token = signupAndGetToken("nocouns_" + System.nanoTime() + "@zeom.com");

        mvc.perform(post("/api/v1/bookings")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"counselorId\":9999,\"slotId\":1}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void booking_nonexistent_slot_returns_404() throws Exception {
        String token = signupAndGetToken("noslot_" + System.nanoTime() + "@zeom.com");

        mvc.perform(post("/api/v1/bookings")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"counselorId\":1,\"slotId\":9999}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void booking_mismatched_counselor_slot_returns_400() throws Exception {
        String token = signupAndGetToken("mismatch_" + System.nanoTime() + "@zeom.com");

        // slot 3 belongs to counselor 2, not counselor 1
        mvc.perform(post("/api/v1/bookings")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"counselorId\":1,\"slotId\":3}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void cancel_other_users_booking_returns_404() throws Exception {
        String user1 = signupAndGetToken("owner_" + System.nanoTime() + "@zeom.com");
        String user2 = signupAndGetToken("thief_" + System.nanoTime() + "@zeom.com");

        String bookingRes = null;
        int[][] candidates = { {1, 4}, {1, 5}, {1, 6}, {1, 7}, {1, 8}, {1, 9}, {1, 10}, {1, 11}, {1, 12}, {1, 13}, {2, 14}, {2, 15}, {2, 16}, {2, 17}, {2, 18}, {2, 19}, {2, 20}, {2, 21}, {2, 22}, {2, 23}, {3, 24}, {3, 25}, {3, 26}, {3, 27}, {3, 28}, {3, 29}, {3, 30}, {3, 31}, {3, 32}, {3, 33}, {1, 1}, {1, 2}, {2, 3} };
        for (int[] c : candidates) {
            var res = mvc.perform(post("/api/v1/bookings")
                            .header("Authorization", "Bearer " + user1)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"counselorId\":" + c[0] + ",\"slotId\":" + c[1] + "}"))
                    .andReturn().getResponse();
            if (res.getStatus() == 200) {
                bookingRes = res.getContentAsString();
                break;
            }
        }
        if (bookingRes == null) throw new IllegalStateException("테스트용 예약 생성 실패");

        String bookingId = bookingRes.replaceAll(".*\"id\":([0-9]+).*", "$1");

        // user2 tries to cancel user1's booking
        mvc.perform(post("/api/v1/bookings/" + bookingId + "/cancel")
                        .header("Authorization", "Bearer " + user2))
                .andExpect(status().isNotFound());
    }

    @Test
    void counselor_detail_nonexistent_returns_404() throws Exception {
        mvc.perform(get("/api/v1/counselors/9999"))
                .andExpect(status().isNotFound());
    }

    private String signupAndGetToken(String email) throws Exception {
        return mvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"Password123!\",\"name\":\"테스트\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString()
                .replaceAll(".*\"accessToken\":\"([^\"]+)\".*", "$1");
    }
}
