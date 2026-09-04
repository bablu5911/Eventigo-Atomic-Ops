const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const catchAsync = require('../middlewares/catchAsync');
const { createBookingSchema, checkInSchema, earlyExitSchema, verifyTicketSchema } = require('../validations/bookingValidation');

router.post('/', auth, validate(createBookingSchema), catchAsync(bookingController.createBooking));
router.get('/my', auth, catchAsync(bookingController.getUserBookings));
router.get('/my-bookings', auth, catchAsync(bookingController.getUserBookings));
router.get('/gate-status', auth, (req, res) => {
  const superadminService = require('../services/superadminService');
  res.status(200).json({ success: true, lockdown: superadminService.getLockdownDetails() });
});
router.post('/verify', auth, authorize('organizer', 'admin', 'staff'), validate(verifyTicketSchema), catchAsync(bookingController.verifyTicketCheckIn));
router.post('/verify-checkin', auth, authorize('organizer', 'admin', 'staff'), validate(checkInSchema), catchAsync(bookingController.verifyCheckIn));
router.post('/verify-code', auth, authorize('organizer', 'admin', 'staff'), validate(checkInSchema), catchAsync(bookingController.verifyCheckIn));
router.post('/early-exit', auth, authorize('organizer', 'admin', 'staff'), validate(earlyExitSchema), catchAsync(bookingController.processEarlyExit));
router.get('/:id', auth, catchAsync(bookingController.getBookingById));
router.get('/:id/pdf', auth, catchAsync(bookingController.downloadTicketPDF));
router.post('/:id/cancel', auth, catchAsync(bookingController.cancelBooking));

module.exports = router;
