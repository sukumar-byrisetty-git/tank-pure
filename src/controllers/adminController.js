const ApiError = require('../utils/apiError');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Notification = require('../models/Notification');
const ROLES = require('../constants/roles');
const { sendFcmNotification } = require('../utils/fcm');
const logger = require('../config/logger');

const assignWorker = async (req, res) => {
    const { bookingId, workerId } = req.body;
    logger.info('[Admin] assignWorker started', { bookingId, workerId });

    const booking = await Booking.findById(bookingId);
    if (!booking) {
        logger.warn('[Admin] assignWorker failed: booking not found', { bookingId });
        throw new ApiError(404, 'Booking not found');
    }

    if (booking.status === 'verified') {
        logger.warn('[Admin] assignWorker failed: booking already verified', { bookingId });
        throw new ApiError(410, 'Booking is already verified and cannot be reassigned');
    }

    const worker = await User.findOne({ _id: workerId, role: ROLES.WORKER });
    if (!worker) {
        logger.warn('[Admin] assignWorker failed: worker not found', { workerId });
        throw new ApiError(404, 'Worker not found');
    }

    if (['completed', 'verified'].includes(booking.status)) {
        throw new ApiError(400, 'Cannot assign worker to completed or verified bookings');
    }

    booking.worker = worker._id;
    booking.status = 'assigned';
    await booking.save();

    await Notification.create({ recipient: booking.customer, title: 'Worker Assigned', message: `Worker ${worker.name} assigned`, booking: booking._id });
    await sendFcmNotification(booking.customer, 'Worker Assigned', `Worker ${worker.name} assigned to your booking`);

    logger.log('info', '[Admin] assignWorker success', { bookingId, workerId });
    res.json(booking);
};

const createUser = async (req, res) => {
    const { name, email, password, role, phone, address } = req.body;
    logger.info('[Admin] createUser started', { email, role });

    const existing = await User.findOne({ email });
    if (existing) {
        logger.warn('[Admin] createUser failed: email already registered', { email });
        throw new ApiError(409, 'Email already registered');
    }

    if (!Object.values(ROLES).includes(role)) {
        logger.warn('[Admin] createUser failed: invalid role', { role });
        throw new ApiError(400, 'Invalid role');
    }

    const hashed = await require('bcryptjs').hash(password || 'ChangeMe123!', 10);
    const user = await User.create({ name, email, password: hashed, role, phone, address });

    logger.info('[Admin] createUser success', { userId: user._id });
    res.status(201).json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
};

const updateUserRole = async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    logger.info('[Admin] updateUserRole started', { id, role });

    if (!Object.values(ROLES).includes(role)) {
        logger.warn('[Admin] updateUserRole failed: invalid role', { role });
        throw new ApiError(400, 'Invalid role');
    }

    const user = await User.findById(id);
    if (!user) {
        logger.warn('[Admin] updateUserRole failed: user not found', { id });
        throw new ApiError(404, 'User not found');
    }

    if (user.role === ROLES.SUPERADMIN && role !== ROLES.SUPERADMIN) {
        throw new ApiError(403, 'Cannot downgrade superadmin');
    }

    user.role = role;
    await user.save();

    logger.log('info', '[Admin] updateUserRole success', { userId: user._id, newRole: role });
    res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
};

const dashboard = async (req, res) => {
    const total = await Booking.countDocuments();
    const pending = await Booking.countDocuments({ status: 'pending' });
    const assigned = await Booking.countDocuments({ status: 'assigned' });
    const in_progress = await Booking.countDocuments({ status: 'in_progress' });
    const completed = await Booking.countDocuments({ status: 'completed' });
    const verified = await Booking.countDocuments({ status: 'verified' });

    const users = await User.countDocuments();
    const workers = await User.countDocuments({ role: ROLES.WORKER });

    logger.info('[Admin] dashboard fetched', { total, pending, assigned, in_progress, completed, verified, users, workers });
    res.json({ total, pending, assigned, in_progress, completed, verified, users, workers });
};

module.exports = { assignWorker, dashboard, createUser, updateUserRole };
