package com.cheonjiyeon.api;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class Step2ApiIntegrationTest {

    @Autowired
    MockMvc mvc;

    @Test
    void signup_login_me_flow() throws Exception {
        String signupBody = """
                {"email":"test@zeom.com","password":"Password123!","name":"테스터"}
                """;

        String token = mvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(signupBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").exists())
                .andReturn().getResponse().getContentAsString()
                .replaceAll(".*\"accessToken\":\"([^\"]+)\".*", "$1");

        mvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("test@zeom.com"));

        mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"test@zeom.com\",\"password\":\"Password123!\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").exists());
    }

    @Test
    void counselor_list_and_detail() throws Exception {
        mvc.perform(get("/api/v1/counselors"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").exists());

        mvc.perform(get("/api/v1/counselors/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.slots").isArray());
    }

    @Test
    void booking_create_cancel_and_my_bookings() throws Exception {
        String token = mvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"booking@zeom.com\",\"password\":\"Password123!\",\"name\":\"예약자\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString()
                .replaceAll(".*\"accessToken\":\"([^\"]+)\".*", "$1");

        String bookingRes = mvc.perform(post("/api/v1/bookings")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"counselorId\":1,\"slotId\":1}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("BOOKED"))
                .andReturn().getResponse().getContentAsString();

        String bookingId = bookingRes.replaceAll(".*\"id\":([0-9]+).*", "$1");

        mvc.perform(post("/api/v1/bookings/" + bookingId + "/cancel")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELED"));

        mvc.perform(get("/api/v1/bookings/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("CANCELED"));

        mvc.perform(get("/api/v1/counselors/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.slots[?(@.id == 1)]").isArray());
    }
}
