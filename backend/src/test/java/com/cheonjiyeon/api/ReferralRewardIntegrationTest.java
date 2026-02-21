package com.cheonjiyeon.api;

import com.cheonjiyeon.api.wallet.WalletEntity;
import com.cheonjiyeon.api.wallet.WalletRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class ReferralRewardIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired WalletRepository walletRepository;

    @Test
    void referral_reward_credits_referrer_wallet() throws Exception {
        // Sign up referrer
        String referrerToken = signupAndGetToken("referrer_" + System.nanoTime() + "@zeom.com");
        Long referrerId = getUserId(referrerToken);

        // Get referrer's referral code
        String codeRes = mvc.perform(get("/api/v1/referral/my-code")
                        .header("Authorization", "Bearer " + referrerToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String referralCode = codeRes.replaceAll(".*\"code\":\"([^\"]+)\".*", "$1");

        // Check referrer wallet balance before
        WalletEntity walletBefore = walletRepository.findByUserId(referrerId).orElseThrow();
        long balanceBefore = walletBefore.getBalanceCash();

        // Sign up referee and apply referral code
        String refereeToken = signupAndGetToken("referee_" + System.nanoTime() + "@zeom.com");

        mvc.perform(post("/api/v1/referral/apply")
                        .header("Authorization", "Bearer " + refereeToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\":\"" + referralCode + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.applied").value(true))
                .andExpect(jsonPath("$.rewardAmount").value(2000));

        // Verify referrer wallet balance increased by 2000
        WalletEntity walletAfter = walletRepository.findByUserId(referrerId).orElseThrow();
        assertEquals(balanceBefore + 2000L, walletAfter.getBalanceCash());

        // Verify referral stats show rewarded
        mvc.perform(get("/api/v1/referral/stats")
                        .header("Authorization", "Bearer " + referrerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalReferrals").value(1))
                .andExpect(jsonPath("$.rewardedCount").value(1))
                .andExpect(jsonPath("$.totalRewardAmount").value(2000));
    }

    private String signupAndGetToken(String email) throws Exception {
        return mvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"Password123!\",\"name\":\"추천테스터\"}"))
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
}
