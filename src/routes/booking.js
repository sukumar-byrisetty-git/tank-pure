const express = require('express');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { requireRole } = require('../middlewares/roles');
const { createBooking, listBookings, getBooking, updateStatus } = require('../controllers/bookingController');
const { createBookingSchema, updateStatusSchema } = require('../validators/bookingValidator');

const router = express.Router();

router.post('/create', auth, requireRole('customer'), validate(createBookingSchema), createBooking);
router.get('/list', auth, listBookings);
router.get('/:id', auth, getBooking);
router.put('/status/:id', auth, requireRole('worker', 'admin'), validate(updateStatusSchema), updateStatus);

module.exports = router;
