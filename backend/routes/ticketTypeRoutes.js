const express = require('express');
const router = express.Router();
const ticketTypeController = require('../controllers/ticketTypeController');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const catchAsync = require('../middlewares/catchAsync');
const { createTicketTypeSchema, updateTicketTypeSchema } = require('../validations/ticketTypeValidation');

router.get('/ticket-types', catchAsync(ticketTypeController.getAllTicketTypes));
router.get('/events/:eventId/ticket-types', catchAsync(ticketTypeController.getTicketTypesByEvent));
router.post('/ticket-types', auth, authorize('organizer', 'admin', 'superadmin'), validate(createTicketTypeSchema), catchAsync(ticketTypeController.createTicketType));
router.put('/ticket-types/:id', auth, authorize('organizer', 'admin', 'superadmin'), validate(updateTicketTypeSchema), catchAsync(ticketTypeController.updateTicketType));
router.delete('/ticket-types/:id', auth, authorize('organizer', 'admin', 'superadmin'), catchAsync(ticketTypeController.deleteTicketType));

module.exports = router;
