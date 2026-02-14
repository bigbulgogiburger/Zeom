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

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class ChatRoomAutoCreationIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired UserRepository userRepository;

    private String signupAndGetToken(String email) throws Exception {
        return mvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"Password123!\",\"name\":\"채팅테스터\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString()
                .replaceAll(".*\"accessToken\":\"([^\"]+)\".*", "$1");
    }

    private String createBooking(String token) throws Exception {
        int[][] candidates = {
            {1, 4}, {1, 5}, {1, 6}, {1, 7}, {1, 8}, {1, 9}, {1, 10},
            {2, 14}, {2, 15}, {2, 16}, {2, 17}, {2, 18}, {2, 19}, {2, 20},
            {3, 24}, {3, 25}, {3, 26}, {3, 27}, {3, 28}, {3, 29}, {3, 30},
            {1, 1}, {1, 2}, {2, 3}
        };
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

    @Test
    void chat_room_created_on_payment_confirmation() throws Exception {
        String email = "chat_" + System.nanoTime() + "@zeom.com";
        String token = signupAndGetToken(email);
        String bookingId = createBooking(token);

        // Create payment
        String payment = mvc.perform(post("/api/v1/payments")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"bookingId\":" + bookingId + ",\"amount\":50000,\"currency\":\"KRW\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String paymentId = payment.replaceAll(".*\"id\":([0-9]+).*", "$1");

        // Chat room should NOT exist before payment confirmation
        mvc.perform(get("/api/v1/chats/by-booking/" + bookingId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());

        // Confirm payment - should trigger chat room creation
        mvc.perform(post("/api/v1/payments/" + paymentId + "/confirm")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PAID"));

        // Chat room should now exist with OPEN status
        mvc.perform(get("/api/v1/chats/by-booking/" + bookingId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.providerRoomId").value("fake_room_" + bookingId))
                .andExpect(jsonPath("$.status").value("OPEN"));
    }

    @Test
    void chat_room_closed_on_payment_cancellation() throws Exception {
        String email = "chat_cancel_" + System.nanoTime() + "@zeom.com";
        String token = signupAndGetToken(email);
        String bookingId = createBooking(token);

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

        // Verify chat room is OPEN
        mvc.perform(get("/api/v1/chats/by-booking/" + bookingId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("OPEN"));

        // Cancel payment - should close chat room
        mvc.perform(post("/api/v1/payments/" + paymentId + "/cancel")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELED"));

        // Chat room should be CLOSED
        mvc.perform(get("/api/v1/chats/by-booking/" + bookingId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CLOSED"));
    }

    @Test
    void duplicate_confirm_does_not_create_second_chat_room() throws Exception {
        String email = "chat_dup_" + System.nanoTime() + "@zeom.com";
        String token = signupAndGetToken(email);
        String bookingId = createBooking(token);

        String payment = mvc.perform(post("/api/v1/payments")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"bookingId\":" + bookingId + ",\"amount\":50000,\"currency\":\"KRW\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String paymentId = payment.replaceAll(".*\"id\":([0-9]+).*", "$1");

        // First confirm
        mvc.perform(post("/api/v1/payments/" + paymentId + "/confirm")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // Get chat room ID
        String chatRoom1 = mvc.perform(get("/api/v1/chats/by-booking/" + bookingId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        // Retry post-actions (admin)
        String adminEmail = "chat_dup_admin_" + System.nanoTime() + "@zeom.com";
        String adminToken = mvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + adminEmail + "\",\"password\":\"Password123!\",\"name\":\"관리자\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString()
                .replaceAll(".*\"accessToken\":\"([^\"]+)\".*", "$1");
        UserEntity admin = userRepository.findByEmail(adminEmail).orElseThrow();
        admin.setRole("ADMIN");
        userRepository.save(admin);

        mvc.perform(post("/api/v1/payments/" + paymentId + "/retry-post-actions")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        // Chat room should still be the same (idempotent)
        String chatRoom2 = mvc.perform(get("/api/v1/chats/by-booking/" + bookingId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        // Same providerRoomId
        String roomId1 = chatRoom1.replaceAll(".*\"providerRoomId\":\"([^\"]+)\".*", "$1");
        String roomId2 = chatRoom2.replaceAll(".*\"providerRoomId\":\"([^\"]+)\".*", "$1");
        assert roomId1.equals(roomId2) : "Chat rooms should be the same after retry";
    }
}
