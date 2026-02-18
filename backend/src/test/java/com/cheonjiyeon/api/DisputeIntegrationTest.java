package com.cheonjiyeon.api;

import com.cheonjiyeon.api.dispute.DisputeEntity;
import com.cheonjiyeon.api.dispute.DisputeRepository;
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
class DisputeIntegrationTest {

    @Autowired
    MockMvc mvc;

    @Autowired
    DisputeRepository disputeRepository;

    @Test
    void create_dispute() throws Exception {
        String token = signupAndGetToken("dispute_create_" + System.nanoTime() + "@zeom.com");
        String bookingId = createBookingAndConfirmPayment(token);

        mvc.perform(post("/api/v1/disputes")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reservationId\":" + bookingId + ",\"category\":\"SERVICE_ISSUE\",\"description\":\"상담 품질에 문제가 있었습니다\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reservationId").value(Long.parseLong(bookingId)))
                .andExpect(jsonPath("$.category").value("SERVICE_ISSUE"))
                .andExpect(jsonPath("$.description").value("상담 품질에 문제가 있었습니다"))
                .andExpect(jsonPath("$.status").value("OPEN"));
    }

    @Test
    void get_my_disputes() throws Exception {
        String token = signupAndGetToken("my_disputes_" + System.nanoTime() + "@zeom.com");
        String booking1 = createBookingAndConfirmPayment(token);
        String booking2 = createBookingAndConfirmPayment(token);

        // Create two disputes
        mvc.perform(post("/api/v1/disputes")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reservationId\":" + booking1 + ",\"category\":\"SERVICE_ISSUE\",\"description\":\"문제 1\"}"))
                .andExpect(status().isOk());

        mvc.perform(post("/api/v1/disputes")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reservationId\":" + booking2 + ",\"category\":\"BILLING_ISSUE\",\"description\":\"문제 2\"}"))
                .andExpect(status().isOk());

        // Get my disputes
        mvc.perform(get("/api/v1/disputes/me")
                        .header("Authorization", "Bearer " + token)
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.disputes").isArray())
                .andExpect(jsonPath("$.disputes", hasSize(greaterThanOrEqualTo(2))))
                .andExpect(jsonPath("$.disputes[0].category").exists())
                .andExpect(jsonPath("$.disputes[0].description").exists())
                .andExpect(jsonPath("$.disputes[0].status").exists());
    }

    @Test
    void create_dispute_requires_auth() throws Exception {
        mvc.perform(post("/api/v1/disputes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reservationId\":1,\"category\":\"SERVICE_ISSUE\",\"description\":\"문제\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void get_my_disputes_requires_auth() throws Exception {
        mvc.perform(get("/api/v1/disputes/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void create_dispute_validation_errors() throws Exception {
        String token = signupAndGetToken("val_dispute_" + System.nanoTime() + "@zeom.com");
        String bookingId = createBookingAndConfirmPayment(token);

        // Missing category
        mvc.perform(post("/api/v1/disputes")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reservationId\":" + bookingId + ",\"description\":\"문제\"}"))
                .andExpect(status().isBadRequest());

        // Missing description
        mvc.perform(post("/api/v1/disputes")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reservationId\":" + bookingId + ",\"category\":\"SERVICE_ISSUE\"}"))
                .andExpect(status().isBadRequest());

        // Missing reservationId
        mvc.perform(post("/api/v1/disputes")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"category\":\"SERVICE_ISSUE\",\"description\":\"문제\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void dispute_for_nonexistent_reservation_fails() throws Exception {
        String token = signupAndGetToken("no_reservation_" + System.nanoTime() + "@zeom.com");

        mvc.perform(post("/api/v1/disputes")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reservationId\":99999,\"category\":\"SERVICE_ISSUE\",\"description\":\"존재하지 않는 예약\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void duplicate_dispute_for_same_reservation_allowed() throws Exception {
        // Business rule: multiple disputes per reservation may be allowed
        String token = signupAndGetToken("dup_dispute_" + System.nanoTime() + "@zeom.com");
        String bookingId = createBookingAndConfirmPayment(token);

        // First dispute
        mvc.perform(post("/api/v1/disputes")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reservationId\":" + bookingId + ",\"category\":\"SERVICE_ISSUE\",\"description\":\"문제 1\"}"))
                .andExpect(status().isOk());

        // Second dispute for same reservation
        mvc.perform(post("/api/v1/disputes")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reservationId\":" + bookingId + ",\"category\":\"BILLING_ISSUE\",\"description\":\"문제 2\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void get_my_disputes_pagination() throws Exception {
        String token = signupAndGetToken("pag_disputes_" + System.nanoTime() + "@zeom.com");
        String bookingId = createBookingAndConfirmPayment(token);

        // Create dispute
        mvc.perform(post("/api/v1/disputes")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reservationId\":" + bookingId + ",\"category\":\"SERVICE_ISSUE\",\"description\":\"테스트\"}"))
                .andExpect(status().isOk());

        // Get with pagination params
        mvc.perform(get("/api/v1/disputes/me")
                        .header("Authorization", "Bearer " + token)
                        .param("page", "0")
                        .param("size", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.disputes").isArray());
    }

    private String signupAndGetToken(String email) throws Exception {
        return mvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"Password123!\",\"name\":\"분쟁테스터\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString()
                .replaceAll(".*\"accessToken\":\"([^\"]+)\".*", "$1");
    }

    private String createBookingAndConfirmPayment(String token) throws Exception {
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
        if (bookingId == null) {
            throw new IllegalStateException("테스트용 예약 생성 실패");
        }

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

        return bookingId;
    }
}
