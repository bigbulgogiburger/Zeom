package com.cheonjiyeon.api.config;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseCookie;

import java.util.UUID;

/**
 * JWT 토큰 및 CSRF 토큰을 cookie로 설정하는 유틸리티.
 */
public final class CookieUtils {

    private static final String ACCESS_TOKEN_COOKIE = "access_token";
    private static final String REFRESH_TOKEN_COOKIE = "refresh_token";
    private static final String CSRF_TOKEN_COOKIE = "csrf_token";
    private static final long ACCESS_TOKEN_MAX_AGE = 6 * 60 * 60;       // 6시간
    private static final long REFRESH_TOKEN_MAX_AGE = 14 * 24 * 60 * 60; // 14일

    private CookieUtils() {}

    public static void setTokenCookies(HttpServletResponse response, String accessToken, String refreshToken) {
        addHttpOnlyCookie(response, ACCESS_TOKEN_COOKIE, accessToken, ACCESS_TOKEN_MAX_AGE);
        addHttpOnlyCookie(response, REFRESH_TOKEN_COOKIE, refreshToken, REFRESH_TOKEN_MAX_AGE);
        // CSRF 토큰: non-httpOnly (JS에서 읽어서 X-CSRF-Token 헤더로 전송)
        String csrfToken = UUID.randomUUID().toString();
        addCookie(response, CSRF_TOKEN_COOKIE, csrfToken, ACCESS_TOKEN_MAX_AGE, false);
    }

    public static void clearTokenCookies(HttpServletResponse response) {
        addHttpOnlyCookie(response, ACCESS_TOKEN_COOKIE, "", 0);
        addHttpOnlyCookie(response, REFRESH_TOKEN_COOKIE, "", 0);
        addCookie(response, CSRF_TOKEN_COOKIE, "", 0, false);
    }

    private static void addHttpOnlyCookie(HttpServletResponse response, String name, String value, long maxAge) {
        addCookie(response, name, value, maxAge, true);
    }

    private static void addCookie(HttpServletResponse response, String name, String value, long maxAge, boolean httpOnly) {
        ResponseCookie cookie = ResponseCookie.from(name, value)
                .httpOnly(httpOnly)
                .secure(true)
                .sameSite("Lax")
                .path("/")
                .maxAge(maxAge)
                .build();
        response.addHeader("Set-Cookie", cookie.toString());
    }
}
