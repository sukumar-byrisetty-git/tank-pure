const AWS = require('aws-sdk');
const logger = require('../config/logger');

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

const uploadFile = async (buffer, filename, mimetype) => {
    const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: filename,
        Body: buffer,
        ContentType: mimetype,
        ACL: 'public-read',
    };

    try {
        const result = await s3.upload(params).promise();
        logger.info('S3 upload success', { key: filename });
        return result.Location;
    } catch (error) {
        logger.error('S3 upload failed', { key: filename, error: error.message });
        throw error;
    }
};

module.exports = { s3, uploadFile };
