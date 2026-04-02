require('dotenv').config();
require('express-async-errors');
const validateEnv = require('./src/config/validateEnv');
validateEnv();

// Sentry error tracking (optional, only if SENTRY_DSN is set)
if (process.env.SENTRY_DSN) {
    const Sentry = require('@sentry/node');
    Sentry.init({ dsn: process.env.SENTRY_DSN });
}

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const { connectDB, checkDBHealth } = require('./src/config/db');
const { connectRedis, checkRedisHealth } = require('./src/config/redis');
const { initQueues } = require('./src/config/queues');
const logger = require('./src/config/logger');
const { getConfig } = require('./src/config/env');
const authRoutes = require('./src/routes/auth');
const bookingRoutes = require('./src/routes/booking');
const tankRoutes = require('./src/routes/tank');
const adminRoutes = require('./src/routes/admin');
const uploadRoutes = require('./src/routes/upload');
const reviewRoutes = require('./src/routes/review');
const errorHandler = require('./src/middlewares/errorHandler');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./src/docs/swagger.json');

const config = getConfig();
const app = express();

// Security middleware
const cspDirectives = {
    defaultSrc: ['self'],
    scriptSrc: ['self'],
    styleSrc: ['self'],
};

if (process.env.NODE_ENV !== 'production') {
    cspDirectives.scriptSrc.push('unsafe-inline');
    cspDirectives.styleSrc.push('unsafe-inline');
}

app.use(helmet({
    contentSecurityPolicy: {
        directives: cspDirectives,
    },
}));

app.use(mongoSanitize());
app.use(compression());

// Trusted proxy for load balancers
app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : 0);

// CORS configuration
const allowedOrigins = config.corsOrigins.length > 0
    ? config.corsOrigins
    : (process.env.CORS_ORIGINS || '').split(',').map((u) => u.trim()).filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        callback(new Error('CORS policy: This origin is not allowed'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
    credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use(rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMaxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again later.',
}));

// Morgan logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Audit logging
const auditLogger = require('./src/middlewares/audit');
app.use(auditLogger);

// Routes
app.use('/auth', authRoutes);
app.use('/booking', bookingRoutes);
app.use('/tank', tankRoutes);
app.use('/admin', adminRoutes);
app.use('/review', reviewRoutes);
app.use('/upload', uploadRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        const dbHealth = checkDBHealth ? await checkDBHealth() : { status: 'unknown', message: 'DB check not available' };
        const redisHealth = await checkRedisHealth();

        const overallStatus = (dbHealth.status === 'connected' && redisHealth.status === 'connected') ? 200 : 503;

        return res.status(overallStatus).json({
            status: overallStatus === 200 ? 'ok' : 'degraded',
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            database: dbHealth,
            redis: redisHealth,
            timestamp: new Date().toISOString(),
        });
    } catch (err) {
        logger.error('Health check failed:', err);
        res.status(503).json({
            status: 'error',
            message: 'Health check failed',
            timestamp: new Date().toISOString(),
        });
    }
});

// 404 handler
const notFoundMiddleware = require('./src/middlewares/notFound');
app.use(notFoundMiddleware);

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

let server;

const startServer = async () => {
    try {
        // Connect to database
        await connectDB();

        // Connect to Redis (optional, graceful fallback)
        await connectRedis().catch(err => {
            logger.warn('Redis not available, continuing without cache:', err.message);
        });

        // Initialize queues
        await initQueues();

        // Start server
        server = app.listen(PORT, () => {
            logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
        });
    } catch (err) {
        logger.error('Failed to start server:', err);
        process.exit(1);
    }
};

// Graceful shutdown
const gracefulShutdown = async (signal) => {
    logger.info(`${signal} received, starting graceful shutdown...`);

    if (server) {
        server.close(async () => {
            logger.info('HTTP server closed');

            try {
                const { disconnectDB } = require('./src/config/db');
                await disconnectDB();

                const { disconnectRedis } = require('./src/config/redis');
                await disconnectRedis();

                const { closeQueues } = require('./src/config/queues');
                await closeQueues();

                logger.info('Graceful shutdown completed');
                process.exit(0);
            } catch (err) {
                logger.error('Error during shutdown:', err);
                process.exit(1);
            }
        });

        // Force shutdown after 10 seconds
        setTimeout(() => {
            logger.error('Forced shutdown after timeout');
            process.exit(1);
        }, 10000);
    }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    process.exit(1);
});

startServer();

module.exports = app;

