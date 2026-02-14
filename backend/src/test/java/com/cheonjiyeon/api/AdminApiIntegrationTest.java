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

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class AdminApiIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired UserRepository userRepository;

    @Test
    void audit_log_list_requires_admin() throws Exception {
        String userToken = signupAndGetToken("audituser_" + System.nanoTime() + "@zeom.com");

        mvc.perform(get("/api/v1/admin/audit")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void audit_log_list_returns_recent_actions() throws Exception {
        String email = "auditadmin_" + System.nanoTime() + "@zeom.com";
        String adminToken = signupAndPromoteAdmin(email);

        mvc.perform(get("/api/v1/admin/audit")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].action").exists())
                .andExpect(jsonPath("$[0].userId").exists());
    }

    @Test
    void audit_log_filtered_by_action() throws Exception {
        String email = "auditfilter_" + System.nanoTime() + "@zeom.com";
        String adminToken = signupAndPromoteAdmin(email);

        mvc.perform(get("/api/v1/admin/audit")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("action", "AUTH_SIGNUP"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[*].action", everyItem(is("AUTH_SIGNUP"))));
    }

    @Test
    void audit_log_filtered_by_date_range() throws Exception {
        String email = "auditdate_" + System.nanoTime() + "@zeom.com";
        String adminToken = signupAndPromoteAdmin(email);

        mvc.perform(get("/api/v1/admin/audit")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("from", "2026-01-01T00:00:00")
                        .param("to", "2026-12-31T23:59:59"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void audit_csv_export() throws Exception {
        String email = "auditcsv_" + System.nanoTime() + "@zeom.com";
        String adminToken = signupAndPromoteAdmin(email);

        mvc.perform(get("/api/v1/admin/audit/csv")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("text/csv"))
                .andExpect(header().string("Content-Disposition", "attachment; filename=audit_logs.csv"))
                .andExpect(content().string(containsString("id,userId,action,targetType,targetId,createdAt")));
    }

    @Test
    void audit_csv_requires_admin() throws Exception {
        String userToken = signupAndGetToken("csvuser_" + System.nanoTime() + "@zeom.com");

        mvc.perform(get("/api/v1/admin/audit/csv")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void ops_timeline_returns_booking_data() throws Exception {
        String email = "timeline_" + System.nanoTime() + "@zeom.com";
        String userToken = signupAndGetToken(email);

        String bookingId = createBooking(userToken);
        if (bookingId == null) throw new IllegalStateException("테스트용 예약 생성 실패");

        String adminEmail = "timelineadm_" + System.nanoTime() + "@zeom.com";
        String adminToken = signupAndPromoteAdmin(adminEmail);

        mvc.perform(get("/api/v1/ops/timeline")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[?(@.bookingId == " + bookingId + ")]").exists());
    }

    @Test
    void ops_timeline_filters_by_booking_status() throws Exception {
        String email = "tlfilter_" + System.nanoTime() + "@zeom.com";
        String userToken = signupAndGetToken(email);

        String bookingId = createBooking(userToken);
        if (bookingId == null) throw new IllegalStateException("테스트용 예약 생성 실패");

        String adminToken = signupAndPromoteAdmin("tladmin_" + System.nanoTime() + "@zeom.com");

        mvc.perform(get("/api/v1/ops/timeline")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("bookingStatus", "BOOKED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].bookingStatus", everyItem(is("BOOKED"))));

        mvc.perform(get("/api/v1/ops/timeline")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("bookingStatus", "NONEXISTENT"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void ops_timeline_requires_admin() throws Exception {
        String userToken = signupAndGetToken("tluser_" + System.nanoTime() + "@zeom.com");

        mvc.perform(get("/api/v1/ops/timeline")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void ops_summary_returns_counts() throws Exception {
        String adminToken = signupAndPromoteAdmin("sumadm_" + System.nanoTime() + "@zeom.com");

        mvc.perform(get("/api/v1/ops/summary")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.users").isNumber())
                .andExpect(jsonPath("$.counselors").isNumber())
                .andExpect(jsonPath("$.availableSlots").isNumber())
                .andExpect(jsonPath("$.booked").isNumber())
                .andExpect(jsonPath("$.authLogin").isNumber());
    }

    @Test
    void ops_summary_with_date_range() throws Exception {
        String adminToken = signupAndPromoteAdmin("sumdate_" + System.nanoTime() + "@zeom.com");

        mvc.perform(get("/api/v1/ops/summary")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("from", "2026-01-01T00:00:00")
                        .param("to", "2026-12-31T23:59:59"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.booked").isNumber())
                .andExpect(jsonPath("$.canceled").isNumber());
    }

    private String signupAndGetToken(String email) throws Exception {
        return mvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"Password123!\",\"name\":\"테스트\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString()
                .replaceAll(".*\"accessToken\":\"([^\"]+)\".*", "$1");
    }

    private String signupAndPromoteAdmin(String email) throws Exception {
        String token = signupAndGetToken(email);
        UserEntity user = userRepository.findByEmail(email).orElseThrow();
        user.setRole("ADMIN");
        userRepository.save(user);
        return token;
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
        return null;
    }
}
