package com.cheonjiyeon.api;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

@SpringBootTest
@AutoConfigureMockMvc
class BookingConcurrencyIntegrationTest {

    @Autowired
    MockMvc mvc;

    @Test
    void same_slot_concurrent_booking_only_one_success() throws Exception {
        String token1 = signup("c1@zeom.com", "유저1");
        String token2 = signup("c2@zeom.com", "유저2");

        ExecutorService pool = Executors.newFixedThreadPool(2);
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        List<Integer> statuses = new CopyOnWriteArrayList<>();

        Runnable r1 = () -> runBooking(token1, ready, start, statuses);
        Runnable r2 = () -> runBooking(token2, ready, start, statuses);

        pool.submit(r1);
        pool.submit(r2);

        ready.await(3, TimeUnit.SECONDS);
        start.countDown();

        pool.shutdown();
        pool.awaitTermination(5, TimeUnit.SECONDS);

        long ok = statuses.stream().filter(s -> s == 200).count();
        long conflict = statuses.stream().filter(s -> s == 409).count();

        if (!(ok == 1 && conflict == 1)) {
            throw new AssertionError("expected [200,409], got=" + new ArrayList<>(statuses));
        }
    }

    private void runBooking(String token, CountDownLatch ready, CountDownLatch start, List<Integer> statuses) {
        try {
            ready.countDown();
            start.await();
            int status = mvc.perform(post("/api/v1/bookings")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"counselorId\":1,\"slotId\":2}"))
                    .andReturn().getResponse().getStatus();
            statuses.add(status);
        } catch (Exception e) {
            statuses.add(500);
        }
    }

    private String signup(String email, String name) throws Exception {
        String body = String.format("{\"email\":\"%s\",\"password\":\"Password123!\",\"name\":\"%s\"}", email, name);
        String res = mvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andReturn().getResponse().getContentAsString();
        return res.replaceAll(".*\"accessToken\":\"([^\"]+)\".*", "$1");
    }
}
