const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/authorize');
const catchAsync = require('../middlewares/catchAsync');

router.get('/organizer', auth, authorize('attendee', 'organizer', 'admin', 'superadmin'), catchAsync(dashboardController.getOrganizerDashboard));
router.get('/admin', auth, authorize('admin', 'superadmin'), catchAsync(dashboardController.getAdminDashboard));
router.get('/superadmin', auth, authorize('superadmin'), catchAsync(dashboardController.getSuperAdminDashboard));

module.exports = router;
