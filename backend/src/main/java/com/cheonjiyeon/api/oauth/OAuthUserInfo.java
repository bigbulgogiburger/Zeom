package com.cheonjiyeon.api.oauth;

public record OAuthUserInfo(
        String email,
        String name,
        String oauthId,
        String provider,
        String profileImage,
        String birthDate,
        String phone,
        String gender
) {}
