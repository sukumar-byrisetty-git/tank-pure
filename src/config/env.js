const logger = require('./logger');

const environments = {
    development: {
        name: 'development',
        debug: true,
        logLevel: 'debug',
        corsOrigins: ['http://localhost:3000', 'http://localhost:3001'],
        rateLimitWindowMs: 15 * 60 * 1000,
        rateLimitMaxRequests: 100,
        cacheEnabled: false,
        cacheTTL: 300,
        mongooseLogging: true,
    },
    staging: {
        name: 'staging',
        debug: false,
        logLevel: 'info',
        corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [],
        rateLimitWindowMs: 15 * 60 * 1000,
        rateLimitMaxRequests: 150,
        cacheEnabled: true,
        cacheTTL: 600,
        mongooseLogging: false,
    },
    production: {
        name: 'production',
        debug: false,
        logLevel: 'warn',
        corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [],
        rateLimitWindowMs: 15 * 60 * 1000,
        rateLimitMaxRequests: 120,
        cacheEnabled: true,
        cacheTTL: 900,
        mongooseLogging: false,
    },
};

const getConfig = () => {
    const nodeEnv = process.env.NODE_ENV || 'development';
    const config = environments[nodeEnv] || environments.development;
    logger.info(`Loaded config for environment: ${config.name}`);
    return config;
};

module.exports = { getConfig, environments };
