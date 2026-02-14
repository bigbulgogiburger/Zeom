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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class AdminTimelineAuditIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired UserRepository userRepository;

    private String signupAndGetToken(String email) throws Exception {
        return mvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"Password123!\",\"name\":\"테스터\"}"))
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

    private String createBookingAndPayment(String token) throws Exception {
        int[][] candidates = {
            {1, 4}, {1, 5}, {1, 6}, {1, 7}, {1, 8}, {1, 9}, {1, 10},
            {2, 14}, {2, 15}, {2, 16}, {2, 17}, {2, 18}, {2, 19}, {2, 20},
            {3, 24}, {3, 25}, {3, 26}, {3, 27}, {3, 28}, {3, 29}, {3, 30},
            {1, 1}, {1, 2}, {2, 3}
        };
        String bookingId = null;
        for (int[] c : candidates) {
            var res = mvc.perform(post("/api/v1/bookings")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"counselorId\":" + c[0] + ",\"slotId\":" + c[1] + "}"))
                    .andReturn().getResponse();
            if (res.getStatus() == 200) {
                bookingId = res.getContentAsString().replaceAll(".*\"id\":([0-9]+).*", "$1");
                break;
            }
        }
        if (bookingId == null) throw new IllegalStateException("테스트용 예약 생성 실패");
        return bookingId;
    }

    @Test
    void audit_log_records_signup_and_booking_actions() throws Exception {
        String adminEmail = "audit_admin_" + System.nanoTime() + "@zeom.com";
        String adminToken = promoteToAdmin(adminEmail);

        // Signup creates an audit log entry
        String userEmail = "audit_user_" + System.nanoTime() + "@zeom.com";
        String userToken = signupAndGetToken(userEmail);

        // Create booking to generate more audit entries
        createBookingAndPayment(userToken);

        // Query audit logs - should have entries
        mvc.perform(get("/api/v1/admin/audit")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThan(0))))
                .andExpect(jsonPath("$[0].action").isNotEmpty());
    }

    @Test
    void audit_log_filters_by_action() throws Exception {
        String adminEmail = "audit_filter_" + System.nanoTime() + "@zeom.com";
        String adminToken = promoteToAdmin(adminEmail);

        // Create user to generate SIGNUP audit entry
        signupAndGetToken("audit_user_" + System.nanoTime() + "@zeom.com");

        mvc.perform(get("/api/v1/admin/audit")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("action", "SIGNUP"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void audit_csv_export_returns_csv_content() throws Exception {
        String adminEmail = "audit_csv_" + System.nanoTime() + "@zeom.com";
        String adminToken = promoteToAdmin(adminEmail);

        mvc.perform(get("/api/v1/admin/audit/csv")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("text/csv"))
                .andExpect(content().string(containsString("id,userId,action,targetType,targetId,createdAt")));
    }

    @Test
    void audit_endpoints_reject_non_admin_users() throws Exception {
        String userEmail = "non_admin_" + System.nanoTime() + "@zeom.com";
        String userToken = signupAndGetToken(userEmail);

        mvc.perform(get("/api/v1/admin/audit")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());

        mvc.perform(get("/api/v1/admin/audit/csv")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void timeline_shows_booking_payment_chat_status() throws Exception {
        String userEmail = "timeline_" + System.nanoTime() + "@zeom.com";
        String userToken = signupAndGetToken(userEmail);
        String bookingId = createBookingAndPayment(userToken);

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

        // Admin queries timeline
        String adminEmail = "timeline_admin_" + System.nanoTime() + "@zeom.com";
        String adminToken = promoteToAdmin(adminEmail);

        mvc.perform(get("/api/v1/ops/timeline")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("bookingId", bookingId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].bookingId").value(Integer.parseInt(bookingId)))
                .andExpect(jsonPath("$[0].paymentStatus").value("PAID"))
                .andExpect(jsonPath("$[0].chatStatus").value("OPEN"));
    }

    @Test
    void timeline_filters_by_payment_status() throws Exception {
        String adminEmail = "timeline_filter_" + System.nanoTime() + "@zeom.com";
        String adminToken = promoteToAdmin(adminEmail);

        // Query timeline filtering by PENDING payment status
        mvc.perform(get("/api/v1/ops/timeline")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("paymentStatus", "PENDING"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void timeline_requires_admin() throws Exception {
        String userEmail = "timeline_user_" + System.nanoTime() + "@zeom.com";
        String userToken = signupAndGetToken(userEmail);

        mvc.perform(get("/api/v1/ops/timeline")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());
    }
}
