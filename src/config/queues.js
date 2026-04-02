const Queue = require('bull');
const logger = require('./logger');

// Define queues for different async tasks
const queues = {
    notifications: new Queue('notifications', {
        redis: {
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD || undefined,
        },
        defaultJobOptions: {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 2000,
            },
            removeOnComplete: true,
        },
    }),
    emails: new Queue('emails', {
        redis: {
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD || undefined,
        },
        defaultJobOptions: {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 2000,
            },
            removeOnComplete: true,
        },
    }),
    reports: new Queue('reports', {
        redis: {
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD || undefined,
        },
        defaultJobOptions: {
            attempts: 5,
            backoff: {
                type: 'exponential',
                delay: 2000,
            },
            removeOnComplete: true,
        },
    }),
};

// Setup queue event listeners
const initQueues = async () => {
    Object.entries(queues).forEach(([queueName, queue]) => {
        queue.on('error', (err) => {
            logger.error(`Error in ${queueName} queue:`, err);
        });

        queue.on('failed', (job, err) => {
            logger.error(`Job ${job.id} failed in ${queueName} queue:`, err.message);
        });

        queue.on('stalled', (job) => {
            logger.warn(`Job ${job.id} stalled in ${queueName} queue`);
        });
    });

    logger.info('Queues initialized successfully');
};

const closeQueues = async () => {
    for (const queue of Object.values(queues)) {
        await queue.close();
    }
    logger.info('All queues closed');
};

module.exports = { queues, initQueues, closeQueues };
