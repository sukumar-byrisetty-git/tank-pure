const ApiError = require('../utils/apiError');

const requiredEnv = [
    'MONGO_URI',
    'JWT_SECRET',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_REGION',
    'AWS_S3_BUCKET',
    'FIREBASE_SERVICE_ACCOUNT_JSON',
];

const validateEnv = () => {
    const missing = requiredEnv.filter((name) => !process.env[name]);
    if (missing.length) {
        throw new ApiError(500, `Missing required env vars: ${missing.join(', ')}`);
    }

    try {
        const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
        if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
            throw new Error('Incomplete Firebase service account JSON');
        }
    } catch (err) {
        throw new ApiError(500, 'FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON or missing fields');
    }
};

module.exports = validateEnv;
