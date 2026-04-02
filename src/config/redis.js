const redis = require('redis');
const logger = require('./logger');

let redisClient = null;

const connectRedis = async () => {
    try {
        redisClient = redis.createClient({
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD || undefined,
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 10) {
                        logger.error('Max Redis reconnection attempts exceeded');
                        return new Error('Max retries exceeded');
                    }
                    return Math.min(retries * 50, 500);
                },
            },
        });

        redisClient.on('error', (err) => {
            logger.error('Redis Client Error:', err);
        });

        redisClient.on('connect', () => {
            logger.info('Redis Client Connected');
        });

        await redisClient.connect();
        logger.info('Redis connected successfully');
        return redisClient;
    } catch (err) {
        logger.error('Failed to connect to Redis:', err);
        // Gracefully continue without Redis in development
        if (process.env.NODE_ENV !== 'production') {
            logger.warn('Continuing without Redis cache in development mode');
            return null;
        }
        throw err;
    }
};

const getRedis = () => redisClient;

const disconnectRedis = async () => {
    if (redisClient) {
        await redisClient.quit();
        logger.info('Redis disconnected');
    }
};

module.exports = { connectRedis, getRedis, disconnectRedis };
