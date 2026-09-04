const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const catchAsync = require('../middlewares/catchAsync');
const { createEventSchema, updateEventSchema } = require('../validations/eventValidation');

router.get('/', catchAsync(eventController.getAllEvents));
router.get('/organizer/me', auth, authorize('attendee', 'organizer', 'admin', 'superadmin'), catchAsync(eventController.getOrganizerEvents));
router.get('/:slugOrId', catchAsync(eventController.getEventBySlugOrId));
router.post('/', auth, authorize('attendee', 'organizer', 'admin', 'superadmin'), validate(createEventSchema), catchAsync(eventController.createEvent));
router.put('/:id', auth, authorize('attendee', 'organizer', 'admin', 'superadmin'), validate(updateEventSchema), catchAsync(eventController.updateEvent));
router.delete('/:id', auth, authorize('attendee', 'organizer', 'admin', 'superadmin'), catchAsync(eventController.deleteEvent));
router.patch('/:id/approval', auth, authorize('admin', 'superadmin'), catchAsync(eventController.toggleApproval));

module.exports = router;
