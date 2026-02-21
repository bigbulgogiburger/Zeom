package com.cheonjiyeon.api.oauth;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "oauth.provider", havingValue = "fake", matchIfMissing = true)
public class FakeOAuthProvider implements OAuthProvider {

    @Override
    public String name() {
        return "FAKE";
    }

    @Override
    public OAuthUserInfo authenticate(String code, String redirectUri) {
        // code format: "fake_{provider}_{oauthId}" or just use code as oauthId
        String provider = "kakao";
        String oauthId = code;

        if (code.startsWith("fake_kakao_")) {
            provider = "kakao";
            oauthId = code.substring("fake_kakao_".length());
        } else if (code.startsWith("fake_naver_")) {
            provider = "naver";
            oauthId = code.substring("fake_naver_".length());
        }

        return new OAuthUserInfo(
                "oauth_" + oauthId + "@test.com",
                "테스트유저_" + oauthId,
                oauthId,
                provider,
                null,
                null,
                null,
                null
        );
    }
}
