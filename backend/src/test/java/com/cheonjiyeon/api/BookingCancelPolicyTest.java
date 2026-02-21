package com.cheonjiyeon.api;

import com.cheonjiyeon.api.counselor.SlotEntity;
import com.cheonjiyeon.api.counselor.SlotRepository;
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
class BookingCancelPolicyTest {

    @Autowired MockMvc mvc;
    @Autowired CreditRepository creditRepository;
    @Autowired SlotRepository slotRepository;

    @Test
    void cancel_24h_plus_before_gives_full_refund() throws Exception {
        String token = signupAndGetToken("cancel_24h_" + System.nanoTime() + "@zeom.com");
        Long userId = getUserId(token);

        // Move slot 24 to 48h in the future
        moveSlotsToFuture(24L, 48);

        grantCredits(userId, 2);

        // Book 1 slot
        String bookingRes = mvc.perform(post("/api/v1/bookings")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"counselorId\":3,\"slotId\":24}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.creditsUsed").value(1))
                .andReturn().getResponse().getContentAsString();

        String bookingId = bookingRes.replaceAll(".*\"id\":([0-9]+).*", "$1");

        // Cancel — 48h away = FREE_CANCEL = 100% refund
        mvc.perform(post("/api/v1/bookings/" + bookingId + "/cancel")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELED"))
                .andExpect(jsonPath("$.cancelType").value("FREE_CANCEL"))
                .andExpect(jsonPath("$.refundedCredits").value(1))
                .andExpect(jsonPath("$.creditsUsed").value(0));

        // Verify all credits restored
        mvc.perform(get("/api/v1/credits/my")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.remainingUnits").value(2));
    }

    @Test
    void cancel_2h_before_gives_50_percent_refund() throws Exception {
        String token = signupAndGetToken("cancel_2h_" + System.nanoTime() + "@zeom.com");
        Long userId = getUserId(token);

        // Move slot 25 to 2h in the future (between 1h and 24h)
        moveSlotsToFuture(25L, 2);

        grantCredits(userId, 2);

        // Book 2 slots
        String bookingRes = mvc.perform(post("/api/v1/bookings")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"counselorId\":3,\"slotId\":25}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.creditsUsed").value(1))
                .andReturn().getResponse().getContentAsString();

        String bookingId = bookingRes.replaceAll(".*\"id\":([0-9]+).*", "$1");

        // Cancel — 2h away = PARTIAL_CANCEL = 50% refund
        // 1 credit used, 50% = 0 credits refunded (integer division: 1/2=0)
        mvc.perform(post("/api/v1/bookings/" + bookingId + "/cancel")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELED"))
                .andExpect(jsonPath("$.cancelType").value("PARTIAL_CANCEL"));
    }

    @Test
    void cancel_2h_before_with_2_credits_gives_1_back() throws Exception {
        String token = signupAndGetToken("cancel_2h2c_" + System.nanoTime() + "@zeom.com");
        Long userId = getUserId(token);

        // Move slots 26, 27 to 2h in the future
        moveSlotsToFuture(26L, 2);
        moveSlotsToFuture(27L, 2);

        grantCredits(userId, 2);

        // Book 2 slots (2 credits used)
        String bookingRes = mvc.perform(post("/api/v1/bookings")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"counselorId\":3,\"slotIds\":[26,27]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.creditsUsed").value(2))
                .andReturn().getResponse().getContentAsString();

        String bookingId = bookingRes.replaceAll(".*\"id\":([0-9]+).*", "$1");

        // Cancel — 2h away = PARTIAL_CANCEL = 50% refund of 2 credits = 1 refunded
        mvc.perform(post("/api/v1/bookings/" + bookingId + "/cancel")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELED"))
                .andExpect(jsonPath("$.cancelType").value("PARTIAL_CANCEL"))
                .andExpect(jsonPath("$.refundedCredits").value(1))
                .andExpect(jsonPath("$.creditsUsed").value(1));

        // Verify partial credits restored (had 2, used 2, refunded 1 => remaining 1)
        mvc.perform(get("/api/v1/credits/my")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.remainingUnits").value(1));
    }

    @Test
    void cancel_less_than_1h_before_is_blocked() throws Exception {
        String token = signupAndGetToken("cancel_30m_" + System.nanoTime() + "@zeom.com");
        Long userId = getUserId(token);

        // Move slot 28 to 30min in the future (less than 1h)
        SlotEntity slot = slotRepository.findById(28L).orElseThrow();
        LocalDateTime newStart = LocalDateTime.now().plusMinutes(30);
        slot.setStartAt(newStart);
        slot.setEndAt(newStart.plusMinutes(30));
        slotRepository.save(slot);

        grantCredits(userId, 1);

        // Book 1 slot
        String bookingRes = mvc.perform(post("/api/v1/bookings")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"counselorId\":3,\"slotId\":28}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String bookingId = bookingRes.replaceAll(".*\"id\":([0-9]+).*", "$1");

        // Cancel — 30min away = blocked
        mvc.perform(post("/api/v1/bookings/" + bookingId + "/cancel")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("상담 시작 1시간 전까지만 취소 가능합니다."));
    }

    @Test
    void cancel_paid_booking_is_blocked() throws Exception {
        String token = signupAndGetToken("cancel_paid_" + System.nanoTime() + "@zeom.com");

        // Move slot 29 to far future
        moveSlotsToFuture(29L, 72);

        // Book without credits (legacy path, status = BOOKED)
        String bookingRes = mvc.perform(post("/api/v1/bookings")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"counselorId\":3,\"slotId\":29}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String bookingId = bookingRes.replaceAll(".*\"id\":([0-9]+).*", "$1");

        // Manually set booking status to PAID (simulating payment completion)
        // We use the booking repository directly
        com.cheonjiyeon.api.booking.BookingEntity booking =
                bookingRepository.findById(Long.parseLong(bookingId)).orElseThrow();
        booking.setStatus("PAID");
        bookingRepository.save(booking);

        // Cancel — PAID status = blocked
        mvc.perform(post("/api/v1/bookings/" + bookingId + "/cancel")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("결제 완료된 예약은 환불 요청을 이용해주세요."));
    }

    @Autowired
    com.cheonjiyeon.api.booking.BookingRepository bookingRepository;

    private String signupAndGetToken(String email) throws Exception {
        return mvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"Password123!\",\"name\":\"취소테스터\"}"))
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
