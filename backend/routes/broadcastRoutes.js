const express = require('express');
const router = express.Router();
const broadcastController = require('../controllers/broadcastController');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/authorize');
const catchAsync = require('../middlewares/catchAsync');

// Attendee active alerts (scoped strictly to events user booked tickets for)
router.get('/my-alerts', auth, catchAsync(broadcastController.getMyAlerts));

// Broadcast directives for a specific event
router.get(
  '/events/:eventId',
  auth,
  authorize('organizer', 'admin', 'staff', 'superadmin'),
  catchAsync(broadcastController.getEventBroadcasts)
);

router.post(
  '/events/:eventId',
  auth,
  authorize('organizer', 'admin', 'superadmin'),
  catchAsync(broadcastController.createBroadcast)
);

// Dismiss / Deactivate broadcast
router.delete(
  '/:id',
  auth,
  authorize('organizer', 'admin', 'superadmin'),
  catchAsync(broadcastController.deleteBroadcast)
);

module.exports = router;
