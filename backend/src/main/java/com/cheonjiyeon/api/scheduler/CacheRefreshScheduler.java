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

    /**
     * Cache refresh scheduler
     * Runs every hour by default
     * Evicts or refreshes specific caches periodically
     */
    @Scheduled(cron = "${scheduler.cache-refresh-cron:0 0 */1 * * ?}")
    public void refreshCaches() {
        log.debug("Cache refresh scheduler triggered");

        // TODO: Implementation pending
        // 1. Identify caches to refresh (e.g. counselor list, popular counselors)
        // 2. Evict or refresh caches
        // 3. Log statistics

        // Example:
        // cacheManager.getCache("counselors").clear();
        // cacheManager.getCache("popular-counselors").clear();
    }
}
