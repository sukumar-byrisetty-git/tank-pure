const ApiError = require('../utils/apiError');
const Booking = require('../models/Booking');
const { uploadFile } = require('../utils/s3');
const { sendFcmNotification } = require('../utils/fcm');
const logger = require('../config/logger');

const uploadJobImages = async (req, res) => {
    const bookingId = req.params.id;
    logger.info('[Upload] uploadJobImages started', { bookingId, userId: req.user?._id });

    const booking = await Booking.findById(bookingId);
    if (!booking) {
        logger.warn('[Upload] uploadJobImages failed: booking not found', { bookingId });
        throw new ApiError(404, 'Booking not found');
    }

    if (!req.files || Object.keys(req.files).length === 0) {
        logger.warn('[Upload] uploadJobImages failed: no files attached', { bookingId });
        throw new ApiError(400, 'No files uploaded, please attach before and/or after images');
    }

    const uploads = [];
    for (const fieldName of ['beforeImages', 'afterImages']) {
        if (req.files[fieldName]) {
            const filePromises = req.files[fieldName].map(async (file) => {
                const filename = `bookings/${bookingId}/${fieldName}/${Date.now()}-${file.originalname}`;
                const url = await uploadFile(file.buffer, filename, file.mimetype);
                return url;
            });
            uploads.push(
                Promise.all(filePromises).then((urls) => {
                    booking[fieldName] = [...(booking[fieldName] || []), ...urls];
                })
            );
        }
    }

    if (uploads.length === 0) {
        logger.warn('[Upload] uploadJobImages failed: files keys did not match beforeImages/afterImages', { files: Object.keys(req.files) });
        throw new ApiError(400, 'Invalid file fields; use beforeImages and/or afterImages');
    }

    await Promise.all(uploads);

    if (booking.beforeImages && booking.beforeImages.length > 0 && booking.status === 'pending') {
        booking.status = 'in_progress';
    }

    if (booking.afterImages && booking.afterImages.length > 0 && booking.status === 'in_progress') {
        booking.status = 'completed';
    }

    await booking.save();

    await sendFcmNotification(booking.customer, 'Images Uploaded', 'Job images were uploaded and booking updated.');
    logger.log('info', '[Upload] uploadJobImages success', { bookingId });

    res.json(booking);
};

module.exports = { uploadJobImages };
