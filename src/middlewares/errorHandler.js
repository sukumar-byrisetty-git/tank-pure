const ApiError = require('../utils/apiError');
const logger = require('../config/logger');

const errorHandler = (err, req, res) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal server error';
    const response = {
        error: {
            message,
            statusCode,
            path: req.originalUrl,
            method: req.method,
        },
    };

    if (err.errors) {
        response.error.errors = err.errors;
    }

    if (statusCode >= 500) {
        logger.error('[ErrorHandler] Server error', { err, path: req.originalUrl, method: req.method });
        console.error('[ErrorHandler] 500 error:', err);
    } else if (statusCode >= 400) {
        logger.warn('[ErrorHandler] Client error', { statusCode, message, path: req.originalUrl, method: req.method });
        console.warn('[ErrorHandler] 4xx error:', message);
    } else {
        logger.info('[ErrorHandler] Unexpected status code', { statusCode, message });
        console.log('[ErrorHandler] Info', message);
    }

    if (process.env.NODE_ENV !== 'production') {
        response.error.stack = err.stack;
    }

    return res.status(statusCode).json(response);
};

module.exports = errorHandler;
