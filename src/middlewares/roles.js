const ROLES = require('../constants/roles');
const ApiError = require('../utils/apiError');
const logger = require('../config/logger');

const requireRole = (...allowedRoles) => (req, res, next) => {
    if (!req.user) {
        logger.warn('Role check failed: missing req.user');
        console.warn('[Roles] Unauthorized access attempt');
        return next(new ApiError(401, 'Unauthorized: authentication required'));
    }

    if (req.user.role === ROLES.SUPERADMIN) {
        console.log('[Roles] Superadmin access granted');
        return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
        logger.warn('Role check failed: forbidden role', { userRole: req.user.role, required: allowedRoles });
        console.warn('[Roles] Forbidden role', req.user.role);
        return next(new ApiError(403, 'Forbidden: insufficient privileges'));
    }

    console.log('[Roles] Role allowed', { userRole: req.user.role });
    next();
};

module.exports = { requireRole };
