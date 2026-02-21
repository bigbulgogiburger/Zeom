package com.cheonjiyeon.api.oauth;

public interface OAuthProvider {
    String name();
    OAuthUserInfo authenticate(String code, String redirectUri);
}
