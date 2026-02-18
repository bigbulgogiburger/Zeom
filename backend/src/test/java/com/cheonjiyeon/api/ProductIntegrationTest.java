package com.cheonjiyeon.api;

import com.cheonjiyeon.api.product.ProductEntity;
import com.cheonjiyeon.api.product.ProductRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class ProductIntegrationTest {

    @Autowired
    MockMvc mvc;

    @Autowired
    ProductRepository productRepository;

    @Test
    void get_cash_products_returns_active_products() throws Exception {
        // Create some active products
        ProductEntity p1 = new ProductEntity();
        p1.setName("30분 상담권");
        p1.setDescription("30분 동안 상담사님과 대화할 수 있는 상품");
        p1.setMinutes(30);
        p1.setCashAmount(5000L);
        p1.setPriceKrw(5000L);
        p1.setActive(true);
        productRepository.save(p1);

        ProductEntity p2 = new ProductEntity();
        p2.setName("60분 상담권");
        p2.setDescription("60분 동안 상담사님과 대화할 수 있는 상품");
        p2.setMinutes(60);
        p2.setCashAmount(10000L);
        p2.setPriceKrw(10000L);
        p2.setActive(true);
        productRepository.save(p2);

        mvc.perform(get("/api/v1/products/cash"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.products").isArray())
                .andExpect(jsonPath("$.products", hasSize(greaterThanOrEqualTo(2))))
                .andExpect(jsonPath("$.products[0].name").exists())
                .andExpect(jsonPath("$.products[0].cashAmount").exists())
                .andExpect(jsonPath("$.products[0].priceKrw").exists());
    }

    @Test
    void inactive_products_are_not_returned() throws Exception {
        // Create one active and one inactive product
        ProductEntity active = new ProductEntity();
        active.setName("활성 상품");
        active.setDescription("활성화된 상담권");
        active.setMinutes(30);
        active.setCashAmount(5000L);
        active.setPriceKrw(5000L);
        active.setActive(true);
        productRepository.save(active);

        ProductEntity inactive = new ProductEntity();
        inactive.setName("비활성 상품");
        inactive.setDescription("비활성화된 상담권");
        inactive.setMinutes(60);
        inactive.setCashAmount(10000L);
        inactive.setPriceKrw(10000L);
        inactive.setActive(false);
        productRepository.save(inactive);

        String res = mvc.perform(get("/api/v1/products/cash"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.products").isArray())
                .andReturn().getResponse().getContentAsString();

        // Verify inactive product is not in the list
        if (res.contains("비활성 상품")) {
            throw new AssertionError("Inactive product should not be returned");
        }
    }

    @Test
    void get_cash_products_no_auth_required() throws Exception {
        // Public endpoint - no auth required
        mvc.perform(get("/api/v1/products/cash"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.products").isArray());
    }
}
