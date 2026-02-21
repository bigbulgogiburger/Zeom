package com.cheonjiyeon.api.oauth;

import com.cheonjiyeon.api.common.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Component
@ConditionalOnProperty(name = "oauth.provider", havingValue = "naver")
public class NaverOAuthProvider implements OAuthProvider {

    private static final Logger log = LoggerFactory.getLogger(NaverOAuthProvider.class);
    private static final String TOKEN_URL = "https://nid.naver.com/oauth2.0/token";
    private static final String USER_INFO_URL = "https://openapi.naver.com/v1/nid/me";

    private final String clientId;
    private final String clientSecret;
    private final RestTemplate restTemplate = new RestTemplate();

    public NaverOAuthProvider(
            @Value("${oauth.naver.client-id}") String clientId,
            @Value("${oauth.naver.client-secret}") String clientSecret) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
    }

    @Override
    public String name() {
        return "naver";
    }

    @Override
    @SuppressWarnings("unchecked")
    public OAuthUserInfo authenticate(String code, String redirectUri) {
        // Step 1: Exchange code for access token
        MultiValueMap<String, String> tokenParams = new LinkedMultiValueMap<>();
        tokenParams.add("grant_type", "authorization_code");
        tokenParams.add("client_id", clientId);
        tokenParams.add("client_secret", clientSecret);
        tokenParams.add("redirect_uri", redirectUri);
        tokenParams.add("code", code);
        tokenParams.add("state", "state");

        HttpHeaders tokenHeaders = new HttpHeaders();
        tokenHeaders.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        ResponseEntity<Map> tokenResponse;
        try {
            tokenResponse = restTemplate.exchange(
                    TOKEN_URL, HttpMethod.POST,
                    new HttpEntity<>(tokenParams, tokenHeaders),
                    Map.class);
        } catch (Exception e) {
            log.error("Naver token exchange failed", e);
            throw new ApiException(401, "네이버 인증에 실패했습니다.");
        }

        String accessToken = (String) tokenResponse.getBody().get("access_token");
        if (accessToken == null) {
            throw new ApiException(401, "네이버 인증에 실패했습니다.");
        }

        // Step 2: Get user info
        HttpHeaders userHeaders = new HttpHeaders();
        userHeaders.setBearerAuth(accessToken);

        ResponseEntity<Map> userResponse;
        try {
            userResponse = restTemplate.exchange(
                    USER_INFO_URL, HttpMethod.GET,
                    new HttpEntity<>(userHeaders),
                    Map.class);
        } catch (Exception e) {
            log.error("Naver user info fetch failed", e);
            throw new ApiException(401, "네이버 사용자 정보 조회에 실패했습니다.");
        }

        Map<String, Object> body = userResponse.getBody();
        Map<String, Object> response = (Map<String, Object>) body.get("response");

        String oauthId = (String) response.get("id");
        String email = (String) response.get("email");
        String name = (String) response.get("name");
        String profileImage = (String) response.get("profile_image");
        String birthday = (String) response.get("birthday");
        String phone = (String) response.get("mobile");
        String gender = (String) response.get("gender");

        return new OAuthUserInfo(email, name, oauthId, "naver", profileImage, birthday, phone, gender);
    }
}
