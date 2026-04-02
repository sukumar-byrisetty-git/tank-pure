const logger = require('../config/logger');
const { getRedis } = require('../config/redis');

class CacheService {
    async get(key) {
        try {
            const redis = getRedis();
            if (!redis) return null;

            const value = await redis.get(key);
            if (value) {
                logger.debug(`Cache hit for key: ${key}`);
            }
            return value ? JSON.parse(value) : null;
        } catch (err) {
            logger.error(`Cache get error for key ${key}:`, err);
            return null;
        }
    }

    async set(key, value, ttl = 300) {
        try {
            const redis = getRedis();
            if (!redis) return false;

            const serialized = JSON.stringify(value);
            if (ttl) {
                await redis.setEx(key, ttl, serialized);
            } else {
                await redis.set(key, serialized);
            }
            logger.debug(`Cache set for key: ${key} with TTL: ${ttl}s`);
            return true;
        } catch (err) {
            logger.error(`Cache set error for key ${key}:`, err);
            return false;
        }
    }

    async delete(key) {
        try {
            const redis = getRedis();
            if (!redis) return false;

            await redis.del(key);
            logger.debug(`Cache deleted for key: ${key}`);
            return true;
        } catch (err) {
            logger.error(`Cache delete error for key ${key}:`, err);
            return false;
        }
    }

    async clear() {
        try {
            const redis = getRedis();
            if (!redis) return false;

            await redis.flushDb();
            logger.debug('Cache cleared');
            return true;
        } catch (err) {
            logger.error('Cache clear error:', err);
            return false;
        }
    }

    generateKey(...parts) {
        return parts.filter(Boolean).join(':');
    }
}

module.exports = new CacheService();
