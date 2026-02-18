package com.cheonjiyeon.api;

import com.cheonjiyeon.api.consultation.ConsultationSessionEntity;
import com.cheonjiyeon.api.consultation.ConsultationSessionRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class ConsultationSessionIntegrationTest {

    @Autowired
    MockMvc mvc;

    @Autowired
    ConsultationSessionRepository sessionRepository;

    @Test
    void session_start_creates_record() throws Exception {
        String token = signupAndGetToken("session_start_" + System.nanoTime() + "@zeom.com");
        String bookingId = createBookingAndConfirmPayment(token);

        mvc.perform(post("/api/v1/sessions/" + bookingId + "/start"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reservationId").value(Long.parseLong(bookingId)))
                .andExpect(jsonPath("$.sendbirdRoomId").exists())
                .andExpect(jsonPath("$.startedAt").exists())
                .andExpect(jsonPath("$.endedAt").doesNotExist());
    }

    @Test
    void session_end_calculates_duration() throws Exception {
        String token = signupAndGetToken("session_end_" + System.nanoTime() + "@zeom.com");
        String bookingId = createBookingAndConfirmPayment(token);

        // Start session
        String startRes = mvc.perform(post("/api/v1/sessions/" + bookingId + "/start"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String sessionId = startRes.replaceAll(".*\"id\":([0-9]+).*", "$1");

        // End session (duration calculated automatically)
        mvc.perform(post("/api/v1/sessions/" + sessionId + "/end")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"endReason\":\"COMPLETED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.endedAt").exists())
                .andExpect(jsonPath("$.endReason").value("COMPLETED"))
                .andExpect(jsonPath("$.durationSec").exists());
    }

    @Test
    void duplicate_session_start_is_idempotent() throws Exception {
        String token = signupAndGetToken("dup_start_" + System.nanoTime() + "@zeom.com");
        String bookingId = createBookingAndConfirmPayment(token);

        // Start session first time
        String firstRes = mvc.perform(post("/api/v1/sessions/" + bookingId + "/start"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String firstId = firstRes.replaceAll(".*\"id\":([0-9]+).*", "$1");

        // Start again - should return same session (idempotent)
        mvc.perform(post("/api/v1/sessions/" + bookingId + "/start"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(Long.parseLong(firstId)));
    }

    @Test
    void end_without_start_fails() throws Exception {
        String token = signupAndGetToken("end_no_start_" + System.nanoTime() + "@zeom.com");

        // Try to end a non-existent session
        mvc.perform(post("/api/v1/sessions/99999/end")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"endReason\":\"COMPLETED\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void get_session_by_reservation_id() throws Exception {
        String token = signupAndGetToken("get_session_" + System.nanoTime() + "@zeom.com");
        String bookingId = createBookingAndConfirmPayment(token);

        // Start session
        mvc.perform(post("/api/v1/sessions/" + bookingId + "/start"))
                .andExpect(status().isOk());

        // Get session
        mvc.perform(get("/api/v1/sessions/" + bookingId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reservationId").value(Long.parseLong(bookingId)))
                .andExpect(jsonPath("$.sendbirdRoomId").exists());
    }

    @Test
    void session_end_validation_missing_fields() throws Exception {
        String token = signupAndGetToken("validation_" + System.nanoTime() + "@zeom.com");
        String bookingId = createBookingAndConfirmPayment(token);

        // Start session
        String startRes = mvc.perform(post("/api/v1/sessions/" + bookingId + "/start"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String sessionId = startRes.replaceAll(".*\"id\":([0-9]+).*", "$1");

        // Missing endReason
        mvc.perform(post("/api/v1/sessions/" + sessionId + "/end")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void session_start_creates_sendbird_channel() throws Exception {
        String token = signupAndGetToken("sendbird_channel_" + System.nanoTime() + "@zeom.com");
        String bookingId = createBookingAndConfirmPayment(token);

        // Start session and verify sendbirdRoomId format
        mvc.perform(post("/api/v1/sessions/" + bookingId + "/start"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sendbirdRoomId").value("consultation-" + bookingId));
    }

    @Test
    void session_token_endpoint_returns_valid_response() throws Exception {
        String token = signupAndGetToken("session_token_" + System.nanoTime() + "@zeom.com");
        String bookingId = createBookingAndConfirmPayment(token);

        // Start session
        mvc.perform(post("/api/v1/sessions/" + bookingId + "/start"))
                .andExpect(status().isOk());

        // Get session token and verify all Sendbird fields
        mvc.perform(post("/api/v1/sessions/" + bookingId + "/token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.sendbirdToken").exists())
                .andExpect(jsonPath("$.sendbirdToken").isNotEmpty())
                .andExpect(jsonPath("$.sendbirdUserId").exists())
                .andExpect(jsonPath("$.sendbirdAppId").exists())
                .andExpect(jsonPath("$.calleeId").exists())
                .andExpect(jsonPath("$.channelUrl").exists())
                .andExpect(jsonPath("$.calleeName").exists())
                .andExpect(jsonPath("$.durationMinutes").exists());
    }

    @Test
    void token_endpoint_for_nonexistent_session_returns_404() throws Exception {
        // Try to get token for non-existent session
        mvc.perform(post("/api/v1/sessions/99999/token"))
                .andExpect(status().isNotFound());
    }

    private String signupAndGetToken(String email) throws Exception {
        return mvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"Password123!\",\"name\":\"상담테스터\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString()
                .replaceAll(".*\"accessToken\":\"([^\"]+)\".*", "$1");
    }

    private String createBookingAndConfirmPayment(String token) throws Exception {
        // Create booking
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

        // Create and confirm payment
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
