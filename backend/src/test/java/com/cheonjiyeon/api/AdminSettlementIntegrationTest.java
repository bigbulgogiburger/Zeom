package com.cheonjiyeon.api;

import com.cheonjiyeon.api.credit.CreditEntity;
import com.cheonjiyeon.api.credit.CreditRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class AdminSettlementIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired CreditRepository creditRepository;

    @Test
    void admin_can_list_all_settlements() throws Exception {
        // Create a settlement by running a full session flow
        createSettlementViaSessionFlow();

        // Admin retrieves all settlements
        String adminToken = getAdminToken();
        mvc.perform(get("/api/v1/admin/settlements")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.settlements").isArray());
    }

    @Test
    void admin_can_confirm_settlement() throws Exception {
        Long settlementId = createSettlementViaSessionFlow();
        String adminToken = getAdminToken();

        // Confirm settlement
        mvc.perform(post("/api/v1/admin/settlements/" + settlementId + "/confirm")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMED"))
                .andExpect(jsonPath("$.confirmedAt").exists());
    }

    @Test
    void admin_can_pay_confirmed_settlement() throws Exception {
        Long settlementId = createSettlementViaSessionFlow();
        String adminToken = getAdminToken();

        // First confirm
        mvc.perform(post("/api/v1/admin/settlements/" + settlementId + "/confirm")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        // Then pay
        mvc.perform(post("/api/v1/admin/settlements/" + settlementId + "/pay")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PAID"))
                .andExpect(jsonPath("$.paidAt").exists());
    }

    @Test
    void admin_cannot_pay_unconfirmed_settlement() throws Exception {
        Long settlementId = createSettlementViaSessionFlow();
        String adminToken = getAdminToken();

        // Try to pay without confirming first
        mvc.perform(post("/api/v1/admin/settlements/" + settlementId + "/pay")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest());
    }

    @Test
    void confirm_nonexistent_settlement_returns_404() throws Exception {
        String adminToken = getAdminToken();
        mvc.perform(post("/api/v1/admin/settlements/99999/confirm")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void pay_nonexistent_settlement_returns_404() throws Exception {
        String adminToken = getAdminToken();
        mvc.perform(post("/api/v1/admin/settlements/99999/pay")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void session_end_creates_settlement_transaction() throws Exception {
        String token = signupAndGetToken("settle_tx_" + System.nanoTime() + "@zeom.com");
        Long userId = getUserId(token);

        grantCredits(userId, 1);
        String bookingId = createBookingAndConfirmPayment(token);

        // Start session
        String sessionRes = mvc.perform(post("/api/v1/sessions/" + bookingId + "/start"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String sessionId = sessionRes.replaceAll(".*\"id\":([0-9]+).*", "$1");

        // End session
        mvc.perform(post("/api/v1/sessions/" + sessionId + "/end")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"endReason\":\"NORMAL\"}"))
                .andExpect(status().isOk());

        // Verify settlement was created
        mvc.perform(get("/api/v1/settlements/session/" + sessionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sessionId").value(Long.parseLong(sessionId)))
                .andExpect(jsonPath("$.settlementType").value("NORMAL"))
                .andExpect(jsonPath("$.commissionRate").exists())
                .andExpect(jsonPath("$.counselorEarning").exists())
                .andExpect(jsonPath("$.platformFee").exists());
    }

    @Test
    void settlement_is_idempotent() throws Exception {
        String token = signupAndGetToken("settle_idem_" + System.nanoTime() + "@zeom.com");
        Long userId = getUserId(token);

        grantCredits(userId, 1);
        String bookingId = createBookingAndConfirmPayment(token);

        // Start and end session
        String sessionRes = mvc.perform(post("/api/v1/sessions/" + bookingId + "/start"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String sessionId = sessionRes.replaceAll(".*\"id\":([0-9]+).*", "$1");

        mvc.perform(post("/api/v1/sessions/" + sessionId + "/end")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"endReason\":\"NORMAL\"}"))
                .andExpect(status().isOk());

        // Get settlement - first call
        String firstRes = mvc.perform(get("/api/v1/settlements/session/" + sessionId))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String firstId = firstRes.replaceAll(".*\"id\":([0-9]+).*", "$1");

        // Second end should be idempotent (already ended - returns 400)
        mvc.perform(post("/api/v1/sessions/" + sessionId + "/end")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"endReason\":\"NORMAL\"}"))
                .andExpect(status().isBadRequest()); // Session already ended

        // Settlement should still be the same
        String secondRes = mvc.perform(get("/api/v1/settlements/session/" + sessionId))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String secondId = secondRes.replaceAll(".*\"id\":([0-9]+).*", "$1");

        // Same settlement ID (idempotent)
        if (!firstId.equals(secondId)) {
            throw new AssertionError("Settlement should be idempotent. First ID: " + firstId + ", Second ID: " + secondId);
        }
    }

    @Test
    void zero_credits_settlement_produces_zero_earnings() throws Exception {
        String token = signupAndGetToken("settle_zero_" + System.nanoTime() + "@zeom.com");

        // Create booking WITHOUT credits (legacy path - no credits granted)
        String bookingId = createBookingAndConfirmPayment(token);

        // Start and end session
        String sessionRes = mvc.perform(post("/api/v1/sessions/" + bookingId + "/start"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String sessionId = sessionRes.replaceAll(".*\"id\":([0-9]+).*", "$1");

        mvc.perform(post("/api/v1/sessions/" + sessionId + "/end")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"endReason\":\"NORMAL\"}"))
                .andExpect(status().isOk());

        // Settlement should have 0 credits and 0 earnings
        mvc.perform(get("/api/v1/settlements/session/" + sessionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.creditsReserved").value(0))
                .andExpect(jsonPath("$.creditsConsumed").value(0))
                .andExpect(jsonPath("$.counselorEarning").value(0))
                .andExpect(jsonPath("$.platformFee").value(0));
    }

    @Test
    void customer_can_view_own_settlements() throws Exception {
        String token = signupAndGetToken("settle_my_" + System.nanoTime() + "@zeom.com");
        Long userId = getUserId(token);

        grantCredits(userId, 1);
        String bookingId = createBookingAndConfirmPayment(token);

        // Start and end session
        String sessionRes = mvc.perform(post("/api/v1/sessions/" + bookingId + "/start"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String sessionId = sessionRes.replaceAll(".*\"id\":([0-9]+).*", "$1");

        mvc.perform(post("/api/v1/sessions/" + sessionId + "/end")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"endReason\":\"NORMAL\"}"))
                .andExpect(status().isOk());

        // Customer can see their settlements
        mvc.perform(get("/api/v1/settlements/my")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.settlements").isArray())
                .andExpect(jsonPath("$.settlements[0].sessionId").value(Long.parseLong(sessionId)));
    }

    @Test
    void settlements_require_auth() throws Exception {
        mvc.perform(get("/api/v1/settlements/my"))
                .andExpect(status().isUnauthorized());
    }

    // --- Helpers ---

    private String getAdminToken() throws Exception {
        String email = "e2e_admin_settle_" + System.nanoTime() + "@zeom.com";
        return mvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"Password123!\",\"name\":\"관리자\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString()
                .replaceAll(".*\"accessToken\":\"([^\"]+)\".*", "$1");
    }

    private static final int[][] SLOT_CANDIDATES = {
            {1, 4}, {1, 5}, {1, 6}, {1, 7}, {1, 8}, {1, 9}, {1, 10},
            {2, 14}, {2, 15}, {2, 16}, {2, 17}, {2, 18}, {2, 19}, {2, 20},
            {3, 24}, {3, 25}, {3, 26}, {3, 27}, {3, 28}, {3, 29}, {3, 30},
            {1, 1}, {1, 2}, {2, 3}
    };

    private Long createSettlementViaSessionFlow() throws Exception {
        String token = signupAndGetToken("admin_settle_" + System.nanoTime() + "@zeom.com");
        Long userId = getUserId(token);

        grantCredits(userId, 1);
        String bookingId = createBookingAndConfirmPayment(token);

        // Start session
        String sessionRes = mvc.perform(post("/api/v1/sessions/" + bookingId + "/start"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String sessionId = sessionRes.replaceAll(".*\"id\":([0-9]+).*", "$1");

        // End session (triggers settlement)
        mvc.perform(post("/api/v1/sessions/" + sessionId + "/end")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"endReason\":\"NORMAL\"}"))
                .andExpect(status().isOk());

        // Find the counselor settlement that was created
        String adminToken = getAdminToken();
        String settlementsRes = mvc.perform(get("/api/v1/admin/settlements")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        // Extract the first settlement ID
        String settlementId = settlementsRes.replaceAll(".*\"id\":([0-9]+).*", "$1");
        return Long.parseLong(settlementId);
    }

    private String signupAndGetToken(String email) throws Exception {
        return mvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"Password123!\",\"name\":\"정산테스터\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString()
                .replaceAll(".*\"accessToken\":\"([^\"]+)\".*", "$1");
    }

    private Long getUserId(String token) throws Exception {
        String res = mvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return Long.parseLong(res.replaceAll(".*\"id\":([0-9]+).*", "$1"));
    }

    private void grantCredits(Long userId, int units) {
        CreditEntity credit = new CreditEntity();
        credit.setUserId(userId);
        credit.setTotalUnits(units);
        credit.setRemainingUnits(units);
        credit.setPurchasedAt(LocalDateTime.now());
        creditRepository.save(credit);
    }

    private String createBookingAndConfirmPayment(String token) throws Exception {
        String bookingId = null;
        for (int[] c : SLOT_CANDIDATES) {
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
