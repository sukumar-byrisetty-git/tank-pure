const jwt = require('jsonwebtoken');
const ApiError = require('../utils/apiError');
const User = require('../models/User');
const logger = require('../config/logger');

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        logger.warn('Auth middleware denied access: missing or malformed Authorization header');
        console.warn('[Auth] Missing token');
        return next(new ApiError(401, 'Authentication required: token is missing or malformed'));
    }

    try {
        const token = authHeader.split(' ')[1];
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(payload.id);
        if (!user) {
            logger.warn('Auth middleware denied access: user not found', { userId: payload.id });
            return next(new ApiError(401, 'Invalid token: user not found'));
        }

        req.user = user;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            logger.warn('Auth failed: token expired');
            return next(new ApiError(401, 'Token expired, please log in again'));
        }

        if (err.name === 'JsonWebTokenError') {
            logger.warn('Auth failed: invalid token', { error: err.message });
            return next(new ApiError(401, 'Invalid token, access denied'));
        }

        logger.error('Auth middleware caught unexpected error', err);
        console.error('[Auth] Verification error:', err);
        next(new ApiError(401, 'Authentication failed'));
    }
};

module.exports = authMiddleware;
