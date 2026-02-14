package com.cheonjiyeon.api.auth;

import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class TokenStore {
    private final Map<String, Long> tokenToUserId = new ConcurrentHashMap<>();

    public String issue(Long userId) {
        String token = "zm_" + UUID.randomUUID();
        tokenToUserId.put(token, userId);
        return token;
    }

    public Optional<Long> resolve(String token) {
        return Optional.ofNullable(tokenToUserId.get(token));
    }
}
