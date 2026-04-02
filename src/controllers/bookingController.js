const bookingService = require('../services/bookingService');
const logger = require('../config/logger');

const createBooking = async (req, res) => {
    logger.info('[Booking] createBooking request', { userId: req.user._id, body: req.body });
    const booking = await bookingService.createBooking(req.user, req.body);
    res.status(201).json(booking);
};

const listBookings = async (req, res) => {
    logger.info('[Booking] listBookings request', { userId: req.user._id });
    const bookings = await bookingService.getBookings(req.user);
    res.json(bookings);
};

const getBooking = async (req, res) => {
    logger.info('[Booking] getBooking request', { userId: req.user._id, bookingId: req.params.id });
    const booking = await bookingService.getBookingById(req.user, req.params.id);
    res.json(booking);
};

const updateStatus = async (req, res) => {
    logger.info('[Booking] updateStatus request', { userId: req.user._id, bookingId: req.params.id, body: req.body });
    const booking = await bookingService.updateBookingStatus(req.user, req.params.id, req.body);
    res.json(booking);
};

module.exports = { createBooking, listBookings, getBooking, updateStatus };
