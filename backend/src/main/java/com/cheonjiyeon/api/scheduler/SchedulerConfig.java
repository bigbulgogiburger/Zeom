package com.cheonjiyeon.api.scheduler;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration
@EnableScheduling
@ConditionalOnProperty(name = "scheduler.enabled", havingValue = "true", matchIfMissing = true)
public class SchedulerConfig {
    // Scheduler configuration
    // Individual scheduled tasks can be enabled/disabled via their own conditions
}
