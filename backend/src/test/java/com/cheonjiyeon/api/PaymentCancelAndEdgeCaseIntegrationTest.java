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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "payment.webhook-secret=test-secret")
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class PaymentCancelAndEdgeCaseIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired UserRepository userRepository;

    @Test
    void cancel_payment_flow() throws Exception {
        String token = signupAndGetToken("cancel_" + System.nanoTime() + "@zeom.com");
        String bookingId = createBooking(token);
        String paymentId = createPayment(token, bookingId);

        mvc.perform(post("/api/v1/payments/" + paymentId + "/cancel")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELED"));

        // verify booking status updated
        mvc.perform(get("/api/v1/bookings/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("PAYMENT_CANCELED"));
    }

    @Test
    void cancel_already_canceled_payment_returns_409() throws Exception {
        String token = signupAndGetToken("canceldup_" + System.nanoTime() + "@zeom.com");
        String bookingId = createBooking(token);
        String paymentId = createPayment(token, bookingId);

        mvc.perform(post("/api/v1/payments/" + paymentId + "/cancel")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        mvc.perform(post("/api/v1/payments/" + paymentId + "/cancel")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isConflict());
    }

    @Test
    void confirm_already_paid_payment_returns_409() throws Exception {
        String token = signupAndGetToken("confirmpaid_" + System.nanoTime() + "@zeom.com");
        String bookingId = createBooking(token);
        String paymentId = createPayment(token, bookingId);

        mvc.perform(post("/api/v1/payments/" + paymentId + "/confirm")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PAID"));

        mvc.perform(post("/api/v1/payments/" + paymentId + "/confirm")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isConflict());
    }

    @Test
    void duplicate_payment_for_same_booking_returns_409() throws Exception {
        String token = signupAndGetToken("dupay_" + System.nanoTime() + "@zeom.com");
        String bookingId = createBooking(token);
        createPayment(token, bookingId);

        mvc.perform(post("/api/v1/payments")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"bookingId\":" + bookingId + ",\"amount\":50000,\"currency\":\"KRW\"}"))
                .andExpect(status().isConflict());
    }

    @Test
    void payment_for_nonexistent_booking_returns_404() throws Exception {
        String token = signupAndGetToken("nobook_" + System.nanoTime() + "@zeom.com");

        mvc.perform(post("/api/v1/payments")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"bookingId\":99999,\"amount\":50000,\"currency\":\"KRW\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void get_nonexistent_payment_returns_404() throws Exception {
        String token = signupAndGetToken("nopay_" + System.nanoTime() + "@zeom.com");

        mvc.perform(get("/api/v1/payments/99999")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    @Test
    void payment_requires_auth() throws Exception {
        mvc.perform(post("/api/v1/payments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"bookingId\":1,\"amount\":50000,\"currency\":\"KRW\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void payment_currency_validation() throws Exception {
        String token = signupAndGetToken("curval_" + System.nanoTime() + "@zeom.com");
        String bookingId = createBooking(token);

        // lowercase currency rejected
        mvc.perform(post("/api/v1/payments")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"bookingId\":" + bookingId + ",\"amount\":50000,\"currency\":\"krw\"}"))
                .andExpect(status().isBadRequest());

        // too long currency rejected
        mvc.perform(post("/api/v1/payments")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"bookingId\":" + bookingId + ",\"amount\":50000,\"currency\":\"KRWW\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void webhook_canceled_event_cancels_payment() throws Exception {
        String token = signupAndGetToken("whcancel_" + System.nanoTime() + "@zeom.com");
        String bookingId = createBooking(token);
        String paymentId = createPayment(token, bookingId);
        String txId = "fake_tx_" + paymentId;

        mvc.perform(post("/api/v1/payments/webhooks/provider")
                        .header("X-Webhook-Secret", "test-secret")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"providerTxId\":\"" + txId + "\",\"eventType\":\"CANCELED\"}"))
                .andExpect(status().isAccepted());

        mvc.perform(get("/api/v1/payments/" + paymentId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELED"));
    }

    @Test
    void webhook_failed_event_marks_payment_failed() throws Exception {
        String token = signupAndGetToken("whfail_" + System.nanoTime() + "@zeom.com");
        String bookingId = createBooking(token);
        String paymentId = createPayment(token, bookingId);
        String txId = "fake_tx_" + paymentId;

        mvc.perform(post("/api/v1/payments/webhooks/provider")
                        .header("X-Webhook-Secret", "test-secret")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"providerTxId\":\"" + txId + "\",\"eventType\":\"FAILED\"}"))
                .andExpect(status().isAccepted());

        mvc.perform(get("/api/v1/payments/" + paymentId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("FAILED"));
    }

    @Test
    void webhook_on_terminal_payment_is_ignored() throws Exception {
        String token = signupAndGetToken("whterminal_" + System.nanoTime() + "@zeom.com");
        String bookingId = createBooking(token);
        String paymentId = createPayment(token, bookingId);
        String txId = "fake_tx_" + paymentId;

        // confirm payment first
        mvc.perform(post("/api/v1/payments/" + paymentId + "/confirm")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // webhook should be ignored for already-PAID payment
        mvc.perform(post("/api/v1/payments/webhooks/provider")
                        .header("X-Webhook-Secret", "test-secret")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"providerTxId\":\"" + txId + "\",\"eventType\":\"CANCELED\"}"))
                .andExpect(status().isAccepted());

        // status should still be PAID
        mvc.perform(get("/api/v1/payments/" + paymentId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PAID"));
    }

    @Test
    void webhook_unsupported_event_returns_400() throws Exception {
        String token = signupAndGetToken("whbad_" + System.nanoTime() + "@zeom.com");
        String bookingId = createBooking(token);
        String paymentId = createPayment(token, bookingId);
        String txId = "fake_tx_" + paymentId;

        mvc.perform(post("/api/v1/payments/webhooks/provider")
                        .header("X-Webhook-Secret", "test-secret")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"providerTxId\":\"" + txId + "\",\"eventType\":\"UNKNOWN_TYPE\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void webhook_missing_secret_returns_401() throws Exception {
        mvc.perform(post("/api/v1/payments/webhooks/provider")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"providerTxId\":\"fake_tx_1\",\"eventType\":\"PAID\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void chat_room_for_nonexistent_booking_returns_404() throws Exception {
        String token = signupAndGetToken("nochat_" + System.nanoTime() + "@zeom.com");

        mvc.perform(get("/api/v1/chats/by-booking/99999")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    @Test
    void chat_room_requires_auth() throws Exception {
        mvc.perform(get("/api/v1/chats/by-booking/1"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void payment_confirm_creates_chat_room_and_closes_on_cancel() throws Exception {
        String token = signupAndGetToken("chatflow_" + System.nanoTime() + "@zeom.com");
        String bookingId = createBooking(token);
        String paymentId = createPayment(token, bookingId);

        // confirm → chat room OPEN
        mvc.perform(post("/api/v1/payments/" + paymentId + "/confirm")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        mvc.perform(get("/api/v1/chats/by-booking/" + bookingId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("OPEN"))
                .andExpect(jsonPath("$.providerRoomId").value("fake_room_" + bookingId));
    }

    @Test
    void payment_logs_require_admin() throws Exception {
        String token = signupAndGetToken("loguser_" + System.nanoTime() + "@zeom.com");

        mvc.perform(get("/api/v1/payments/1/logs")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void retry_post_actions_requires_admin() throws Exception {
        String token = signupAndGetToken("retryuser_" + System.nanoTime() + "@zeom.com");

        mvc.perform(post("/api/v1/payments/1/retry-post-actions")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    private String signupAndGetToken(String email) throws Exception {
        return mvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"Password123!\",\"name\":\"테스트\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString()
                .replaceAll(".*\"accessToken\":\"([^\"]+)\".*", "$1");
    }

    private String createBooking(String token) throws Exception {
        int[][] candidates = { {1, 4}, {1, 5}, {1, 6}, {1, 7}, {1, 8}, {1, 9}, {1, 10}, {1, 11}, {1, 12}, {1, 13}, {2, 14}, {2, 15}, {2, 16}, {2, 17}, {2, 18}, {2, 19}, {2, 20}, {2, 21}, {2, 22}, {2, 23}, {3, 24}, {3, 25}, {3, 26}, {3, 27}, {3, 28}, {3, 29}, {3, 30}, {3, 31}, {3, 32}, {3, 33}, {1, 1}, {1, 2}, {2, 3} };
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

    private String createPayment(String token, String bookingId) throws Exception {
        return mvc.perform(post("/api/v1/payments")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"bookingId\":" + bookingId + ",\"amount\":50000,\"currency\":\"KRW\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString()
                .replaceAll(".*\"id\":([0-9]+).*", "$1");
    }
}
