package com.cheonjiyeon.api.auth;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SocialAccountRepository extends JpaRepository<SocialAccountEntity, Long> {
    Optional<SocialAccountEntity> findByProviderAndProviderUserId(String provider, String providerUserId);
    List<SocialAccountEntity> findByUserId(Long userId);
    Optional<SocialAccountEntity> findByUserIdAndProvider(Long userId, String provider);
}
