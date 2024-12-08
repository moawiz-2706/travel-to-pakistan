const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { bookingValidation } = require('../utils/validation');
const {
  getBookings,
  createBooking,
  updateBookingStatus,
  cancelBooking
} = require('../controllers/bookingController');

const router = express.Router();

router.get('/', protect, getBookings);
router.post('/', protect, authorize('user'), bookingValidation, createBooking);
router.put('/:id/status', protect, authorize('admin'), updateBookingStatus);
router.put('/:id/cancel', protect, authorize('user', 'admin'), cancelBooking);

module.exports = router;