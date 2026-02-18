package com.cheonjiyeon.api;

import com.cheonjiyeon.api.booking.BookingEntity;
import com.cheonjiyeon.api.booking.BookingRepository;
import com.cheonjiyeon.api.consultation.ConsultationSessionEntity;
import com.cheonjiyeon.api.consultation.ConsultationSessionRepository;
import com.cheonjiyeon.api.credit.CreditEntity;
import com.cheonjiyeon.api.credit.CreditRepository;
import com.cheonjiyeon.api.credit.CreditUsageLogEntity;
import com.cheonjiyeon.api.credit.CreditUsageLogRepository;
import com.cheonjiyeon.api.settlement.SettlementService;
import com.cheonjiyeon.api.settlement.SettlementTransactionEntity;
import com.cheonjiyeon.api.settlement.SettlementTransactionRepository;
import com.cheonjiyeon.api.settlement.CounselorSettlementEntity;
import com.cheonjiyeon.api.settlement.CounselorSettlementRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class SettlementIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired CreditRepository creditRepository;
    @Autowired CreditUsageLogRepository usageLogRepository;
    @Autowired ConsultationSessionRepository sessionRepository;
    @Autowired BookingRepository bookingRepository;
    @Autowired SettlementTransactionRepository settlementTransactionRepository;
    @Autowired CounselorSettlementRepository counselorSettlementRepository;
    @Autowired SettlementService settlementService;

    @Test
    void testNormalEndSession_FullCreditConsumption() throws Exception {
        // Setup: user with 2 credits, booking 2 slots, start session
        String token = signupAndGetToken("settle_normal_" + System.nanoTime() + "@zeom.com");
        Long userId = getUserId(token);
        grantCredits(userId, 2);

        String bookingId = createBookingWithCredits(token, 2);
        String sessionId = startSession(bookingId);

        // Set startedAt to 30 min ago to simulate 30min call
        adjustSessionStartTime(Long.parseLong(sessionId), 30);

        // End session normally
        mvc.perform(post("/api/v1/sessions/" + sessionId + "/end")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"endReason\":\"NORMAL\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.endReason").value("NORMAL"));

        // Verify settlement transaction created
        SettlementTransactionEntity tx = settlementTransactionRepository.findBySessionId(Long.parseLong(sessionId)).orElseThrow();
        assertThat(tx.getCreditsReserved()).isEqualTo(2);
        assertThat(tx.getCreditsConsumed()).isEqualTo(2);
        assertThat(tx.getCreditsRefunded()).isEqualTo(0);
        assertThat(tx.getSettlementType()).isEqualTo("NORMAL");

        // Verify credit usage logs updated to CONSUMED
        List<CreditUsageLogEntity> logs = usageLogRepository.findByBookingId(Long.parseLong(bookingId));
        assertThat(logs).allMatch(log -> "CONSUMED".equals(log.getStatus()));
    }

    @Test
    void testTimeoutEndSession_FullCreditConsumption() throws Exception {
        String token = signupAndGetToken("settle_timeout_" + System.nanoTime() + "@zeom.com");
        Long userId = getUserId(token);
        grantCredits(userId, 1);

        String bookingId = createBookingWithCredits(token, 1);
        String sessionId = startSession(bookingId);
        adjustSessionStartTime(Long.parseLong(sessionId), 65);

        mvc.perform(post("/api/v1/sessions/" + sessionId + "/end")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"endReason\":\"TIMEOUT\"}"))
                .andExpect(status().isOk());

        SettlementTransactionEntity tx = settlementTransactionRepository.findBySessionId(Long.parseLong(sessionId)).orElseThrow();
        assertThat(tx.getCreditsConsumed()).isEqualTo(1);
        assertThat(tx.getCreditsRefunded()).isEqualTo(0);
        assertThat(tx.getSettlementType()).isEqualTo("TIMEOUT");
    }

    @Test
    void testNetworkEnd_Under10Min_FullRefund() throws Exception {
        String token = signupAndGetToken("settle_net_short_" + System.nanoTime() + "@zeom.com");
        Long userId = getUserId(token);
        grantCredits(userId, 1);

        String bookingId = createBookingWithCredits(token, 1);
        String sessionId = startSession(bookingId);

        // 8 min call (under 10 min threshold)
        adjustSessionStartTime(Long.parseLong(sessionId), 8);

        mvc.perform(post("/api/v1/sessions/" + sessionId + "/end")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"endReason\":\"NETWORK\"}"))
                .andExpect(status().isOk());

        SettlementTransactionEntity tx = settlementTransactionRepository.findBySessionId(Long.parseLong(sessionId)).orElseThrow();
        assertThat(tx.getCreditsConsumed()).isEqualTo(0);
        assertThat(tx.getCreditsRefunded()).isEqualTo(1);
        assertThat(tx.getSettlementType()).isEqualTo("NETWORK_SHORT");

        // Verify credits restored
        List<CreditUsageLogEntity> logs = usageLogRepository.findByBookingId(Long.parseLong(bookingId));
        assertThat(logs).allMatch(log -> "RELEASED".equals(log.getStatus()));

        // Verify credit balance restored
        int remaining = creditRepository.sumRemainingUnitsByUserId(userId);
        assertThat(remaining).isEqualTo(1);
    }

    @Test
    void testNetworkEnd_Over10Min_ProRataSettlement() throws Exception {
        String token = signupAndGetToken("settle_net_pro_" + System.nanoTime() + "@zeom.com");
        Long userId = getUserId(token);
        grantCredits(userId, 2);

        String bookingId = createBookingWithCredits(token, 2);
        String sessionId = startSession(bookingId);

        // 25 min call -> ceil(25/30) = 1 credit consumed, 1 refunded
        adjustSessionStartTime(Long.parseLong(sessionId), 25);

        mvc.perform(post("/api/v1/sessions/" + sessionId + "/end")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"endReason\":\"NETWORK\"}"))
                .andExpect(status().isOk());

        SettlementTransactionEntity tx = settlementTransactionRepository.findBySessionId(Long.parseLong(sessionId)).orElseThrow();
        assertThat(tx.getCreditsConsumed()).isEqualTo(1);
        assertThat(tx.getCreditsRefunded()).isEqualTo(1);
        assertThat(tx.getSettlementType()).isEqualTo("NETWORK_PARTIAL");
    }

    @Test
    void testAdminForceEnd_FullRefund() throws Exception {
        String token = signupAndGetToken("settle_admin_" + System.nanoTime() + "@zeom.com");
        Long userId = getUserId(token);
        grantCredits(userId, 1);

        String bookingId = createBookingWithCredits(token, 1);
        String sessionId = startSession(bookingId);
        adjustSessionStartTime(Long.parseLong(sessionId), 15);

        mvc.perform(post("/api/v1/sessions/" + sessionId + "/end")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"endReason\":\"ADMIN\"}"))
                .andExpect(status().isOk());

        SettlementTransactionEntity tx = settlementTransactionRepository.findBySessionId(Long.parseLong(sessionId)).orElseThrow();
        assertThat(tx.getCreditsConsumed()).isEqualTo(0);
        assertThat(tx.getCreditsRefunded()).isEqualTo(1);
        assertThat(tx.getSettlementType()).isEqualTo("ADMIN_REFUND");

        // Credits restored
        int remaining = creditRepository.sumRemainingUnitsByUserId(userId);
        assertThat(remaining).isEqualTo(1);
    }

    @Test
    void testDoubleSettlement_Prevented() throws Exception {
        String token = signupAndGetToken("settle_dup_" + System.nanoTime() + "@zeom.com");
        Long userId = getUserId(token);
        grantCredits(userId, 1);

        String bookingId = createBookingWithCredits(token, 1);
        String sessionId = startSession(bookingId);
        adjustSessionStartTime(Long.parseLong(sessionId), 30);

        // End session (triggers settlement)
        mvc.perform(post("/api/v1/sessions/" + sessionId + "/end")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"endReason\":\"NORMAL\"}"))
                .andExpect(status().isOk());

        // Verify only one settlement transaction exists
        assertThat(settlementTransactionRepository.existsBySessionId(Long.parseLong(sessionId))).isTrue();

        // Try settling again directly (should return existing, not create duplicate)
        ConsultationSessionEntity session = sessionRepository.findById(Long.parseLong(sessionId)).orElseThrow();
        SettlementTransactionEntity second = settlementService.settleSession(session);
        assertThat(second).isNotNull();

        // Only one settlement transaction should exist
        long count = settlementTransactionRepository.findBySessionId(Long.parseLong(sessionId)).stream().count();
        assertThat(count).isEqualTo(1);
    }

    @Test
    void testSettlementCalculation_CounselorEarning() throws Exception {
        String token = signupAndGetToken("settle_calc_" + System.nanoTime() + "@zeom.com");
        Long userId = getUserId(token);
        grantCredits(userId, 1);

        String bookingId = createBookingWithCredits(token, 1);
        String sessionId = startSession(bookingId);
        adjustSessionStartTime(Long.parseLong(sessionId), 30);

        mvc.perform(post("/api/v1/sessions/" + sessionId + "/end")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"endReason\":\"NORMAL\"}"))
                .andExpect(status().isOk());

        SettlementTransactionEntity tx = settlementTransactionRepository.findBySessionId(Long.parseLong(sessionId)).orElseThrow();
        // 1 credit consumed * 33,000 = 33,000 gross
        // 20% commission = 6,600
        // counselor earning = 26,400
        assertThat(tx.getCounselorEarning()).isEqualTo(26_400L);
        assertThat(tx.getPlatformFee()).isEqualTo(6_600L);
    }

    @Test
    void testCounselorSettlement_PeriodAccumulation() throws Exception {
        // Session 1
        String token1 = signupAndGetToken("settle_accum1_" + System.nanoTime() + "@zeom.com");
        Long userId1 = getUserId(token1);
        grantCredits(userId1, 1);
        String bookingId1 = createBookingWithCredits(token1, 1);
        String sessionId1 = startSession(bookingId1);
        adjustSessionStartTime(Long.parseLong(sessionId1), 30);

        mvc.perform(post("/api/v1/sessions/" + sessionId1 + "/end")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"endReason\":\"NORMAL\"}"))
                .andExpect(status().isOk());

        // Session 2 (different user, same counselor)
        String token2 = signupAndGetToken("settle_accum2_" + System.nanoTime() + "@zeom.com");
        Long userId2 = getUserId(token2);
        grantCredits(userId2, 1);
        String bookingId2 = createBookingWithCredits2(token2, 1);
        String sessionId2 = startSession(bookingId2);
        adjustSessionStartTime(Long.parseLong(sessionId2), 30);

        mvc.perform(post("/api/v1/sessions/" + sessionId2 + "/end")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"endReason\":\"NORMAL\"}"))
                .andExpect(status().isOk());

        // Verify counselor settlement accumulated
        BookingEntity booking1 = bookingRepository.findById(Long.parseLong(bookingId1)).orElseThrow();
        Long counselorId = booking1.getCounselor().getId();
        List<CounselorSettlementEntity> settlements = counselorSettlementRepository.findByCounselorIdOrderByPeriodStartDesc(counselorId);

        assertThat(settlements).isNotEmpty();
        CounselorSettlementEntity current = settlements.getFirst();
        assertThat(current.getTotalSessions()).isGreaterThanOrEqualTo(2);
    }

    @Test
    void testSettlementApi_CustomerSettlements() throws Exception {
        String token = signupAndGetToken("settle_api_" + System.nanoTime() + "@zeom.com");
        Long userId = getUserId(token);
        grantCredits(userId, 1);

        String bookingId = createBookingWithCredits(token, 1);
        String sessionId = startSession(bookingId);
        adjustSessionStartTime(Long.parseLong(sessionId), 30);

        mvc.perform(post("/api/v1/sessions/" + sessionId + "/end")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"endReason\":\"NORMAL\"}"))
                .andExpect(status().isOk());

        // Get customer settlement via API
        mvc.perform(get("/api/v1/settlements/my")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.settlements").isArray())
                .andExpect(jsonPath("$.settlements[0].settlementType").value("NORMAL"));
    }

    @Test
    void testSettlementApi_SessionSettlement() throws Exception {
        String token = signupAndGetToken("settle_sess_api_" + System.nanoTime() + "@zeom.com");
        Long userId = getUserId(token);
        grantCredits(userId, 1);

        String bookingId = createBookingWithCredits(token, 1);
        String sessionId = startSession(bookingId);
        adjustSessionStartTime(Long.parseLong(sessionId), 30);

        mvc.perform(post("/api/v1/sessions/" + sessionId + "/end")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"endReason\":\"NORMAL\"}"))
                .andExpect(status().isOk());

        // Get settlement by session
        mvc.perform(get("/api/v1/settlements/session/" + sessionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sessionId").value(Long.parseLong(sessionId)))
                .andExpect(jsonPath("$.creditsConsumed").value(1));
    }

    // --- Helper methods ---

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

    private static final int[][] SLOT_SET_1 = {
            {1, 4}, {1, 5}, {1, 6}, {1, 7}, {1, 8}, {1, 9}, {1, 10},
            {2, 14}, {2, 15}, {2, 16}, {2, 17}, {2, 18}, {2, 19}, {2, 20},
            {3, 24}, {3, 25}, {3, 26}, {3, 27}, {3, 28}, {3, 29}, {3, 30}
    };

    private String createBookingWithCredits(String token, int numSlots) throws Exception {
        for (int[] c : SLOT_SET_1) {
            String content;
            if (numSlots == 1) {
                content = "{\"counselorId\":" + c[0] + ",\"slotId\":" + c[1] + "}";
            } else {
                // Try pairs for 2 slots
                int nextSlot = c[1] + 1;
                content = "{\"counselorId\":" + c[0] + ",\"slotIds\":[" + c[1] + "," + nextSlot + "]}";
            }
            var res = mvc.perform(post("/api/v1/bookings")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(content))
                    .andReturn().getResponse();
            if (res.getStatus() == 200) {
                String bookingId = res.getContentAsString().replaceAll(".*\"id\":([0-9]+).*", "$1");
                confirmPayment(token, bookingId);
                return bookingId;
            }
        }
        throw new IllegalStateException("테스트용 예약 생성 실패");
    }

    // Second booking set to use different slots (for accumulation test)
    private static final int[][] SLOT_SET_2 = {
            {1, 11}, {1, 12}, {1, 13}, {2, 21}, {2, 22}, {2, 23},
            {3, 31}, {3, 32}, {3, 33}, {1, 1}, {1, 2}, {2, 3}
    };

    private String createBookingWithCredits2(String token, int numSlots) throws Exception {
        for (int[] c : SLOT_SET_2) {
            String content = "{\"counselorId\":" + c[0] + ",\"slotId\":" + c[1] + "}";
            var res = mvc.perform(post("/api/v1/bookings")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(content))
                    .andReturn().getResponse();
            if (res.getStatus() == 200) {
                String bookingId = res.getContentAsString().replaceAll(".*\"id\":([0-9]+).*", "$1");
                confirmPayment(token, bookingId);
                return bookingId;
            }
        }
        throw new IllegalStateException("테스트용 예약 생성 실패 (set 2)");
    }

    private void confirmPayment(String token, String bookingId) throws Exception {
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
    }

    private String startSession(String bookingId) throws Exception {
        String res = mvc.perform(post("/api/v1/sessions/" + bookingId + "/start"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return res.replaceAll(".*\"id\":([0-9]+).*", "$1");
    }

    private void adjustSessionStartTime(Long sessionId, int minutesAgo) {
        ConsultationSessionEntity session = sessionRepository.findById(sessionId).orElseThrow();
        session.setStartedAt(LocalDateTime.now().minusMinutes(minutesAgo));
        sessionRepository.save(session);
    }
}
