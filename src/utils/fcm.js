const admin = require('firebase-admin');
const logger = require('../config/logger');

if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '{}');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

const sendFcmNotification = async (recipientId, title, body) => {
    try {
        const User = require('../models/User');
        const user = await User.findById(recipientId);
        if (!user || !user.fcmToken) {
            logger.warn('No FCM token for user', { recipientId });
            return null;
        }

        const message = {
            token: user.fcmToken,
            notification: { title, body },
        };

        const response = await admin.messaging().send(message);
        logger.info('FCM sent', { recipientId, messageId: response });
        return response;
    } catch (error) {
        logger.error('Failed to send FCM notification', { recipientId, title, error: error.message });
        return null;
    }
};

module.exports = { sendFcmNotification };

