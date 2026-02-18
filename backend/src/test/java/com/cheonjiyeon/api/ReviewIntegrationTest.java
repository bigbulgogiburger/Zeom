package com.cheonjiyeon.api;

import com.cheonjiyeon.api.counselor.CounselorEntity;
import com.cheonjiyeon.api.counselor.CounselorRepository;
import com.cheonjiyeon.api.review.ReviewEntity;
import com.cheonjiyeon.api.review.ReviewRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class ReviewIntegrationTest {

    @Autowired
    MockMvc mvc;

    @Autowired
    ReviewRepository reviewRepository;

    @Autowired
    CounselorRepository counselorRepository;

    @Test
    void create_review_after_session() throws Exception {
        String token = signupAndGetToken("review_create_" + System.nanoTime() + "@zeom.com");
        String bookingId = createBookingAndConfirmPayment(token);

        // Start and end session
        mvc.perform(post("/api/v1/sessions/" + bookingId + "/start")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sendbirdRoomId\":\"room_" + bookingId + "\"}"))
                .andExpect(status().isOk());

        String sessionRes = mvc.perform(get("/api/v1/sessions/" + bookingId))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String sessionId = sessionRes.replaceAll(".*\"id\":([0-9]+).*", "$1");

        mvc.perform(post("/api/v1/sessions/" + sessionId + "/end")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"endReason\":\"COMPLETED\",\"durationSec\":1800}"))
                .andExpect(status().isOk());

        // Create review
        mvc.perform(post("/api/v1/reservations/" + bookingId + "/reviews")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rating\":5,\"comment\":\"정말 훌륭한 상담이었습니다!\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reservationId").value(Long.parseLong(bookingId)))
                .andExpect(jsonPath("$.rating").value(5))
                .andExpect(jsonPath("$.comment").value("정말 훌륭한 상담이었습니다!"));
    }

    @Test
    void duplicate_review_for_same_reservation_fails() throws Exception {
        String token = signupAndGetToken("dup_review_" + System.nanoTime() + "@zeom.com");
        String bookingId = createBookingAndConfirmPayment(token);

        // Complete session
        completeSession(bookingId);

        // Create first review
        mvc.perform(post("/api/v1/reservations/" + bookingId + "/reviews")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rating\":5,\"comment\":\"좋았어요\"}"))
                .andExpect(status().isOk());

        // Try to create second review for same reservation
        mvc.perform(post("/api/v1/reservations/" + bookingId + "/reviews")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rating\":4,\"comment\":\"또 작성\"}"))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void counselor_rating_avg_updates_correctly() throws Exception {
        // Get a counselor
        CounselorEntity counselor = counselorRepository.findById(1L)
                .orElseThrow(() -> new IllegalStateException("Counselor 1 not found"));

        BigDecimal initialRating = counselor.getRatingAvg();

        // Create multiple reviews
        String token1 = signupAndGetToken("review1_" + System.nanoTime() + "@zeom.com");
        String booking1 = createBookingAndConfirmPayment(token1);
        completeSession(booking1);

        mvc.perform(post("/api/v1/reservations/" + booking1 + "/reviews")
                        .header("Authorization", "Bearer " + token1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rating\":5,\"comment\":\"훌륭해요\"}"))
                .andExpect(status().isOk());

        // Check rating updated
        CounselorEntity updated = counselorRepository.findById(1L).orElseThrow();
        if (updated.getRatingAvg() == null || updated.getRatingAvg().compareTo(BigDecimal.ZERO) == 0) {
            // Rating should be updated after review
            throw new AssertionError("Rating average should be updated after review");
        }
    }

    @Test
    void get_reviews_by_counselor_with_pagination() throws Exception {
        // Create a couple of reviews for counselor 1
        String token1 = signupAndGetToken("pag1_" + System.nanoTime() + "@zeom.com");
        String booking1 = createBookingAndConfirmPayment(token1);
        completeSession(booking1);

        mvc.perform(post("/api/v1/reservations/" + booking1 + "/reviews")
                        .header("Authorization", "Bearer " + token1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rating\":5,\"comment\":\"완벽합니다\"}"))
                .andExpect(status().isOk());

        String token2 = signupAndGetToken("pag2_" + System.nanoTime() + "@zeom.com");
        String booking2 = createBookingAndConfirmPayment(token2);
        completeSession(booking2);

        mvc.perform(post("/api/v1/reservations/" + booking2 + "/reviews")
                        .header("Authorization", "Bearer " + token2)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rating\":4,\"comment\":\"좋아요\"}"))
                .andExpect(status().isOk());

        // Get reviews
        mvc.perform(get("/api/v1/counselors/1/reviews")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reviews").isArray())
                .andExpect(jsonPath("$.reviews", hasSize(greaterThanOrEqualTo(2))))
                .andExpect(jsonPath("$.reviews[0].rating").exists())
                .andExpect(jsonPath("$.reviews[0].comment").exists());
    }

    @Test
    void create_review_requires_auth() throws Exception {
        mvc.perform(post("/api/v1/reservations/1/reviews")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rating\":5,\"comment\":\"좋아요\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void create_review_validation_errors() throws Exception {
        String token = signupAndGetToken("val_review_" + System.nanoTime() + "@zeom.com");
        String bookingId = createBookingAndConfirmPayment(token);
        completeSession(bookingId);

        // Rating out of range
        mvc.perform(post("/api/v1/reservations/" + bookingId + "/reviews")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rating\":6,\"comment\":\"좋아요\"}"))
                .andExpect(status().isBadRequest());

        // Missing rating
        mvc.perform(post("/api/v1/reservations/" + bookingId + "/reviews")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"comment\":\"좋아요\"}"))
                .andExpect(status().isBadRequest());
    }

    private String signupAndGetToken(String email) throws Exception {
        return mvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"Password123!\",\"name\":\"리뷰테스터\"}"))
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

    private void completeSession(String bookingId) throws Exception {
        mvc.perform(post("/api/v1/sessions/" + bookingId + "/start"))
                .andExpect(status().isOk());

        String sessionRes = mvc.perform(get("/api/v1/sessions/" + bookingId))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String sessionId = sessionRes.replaceAll(".*\"id\":([0-9]+).*", "$1");

        mvc.perform(post("/api/v1/sessions/" + sessionId + "/end")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"endReason\":\"COMPLETED\"}"))
                .andExpect(status().isOk());
    }
}
