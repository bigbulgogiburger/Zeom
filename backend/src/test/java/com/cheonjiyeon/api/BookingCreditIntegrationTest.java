package com.cheonjiyeon.api;

import com.cheonjiyeon.api.counselor.SlotEntity;
import com.cheonjiyeon.api.counselor.SlotRepository;
import com.cheonjiyeon.api.credit.CreditEntity;
import com.cheonjiyeon.api.credit.CreditRepository;
import com.cheonjiyeon.api.credit.CreditUsageLogRepository;
import com.cheonjiyeon.api.wallet.WalletEntity;
import com.cheonjiyeon.api.wallet.WalletRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class BookingCreditIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired CreditRepository creditRepository;
    @Autowired CreditUsageLogRepository usageLogRepository;
    @Autowired WalletRepository walletRepository;
    @Autowired SlotRepository slotRepository;

    private static final int[][] SLOT_CANDIDATES = {
            {1, 4}, {1, 5}, {1, 6}, {1, 7}, {1, 8}, {1, 9}, {1, 10}, {1, 11}, {1, 12}, {1, 13},
            {2, 14}, {2, 15}, {2, 16}, {2, 17}, {2, 18}, {2, 19}, {2, 20}, {2, 21}, {2, 22}, {2, 23},
            {3, 24}, {3, 25}, {3, 26}, {3, 27}, {3, 28}, {3, 29}, {3, 30}, {3, 31}, {3, 32}, {3, 33},
            {1, 1}, {1, 2}, {2, 3}
    };

    @Test
    void book_two_slots_reserves_two_credits() throws Exception {
        String token = signupAndGetToken("bc_2slot_" + System.nanoTime() + "@zeom.com");
        Long userId = getUserId(token);

        // Grant 3 credits
        grantCredits(userId, 3);

        // Verify initial credit balance
        mvc.perform(get("/api/v1/credits/my")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.remainingUnits").value(3));

        // Book 2 slots
        String bookingRes = mvc.perform(post("/api/v1/bookings")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"counselorId\":3,\"slotIds\":[24,25]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.creditsUsed").value(2))
                .andExpect(jsonPath("$.slots", hasSize(2)))
                .andReturn().getResponse().getContentAsString();

        // Verify credits decreased
        mvc.perform(get("/api/v1/credits/my")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.remainingUnits").value(1))
                .andExpect(jsonPath("$.usedUnits").value(2));
    }

    @Test
    void cancel_booking_releases_credits() throws Exception {
        String token = signupAndGetToken("bc_cancel_" + System.nanoTime() + "@zeom.com");
        Long userId = getUserId(token);

        // Move slots 26,27 to 48h in the future so free cancel is allowed
        moveSlotsToFuture(26L, 48);
        moveSlotsToFuture(27L, 48);

        // Grant 2 credits
        grantCredits(userId, 2);

        // Book 2 slots
        String bookingRes = mvc.perform(post("/api/v1/bookings")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"counselorId\":3,\"slotIds\":[26,27]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.creditsUsed").value(2))
                .andReturn().getResponse().getContentAsString();

        String bookingId = bookingRes.replaceAll(".*\"id\":([0-9]+).*", "$1");

        // Verify credits used
        mvc.perform(get("/api/v1/credits/my")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.remainingUnits").value(0));

        // Cancel booking (48h away = FREE_CANCEL, 100% refund)
        mvc.perform(post("/api/v1/bookings/" + bookingId + "/cancel")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELED"))
                .andExpect(jsonPath("$.creditsUsed").value(0))
                .andExpect(jsonPath("$.cancelType").value("FREE_CANCEL"))
                .andExpect(jsonPath("$.refundedCredits").value(2));

        // Verify credits restored
        mvc.perform(get("/api/v1/credits/my")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.remainingUnits").value(2));
    }

    @Test
    void book_with_insufficient_credits_returns_400() throws Exception {
        String token = signupAndGetToken("bc_insuff_" + System.nanoTime() + "@zeom.com");
        Long userId = getUserId(token);

        // Grant only 1 credit
        grantCredits(userId, 1);

        // Try to book 2 slots — should fail
        mvc.perform(post("/api/v1/bookings")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"counselorId\":3,\"slotIds\":[28,29]}"))
                .andExpect(status().isBadRequest());

        // Verify credits not changed
        mvc.perform(get("/api/v1/credits/my")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.remainingUnits").value(1));
    }

    @Test
    void book_without_credits_succeeds_on_legacy_path() throws Exception {
        String token = signupAndGetToken("bc_nocred_" + System.nanoTime() + "@zeom.com");

        // User has never purchased credits — booking succeeds without credit check (legacy path)
        mvc.perform(post("/api/v1/bookings")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"counselorId\":3,\"slotId\":30}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.creditsUsed").value(0));
    }

    @Test
    void book_with_all_credits_used_returns_400() throws Exception {
        String token = signupAndGetToken("bc_allused_" + System.nanoTime() + "@zeom.com");
        Long userId = getUserId(token);

        // Grant 1 credit (total > 0 means credit check is active)
        grantCredits(userId, 1);

        // Book 1 slot — uses all credits
        mvc.perform(post("/api/v1/bookings")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"counselorId\":3,\"slotId\":30}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.creditsUsed").value(1));

        // Try to book another slot with 0 remaining credits — should fail
        mvc.perform(post("/api/v1/bookings")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"counselorId\":3,\"slotId\":31}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void end_to_end_purchase_credits_then_book() throws Exception {
        String token = signupAndGetToken("bc_e2e_" + System.nanoTime() + "@zeom.com");
        Long userId = getUserId(token);

        // Fund wallet
        WalletEntity wallet = walletRepository.findByUserId(userId).orElseThrow();
        wallet.setBalanceCash(200000L);
        walletRepository.save(wallet);

        // Purchase 3-unit credit package (product #6: 90분, 3 units)
        mvc.perform(post("/api/v1/credits/purchase")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"productId\":6}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.units").value(3));

        // Book 2 slots using credits
        mvc.perform(post("/api/v1/bookings")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"counselorId\":3,\"slotIds\":[31,32]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.creditsUsed").value(2));

        // Verify credit balance
        mvc.perform(get("/api/v1/credits/my")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalUnits").value(3))
                .andExpect(jsonPath("$.usedUnits").value(2))
                .andExpect(jsonPath("$.remainingUnits").value(1));

        // Verify credit history shows usage
        mvc.perform(get("/api/v1/credits/history")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(1)))
                .andExpect(jsonPath("$.items[0].usages", hasSize(1)))
                .andExpect(jsonPath("$.items[0].usages[0].unitsUsed").value(2));
    }

    private String signupAndGetToken(String email) throws Exception {
        return mvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"Password123!\",\"name\":\"크레딧테스터\"}"))
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

    private void moveSlotsToFuture(Long slotId, int hoursFromNow) {
        SlotEntity slot = slotRepository.findById(slotId).orElseThrow();
        LocalDateTime newStart = LocalDateTime.now().plusHours(hoursFromNow);
        slot.setStartAt(newStart);
        slot.setEndAt(newStart.plusMinutes(30));
        slotRepository.save(slot);
    }
}
