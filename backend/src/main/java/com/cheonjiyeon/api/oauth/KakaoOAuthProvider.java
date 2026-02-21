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
@ConditionalOnProperty(name = "oauth.provider", havingValue = "kakao")
public class KakaoOAuthProvider implements OAuthProvider {

    private static final Logger log = LoggerFactory.getLogger(KakaoOAuthProvider.class);
    private static final String TOKEN_URL = "https://kauth.kakao.com/oauth/token";
    private static final String USER_INFO_URL = "https://kapi.kakao.com/v2/user/me";

    private final String clientId;
    private final String clientSecret;
    private final RestTemplate restTemplate = new RestTemplate();

    public KakaoOAuthProvider(
            @Value("${oauth.kakao.client-id}") String clientId,
            @Value("${oauth.kakao.client-secret}") String clientSecret) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
    }

    @Override
    public String name() {
        return "kakao";
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

        HttpHeaders tokenHeaders = new HttpHeaders();
        tokenHeaders.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        ResponseEntity<Map> tokenResponse;
        try {
            tokenResponse = restTemplate.exchange(
                    TOKEN_URL, HttpMethod.POST,
                    new HttpEntity<>(tokenParams, tokenHeaders),
                    Map.class);
        } catch (Exception e) {
            log.error("Kakao token exchange failed", e);
            throw new ApiException(401, "카카오 인증에 실패했습니다.");
        }

        String accessToken = (String) tokenResponse.getBody().get("access_token");
        if (accessToken == null) {
            throw new ApiException(401, "카카오 인증에 실패했습니다.");
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
            log.error("Kakao user info fetch failed", e);
            throw new ApiException(401, "카카오 사용자 정보 조회에 실패했습니다.");
        }

        Map<String, Object> body = userResponse.getBody();
        String oauthId = String.valueOf(body.get("id"));

        Map<String, Object> kakaoAccount = (Map<String, Object>) body.getOrDefault("kakao_account", Map.of());
        Map<String, Object> profile = (Map<String, Object>) kakaoAccount.getOrDefault("profile", Map.of());

        String email = (String) kakaoAccount.get("email");
        String nickname = (String) profile.get("nickname");
        String profileImage = (String) profile.get("profile_image_url");
        String birthday = (String) kakaoAccount.get("birthday");
        String phone = (String) kakaoAccount.get("phone_number");
        String gender = (String) kakaoAccount.get("gender");

        return new OAuthUserInfo(email, nickname, oauthId, "kakao", profileImage, birthday, phone, gender);
    }
}
