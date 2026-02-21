package com.cheonjiyeon.api.scheduler;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.cache.CacheManager;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "scheduler.enabled", havingValue = "true", matchIfMissing = true)
public class CacheRefreshScheduler {

    private static final Logger log = LoggerFactory.getLogger(CacheRefreshScheduler.class);
    private final CacheManager cacheManager;

    public CacheRefreshScheduler(CacheManager cacheManager) {
        this.cacheManager = cacheManager;
    }

    private static final String[] CACHE_NAMES = {
            "counselors", "products", "counselor-reviews", "counselor-ratings"
    };

    /**
     * Cache refresh scheduler.
     * Runs every hour by default.
     * Evicts specific caches periodically.
     */
    @Scheduled(cron = "${scheduler.cache-refresh-cron:0 0 */1 * * ?}")
    public void refreshCaches() {
        log.debug("Cache refresh scheduler triggered");

        int cleared = 0;
        for (String cacheName : CACHE_NAMES) {
            var cache = cacheManager.getCache(cacheName);
            if (cache != null) {
                cache.clear();
                cleared++;
            }
        }

        log.info("Cache refresh completed: cleared {}/{} caches at {}",
                cleared, CACHE_NAMES.length, java.time.LocalDateTime.now());
    }
}
