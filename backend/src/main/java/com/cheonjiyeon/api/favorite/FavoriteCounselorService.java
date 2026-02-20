package com.cheonjiyeon.api.favorite;

import com.cheonjiyeon.api.auth.TokenStore;
import com.cheonjiyeon.api.auth.UserEntity;
import com.cheonjiyeon.api.auth.UserRepository;
import com.cheonjiyeon.api.common.ApiException;
import com.cheonjiyeon.api.counselor.CounselorEntity;
import com.cheonjiyeon.api.counselor.CounselorRepository;
import com.cheonjiyeon.api.counselor.FavoriteCounselorEntity;
import com.cheonjiyeon.api.counselor.FavoriteCounselorRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class FavoriteCounselorService {
    private final FavoriteCounselorRepository favoriteRepository;
    private final CounselorRepository counselorRepository;
    private final UserRepository userRepository;
    private final TokenStore tokenStore;

    public FavoriteCounselorService(FavoriteCounselorRepository favoriteRepository,
                                    CounselorRepository counselorRepository,
                                    UserRepository userRepository,
                                    TokenStore tokenStore) {
        this.favoriteRepository = favoriteRepository;
        this.counselorRepository = counselorRepository;
        this.userRepository = userRepository;
        this.tokenStore = tokenStore;
    }

    @Transactional
    public Map<String, Object> addFavorite(String authHeader, Long counselorId) {
        Long userId = resolveUserId(authHeader);

        counselorRepository.findById(counselorId)
                .orElseThrow(() -> new ApiException(404, "상담사를 찾을 수 없습니다."));

        if (favoriteRepository.existsByUserIdAndCounselorId(userId, counselorId)) {
            throw new ApiException(409, "이미 즐겨찾기에 추가된 상담사입니다.");
        }

        FavoriteCounselorEntity entity = new FavoriteCounselorEntity();
        entity.setUserId(userId);
        entity.setCounselorId(counselorId);
        favoriteRepository.save(entity);

        return Map.of("message", "즐겨찾기에 추가되었습니다.", "counselorId", counselorId, "favorited", true);
    }

    @Transactional
    public Map<String, Object> removeFavorite(String authHeader, Long counselorId) {
        Long userId = resolveUserId(authHeader);

        FavoriteCounselorEntity entity = favoriteRepository.findByUserIdAndCounselorId(userId, counselorId)
                .orElseThrow(() -> new ApiException(404, "즐겨찾기에 없는 상담사입니다."));

        favoriteRepository.delete(entity);

        return Map.of("message", "즐겨찾기에서 제거되었습니다.", "counselorId", counselorId, "favorited", false);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listFavorites(String authHeader, int page, int size) {
        Long userId = resolveUserId(authHeader);

        Page<FavoriteCounselorEntity> favorites = favoriteRepository
                .findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size));

        return favorites.getContent().stream().map(fav -> {
            CounselorEntity counselor = counselorRepository.findById(fav.getCounselorId()).orElse(null);
            if (counselor == null) {
                return Map.<String, Object>of(
                        "counselorId", fav.getCounselorId(),
                        "favoritedAt", fav.getCreatedAt().toString()
                );
            }
            return Map.<String, Object>of(
                    "counselorId", counselor.getId(),
                    "name", counselor.getName(),
                    "specialty", counselor.getSpecialty(),
                    "intro", counselor.getIntro(),
                    "favoritedAt", fav.getCreatedAt().toString()
            );
        }).toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> checkFavoriteStatus(String authHeader, Long counselorId) {
        Long userId = resolveUserId(authHeader);
        boolean favorited = favoriteRepository.existsByUserIdAndCounselorId(userId, counselorId);
        return Map.of("counselorId", counselorId, "favorited", favorited);
    }

    private Long resolveUserId(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new ApiException(401, "Authorization Bearer 토큰이 필요합니다.");
        }
        String token = authHeader.substring(7);
        return tokenStore.resolveAccessUserId(token)
                .orElseThrow(() -> new ApiException(401, "로그인이 필요합니다."));
    }
}
