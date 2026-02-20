package com.cheonjiyeon.api.favorite;

import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/favorites")
public class FavoriteCounselorController {
    private final FavoriteCounselorService favoriteService;

    public FavoriteCounselorController(FavoriteCounselorService favoriteService) {
        this.favoriteService = favoriteService;
    }

    @PostMapping("/{counselorId}")
    public Map<String, Object> addFavorite(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long counselorId
    ) {
        return favoriteService.addFavorite(authHeader, counselorId);
    }

    @DeleteMapping("/{counselorId}")
    public Map<String, Object> removeFavorite(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long counselorId
    ) {
        return favoriteService.removeFavorite(authHeader, counselorId);
    }

    @GetMapping
    public List<Map<String, Object>> listFavorites(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return favoriteService.listFavorites(authHeader, page, size);
    }

    @GetMapping("/{counselorId}/status")
    public Map<String, Object> checkStatus(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long counselorId
    ) {
        return favoriteService.checkFavoriteStatus(authHeader, counselorId);
    }
}
