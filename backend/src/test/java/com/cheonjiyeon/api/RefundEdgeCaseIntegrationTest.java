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
class RefundEdgeCaseIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired UserRepository userRepository;

    private String signupAndGetToken(String email) throws Exception {
        return mvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"Password123!\",\"name\":\"환불테스터\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString()
                .replaceAll(".*\"accessToken\":\"([^\"]+)\".*", "$1");
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
    void cancel_pending_payment_succeeds() throws Exception {
        String email = "cancel_pending_" + System.nanoTime() + "@zeom.com";
        String token = signupAndGetToken(email);
        String bookingId = createBooking(token);

        String payment = mvc.perform(post("/api/v1/payments")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"bookingId\":" + bookingId + ",\"amount\":50000,\"currency\":\"KRW\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andReturn().getResponse().getContentAsString();
        String paymentId = payment.replaceAll(".*\"id\":([0-9]+).*", "$1");

        // Cancel a pending payment
        mvc.perform(post("/api/v1/payments/" + paymentId + "/cancel")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELED"));

        // Booking should reflect payment cancellation
        mvc.perform(get("/api/v1/bookings/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void cancel_confirmed_payment_closes_chat_room() throws Exception {
        String email = "cancel_paid_" + System.nanoTime() + "@zeom.com";
        String token = signupAndGetToken(email);
        String bookingId = createBooking(token);

        String payment = mvc.perform(post("/api/v1/payments")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"bookingId\":" + bookingId + ",\"amount\":50000,\"currency\":\"KRW\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String paymentId = payment.replaceAll(".*\"id\":([0-9]+).*", "$1");

        mvc.perform(post("/api/v1/payments/" + paymentId + "/confirm")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // Verify chat room OPEN
        mvc.perform(get("/api/v1/chats/by-booking/" + bookingId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(jsonPath("$.status").value("OPEN"));

        // Cancel the PAID payment
        mvc.perform(post("/api/v1/payments/" + paymentId + "/cancel")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELED"));

        // Chat room should be CLOSED now
        mvc.perform(get("/api/v1/chats/by-booking/" + bookingId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(jsonPath("$.status").value("CLOSED"));
    }

    @Test
    void double_cancel_is_rejected() throws Exception {
        String email = "double_cancel_" + System.nanoTime() + "@zeom.com";
        String token = signupAndGetToken(email);
        String bookingId = createBooking(token);

        String payment = mvc.perform(post("/api/v1/payments")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"bookingId\":" + bookingId + ",\"amount\":50000,\"currency\":\"KRW\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String paymentId = payment.replaceAll(".*\"id\":([0-9]+).*", "$1");

        // First cancel
        mvc.perform(post("/api/v1/payments/" + paymentId + "/cancel")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // Second cancel should fail
        mvc.perform(post("/api/v1/payments/" + paymentId + "/cancel")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void payment_status_logs_track_full_lifecycle() throws Exception {
        String email = "lifecycle_" + System.nanoTime() + "@zeom.com";
        String token = signupAndGetToken(email);
        String bookingId = createBooking(token);

        String payment = mvc.perform(post("/api/v1/payments")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"bookingId\":" + bookingId + ",\"amount\":50000,\"currency\":\"KRW\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String paymentId = payment.replaceAll(".*\"id\":([0-9]+).*", "$1");

        // Confirm
        mvc.perform(post("/api/v1/payments/" + paymentId + "/confirm")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // Cancel
        mvc.perform(post("/api/v1/payments/" + paymentId + "/cancel")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // Check logs as admin
        String adminEmail = "lifecycle_admin_" + System.nanoTime() + "@zeom.com";
        String adminToken = signupAndGetToken(adminEmail);
        UserEntity adminUser = userRepository.findByEmail(adminEmail).orElseThrow();
        adminUser.setRole("ADMIN");
        userRepository.save(adminUser);

        mvc.perform(get("/api/v1/payments/" + paymentId + "/logs")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(3))))
                .andExpect(jsonPath("$[0].toStatus").value("PENDING"))
                .andExpect(jsonPath("$[1].toStatus").value("PAID"))
                .andExpect(jsonPath("$[2].toStatus").value("CANCELED"));
    }

    @Test
    void confirm_already_paid_payment_is_rejected() throws Exception {
        String email = "double_confirm_" + System.nanoTime() + "@zeom.com";
        String token = signupAndGetToken(email);
        String bookingId = createBooking(token);

        String payment = mvc.perform(post("/api/v1/payments")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"bookingId\":" + bookingId + ",\"amount\":50000,\"currency\":\"KRW\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String paymentId = payment.replaceAll(".*\"id\":([0-9]+).*", "$1");

        // First confirm
        mvc.perform(post("/api/v1/payments/" + paymentId + "/confirm")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // Second confirm should fail or return already-paid status
        mvc.perform(post("/api/v1/payments/" + paymentId + "/confirm")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().is4xxClientError());
    }
}
