const ApiError = require('../utils/apiError');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const logger = require('../config/logger');

const createReview = async (req, res) => {
    const { bookingId, workerId, rating, comment } = req.body;
    logger.info('[Review] createReview started', { userId: req.user._id, bookingId });

    const booking = await Booking.findById(bookingId);
    if (!booking) {
        logger.warn('[Review] createReview failed: booking not found', { bookingId });
        throw new ApiError(404, 'Booking not found');
    }

    if (String(booking.customer) !== String(req.user._id)) {
        logger.warn('[Review] createReview failed: unauthorized reviewer', { userId: req.user._id, bookingId });
        throw new ApiError(403, 'You are not allowed to review this booking');
    }

    if (booking.status !== 'completed' && booking.status !== 'verified') {
        logger.warn('[Review] createReview failed: booking not complete', { bookingId, status: booking.status });
        throw new ApiError(400, 'Review allowed only after completion');
    }

    const existing = await Review.findOne({ booking: bookingId, customer: req.user._id });
    if (existing) {
        logger.warn('[Review] createReview failed: duplicate review', { userId: req.user._id, bookingId });
        throw new ApiError(409, 'You have already reviewed this booking');
    }

    const review = await Review.create({
        customer: req.user._id,
        worker: workerId,
        booking: bookingId,
        rating,
        comment,
    });

    logger.log('info', '[Review] createReview success', { reviewId: review._id });
    res.status(201).json(review);
};

module.exports = { createReview };
