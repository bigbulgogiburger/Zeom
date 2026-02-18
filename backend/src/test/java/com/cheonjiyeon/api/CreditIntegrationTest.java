package com.cheonjiyeon.api;

import com.cheonjiyeon.api.credit.CreditRepository;
import com.cheonjiyeon.api.credit.CreditService;
import com.cheonjiyeon.api.wallet.WalletEntity;
import com.cheonjiyeon.api.wallet.WalletRepository;
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
class CreditIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired WalletRepository walletRepository;
    @Autowired CreditRepository creditRepository;
    @Autowired CreditService creditService;

    private static final int[][] SLOT_CANDIDATES = {
            {1, 4}, {1, 5}, {1, 6}, {1, 7}, {1, 8}, {1, 9}, {1, 10}, {1, 11}, {1, 12}, {1, 13},
            {2, 14}, {2, 15}, {2, 16}, {2, 17}, {2, 18}, {2, 19}, {2, 20}, {2, 21}, {2, 22}, {2, 23},
            {3, 24}, {3, 25}, {3, 26}, {3, 27}, {3, 28}, {3, 29}, {3, 30}, {3, 31}, {3, 32}, {3, 33},
            {1, 1}, {1, 2}, {2, 3}
    };

    @Test
    void purchase_credits_with_sufficient_balance() throws Exception {
        String token = signupAndGetToken("credit_buy_" + System.nanoTime() + "@zeom.com");
        String userId = extractUserId(token);

        // Fund the wallet
        WalletEntity wallet = walletRepository.findByUserId(Long.parseLong(userId)).orElseThrow();
        wallet.setBalanceCash(100000L);
        walletRepository.save(wallet);

        // Product #4 = "상담권 1회 (30분)" from V24 migration, price 33000
        mvc.perform(post("/api/v1/credits/purchase")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"productId\":4}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.creditId").exists())
                .andExpect(jsonPath("$.units").value(1))
                .andExpect(jsonPath("$.productId").value(4))
                .andExpect(jsonPath("$.purchasedAt").exists());

        // Verify wallet was debited
        WalletEntity updated = walletRepository.findByUserId(Long.parseLong(userId)).orElseThrow();
        if (updated.getBalanceCash() != 67000L) {
            throw new AssertionError("Expected 67000, got: " + updated.getBalanceCash());
        }
    }

    @Test
    void purchase_credits_fails_with_insufficient_balance() throws Exception {
        String token = signupAndGetToken("credit_broke_" + System.nanoTime() + "@zeom.com");

        // Wallet has 0 balance (default)
        mvc.perform(post("/api/v1/credits/purchase")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"productId\":4}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void get_my_credits_returns_balance() throws Exception {
        String token = signupAndGetToken("credit_bal_" + System.nanoTime() + "@zeom.com");
        String userId = extractUserId(token);

        // Initially zero
        mvc.perform(get("/api/v1/credits/my")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalUnits").value(0))
                .andExpect(jsonPath("$.usedUnits").value(0))
                .andExpect(jsonPath("$.remainingUnits").value(0));

        // Fund and purchase product #5 = "상담권 2회 (60분)", 2 units
        WalletEntity wallet = walletRepository.findByUserId(Long.parseLong(userId)).orElseThrow();
        wallet.setBalanceCash(200000L);
        walletRepository.save(wallet);

        mvc.perform(post("/api/v1/credits/purchase")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"productId\":5}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.units").value(2));

        // Check balance
        mvc.perform(get("/api/v1/credits/my")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalUnits").value(2))
                .andExpect(jsonPath("$.usedUnits").value(0))
                .andExpect(jsonPath("$.remainingUnits").value(2));
    }

    @Test
    void get_credit_history_shows_purchases() throws Exception {
        String token = signupAndGetToken("credit_hist_" + System.nanoTime() + "@zeom.com");
        String userId = extractUserId(token);

        // Fund and purchase
        WalletEntity wallet = walletRepository.findByUserId(Long.parseLong(userId)).orElseThrow();
        wallet.setBalanceCash(200000L);
        walletRepository.save(wallet);

        mvc.perform(post("/api/v1/credits/purchase")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"productId\":4}"))
                .andExpect(status().isOk());

        mvc.perform(get("/api/v1/credits/history")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(1)))
                .andExpect(jsonPath("$.items[0].totalUnits").value(1))
                .andExpect(jsonPath("$.items[0].remainingUnits").value(1))
                .andExpect(jsonPath("$.items[0].productId").value(4));
    }

    @Test
    void reserve_credits_deducts_from_balance() throws Exception {
        String token = signupAndGetToken("credit_reserve_" + System.nanoTime() + "@zeom.com");
        String userId = extractUserId(token);
        Long uid = Long.parseLong(userId);

        // Fund and purchase 3 units (product #6)
        WalletEntity wallet = walletRepository.findByUserId(uid).orElseThrow();
        wallet.setBalanceCash(200000L);
        walletRepository.save(wallet);

        mvc.perform(post("/api/v1/credits/purchase")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"productId\":6}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.units").value(3));

        // Create a booking (booking creation now auto-reserves 1 credit)
        Long bookingId = createBooking(token);

        // Check balance reduced (1 unit used by booking creation)
        mvc.perform(get("/api/v1/credits/my")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalUnits").value(3))
                .andExpect(jsonPath("$.usedUnits").value(1))
                .andExpect(jsonPath("$.remainingUnits").value(2));
    }

    @Test
    void reserve_credits_fails_with_insufficient_credits() throws Exception {
        String token = signupAndGetToken("credit_nosuff_" + System.nanoTime() + "@zeom.com");
        String userId = extractUserId(token);
        Long uid = Long.parseLong(userId);

        // Create a booking
        Long bookingId = createBooking(token);

        // No credits purchased — should fail
        try {
            creditService.reserveCredits(uid, bookingId, 1);
            throw new AssertionError("Should have thrown ApiException for insufficient credits");
        } catch (com.cheonjiyeon.api.common.ApiException e) {
            if (e.getStatus() != 400) {
                throw new AssertionError("Expected 400 status, got: " + e.getStatus());
            }
        }
    }

    @Test
    void release_credits_restores_balance() throws Exception {
        String token = signupAndGetToken("credit_release_" + System.nanoTime() + "@zeom.com");
        String userId = extractUserId(token);
        Long uid = Long.parseLong(userId);

        // Fund and purchase 2 units (product #5)
        WalletEntity wallet = walletRepository.findByUserId(uid).orElseThrow();
        wallet.setBalanceCash(200000L);
        walletRepository.save(wallet);

        mvc.perform(post("/api/v1/credits/purchase")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"productId\":5}"))
                .andExpect(status().isOk());

        // Create a booking (auto-reserves 1 credit via booking creation)
        Long bookingId = createBooking(token);

        // Verify reduced (1 used by booking creation)
        mvc.perform(get("/api/v1/credits/my")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.remainingUnits").value(1));

        // Release all credits for this booking
        creditService.releaseCredits(bookingId);

        // Verify restored
        mvc.perform(get("/api/v1/credits/my")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.remainingUnits").value(2));
    }

    @Test
    void credits_require_auth() throws Exception {
        mvc.perform(get("/api/v1/credits/my"))
                .andExpect(status().isUnauthorized());

        mvc.perform(get("/api/v1/credits/history"))
                .andExpect(status().isUnauthorized());

        mvc.perform(post("/api/v1/credits/purchase")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"productId\":4}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void credits_with_invalid_token_returns_401() throws Exception {
        mvc.perform(get("/api/v1/credits/my")
                        .header("Authorization", "Bearer invalid.token.here"))
                .andExpect(status().isUnauthorized());
    }

    private String signupAndGetToken(String email) throws Exception {
        return mvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"Password123!\",\"name\":\"상담권테스터\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString()
                .replaceAll(".*\"accessToken\":\"([^\"]+)\".*", "$1");
    }

    private String extractUserId(String token) throws Exception {
        String res = mvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return res.replaceAll(".*\"id\":([0-9]+).*", "$1");
    }

    private Long createBooking(String token) throws Exception {
        for (int[] c : SLOT_CANDIDATES) {
            var res = mvc.perform(post("/api/v1/bookings")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"counselorId\":" + c[0] + ",\"slotId\":" + c[1] + "}"))
                    .andReturn().getResponse();
            if (res.getStatus() == 200) {
                String body = res.getContentAsString();
                return Long.parseLong(body.replaceAll(".*\"id\":([0-9]+).*", "$1"));
            }
        }
        throw new IllegalStateException("테스트용 예약 생성 실패 — 사용 가능한 슬롯 없음");
    }
}
