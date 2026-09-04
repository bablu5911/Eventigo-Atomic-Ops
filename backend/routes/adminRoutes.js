const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/authorize');
const catchAsync = require('../middlewares/catchAsync');

router.use(auth, authorize('admin', 'superadmin'));

router.get('/users', catchAsync(adminController.getAllUsers));
router.post('/users', catchAsync(adminController.createUser));
router.patch('/users/:id/status', catchAsync(adminController.updateUserStatus));
router.patch('/users/:id/role', catchAsync(adminController.updateUserRole));

// Staff & Organizer Management
router.get('/staff', catchAsync(adminController.getStaffMembers));
router.get('/organizers', catchAsync(adminController.getOrganizers));
router.get('/staff-assignments', catchAsync(adminController.getStaffAssignments));
router.post('/staff-assignments', catchAsync(adminController.createStaffAssignment));
router.delete('/staff-assignments/:id', catchAsync(adminController.deleteStaffAssignment));
router.put('/events/:eventId/assign-organizer', catchAsync(adminController.assignOrganizerToEvent));

module.exports = router;
