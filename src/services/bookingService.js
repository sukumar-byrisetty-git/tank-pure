const ApiError = require('../utils/apiError');
const Booking = require('../models/Booking');
const Tank = require('../models/Tank');
const Notification = require('../models/Notification');
const { sendFcmNotification } = require('../utils/fcm');
const ROLES = require('../constants/roles');
const BOOKING_STATUS = require('../constants/bookingStatus');

const transitionMap = {
    [BOOKING_STATUS.PENDING]: [BOOKING_STATUS.ASSIGNED],
    [BOOKING_STATUS.ASSIGNED]: [BOOKING_STATUS.IN_PROGRESS],
    [BOOKING_STATUS.IN_PROGRESS]: [BOOKING_STATUS.COMPLETED],
    [BOOKING_STATUS.COMPLETED]: [BOOKING_STATUS.VERIFIED],
    [BOOKING_STATUS.VERIFIED]: [],
};

const createBooking = async (user, data) => {
    if (user.isBlocked) {
        throw new ApiError(403, 'Your account is blocked from creating bookings');
    }

    if (typeof user.isPaid !== 'undefined' && user.isPaid === false) {
        throw new ApiError(402, 'Payment required to create booking');
    }

    const tank = await Tank.findById(data.tankId);
    if (!tank) throw new ApiError(404, 'Tank not found');

    const booking = await Booking.create({
        customer: user._id,
        tank: tank._id,
        date: data.date,
        address: data.address,
        notes: data.notes || '',
        status: 'pending',
    });

    await Notification.create({
        recipient: user._id,
        title: 'Booking Created',
        message: 'Your booking is created and pending assignment',
        booking: booking._id,
    });

    await sendFcmNotification(user._id, 'Booking Created', 'Your booking is pending assignment');

    return booking;
};

const getBookings = async (user) => {
    const filter = {};
    if (user.role === ROLES.CUSTOMER) filter.customer = user._id;
    if (user.role === ROLES.WORKER) filter.worker = user._id;
    // admin and superadmin get all bookings

    return Booking.find(filter)
        .populate('customer', 'name email')
        .populate('worker', 'name email')
        .populate('tank');
};

const getBookingById = async (user, id) => {
    const booking = await Booking.findById(id)
        .populate('customer', 'name email')
        .populate('worker', 'name email')
        .populate('tank');

    if (!booking) throw new ApiError(404, 'Booking not found');

    if (booking.status === BOOKING_STATUS.VERIFIED) {
        throw new ApiError(410, 'Booking is already verified and no longer mutable');
    }

    if (user.role === ROLES.CUSTOMER && String(booking.customer._id) !== String(user._id)) {
        throw new ApiError(403, 'Forbidden: not your booking');
    }

    if (user.role === ROLES.WORKER && (!booking.worker || String(booking.worker._id) !== String(user._id))) {
        throw new ApiError(403, 'Forbidden: not assigned booking');
    }

    return booking;
};

const updateBookingStatus = async (user, id, payload) => {
    const { status, beforeImages, afterImages } = payload;
    const booking = await Booking.findById(id);
    if (!booking) throw new ApiError(404, 'Booking not found');

    if (booking.status === BOOKING_STATUS.VERIFIED) {
        throw new ApiError(410, 'Booking is already verified and cannot be updated');
    }

    if (user.role === ROLES.WORKER && String(booking.worker) !== String(user._id)) {
        throw new ApiError(403, 'Forbidden: not assigned worker');
    }

    const allowedStates = transitionMap[booking.status] || [];
    if (!allowedStates.includes(status)) {
        throw new ApiError(400, `Invalid status transition from ${booking.status} to ${status}`);
    }

    if (status === BOOKING_STATUS.IN_PROGRESS && (!beforeImages || beforeImages.length === 0)) {
        throw new ApiError(400, 'beforeImages required to start job');
    }
    if (status === BOOKING_STATUS.COMPLETED && (!afterImages || afterImages.length === 0)) {
        throw new ApiError(400, 'afterImages required to complete job');
    }

    if (status === BOOKING_STATUS.IN_PROGRESS) booking.beforeImages = beforeImages;
    if (status === BOOKING_STATUS.COMPLETED) booking.afterImages = afterImages;

    booking.status = status;
    await booking.save();

    await Notification.create({
        recipient: booking.customer,
        title: 'Booking status updated',
        message: `Status is now ${booking.status}`,
        booking: booking._id,
    });
    await sendFcmNotification(booking.customer, 'Booking status updated', `Status is now ${booking.status}`);

    return booking;
};

module.exports = { createBooking, getBookings, getBookingById, updateBookingStatus };
