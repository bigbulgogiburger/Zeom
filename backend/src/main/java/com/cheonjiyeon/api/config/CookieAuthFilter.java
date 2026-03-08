package com.cheonjiyeon.api.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.Enumeration;
import java.util.List;

/**
 * Cookie에서 access_token을 읽어 Authorization Bearer 헤더로 주입하는 필터.
 * 기존 Authorization 헤더가 있으면 그대로 통과 (Flutter 앱 하위 호환).
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class CookieAuthFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && !authHeader.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }

        String accessToken = extractCookie(request, "access_token");
        if (accessToken != null) {
            filterChain.doFilter(new BearerHeaderRequest(request, accessToken), response);
        } else {
            filterChain.doFilter(request, response);
        }
    }

    private String extractCookie(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) return null;
        for (Cookie cookie : cookies) {
            if (name.equals(cookie.getName()) && cookie.getValue() != null && !cookie.getValue().isBlank()) {
                return cookie.getValue();
            }
        }
        return null;
    }

    /**
     * Authorization 헤더를 주입한 래퍼 요청.
     */
    private static class BearerHeaderRequest extends HttpServletRequestWrapper {
        private final String bearerValue;

        BearerHeaderRequest(HttpServletRequest request, String accessToken) {
            super(request);
            this.bearerValue = "Bearer " + accessToken;
        }

        @Override
        public String getHeader(String name) {
            if ("Authorization".equalsIgnoreCase(name)) {
                return bearerValue;
            }
            return super.getHeader(name);
        }

        @Override
        public Enumeration<String> getHeaders(String name) {
            if ("Authorization".equalsIgnoreCase(name)) {
                return Collections.enumeration(List.of(bearerValue));
            }
            return super.getHeaders(name);
        }

        @Override
        public Enumeration<String> getHeaderNames() {
            List<String> names = new java.util.ArrayList<>(Collections.list(super.getHeaderNames()));
            if (!names.stream().anyMatch(n -> "Authorization".equalsIgnoreCase(n))) {
                names.add("Authorization");
            }
            return Collections.enumeration(names);
        }
    }
}
