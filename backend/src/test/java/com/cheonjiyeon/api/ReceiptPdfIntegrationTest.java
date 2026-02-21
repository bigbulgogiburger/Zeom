package com.cheonjiyeon.api;

import com.cheonjiyeon.api.cash.CashTransactionService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class ReceiptPdfIntegrationTest {

    @Autowired
    MockMvc mvc;

    @Autowired
    CashTransactionService cashTransactionService;

    @Test
    void download_receipt_pdf_returns_pdf_content() throws Exception {
        String token = signupAndGetToken("receipt_pdf_" + System.nanoTime() + "@zeom.com");
        String userId = extractUserId(token);

        // Create a charge transaction
        var tx = cashTransactionService.recordTransaction(
                Long.parseLong(userId), "CHARGE", 10000L,
                "TEST", null, "receipt-test-" + System.nanoTime()
        );

        mvc.perform(get("/api/v1/receipts/transactions/" + tx.getId() + "/pdf")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(header().string("Content-Disposition", "attachment; filename=receipt_" + tx.getId() + ".pdf"));
    }

    @Test
    void download_receipt_pdf_requires_auth() throws Exception {
        mvc.perform(get("/api/v1/receipts/transactions/1/pdf"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void download_receipt_pdf_forbids_other_users_transaction() throws Exception {
        // User 1 creates a transaction
        String token1 = signupAndGetToken("receipt_owner_" + System.nanoTime() + "@zeom.com");
        String userId1 = extractUserId(token1);
        var tx = cashTransactionService.recordTransaction(
                Long.parseLong(userId1), "CHARGE", 5000L,
                "TEST", null, "owner-test-" + System.nanoTime()
        );

        // User 2 tries to download it
        String token2 = signupAndGetToken("receipt_other_" + System.nanoTime() + "@zeom.com");

        mvc.perform(get("/api/v1/receipts/transactions/" + tx.getId() + "/pdf")
                        .header("Authorization", "Bearer " + token2))
                .andExpect(status().isForbidden());
    }

    @Test
    void download_receipt_pdf_returns_404_for_nonexistent() throws Exception {
        String token = signupAndGetToken("receipt_404_" + System.nanoTime() + "@zeom.com");

        mvc.perform(get("/api/v1/receipts/transactions/999999/pdf")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    private String signupAndGetToken(String email) throws Exception {
        return mvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"Password123!\",\"name\":\"영수증테스터\"}"))
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
}
