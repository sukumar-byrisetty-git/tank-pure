const { queues } = require('../config/queues');
const logger = require('../config/logger');

class QueueService {
    async addNotification(userId, data) {
        try {
            const job = await queues.notifications.add(
                { userId, data },
                { jobId: `notification-${userId}-${Date.now()}` }
            );
            logger.info(`Notification job added: ${job.id}`);
            return job;
        } catch (err) {
            logger.error('Error adding notification to queue:', err);
            throw err;
        }
    }

    async addEmail(email, subject, template, data) {
        try {
            const job = await queues.emails.add(
                { email, subject, template, data },
                { jobId: `email-${email}-${Date.now()}` }
            );
            logger.info(`Email job added: ${job.id}`);
            return job;
        } catch (err) {
            logger.error('Error adding email to queue:', err);
            throw err;
        }
    }

    async addReport(userId, reportType, filters) {
        try {
            const job = await queues.reports.add(
                { userId, reportType, filters },
                { jobId: `report-${userId}-${reportType}-${Date.now()}` }
            );
            logger.info(`Report job added: ${job.id}`);
            return job;
        } catch (err) {
            logger.error('Error adding report to queue:', err);
            throw err;
        }
    }

    async getJobStatus(queueName, jobId) {
        try {
            const queue = queues[queueName];
            if (!queue) throw new Error(`Queue ${queueName} not found`);

            const job = await queue.getJob(jobId);
            if (!job) return null;

            return {
                id: job.id,
                state: await job.getState(),
                progress: job.progress(),
                attempts: job.attemptsMade,
            };
        } catch (err) {
            logger.error('Error getting job status:', err);
            throw err;
        }
    }
}

module.exports = new QueueService();
