const logger = require('../config/logger');

const auditLogger = (req, res, next) => {
    const logData = {
        ip: req.ip || req.connection.remoteAddress,
        path: req.originalUrl,
        method: req.method,
        user: req.user ? { id: req.user._id, role: req.user.role, email: req.user.email } : null,
        userAgent: req.headers['user-agent'],
        timestamp: new Date().toISOString(),
        query: req.query,
    };

    logger.info('[Audit] request', logData);
    next();
};

module.exports = auditLogger;
