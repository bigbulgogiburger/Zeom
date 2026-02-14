package com.cheonjiyeon.api.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Optional;
import java.util.UUID;

@Component
public class TokenStore {
    private static final Logger log = LoggerFactory.getLogger(TokenStore.class);
    private static final String DEV_SECRET_PREFIX = "dev-secret";

    private final SecretKey key;

    public TokenStore(@Value("${jwt.secret}") String secret) {
        if (secret.startsWith(DEV_SECRET_PREFIX)) {
            log.warn("JWT_SECRET is using a development default. Set a strong, unique JWT_SECRET for production!");
        }
        if (secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalArgumentException("JWT secret must be at least 32 bytes (256 bits)");
        }
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String issueAccess(Long userId, String role) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("role", role)
                .claim("typ", "access")
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(6, ChronoUnit.HOURS)))
                .signWith(key)
                .compact();
    }

    public String issueRefresh(Long userId) {
        Instant now = Instant.now();
        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(String.valueOf(userId))
                .claim("typ", "refresh")
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(14, ChronoUnit.DAYS)))
                .signWith(key)
                .compact();
    }

    public Optional<Long> resolveAccessUserId(String token) {
        return parse(token)
                .filter(c -> "access".equals(c.get("typ", String.class)))
                .map(c -> Long.parseLong(c.getSubject()));
    }

    public Optional<Long> resolveRefreshUserId(String token) {
        return parse(token)
                .filter(c -> "refresh".equals(c.get("typ", String.class)))
                .map(c -> Long.parseLong(c.getSubject()));
    }

    public Optional<LocalDateTime> refreshExpiry(String token) {
        return parse(token)
                .filter(c -> "refresh".equals(c.get("typ", String.class)))
                .map(c -> LocalDateTime.ofInstant(c.getExpiration().toInstant(), ZoneId.systemDefault()));
    }

    private Optional<Claims> parse(String token) {
        try {
            Claims claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
            return Optional.of(claims);
        } catch (Exception e) {
            return Optional.empty();
        }
    }
}
