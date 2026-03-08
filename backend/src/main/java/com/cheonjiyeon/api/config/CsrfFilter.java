package com.cheonjiyeon.api.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;

/**
 * Double Submit Cookie 패턴 CSRF 방어 필터.
 *
 * Cookie 기반 인증 시에만 검증:
 * - access_token 쿠키가 존재하고 Authorization 헤더가 없는 경우 (= 웹 cookie 인증)
 * - state-changing 메서드(POST/PUT/DELETE)에서 X-CSRF-Token 헤더와 csrf_token 쿠키 값 비교
 *
 * Bearer 토큰 인증(Flutter 앱)은 CSRF 검증 불필요 → skip.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 2)
public class CsrfFilter extends OncePerRequestFilter {

    private static final String CSRF_COOKIE_NAME = "csrf_token";
    private static final String CSRF_HEADER_NAME = "X-CSRF-Token";
    private static final Set<String> SAFE_METHODS = Set.of("GET", "HEAD", "OPTIONS");

    /** 인증 엔드포인트는 CSRF 검증 제외 (로그인 전이므로 토큰 없음) */
    private static final Set<String> EXEMPT_PATHS = Set.of(
            "/api/v1/auth/login",
            "/api/v1/auth/signup",
            "/api/v1/auth/admin/login",
            "/api/v1/auth/refresh"
    );

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        // Safe methods는 검증 불필요
        if (SAFE_METHODS.contains(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        // Bearer 헤더가 있으면 CSRF 검증 skip (Flutter 앱 등 non-browser 클라이언트)
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && !authHeader.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }

        // access_token 쿠키가 없으면 cookie 인증이 아니므로 skip
        String accessTokenCookie = extractCookie(request, "access_token");
        if (accessTokenCookie == null) {
            filterChain.doFilter(request, response);
            return;
        }

        // 인증 엔드포인트는 CSRF 제외
        String path = request.getRequestURI();
        if (EXEMPT_PATHS.contains(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        // Double Submit Cookie 검증
        String csrfCookieValue = extractCookie(request, CSRF_COOKIE_NAME);
        String csrfHeaderValue = request.getHeader(CSRF_HEADER_NAME);

        if (csrfCookieValue == null || csrfHeaderValue == null || !csrfCookieValue.equals(csrfHeaderValue)) {
            response.setStatus(403);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"error\":true,\"status\":403,\"message\":\"CSRF 토큰이 유효하지 않습니다.\"}");
            return;
        }

        filterChain.doFilter(request, response);
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
}
