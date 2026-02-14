package com.cheonjiyeon.api;

import com.cheonjiyeon.api.auth.UserEntity;
import com.cheonjiyeon.api.auth.UserRepository;
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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class NotificationRetryIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired UserRepository userRepository;

    private String signupAndGetToken(String email) throws Exception {
        return mvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"Password123!\",\"name\":\"알림테스터\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString()
                .replaceAll(".*\"accessToken\":\"([^\"]+)\".*", "$1");
    }

    private String promoteToAdmin(String email) throws Exception {
        String token = signupAndGetToken(email);
        UserEntity user = userRepository.findByEmail(email).orElseThrow();
        user.setRole("ADMIN");
        userRepository.save(user);
        return token;
    }

    private String createBooking(String token) throws Exception {
        int[][] candidates = {
            {1, 4}, {1, 5}, {1, 6}, {1, 7}, {1, 8}, {1, 9}, {1, 10},
            {2, 14}, {2, 15}, {2, 16}, {2, 17}, {2, 18}, {2, 19}, {2, 20},
            {3, 24}, {3, 25}, {3, 26}, {3, 27}, {3, 28}, {3, 29}, {3, 30},
            {1, 1}, {1, 2}, {2, 3}
        };
        for (int[] c : candidates) {
            var res = mvc.perform(post("/api/v1/bookings")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"counselorId\":" + c[0] + ",\"slotId\":" + c[1] + "}"))
                    .andReturn().getResponse();
            if (res.getStatus() == 200) {
                return res.getContentAsString().replaceAll(".*\"id\":([0-9]+).*", "$1");
            }
        }
        throw new IllegalStateException("테스트용 예약 생성 실패");
    }

    @Test
    void retry_post_actions_logs_retry_status() throws Exception {
        String userEmail = "retry_" + System.nanoTime() + "@zeom.com";
        String userToken = signupAndGetToken(userEmail);
        String bookingId = createBooking(userToken);

        // Create and confirm payment
        String payment = mvc.perform(post("/api/v1/payments")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"bookingId\":" + bookingId + ",\"amount\":50000,\"currency\":\"KRW\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String paymentId = payment.replaceAll(".*\"id\":([0-9]+).*", "$1");

        mvc.perform(post("/api/v1/payments/" + paymentId + "/confirm")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk());

        // Admin retries post-actions
        String adminEmail = "retry_admin_" + System.nanoTime() + "@zeom.com";
        String adminToken = promoteToAdmin(adminEmail);

        mvc.perform(post("/api/v1/payments/" + paymentId + "/retry-post-actions")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PAID"));

        // Verify logs contain retry-related entries
        mvc.perform(get("/api/v1/payments/" + paymentId + "/logs")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(2))))
                .andExpect(jsonPath("$[0].toStatus").value("PENDING"))
                .andExpect(jsonPath("$[1].toStatus").value("PAID"));
    }

    @Test
    void retry_post_actions_only_works_for_paid_payments() throws Exception {
        String userEmail = "retry_pending_" + System.nanoTime() + "@zeom.com";
        String userToken = signupAndGetToken(userEmail);
        String bookingId = createBooking(userToken);

        // Create payment but do NOT confirm
        String payment = mvc.perform(post("/api/v1/payments")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"bookingId\":" + bookingId + ",\"amount\":50000,\"currency\":\"KRW\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andReturn().getResponse().getContentAsString();
        String paymentId = payment.replaceAll(".*\"id\":([0-9]+).*", "$1");

        // Admin tries to retry on PENDING payment - should fail
        String adminEmail = "retry_admin2_" + System.nanoTime() + "@zeom.com";
        String adminToken = promoteToAdmin(adminEmail);

        mvc.perform(post("/api/v1/payments/" + paymentId + "/retry-post-actions")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void retry_post_actions_requires_admin() throws Exception {
        String userEmail = "retry_nonadmin_" + System.nanoTime() + "@zeom.com";
        String userToken = signupAndGetToken(userEmail);
        String bookingId = createBooking(userToken);

        String payment = mvc.perform(post("/api/v1/payments")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"bookingId\":" + bookingId + ",\"amount\":50000,\"currency\":\"KRW\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String paymentId = payment.replaceAll(".*\"id\":([0-9]+).*", "$1");

        mvc.perform(post("/api/v1/payments/" + paymentId + "/confirm")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk());

        // Non-admin user tries retry - should be forbidden
        mvc.perform(post("/api/v1/payments/" + paymentId + "/retry-post-actions")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());
    }
}
