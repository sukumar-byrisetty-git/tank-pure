const { queues } = require('../src/config/queues');
const logger = require('../src/config/logger');
const { connectDB, disconnectDB } = require('../src/config/db');
const { connectRedis } = require('../src/config/redis');
const fcm = require('../src/utils/fcm');

// Queue processors
const setupQueueProcessors = async () => {
    // Process notifications
    queues.notifications.process(async (job) => {
        try {
            logger.info(`Processing notification job: ${job.id}`);
            const { userId, data } = job.data;

            // Send notification via FCM or other service
            // await fcm.sendNotification(userId, data);

            job.progress(100);
            return { success: true, jobId: job.id };
        } catch (err) {
            logger.error(`Notification job ${job.id} failed:`, err);
            throw err;
        }
    });

    // Process emails
    queues.emails.process(async (job) => {
        try {
            logger.info(`Processing email job: ${job.id}`);
            const { email, subject, template, data } = job.data;

            // Send email via nodemailer or other service
            // await emailService.send(email, subject, template, data);

            job.progress(100);
            return { success: true, jobId: job.id };
        } catch (err) {
            logger.error(`Email job ${job.id} failed:`, err);
            throw err;
        }
    });

    // Process reports
    queues.reports.process(async (job) => {
        try {
            logger.info(`Processing report job: ${job.id}`);
            const { userId, reportType, filters } = job.data;

            // Generate report based on type
            // const report = await reportService.generate(userId, reportType, filters);

            job.progress(50);
            // Send report to user
            // await notificationService.sendReportReady(userId, report);
            job.progress(100);

            return { success: true, jobId: job.id };
        } catch (err) {
            logger.error(`Report job ${job.id} failed:`, err);
            throw err;
        }
    });

    logger.info('Queue processors setup complete');
};

const startWorker = async () => {
    try {
        logger.info('Starting queue worker...');

        // Connect to database
        await connectDB();
        logger.info('Database connected');

        // Connect to Redis
        await connectRedis();
        logger.info('Redis connected');

        // Setup queue processors
        await setupQueueProcessors();

        logger.info('Queue worker started successfully');
    } catch (err) {
        logger.error('Failed to start queue worker:', err);
        process.exit(1);
    }
};

const gracefulShutdown = async (signal) => {
    logger.info(`${signal} received, shutting down queue worker...`);

    try {
        // Close queues
        const { closeQueues } = require('../src/config/queues');
        await closeQueues();

        // Disconnect from database
        await disconnectDB();

        // Disconnect from Redis
        const { disconnectRedis } = require('../src/config/redis');
        await disconnectRedis();

        logger.info('Queue worker shutdown complete');
        process.exit(0);
    } catch (err) {
        logger.error('Error during shutdown:', err);
        process.exit(1);
    }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    process.exit(1);
});

startWorker();
