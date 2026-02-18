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

import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class CounselorMemoIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired ConsultationSessionRepository sessionRepository;

    @Test
    void counselor_can_save_memo_for_session() throws Exception {
        String counselorToken = signupCounselorAndGetToken("memo_save_" + System.nanoTime());
        Long sessionId = createSessionForCounselor(counselorToken);

        mvc.perform(post("/api/v1/counselor/records/" + sessionId + "/memo")
                        .header("Authorization", "Bearer " + counselorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"고객이 재정 문제로 스트레스를 받고 있음. 다음 상담에서 해결 방안 논의 예정.\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sessionId").value(sessionId))
                .andExpect(jsonPath("$.content").value("고객이 재정 문제로 스트레스를 받고 있음. 다음 상담에서 해결 방안 논의 예정."))
                .andExpect(jsonPath("$.createdAt").exists())
                .andExpect(jsonPath("$.updatedAt").exists());
    }

    @Test
    void counselor_can_update_existing_memo() throws Exception {
        String counselorToken = signupCounselorAndGetToken("memo_update_" + System.nanoTime());
        Long sessionId = createSessionForCounselor(counselorToken);

        // Save initial memo
        mvc.perform(post("/api/v1/counselor/records/" + sessionId + "/memo")
                        .header("Authorization", "Bearer " + counselorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"초기 메모\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").value("초기 메모"));

        // Update memo (upsert)
        mvc.perform(post("/api/v1/counselor/records/" + sessionId + "/memo")
                        .header("Authorization", "Bearer " + counselorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"수정된 메모 내용입니다.\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").value("수정된 메모 내용입니다."));
    }

    @Test
    void memo_appears_in_consultation_records() throws Exception {
        String counselorToken = signupCounselorAndGetToken("memo_records_" + System.nanoTime());
        Long sessionId = createSessionForCounselor(counselorToken);

        // Save memo
        mvc.perform(post("/api/v1/counselor/records/" + sessionId + "/memo")
                        .header("Authorization", "Bearer " + counselorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"상담 기록에 표시될 메모\"}"))
                .andExpect(status().isOk());

        // Check records list includes memo
        mvc.perform(get("/api/v1/counselor/records")
                        .header("Authorization", "Bearer " + counselorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.records[0].memo").value("상담 기록에 표시될 메모"));
    }

    @Test
    void memo_for_nonexistent_session_returns_404() throws Exception {
        String counselorToken = signupCounselorAndGetToken("memo_404_" + System.nanoTime());

        mvc.perform(post("/api/v1/counselor/records/99999/memo")
                        .header("Authorization", "Bearer " + counselorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"테스트\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void non_counselor_cannot_save_memo() throws Exception {
        String userToken = signupAndGetToken("memo_user_" + System.nanoTime() + "@zeom.com");

        mvc.perform(post("/api/v1/counselor/records/1/memo")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"unauthorized\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void memo_without_auth_returns_401() throws Exception {
        mvc.perform(post("/api/v1/counselor/records/1/memo")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"no auth\"}"))
                .andExpect(status().isUnauthorized());
    }

    // --- Helpers ---

    private String signupAndGetToken(String email) throws Exception {
        return mvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"Password123!\",\"name\":\"메모테스터\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString()
                .replaceAll(".*\"accessToken\":\"([^\"]+)\".*", "$1");
    }

    private String signupCounselorAndGetToken(String prefix) throws Exception {
        // e2e_counselor_ prefix triggers auto COUNSELOR role + CounselorEntity creation
        String email = "e2e_counselor_" + prefix + "@zeom.com";
        return mvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"Password123!\",\"name\":\"메모상담사\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString()
                .replaceAll(".*\"accessToken\":\"([^\"]+)\".*", "$1");
    }

    private Long createSessionForCounselor(String counselorToken) throws Exception {
        // Get counselor info to find counselor ID
        String meRes = mvc.perform(get("/api/v1/counselor/me")
                        .header("Authorization", "Bearer " + counselorToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String counselorId = meRes.replaceAll(".*\"id\":([0-9]+).*", "$1");

        // Sign up a customer
        String customerEmail = "memo_customer_" + System.nanoTime() + "@zeom.com";
        String customerToken = signupAndGetToken(customerEmail);

        // Create a slot for the counselor and get the slot ID from the response
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startAt = now.plusMinutes(5);
        LocalDateTime endAt = startAt.plusMinutes(30);

        String scheduleRes = mvc.perform(put("/api/v1/counselor/schedule")
                        .header("Authorization", "Bearer " + counselorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"slots\":[{\"startAt\":\"" + startAt + "\",\"endAt\":\"" + endAt + "\"}]}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String slotId = scheduleRes.replaceAll(".*\"id\":([0-9]+).*", "$1");

        // Customer books the slot
        String bookingRes = mvc.perform(post("/api/v1/bookings")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"counselorId\":" + counselorId + ",\"slotId\":" + slotId + "}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String bookingId = bookingRes.replaceAll(".*\"id\":([0-9]+).*", "$1");

        // Start session
        String sessionRes = mvc.perform(post("/api/v1/sessions/" + bookingId + "/start"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return Long.parseLong(sessionRes.replaceAll(".*\"id\":([0-9]+).*", "$1"));
    }
}
