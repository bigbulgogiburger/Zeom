package com.cheonjiyeon.api.lock;

import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

@Component
@ConditionalOnProperty(name = "redis.enabled", havingValue = "true")
public class DistributedLock {

    private static final Logger log = LoggerFactory.getLogger(DistributedLock.class);

    private final RedissonClient redissonClient;

    @Value("${redis.lock.wait-time-ms:5000}")
    private long waitTimeMs;

    @Value("${redis.lock.lease-time-ms:10000}")
    private long leaseTimeMs;

    public DistributedLock(RedissonClient redissonClient) {
        this.redissonClient = redissonClient;
    }

    public <T> T executeWithLock(String lockKey, Supplier<T> supplier) {
        RLock lock = redissonClient.getLock(lockKey);
        try {
            boolean acquired = lock.tryLock(waitTimeMs, leaseTimeMs, TimeUnit.MILLISECONDS);
            if (!acquired) {
                log.warn("Failed to acquire lock: {}", lockKey);
                throw new LockAcquisitionException("Failed to acquire lock: " + lockKey);
            }

            log.debug("Lock acquired: {}", lockKey);
            return supplier.get();

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new LockAcquisitionException("Lock acquisition interrupted: " + lockKey, e);
        } finally {
            if (lock.isHeldByCurrentThread()) {
                lock.unlock();
                log.debug("Lock released: {}", lockKey);
            }
        }
    }

    public void executeWithLock(String lockKey, Runnable runnable) {
        executeWithLock(lockKey, () -> {
            runnable.run();
            return null;
        });
    }

    public static class LockAcquisitionException extends RuntimeException {
        public LockAcquisitionException(String message) {
            super(message);
        }

        public LockAcquisitionException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
