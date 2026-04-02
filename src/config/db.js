const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async (retries = 5) => {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error('MONGO_URI not set');

    const mongooseOptions = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        minPoolSize: 5,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4, // Use IPv4
        retryWrites: true,
    };

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            await mongoose.connect(uri, mongooseOptions);
            logger.info('MongoDB connected successfully');

            // Monitor connection events
            mongoose.connection.on('disconnected', () => {
                logger.warn('MongoDB disconnected');
            });

            mongoose.connection.on('error', (err) => {
                logger.error('MongoDB connection error:', err);
            });

            return;
        } catch (err) {
            logger.warn(`MongoDB connection attempt ${attempt} failed:`, err.message);
            if (attempt === retries) {
                logger.error('Failed to connect to MongoDB after all retries');
                throw err;
            }
            // Exponential backoff
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
};

const disconnectDB = async () => {
    try {
        await mongoose.disconnect();
        logger.info('MongoDB disconnected');
    } catch (err) {
        logger.error('Error disconnecting MongoDB:', err);
    }
};

const checkDBHealth = async () => {
    try {
        const admin = mongoose.connection.db.admin();
        const result = await admin.ping();
        return { status: 'connected', message: 'Database is healthy' };
    } catch (err) {
        logger.error('Database health check failed:', err);
        return { status: 'disconnected', message: err.message };
    }
};

module.exports = { connectDB, disconnectDB, checkDBHealth };
